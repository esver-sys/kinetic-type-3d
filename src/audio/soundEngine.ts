import { MusicTrackId, StemEnableMap, SynthStemId } from '../types/typing'
import { MUSIC_TRACKS, MusicTrackSpec } from './musicTracks'

export interface AudioUiSnapshot {
  trackId: MusicTrackId
  isPlaying: boolean
  isMuted: boolean
  musicVolume: number
  keyChimesEnabled: boolean
  audioReady: boolean
  stems: StemEnableMap
  activeBar: number
  activeChordName: string
}

export interface AudioSpectrumSnapshot {
  bass: number
  mid: number
  treble: number
  energy: number
  beatPulse: number
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function hashKeyCode(code: string): number {
  let h = 2166136261
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

interface ActiveSongBus {
  rootGain: GainNode
  songReverb: ConvolverNode
  songDelaySend: GainNode
  sidechainGain: GainNode
  drumStem: GainNode
  bassStem: GainNode
  padStem: GainNode
  leadStem: GainNode
  vibratoLfo: OscillatorNode
}

class SciFiMusicEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private musicVolumeGain: GainNode | null = null
  private fxGain: GainNode | null = null
  private fxReverb: ConvolverNode | null = null
  private fxDelaySend: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private metallicNoiseBuffer: AudioBuffer | null = null
  private reverbIRBuffer: AudioBuffer | null = null
  private spectrumBytes: Uint8Array<ArrayBuffer> = new Uint8Array(128)

  private activeBus: ActiveSongBus | null = null
  private activeBassStopTimer: { osc1: OscillatorNode; osc2: OscillatorNode; env: GainNode } | null =
    null

  private trackId: MusicTrackId = 'stellar-drift'
  private wantsMusic = true
  private isMuted = false
  private musicVolume = 0.78
  private keyChimesEnabled = true
  private audioReady = false
  private stems: StemEnableMap = {
    drums: true,
    bass: true,
    pad: true,
    lead: true,
  }

  private schedulerTimer: number | null = null
  private nextStepTime = 0
  private currentStep = 0
  private currentBar = 0
  private displayedBar = 0
  private chimeStepOffset = 0
  private lastKickAtMs = -10000

  private listeners = new Set<() => void>()
  private snapshotCache: AudioUiSnapshot = {
    trackId: 'stellar-drift',
    isPlaying: false,
    isMuted: false,
    musicVolume: 0.78,
    keyChimesEnabled: true,
    audioReady: false,
    stems: { drums: true, bass: true, pad: true, lead: true },
    activeBar: 0,
    activeChordName: MUSIC_TRACKS['stellar-drift'].bars[0].chordName,
  }

  private emit(): void {
    const nextPlaying = this.wantsMusic && this.audioReady
    const barSpec = MUSIC_TRACKS[this.trackId].bars[this.displayedBar % 8]
    const prev = this.snapshotCache
    if (
      prev.trackId === this.trackId &&
      prev.isPlaying === nextPlaying &&
      prev.isMuted === this.isMuted &&
      prev.musicVolume === this.musicVolume &&
      prev.keyChimesEnabled === this.keyChimesEnabled &&
      prev.audioReady === this.audioReady &&
      prev.activeBar === this.displayedBar &&
      prev.activeChordName === barSpec.chordName &&
      prev.stems.drums === this.stems.drums &&
      prev.stems.bass === this.stems.bass &&
      prev.stems.pad === this.stems.pad &&
      prev.stems.lead === this.stems.lead
    ) {
      return
    }
    this.snapshotCache = {
      trackId: this.trackId,
      isPlaying: nextPlaying,
      isMuted: this.isMuted,
      musicVolume: this.musicVolume,
      keyChimesEnabled: this.keyChimesEnabled,
      audioReady: this.audioReady,
      stems: { ...this.stems },
      activeBar: this.displayedBar,
      activeChordName: barSpec.chordName,
    }
    for (const listener of this.listeners) {
      listener()
    }
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public getSnapshot = (): AudioUiSnapshot => {
    return this.snapshotCache
  }

  private ensureContext(fromUserGesture = false): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AudioCtx) return null

      const ctx = new AudioCtx({ latencyHint: 'interactive' })
      this.ctx = ctx

      // Gentle mastering glue compressor — prevents harsh clipping without squashing melodies
      const compressor = ctx.createDynamicsCompressor()
      compressor.threshold.value = -8
      compressor.knee.value = 14
      compressor.ratio.value = 2.4
      compressor.attack.value = 0.008
      compressor.release.value = 0.16

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.78
      this.analyser = analyser
      this.spectrumBytes = new Uint8Array(analyser.frequencyBinCount)

      const master = ctx.createGain()
      master.gain.value = this.isMuted ? 0 : 0.85
      this.masterGain = master

      const musicVol = ctx.createGain()
      musicVol.gain.value = this.musicVolume
      musicVol.connect(master)
      this.musicVolumeGain = musicVol

      master.connect(compressor)
      compressor.connect(analyser)
      analyser.connect(ctx.destination)

      // Shared warm reverb IR & noise buffers
      this.reverbIRBuffer = this.buildWarmReverbIR(ctx, 2.3)
      this.noiseBuffer = this.buildNoiseBuffer(ctx, false)
      this.metallicNoiseBuffer = this.buildNoiseBuffer(ctx, true)

      // Dedicated Keystroke Chime FX bus (remains active & shimmering cleanly even when music pauses)
      const fxGain = ctx.createGain()
      fxGain.gain.value = 0.92
      fxGain.connect(master)
      this.fxGain = fxGain

      const fxRev = ctx.createConvolver()
      fxRev.buffer = this.reverbIRBuffer
      const fxRevReturn = ctx.createGain()
      fxRevReturn.gain.value = 0.36
      fxRev.connect(fxRevReturn)
      fxRevReturn.connect(fxGain)
      this.fxReverb = fxRev

      const fxDelay = this.createStereoDelay(ctx, fxGain, fxRev, 0.24)
      this.fxDelaySend = fxDelay

      this.activeBus = this.createSongBus(ctx)

      ctx.onstatechange = () => {
        const running = ctx.state === 'running'
        if (running !== this.audioReady) {
          this.audioReady = running
          if (running && this.wantsMusic && this.schedulerTimer === null) {
            this.startScheduler()
          }
          this.emit()
        }
      }
    }

