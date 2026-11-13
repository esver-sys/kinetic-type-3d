import { SoundProfile } from '../types/typing'

export type KeySoundSize = 'standard' | 'medium' | 'space'

class MechanicalSoundEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private whiteNoiseBuffer: AudioBuffer | null = null
  private warmNoiseBuffer: AudioBuffer | null = null

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return null

      this.ctx = new AudioCtx({ latencyHint: 'interactive' })

      const compressor = this.ctx.createDynamicsCompressor()
      compressor.threshold.value = -14
      compressor.knee.value = 18
      compressor.ratio.value = 4
      compressor.attack.value = 0.002
      compressor.release.value = 0.08

      const master = this.ctx.createGain()
      master.gain.value = 0.78

      master.connect(compressor)
      compressor.connect(this.ctx.destination)
      this.masterGain = master

      this.buildNoiseBuffers(this.ctx)
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }

    return this.ctx
  }

  private buildNoiseBuffers(ctx: AudioContext): void {
    const length = Math.floor(ctx.sampleRate * 0.12)

    const white = ctx.createBuffer(1, length, ctx.sampleRate)
    const whiteData = white.getChannelData(0)
    for (let i = 0; i < length; i++) {
      whiteData[i] = Math.random() * 2 - 1
    }
    this.whiteNoiseBuffer = white

    // One-pole filtered warm noise for PBT / lubed thock transients
    const warm = ctx.createBuffer(1, length, ctx.sampleRate)
    const warmData = warm.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1
      last = last * 0.72 + w * 0.28
      warmData[i] = last * 1.9
    }
    this.warmNoiseBuffer = warm
  }

  public unlock(): void {
    this.ensureContext()
  }

  private sizeMultiplier(size: KeySoundSize): number {
    if (size === 'space') return 0.72
    if (size === 'medium') return 0.86
    return 1.0
  }

  private jitter(amount = 0.045): number {
    return 1 + (Math.random() * 2 - 1) * amount
  }

  public playKeyDown(profile: SoundProfile, size: KeySoundSize = 'standard'): void {
    if (profile === 'mute') return
    const ctx = this.ensureContext()
    if (!ctx || !this.masterGain || !this.whiteNoiseBuffer || !this.warmNoiseBuffer) return

    const now = ctx.currentTime
    const pitchScale = this.sizeMultiplier(size) * this.jitter(0.045)

    if (profile === 'tactile-brown') {
      this.playTactileBrownDown(ctx, now, pitchScale, size)
    } else if (profile === 'clicky-blue') {
      this.playClickyBlueDown(ctx, now, pitchScale, size)
    } else if (profile === 'thocky-linear') {
      this.playThockyLinearDown(ctx, now, pitchScale, size)
    }
  }

  public playKeyUp(profile: SoundProfile, size: KeySoundSize = 'standard'): void {
    if (profile === 'mute') return
    const ctx = this.ensureContext()
    if (!ctx || !this.masterGain || !this.whiteNoiseBuffer || !this.warmNoiseBuffer) return

    const now = ctx.currentTime
    const pitchScale = this.sizeMultiplier(size) * this.jitter(0.05)

    if (profile === 'tactile-brown') {
      this.triggerNoiseBurst(ctx, now, this.warmNoiseBuffer, {
        filterType: 'bandpass',
        freq: 1850 * pitchScale,
        q: 1.5,
        gain: 0.14,
        duration: 0.018,
      })
    } else if (profile === 'clicky-blue') {
      this.triggerNoiseBurst(ctx, now, this.whiteNoiseBuffer, {
        filterType: 'bandpass',
        freq: 3300 * pitchScale,
        q: 2.6,
        gain: 0.16,
        duration: 0.016,
      })
    } else if (profile === 'thocky-linear') {
      this.triggerNoiseBurst(ctx, now, this.warmNoiseBuffer, {
        filterType: 'lowpass',
        freq: 760 * pitchScale,
        q: 0.9,
        gain: 0.12,
        duration: 0.02,
      })
    }
  }

  public playErrorThud(profile: SoundProfile): void {
    if (profile === 'mute') return
    const ctx = this.ensureContext()
    if (!ctx || !this.masterGain || !this.warmNoiseBuffer) return

    const now = ctx.currentTime
    const j = this.jitter(0.03)

    // Muted low damped thud unmistakably distinct from switch clicks
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(118 * j, now)
    osc.frequency.exponentialRampToValueAtTime(52 * j, now + 0.065)

    oscGain.gain.setValueAtTime(0.001, now)
    oscGain.gain.linearRampToValueAtTime(0.32, now + 0.004)
    oscGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.075)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 260

    osc.connect(filter)
    filter.connect(oscGain)
    oscGain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.08)

    this.triggerNoiseBurst(ctx, now, this.warmNoiseBuffer, {
      filterType: 'lowpass',
      freq: 310 * j,
      q: 0.8,
      gain: 0.24,
      duration: 0.045,
    })
  }

  public playPreview(profile: SoundProfile): void {
    if (profile === 'mute') return
    this.playKeyDown(profile, 'standard')
  }

  private playTactileBrownDown(
    ctx: AudioContext,
    now: number,
    pitchScale: number,
    size: KeySoundSize,
  ): void {
    // 1. Tactile bump transient
    this.triggerNoiseBurst(ctx, now, this.whiteNoiseBuffer!, {
      filterType: 'bandpass',
      freq: 2550 * pitchScale,
      q: 2.2,
      gain: 0.22,
      duration: 0.012,
    })

    // 2. Bottom-out housing impact (slightly delayed by ~3ms)
    this.triggerNoiseBurst(ctx, now + 0.003, this.warmNoiseBuffer!, {
      filterType: 'bandpass',
      freq: 1080 * pitchScale,
      q: 1.3,
      gain: size === 'space' ? 0.38 : 0.31,
      duration: 0.026,
    })

    // 3. Subtle PBT keycap body thump
    this.triggerBodyTone(ctx, now + 0.002, {
      startFreq: 215 * pitchScale,
      endFreq: 98 * pitchScale,
      gain: size === 'space' ? 0.22 : 0.16,
      duration: 0.028,
      type: 'sine',
    })
  }

  private playClickyBlueDown(
    ctx: AudioContext,
    now: number,
    pitchScale: number,
    size: KeySoundSize,
  ): void {
    // 1. Primary click-jacket snap
    this.triggerNoiseBurst(ctx, now, this.whiteNoiseBuffer!, {
      filterType: 'bandpass',
      freq: 4300 * pitchScale,
      q: 3.8,
      gain: 0.34,
      duration: 0.012,
    })

    // 2. Crisp harmonic ping of the click bar/jacket
    this.triggerBodyTone(ctx, now, {
      startFreq: 2900 * pitchScale,
      endFreq: 1450 * pitchScale,
      gain: 0.09,
      duration: 0.014,
      type: 'triangle',
    })

    // 3. Bottom-out housing snap (~5ms later)
    this.triggerNoiseBurst(ctx, now + 0.005, this.whiteNoiseBuffer!, {
      filterType: 'bandpass',
      freq: 1850 * pitchScale,
      q: 1.6,
      gain: size === 'space' ? 0.32 : 0.25,
      duration: 0.022,
    })

    this.triggerBodyTone(ctx, now + 0.005, {
      startFreq: 245 * pitchScale,
      endFreq: 118 * pitchScale,
      gain: size === 'space' ? 0.18 : 0.13,
      duration: 0.022,
      type: 'sine',
    })
  }

  private playThockyLinearDown(
    ctx: AudioContext,
    now: number,
    pitchScale: number,
    size: KeySoundSize,
  ): void {
    // 1. Creamy low-mid POM housing resonance
    this.triggerBodyTone(ctx, now, {
      startFreq: 172 * pitchScale,
      endFreq: 68 * pitchScale,
      gain: size === 'space' ? 0.36 : 0.29,
      duration: 0.04,
      type: 'sine',
    })

    // 2. Warm low-pass muffled switch-pad impact
    this.triggerNoiseBurst(ctx, now, this.warmNoiseBuffer!, {
      filterType: 'lowpass',
      freq: 620 * pitchScale,
      q: 1.1,
      gain: size === 'space' ? 0.44 : 0.36,
      duration: 0.032,
    })

    // 3. Gentle rounded mid presence so keys still articulate clearly at high WPM
    this.triggerNoiseBurst(ctx, now + 0.001, this.warmNoiseBuffer!, {
      filterType: 'bandpass',
      freq: 1050 * pitchScale,
      q: 1.0,
      gain: 0.12,
      duration: 0.018,
    })
  }

  private triggerNoiseBurst(
    ctx: AudioContext,
    startTime: number,
    buffer: AudioBuffer,
    opts: {
      filterType: BiquadFilterType
      freq: number
      q: number
      gain: number
      duration: number
    },
  ): void {
    if (!this.masterGain) return

    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.playbackRate.value = 0.92 + Math.random() * 0.16

    const filter = ctx.createBiquadFilter()
    filter.type = opts.filterType
    filter.frequency.setValueAtTime(opts.freq, startTime)
    filter.Q.setValueAtTime(opts.q, startTime)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0005, startTime)
    env.gain.linearRampToValueAtTime(opts.gain, startTime + 0.0018)
    env.gain.exponentialRampToValueAtTime(0.0005, startTime + opts.duration)

    src.connect(filter)
    filter.connect(env)
    env.connect(this.masterGain)

    src.start(startTime)
    src.stop(startTime + opts.duration + 0.005)
  }

  private triggerBodyTone(
    ctx: AudioContext,
    startTime: number,
    opts: {
      startFreq: number
      endFreq: number
      gain: number
      duration: number
      type: OscillatorType
    },
  ): void {
    if (!this.masterGain) return

    const osc = ctx.createOscillator()
    osc.type = opts.type
    osc.frequency.setValueAtTime(opts.startFreq, startTime)
    osc.frequency.exponentialRampToValueAtTime(Math.max(24, opts.endFreq), startTime + opts.duration)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0005, startTime)
    env.gain.linearRampToValueAtTime(opts.gain, startTime + 0.0015)
    env.gain.exponentialRampToValueAtTime(0.0005, startTime + opts.duration)

    osc.connect(env)
    env.connect(this.masterGain)

    osc.start(startTime)
    osc.stop(startTime + opts.duration + 0.005)
  }
}

export const soundEngine = new MechanicalSoundEngine()