    if (this.ctx.state === 'suspended' && fromUserGesture) {
      void this.ctx.resume().then(() => {
        this.audioReady = this.ctx?.state === 'running'
        if (this.audioReady && this.wantsMusic && this.schedulerTimer === null) {
          this.startScheduler()
        }
        this.emit()
      })
    } else if (this.ctx.state === 'running' && !this.audioReady) {
      this.audioReady = true
      if (this.wantsMusic && this.schedulerTimer === null) {
        this.startScheduler()
      }
      this.emit()
    }

    return this.ctx
  }

  private createStereoDelay(
    ctx: AudioContext,
    wetTarget: AudioNode,
    reverbNode: AudioNode,
    sendLevel: number,
  ): GainNode {
    const delaySend = ctx.createGain()
    delaySend.gain.value = sendLevel

    const delayL = ctx.createDelay(1.0)
    const delayR = ctx.createDelay(1.0)
    delayL.delayTime.value = 0.285
    delayR.delayTime.value = 0.428

    const fbL = ctx.createGain()
    const fbR = ctx.createGain()
    fbL.gain.value = 0.3
    fbR.gain.value = 0.26

    const delayFilter = ctx.createBiquadFilter()
    delayFilter.type = 'lowpass'
    delayFilter.frequency.value = 2300

    const merger = ctx.createChannelMerger(2)
    delaySend.connect(delayL)
    delayL.connect(delayFilter)
    delayFilter.connect(fbL)
    fbL.connect(delayR)
    delayR.connect(fbR)
    fbR.connect(delayL)

    const delayReturn = ctx.createGain()
    delayReturn.gain.value = 0.72
    delayL.connect(merger, 0, 0)
    delayR.connect(merger, 0, 1)
    merger.connect(delayReturn)
    delayReturn.connect(wetTarget)
    delayReturn.connect(reverbNode)

    return delaySend
  }

  /**
   * Creates a self-contained song bus (including its own reverb & stereo delay returns)
   * so switching tracks or pausing cleanly crossfades EVERYTHING belonging to that song with zero harmonic bleed.
   */
  private createSongBus(ctx: AudioContext): ActiveSongBus {
    const rootGain = ctx.createGain()
    rootGain.gain.setValueAtTime(1.0, ctx.currentTime)
    rootGain.connect(this.musicVolumeGain!)

    const songReverb = ctx.createConvolver()
    songReverb.buffer = this.reverbIRBuffer!
    const revReturn = ctx.createGain()
    revReturn.gain.value = 0.32
    songReverb.connect(revReturn)
    revReturn.connect(rootGain)

    const songDelaySend = this.createStereoDelay(ctx, rootGain, songReverb, 0.24)

    const sidechainGain = ctx.createGain()
    sidechainGain.gain.value = 1.0
    sidechainGain.connect(rootGain)

    const drumStem = ctx.createGain()
    drumStem.gain.value = this.stems.drums ? 1.0 : 0.0
    drumStem.connect(rootGain)

    const bassStem = ctx.createGain()
    bassStem.gain.value = this.stems.bass ? 1.0 : 0.0
    bassStem.connect(sidechainGain)

    const padStem = ctx.createGain()
    padStem.gain.value = this.stems.pad ? 1.0 : 0.0
    padStem.connect(sidechainGain)

    const leadStem = ctx.createGain()
    leadStem.gain.value = this.stems.lead ? 1.0 : 0.0
    leadStem.connect(rootGain)

    const vibratoLfo = ctx.createOscillator()
    vibratoLfo.type = 'sine'
    vibratoLfo.frequency.value = 5.1
    vibratoLfo.start(ctx.currentTime)

    return {
      rootGain,
      songReverb,
      songDelaySend,
      sidechainGain,
      drumStem,
      bassStem,
      padStem,
      leadStem,
      vibratoLfo,
    }
  }

  private retireSongBus(bus: ActiveSongBus | null, fadeSec = 0.14): void {
    if (!bus || !this.ctx) return
    const now = this.ctx.currentTime
    const g = bus.rootGain.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(Math.max(0.0001, g.value), now)
    g.exponentialRampToValueAtTime(0.0001, now + fadeSec)

    window.setTimeout(() => {
      try {
        bus.vibratoLfo.stop()
      } catch {
        // Ignore already stopped
      }
      bus.rootGain.disconnect()
      bus.songReverb.disconnect()
      bus.songDelaySend.disconnect()
      bus.sidechainGain.disconnect()
    }, fadeSec * 1000 + 80)
  }

  private buildNoiseBuffer(ctx: AudioContext, bandWeighted: boolean): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * 0.4)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    let hpLast = 0
    for (let i = 0; i < len; i++) {
      const n = Math.random() * 2 - 1
      if (bandWeighted) {
        // Crisp silky air noise for hats without harsh low rumble
        const high = n - hpLast * 0.65
        hpLast = n
        data[i] = high * 0.65
      } else {
        data[i] = n
      }
    }
    return buf
  }

  private buildWarmReverbIR(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds)
    const ir = ctx.createBuffer(2, length, ctx.sampleRate)
    const fadeInSamples = Math.floor(ctx.sampleRate * 0.022)

    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch)
      let lp = 0
      for (let i = 0; i < length; i++) {
        const t = i / length
        const env = Math.pow(1 - t, 2.55)
        const attack = i < fadeInSamples ? i / fadeInSamples : 1
        const noise = Math.random() * 2 - 1
        lp = lp * 0.68 + noise * 0.32
        data[i] = lp * env * attack * 0.78
      }
    }
    return ir
  }

  public unlockFromGesture(): void {
    const ctx = this.ensureContext(true)
    if (ctx && ctx.state === 'running') {
      this.audioReady = true
      if (this.wantsMusic && this.schedulerTimer === null) {
        this.startScheduler()
      }
      this.emit()
    }
  }

  public togglePlay(): void {
    this.wantsMusic = !this.wantsMusic
    const ctx = this.ensureContext(true)

    if (this.wantsMusic) {
      if (ctx) {
        this.retireSongBus(this.activeBus, 0.08)
        this.activeBus = this.createSongBus(ctx)
        if (ctx.state === 'running') {
          this.audioReady = true
          this.startScheduler()
        }
      }
    } else {
      this.stopScheduler()
      this.retireSongBus(this.activeBus, 0.14)
      this.activeBus = ctx ? this.createSongBus(ctx) : null
    }

    this.emit()
  }

  public selectTrack(nextTrack: MusicTrackId): void {
    const changed = this.trackId !== nextTrack
    this.trackId = nextTrack
    this.wantsMusic = true

    const ctx = this.ensureContext(true)
    if (ctx && changed) {
      this.retireSongBus(this.activeBus, 0.14)
      this.activeBus = this.createSongBus(ctx)
    }

    this.stopScheduler()
    this.currentBar = 0
    this.displayedBar = 0
    this.currentStep = 0

    if (ctx && ctx.state === 'running') {
      this.audioReady = true
      this.startScheduler()
    }
    this.emit()
  }

  public setMusicVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol))
    this.musicVolume = clamped
    const ctx = this.ensureContext(true)
    if (ctx && this.musicVolumeGain) {
      const now = ctx.currentTime
      this.musicVolumeGain.gain.cancelScheduledValues(now)
      this.musicVolumeGain.gain.setValueAtTime(this.musicVolumeGain.gain.value, now)
      this.musicVolumeGain.gain.linearRampToValueAtTime(clamped, now + 0.04)
    }
    this.emit()
  }

  public toggleStem(stem: SynthStemId): void {
    this.stems = { ...this.stems, [stem]: !this.stems[stem] }
    const ctx = this.ensureContext(true)
    const bus = this.activeBus
    if (ctx && bus) {
      const target =
        stem === 'drums'
          ? bus.drumStem
          : stem === 'bass'
            ? bus.bassStem
            : stem === 'pad'
              ? bus.padStem
              : bus.leadStem
      const now = ctx.currentTime
      target.gain.cancelScheduledValues(now)
      target.gain.setValueAtTime(target.gain.value, now)
      target.gain.linearRampToValueAtTime(this.stems[stem] ? 1.0 : 0.0, now + 0.06)
    }
    this.emit()
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted
    const ctx = this.ensureContext(true)
    if (ctx && this.masterGain) {
      const now = ctx.currentTime
      this.masterGain.gain.cancelScheduledValues(now)
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.85, now + 0.05)
    }
    this.emit()
  }

  public toggleKeyChimes(): void {
    this.keyChimesEnabled = !this.keyChimesEnabled
    this.ensureContext(true)
    if (this.keyChimesEnabled) {
      this.playHoloBurst()
    }
    this.emit()
  }

  private startScheduler(): void {
    if (this.schedulerTimer !== null || !this.ctx || !this.wantsMusic) return
    if (!this.activeBus) {
      this.activeBus = this.createSongBus(this.ctx)
    }
    this.nextStepTime = this.ctx.currentTime + 0.05
    this.schedulerTimer = window.setInterval(() => this.runSchedulerTick(), 24)
  }

  private stopScheduler(): void {
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer)
      this.schedulerTimer = null
    }
    this.activeBassStopTimer = null
  }

  private runSchedulerTick(): void {
    if (!this.ctx || !this.wantsMusic || this.ctx.state !== 'running') return
    if (!this.activeBus) {
      this.activeBus = this.createSongBus(this.ctx)
    }

    const lookaheadSec = 0.14
    const track = MUSIC_TRACKS[this.trackId]
    const sixteenthDur = 60 / track.bpm / 4

    while (this.nextStepTime < this.ctx.currentTime + lookaheadSec) {
      const swingOffset =
        this.currentStep % 2 === 1 ? sixteenthDur * track.swing : 0
      const schedBar = this.currentBar
      const schedStep = this.currentStep
      const schedTime = this.nextStepTime + swingOffset

      this.scheduleStep(
        this.ctx,
        this.activeBus,
        track,
        schedBar,
        schedStep,
        schedTime,
        sixteenthDur,
      )

      if (schedStep === 0) {
        const delayMs = Math.max(0, (schedTime - this.ctx.currentTime) * 1000)
        window.setTimeout(() => {
          this.displayedBar = schedBar
          this.emit()
        }, delayMs)
      }

      this.nextStepTime += sixteenthDur
      this.currentStep += 1
      if (this.currentStep >= 16) {
        this.currentStep = 0
        this.currentBar = (this.currentBar + 1) % track.bars.length
      }
    }
  }

  private scheduleStep(
    ctx: AudioContext,
    bus: ActiveSongBus,
    track: MusicTrackSpec,
    barIdx: number,
    stepIdx: number,
    time: number,
    stepDur: number,
  ): void {
    const bar = track.bars[barIdx]
    const barDur = stepDur * 16
    const drums =
      barIdx >= 4 && track.chorusDrums ? track.chorusDrums : track.drums

    // 1. Lush Open-Voicing Pad or Warm Electric Piano
    if (track.style === 'nocturne') {
      if (stepIdx === 0 || stepIdx === 10) {
        const dur = stepIdx === 0 ? stepDur * 9.5 : stepDur * 5.8
        this.triggerElectricPianoChord(
          ctx,
          bus,
          time,
          bar.pad,
          dur,
          stepIdx === 0 ? 0.18 : 0.13,
        )
      }
    } else if (stepIdx === 0) {
      const padLevel = track.style === 'ambient' ? 0.175 : 0.145
      this.triggerPadChord(ctx, bus, time, bar.pad, barDur * 1.02, padLevel)
    }

    // 2. Monophonic Clean Analog Bassline (zero sub overlap)
    const bassMidi = bar.bass[stepIdx] ?? 0
    if (bassMidi > 0) {
      let restSteps = 1
      for (let k = stepIdx + 1; k < 16; k++) {
        if ((bar.bass[k] ?? 0) === 0) restSteps++
        else break
      }
      const bassDur = Math.min(stepDur * restSteps * 0.88, stepDur * 4.5)
      this.triggerBass(ctx, bus, time, midiToFreq(bassMidi), bassDur, track.style)
    }

    // 3. Stereo Arpeggiator
    const arpMidi = bar.arp[stepIdx] ?? 0
    if (arpMidi > 0) {
      this.triggerArp(
        ctx,
        bus,
        time,
        midiToFreq(arpMidi),
        stepDur * 1.5,
        track.style,
      )
    }

    // 4. Singing Expressive Lead Melody
    const leadMidi = bar.lead[stepIdx] ?? 0
    if (leadMidi > 0) {
      let sustainSteps = 1
      for (let k = stepIdx + 1; k < 16; k++) {
        if ((bar.lead[k] ?? 0) === 0) sustainSteps++
        else break
      }
      const holdDur = Math.min(stepDur * 4.8, stepDur * sustainSteps * 0.9)
      this.triggerLead(ctx, bus, time, midiToFreq(leadMidi), holdDur, track.style)
    }

    // 5. Punchy Balanced Electronic Drums + Subtle Sidechain
    const kickVel = drums.kick[stepIdx] ?? 0
    if (kickVel > 0) {
      this.triggerKick(ctx, bus, time, kickVel, track.style)
      if (track.style === 'synthwave' || track.style === 'cyber') {
        this.triggerSidechainDuck(bus, time, stepDur * 1.4, kickVel)
      }
      if (kickVel > 0.68) {
        const delayMs = Math.max(0, (time - ctx.currentTime) * 1000)
        window.setTimeout(() => {
          this.lastKickAtMs = performance.now()
        }, delayMs)
      }
    }

    const snareVel = drums.snare[stepIdx] ?? 0
    if (snareVel > 0) {
      this.triggerSnare(ctx, bus, time, snareVel, track.style)
    }

    const hatVel = drums.hat[stepIdx] ?? 0
    if (hatVel > 0) {
      this.triggerHat(ctx, bus, time, hatVel)
    }
  }

  private triggerSidechainDuck(
    bus: ActiveSongBus,
    time: number,
    dur: number,
    amount: number,
  ): void {
    const depth = Math.max(0.7, 1 - 0.24 * amount)
    const g = bus.sidechainGain.gain
    g.cancelScheduledValues(time)
    g.setValueAtTime(1.0, time)
    g.linearRampToValueAtTime(depth, time + 0.012)
    g.exponentialRampToValueAtTime(1.0, time + dur)
  }

  private triggerPadChord(
    ctx: AudioContext,
    bus: ActiveSongBus,
    time: number,
    notes: number[],
    duration: number,
    gainLevel: number,
  ): void {
    const chordGain = ctx.createGain()
    chordGain.gain.setValueAtTime(0.0005, time)
    chordGain.gain.linearRampToValueAtTime(gainLevel, time + 0.42)
    chordGain.gain.setValueAtTime(
      gainLevel * 0.92,
      Math.max(time + 0.44, time + duration - 0.42),
    )
    chordGain.gain.exponentialRampToValueAtTime(0.0005, time + duration + 0.35)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 0.85
    filter.frequency.setValueAtTime(640, time)
    filter.frequency.linearRampToValueAtTime(1320, time + duration * 0.48)
    filter.frequency.linearRampToValueAtTime(740, time + duration)

    chordGain.connect(filter)
    filter.connect(bus.padStem)
    filter.connect(bus.songReverb)

    const stopAt = time + duration + 0.4
    for (let i = 0; i < notes.length; i++) {
      const freq = midiToFreq(notes[i])
      const panner = ctx.createStereoPanner()
      panner.pan.value =
        notes.length > 1 ? ((i / (notes.length - 1)) * 2 - 1) * 0.55 : 0
      panner.connect(chordGain)

      // Smooth warm triangle core + subtle detuned saw warmth
      const warmOsc = ctx.createOscillator()
      warmOsc.type = 'triangle'
      warmOsc.frequency.setValueAtTime(freq, time)

      const stringOsc = ctx.createOscillator()
      stringOsc.type = 'sawtooth'
      stringOsc.frequency.setValueAtTime(freq, time)
      stringOsc.detune.value = i % 2 === 0 ? -7 : 7

      const triGain = ctx.createGain()
      triGain.gain.value = 0.65 / Math.max(2.4, notes.length * 0.6)

      const sawGain = ctx.createGain()
      sawGain.gain.value = 0.38 / Math.max(2.4, notes.length * 0.6)

      warmOsc.connect(triGain)
      stringOsc.connect(sawGain)
      triGain.connect(panner)
      sawGain.connect(panner)

      warmOsc.start(time)
      stringOsc.start(time)
      warmOsc.stop(stopAt)
      stringOsc.stop(stopAt)
    }
  }

  private triggerElectricPianoChord(
    ctx: AudioContext,
    bus: ActiveSongBus,
    time: number,
    notes: number[],
    duration: number,
    gainLevel: number,
  ): void {
    const chordGain = ctx.createGain()
    chordGain.gain.setValueAtTime(0.0005, time)
    chordGain.gain.linearRampToValueAtTime(gainLevel, time + 0.016)
    chordGain.gain.exponentialRampToValueAtTime(0.0008, time + duration + 0.32)

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(2400, time)
    lp.frequency.exponentialRampToValueAtTime(980, time + duration)

    chordGain.connect(lp)
    lp.connect(bus.padStem)
    lp.connect(bus.songReverb)
    lp.connect(bus.songDelaySend)

    const stopAt = time + duration + 0.36
    for (let i = 0; i < notes.length; i++) {
      const freq = midiToFreq(notes[i])
      const panner = ctx.createStereoPanner()
      panner.pan.value =
        notes.length > 1 ? ((i / (notes.length - 1)) * 2 - 1) * 0.45 : 0
      panner.connect(chordGain)

      const carrier = ctx.createOscillator()
      const mod = ctx.createOscillator()
      const modGain = ctx.createGain()

      carrier.type = 'sine'
      mod.type = 'sine'
      carrier.frequency.setValueAtTime(freq, time)
      mod.frequency.setValueAtTime(freq * 2, time)

      modGain.gain.setValueAtTime(freq * 0.95, time)
      modGain.gain.exponentialRampToValueAtTime(Math.max(1, freq * 0.05), time + 0.25)

      const voiceGain = ctx.createGain()
      voiceGain.gain.value = 1 / Math.max(2.4, notes.length * 0.64)

      mod.connect(modGain)
      modGain.connect(carrier.frequency)
      carrier.connect(voiceGain)
      voiceGain.connect(panner)

      carrier.start(time)
      mod.start(time)
      carrier.stop(stopAt)
      mod.stop(stopAt)
    }
  }

  private triggerBass(
    ctx: AudioContext,
    bus: ActiveSongBus,
    time: number,
    freq: number,
    duration: number,
    style: MusicTrackSpec['style'],
  ): void {
    // Cleanly choke previous bass tail before new note triggers so sub remains super tight
    if (this.activeBassStopTimer) {
      const prev = this.activeBassStopTimer
      prev.env.gain.cancelScheduledValues(time)
      prev.env.gain.setTargetAtTime(0.0001, time, 0.008)
    }

    const env = ctx.createGain()
    const peak = style === 'nocturne' || style === 'ambient' ? 0.23 : 0.21
    env.gain.setValueAtTime(0.0008, time)
    env.gain.linearRampToValueAtTime(peak, time + 0.009)
    env.gain.exponentialRampToValueAtTime(0.0008, time + duration + 0.025)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = style === 'cyber' ? 2.0 : 1.15
    filter.frequency.setValueAtTime(style === 'nocturne' ? 360 : 980, time)
    filter.frequency.exponentialRampToValueAtTime(170, time + Math.min(0.22, duration))

    const subOsc = ctx.createOscillator()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(freq, time)

    const harmOsc = ctx.createOscillator()
    harmOsc.type = style === 'nocturne' || style === 'ambient' ? 'triangle' : 'sawtooth'
    harmOsc.frequency.setValueAtTime(freq, time)

    const harmGain = ctx.createGain()
    harmGain.gain.value = style === 'nocturne' || style === 'ambient' ? 0.34 : 0.45

    subOsc.connect(filter)
    harmOsc.connect(harmGain)
    harmGain.connect(filter)
    filter.connect(env)
    env.connect(bus.bassStem)

    const stopAt = time + duration + 0.05
    subOsc.start(time)
    harmOsc.start(time)
    subOsc.stop(stopAt)
    harmOsc.stop(stopAt)

    this.activeBassStopTimer = { osc1: subOsc, osc2: harmOsc, env }
  }

  private triggerArp(
    ctx: AudioContext,
    bus: ActiveSongBus,
    time: number,
    freq: number,
    duration: number,
    style: MusicTrackSpec['style'],
  ): void {
    const panner = ctx.createStereoPanner()
    panner.pan.value = Math.sin(time * 2.8) * 0.42

    const env = ctx.createGain()
    const peak = style === 'nocturne' ? 0.068 : style === 'ambient' ? 0.085 : 0.075
    env.gain.setValueAtTime(0.0005, time)
    env.gain.linearRampToValueAtTime(peak, time + 0.008)
    env.gain.exponentialRampToValueAtTime(0.0006, time + duration + 0.08)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2900, time)
    filter.frequency.exponentialRampToValueAtTime(860, time + duration)

    const osc = ctx.createOscillator()
    osc.type = style === 'cyber' ? 'sawtooth' : 'triangle'
    osc.frequency.setValueAtTime(freq, time)

    const shimmer = ctx.createOscillator()
    shimmer.type = 'sine'
    shimmer.frequency.setValueAtTime(freq * 2, time)
    const shimmerGain = ctx.createGain()
    shimmerGain.gain.value = 0.22

    osc.connect(filter)
    shimmer.connect(shimmerGain)
    shimmerGain.connect(filter)
    filter.connect(env)
    env.connect(panner)

    panner.connect(bus.leadStem)
    panner.connect(bus.songDelaySend)
    panner.connect(bus.songReverb)

    const stopAt = time + duration + 0.1
    osc.start(time)
    shimmer.start(time)
    osc.stop(stopAt)
    shimmer.stop(stopAt)
  }

  private triggerLead(
    ctx: AudioContext,
    bus: ActiveSongBus,
    time: number,
    freq: number,
    duration: number,
    style: MusicTrackSpec['style'],
  ): void {
    const panner = ctx.createStereoPanner()
    panner.pan.value = 0.06

    const env = ctx.createGain()
    const peak = style === 'nocturne' ? 0.145 : style === 'ambient' ? 0.15 : 0.16
    env.gain.setValueAtTime(0.0005, time)
    env.gain.linearRampToValueAtTime(peak, time + 0.018)
    env.gain.exponentialRampToValueAtTime(
      peak * 0.56,
      time + Math.min(0.22, duration * 0.55),
    )
    env.gain.exponentialRampToValueAtTime(0.0006, time + duration + 0.2)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(3100, time)
    filter.frequency.exponentialRampToValueAtTime(1280, time + duration + 0.16)

    const carrier = ctx.createOscillator()
    carrier.type = style === 'nocturne' || style === 'ambient' ? 'sine' : 'triangle'
    carrier.frequency.setValueAtTime(freq, time)

    // Expressive delayed vibrato bloom on held melody notes
    const vibratoDepth = ctx.createGain()
    vibratoDepth.gain.setValueAtTime(0, time)
    vibratoDepth.gain.linearRampToValueAtTime(freq * 0.0055, time + 0.16)
    bus.vibratoLfo.connect(vibratoDepth)
    vibratoDepth.connect(carrier.frequency)

    const mod = ctx.createOscillator()
    mod.type = 'sine'
    mod.frequency.setValueAtTime(freq * 2, time)
    const modGain = ctx.createGain()
    modGain.gain.setValueAtTime(freq * (style === 'nocturne' ? 0.72 : 1.15), time)
    modGain.gain.exponentialRampToValueAtTime(Math.max(1, freq * 0.04), time + 0.24)

    const detuneLayer = ctx.createOscillator()
    detuneLayer.type = style === 'nocturne' || style === 'ambient' ? 'triangle' : 'sawtooth'
    detuneLayer.frequency.setValueAtTime(freq, time)
    detuneLayer.detune.value = 6.5
    const detuneGain = ctx.createGain()
    detuneGain.gain.value = style === 'nocturne' || style === 'ambient' ? 0.24 : 0.22

    mod.connect(modGain)
    modGain.connect(carrier.frequency)
    carrier.connect(filter)
    detuneLayer.connect(detuneGain)
    detuneGain.connect(filter)

    filter.connect(env)
    env.connect(panner)

    panner.connect(bus.leadStem)
    panner.connect(bus.songDelaySend)
    panner.connect(bus.songReverb)

    const stopAt = time + duration + 0.25
    carrier.start(time)
    mod.start(time)
    detuneLayer.start(time)
    carrier.stop(stopAt)
    mod.stop(stopAt)
    detuneLayer.stop(stopAt)
  }

  private triggerKick(
    ctx: AudioContext,
    bus: ActiveSongBus,
    time: number,
    velocity: number,
    style: MusicTrackSpec['style'],
  ): void {
    const env = ctx.createGain()
    const peak = (style === 'nocturne' || style === 'ambient' ? 0.34 : 0.4) * velocity
    env.gain.setValueAtTime(0.001, time)
    env.gain.linearRampToValueAtTime(peak, time + 0.004)
    env.gain.exponentialRampToValueAtTime(0.0008, time + 0.21)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(style === 'nocturne' ? 105 : 138, time)
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.05)
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.2)

    osc.connect(env)
    env.connect(bus.drumStem)

    osc.start(time)
    osc.stop(time + 0.24)
  }

  private triggerSnare(
    ctx: AudioContext,
    bus: ActiveSongBus,
    time: number,
    velocity: number,
    style: MusicTrackSpec['style'],
  ): void {
    if (!this.noiseBuffer) return

    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(style === 'nocturne' ? 200 : 185, time)
    osc.frequency.exponentialRampToValueAtTime(102, time + 0.065)

    oscGain.gain.setValueAtTime(0.001, time)
    oscGain.gain.linearRampToValueAtTime(0.14 * velocity, time + 0.003)
    oscGain.gain.exponentialRampToValueAtTime(0.0008, time + 0.1)
    osc.connect(oscGain)
    oscGain.connect(bus.drumStem)
    osc.start(time)
    osc.stop(time + 0.12)

    const noise = ctx.createBufferSource()
    noise.buffer = this.noiseBuffer
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = style === 'nocturne' ? 2000 : 2400
    bp.Q.value = 0.8

    const nGain = ctx.createGain()
    const nPeak = (style === 'nocturne' || style === 'ambient' ? 0.09 : 0.15) * velocity
    const tail = style === 'nocturne' ? 0.1 : 0.16
    nGain.gain.setValueAtTime(0.0008, time)
    nGain.gain.linearRampToValueAtTime(nPeak, time + 0.003)
    nGain.gain.exponentialRampToValueAtTime(0.0008, time + tail)

    noise.connect(bp)
    bp.connect(nGain)
    nGain.connect(bus.drumStem)
    nGain.connect(bus.songReverb)

    noise.start(time)
    noise.stop(time + tail + 0.02)
  }

  private triggerHat(
    ctx: AudioContext,
    bus: ActiveSongBus,
    time: number,
    velocity: number,
  ): void {
    if (!this.metallicNoiseBuffer) return
    const src = ctx.createBufferSource()
    src.buffer = this.metallicNoiseBuffer

    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 7200

    const panner = ctx.createStereoPanner()
    panner.pan.value = -0.18

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0005, time)
    env.gain.linearRampToValueAtTime(0.065 * velocity, time + 0.002)
    env.gain.exponentialRampToValueAtTime(0.0005, time + 0.04)

    src.connect(hp)
    hp.connect(env)
    env.connect(panner)
    panner.connect(bus.drumStem)

    src.start(time)
    src.stop(time + 0.05)
  }

  public playTypingChime(keyCode: string, combo = 0): void {
    this.unlockFromGesture()
    if (!this.keyChimesEnabled || this.isMuted) return
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running' || !this.fxGain || !this.fxDelaySend || !this.fxReverb) return

    const now = ctx.currentTime
    const track = MUSIC_TRACKS[this.trackId]
    const bar = track.bars[this.displayedBar % track.bars.length]
    const scale = bar.chimeScale

    const codeHash = hashKeyCode(keyCode) % 3
    this.chimeStepOffset = (this.chimeStepOffset + 1 + codeHash) % scale.length
    const midi = scale[this.chimeStepOffset]
    const freq = midiToFreq(midi)

    const panner = ctx.createStereoPanner()
    panner.pan.value = (((hashKeyCode(keyCode) % 11) / 10) * 2 - 1) * 0.42

    const comboBrightness = Math.min(1, combo / 40)
    const gainLevel = 0.08 + comboBrightness * 0.025

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0005, now)
    env.gain.linearRampToValueAtTime(gainLevel, now + 0.005)
    env.gain.exponentialRampToValueAtTime(0.0006, now + 0.24)

    const carrier = ctx.createOscillator()
    carrier.type = 'sine'
    carrier.frequency.setValueAtTime(freq, now)

    const mod = ctx.createOscillator()
    mod.type = 'sine'
    mod.frequency.setValueAtTime(freq * 2, now)
    const modGain = ctx.createGain()
    modGain.gain.setValueAtTime(freq * (0.6 + comboBrightness * 0.4), now)
    modGain.gain.exponentialRampToValueAtTime(Math.max(1, freq * 0.02), now + 0.09)

    mod.connect(modGain)
    modGain.connect(carrier.frequency)
    carrier.connect(env)
    env.connect(panner)

    panner.connect(this.fxGain)
    panner.connect(this.fxDelaySend)
    panner.connect(this.fxReverb)

    carrier.start(now)
    mod.start(now)
    carrier.stop(now + 0.26)
    mod.stop(now + 0.26)
  }

  public playErrorPulse(): void {
    this.unlockFromGesture()
    if (this.isMuted) return
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running' || !this.fxGain) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.exponentialRampToValueAtTime(56, now + 0.14)

    filter.type = 'lowpass'
    filter.Q.value = 3.2
    filter.frequency.setValueAtTime(560, now)
    filter.frequency.exponentialRampToValueAtTime(130, now + 0.14)

    env.gain.setValueAtTime(0.0008, now)
    env.gain.linearRampToValueAtTime(0.2, now + 0.005)
    env.gain.exponentialRampToValueAtTime(0.0006, now + 0.16)

    osc.connect(filter)
    filter.connect(env)
    env.connect(this.fxGain)

    osc.start(now)
    osc.stop(now + 0.18)
  }

  public playHoloBurst(): void {
    this.unlockFromGesture()
    if (this.isMuted) return
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running' || !this.fxGain || !this.fxDelaySend || !this.fxReverb) return

    const now = ctx.currentTime
    const track = MUSIC_TRACKS[this.trackId]
    const bar = track.bars[this.displayedBar % track.bars.length]
    const notes = bar.chimeScale.slice(0, 4)

    notes.forEach((midi, idx) => {
      const start = now + idx * 0.045
      const freq = midiToFreq(midi)
      const osc = ctx.createOscillator()
      const env = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, start)
      env.gain.setValueAtTime(0.0005, start)
      env.gain.linearRampToValueAtTime(0.075, start + 0.012)
      env.gain.exponentialRampToValueAtTime(0.0006, start + 0.42)

      osc.connect(env)
      env.connect(this.fxGain!)
      env.connect(this.fxDelaySend!)
      env.connect(this.fxReverb!)

      osc.start(start)
      osc.stop(start + 0.45)
    })
  }

  /**
   * Computes smooth log-weighted perceptual FFT levels across targetHalfBins (32)
   * with slight high-frequency presence weighting so shimmer and melodies animate crisply.
   */
  public sampleAudioMetrics(targetHalfBins: Float32Array): AudioSpectrumSnapshot {
    if (!this.analyser || !this.audioReady || this.isMuted) {
      targetHalfBins.fill(0)
      return { bass: 0, mid: 0, treble: 0, energy: 0, beatPulse: 0 }
    }

    this.analyser.getByteFrequencyData(this.spectrumBytes)
    const srcLen = this.spectrumBytes.length
    const dstLen = targetHalfBins.length

    for (let i = 0; i < dstLen; i++) {
      // Logarithmic perceptual distribution across bins [1 .. 88]
      const t = i / Math.max(1, dstLen - 1)
      const logPos = 1 + Math.pow(t, 1.45) * Math.min(86, srcLen - 2)
      const idx0 = Math.floor(logPos)
      const idx1 = Math.min(srcLen - 1, idx0 + 1)
      const frac = logPos - idx0
      const raw = (this.spectrumBytes[idx0] * (1 - frac) + this.spectrumBytes[idx1] * frac) / 255
      // Gently tame booming low end & lift delicate high shimmer for sleek balanced visual silhouette
      const eqTilt = 0.72 + t * 0.55
      targetHalfBins[i] = Math.min(1, raw * eqTilt)
    }

    let bassSum = 0
    for (let i = 1; i < 8 && i < srcLen; i++) bassSum += this.spectrumBytes[i]
    const bass = bassSum / (7 * 255)

    let midSum = 0
    for (let i = 8; i < 32 && i < srcLen; i++) midSum += this.spectrumBytes[i]
    const mid = midSum / (24 * 255)

    let trebleSum = 0
    for (let i = 32; i < 72 && i < srcLen; i++) trebleSum += this.spectrumBytes[i]
    const treble = trebleSum / (40 * 255)

    const kickAge = performance.now() - this.lastKickAtMs
    const beatPulse = kickAge >= 0 && kickAge < 220 ? Math.pow(1 - kickAge / 220, 1.8) : 0

    return {
      bass,
      mid,
      treble,
      energy: bass * 0.42 + mid * 0.36 + treble * 0.22,
      beatPulse,
    }
  }
}

export const soundEngine = new SciFiMusicEngine()
