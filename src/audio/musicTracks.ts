import { MusicTrackId } from '../types/typing'

export interface ChordBarSpec {
  /** Open spread-voiced chord tones for smooth lush pad / electric keys */
  pad: number[]
  /** Bass notes per 16th step (0 = rest) */
  bass: number[]
  /** Lead melody notes per 16th step (0 = rest) */
  lead: number[]
  /** Arpeggio sparkle notes per 16th step (0 = rest) */
  arp: number[]
  /** Safe harmonic MIDI scale notes used for typing keystroke chimes */
  chimeScale: number[]
  /** Human-readable chord symbol for telemetry UI */
  chordName: string
}

export interface DrumPatternSpec {
  /** Kick intensities [0..1] across 16 steps */
  kick: number[]
  /** Snare / Rim intensities [0..1] across 16 steps */
  snare: number[]
  /** Hi-hat intensities [0..1] across 16 steps */
  hat: number[]
}

export interface MusicTrackSpec {
  id: MusicTrackId
  bpm: number
  swing: number
  keySignature: string
  style: 'synthwave' | 'nocturne' | 'cyber' | 'ambient'
  bars: ChordBarSpec[]
  drums: DrumPatternSpec
  /** Optional dynamic chorus drum groove for bars 4-7 */
  chorusDrums?: DrumPatternSpec
}

const STELLAR_CHIME_SCALE = [69, 71, 73, 76, 78, 81, 83, 85] // A major pentatonic
const NOCTURNE_CHIME_SCALE = [72, 74, 76, 79, 81, 84, 86, 88] // C major pentatonic
const QUANTUM_CHIME_SCALE = [72, 74, 75, 79, 82, 84, 86, 87] // C minor pentatonic + 9
const NEBULA_CHIME_SCALE = [67, 69, 71, 74, 76, 79, 81, 83] // G major pentatonic

/**
 * Every pad chord uses open drop/spread voicings (>= 3 semitones between upper adjacent tones)
 * so rich detuned synth oscillators never produce muddy minor-2nd frequency beating.
 */
export const MUSIC_TRACKS: Record<MusicTrackId, MusicTrackSpec> = {
  'stellar-drift': {
    id: 'stellar-drift',
    bpm: 104,
    swing: 0.03,
    keySignature: 'F#m / A',
    style: 'synthwave',
    drums: {
      kick: [1.0, 0, 0, 0, 0.9, 0, 0, 0, 0.98, 0, 0, 0, 0.92, 0, 0.25, 0],
      snare: [0, 0, 0, 0, 0.84, 0, 0, 0, 0, 0, 0, 0, 0.88, 0, 0, 0.2],
      hat: [0.25, 0.12, 0.48, 0.15, 0.25, 0.12, 0.5, 0.16, 0.25, 0.12, 0.48, 0.15, 0.25, 0.12, 0.54, 0.2],
    },
    chorusDrums: {
      kick: [1.0, 0, 0, 0, 0.94, 0, 0, 0, 1.0, 0, 0, 0.18, 0.95, 0, 0.3, 0],
      snare: [0, 0, 0, 0, 0.9, 0, 0, 0.14, 0, 0, 0, 0, 0.92, 0, 0.18, 0.24],
      hat: [0.3, 0.18, 0.58, 0.2, 0.3, 0.18, 0.6, 0.22, 0.3, 0.18, 0.58, 0.2, 0.3, 0.18, 0.64, 0.26],
    },
    bars: [
      // F#m9: F#3(54), C#4(61), E4(64), A4(69), G#5(80) -> spread, zero clash
      {
        chordName: 'F#m9',
        pad: [54, 61, 64, 69, 80],
        bass: [42, 0, 42, 0, 54, 0, 42, 0, 42, 0, 42, 0, 54, 0, 49, 0],
        arp: [66, 0, 69, 0, 73, 0, 76, 0, 73, 0, 69, 0, 66, 0, 69, 0],
        lead: [73, 0, 0, 76, 0, 0, 78, 0, 76, 0, 73, 0, 71, 0, 69, 0],
        chimeScale: STELLAR_CHIME_SCALE,
      },
      // Dmaj9: D3(50), A3(57), F#4(66), C#5(73), E5(76)
      {
        chordName: 'Dmaj9',
        pad: [50, 57, 66, 73, 76],
        bass: [38, 0, 38, 0, 50, 0, 38, 0, 38, 0, 38, 0, 50, 0, 45, 0],
        arp: [62, 0, 66, 0, 69, 0, 73, 0, 69, 0, 66, 0, 64, 0, 69, 0],
        lead: [78, 0, 0, 76, 0, 0, 73, 0, 71, 0, 73, 0, 69, 0, 0, 0],
        chimeScale: STELLAR_CHIME_SCALE,
      },
      // Aadd9: A3(57), E4(64), A4(69), C#5(73), B5(83)
      {
        chordName: 'Aadd9',
        pad: [57, 64, 69, 73, 83],
        bass: [45, 0, 45, 0, 57, 0, 45, 0, 45, 0, 45, 0, 57, 0, 52, 0],
        arp: [69, 0, 73, 0, 76, 0, 81, 0, 76, 0, 73, 0, 71, 0, 76, 0],
        lead: [73, 0, 0, 76, 0, 0, 81, 0, 80, 0, 76, 0, 73, 0, 71, 0],
        chimeScale: STELLAR_CHIME_SCALE,
      },
      // E6: E3(52), B3(59), G#4(68), C#5(73), E5(76)
      {
        chordName: 'E6',
        pad: [52, 59, 68, 73, 76],
        bass: [40, 0, 40, 0, 52, 0, 40, 0, 40, 0, 40, 0, 52, 0, 47, 0],
        arp: [64, 0, 68, 0, 71, 0, 76, 0, 71, 0, 68, 0, 64, 0, 71, 0],
        lead: [71, 0, 0, 73, 0, 0, 76, 0, 80, 0, 78, 0, 76, 0, 73, 0],
        chimeScale: STELLAR_CHIME_SCALE,
      },
      // Chorus F#m9
      {
        chordName: 'F#m9',
        pad: [54, 61, 64, 69, 80],
        bass: [42, 0, 42, 0, 54, 0, 42, 0, 42, 0, 42, 0, 54, 0, 49, 0],
        arp: [66, 69, 73, 76, 78, 76, 73, 69, 66, 69, 73, 76, 78, 81, 78, 73],
        lead: [81, 0, 0, 80, 0, 0, 78, 0, 76, 0, 78, 0, 80, 0, 76, 0],
        chimeScale: STELLAR_CHIME_SCALE,
      },
      // Chorus Dmaj9
      {
        chordName: 'Dmaj9',
        pad: [50, 57, 66, 73, 76],
        bass: [38, 0, 38, 0, 50, 0, 38, 0, 38, 0, 38, 0, 50, 0, 45, 0],
        arp: [62, 66, 69, 73, 76, 73, 69, 66, 62, 66, 69, 73, 76, 78, 76, 73],
        lead: [85, 0, 0, 83, 0, 0, 81, 0, 78, 0, 76, 0, 78, 0, 0, 0],
        chimeScale: STELLAR_CHIME_SCALE,
      },
      // Chorus Aadd9
      {
        chordName: 'Aadd9',
        pad: [57, 64, 69, 73, 83],
        bass: [45, 0, 45, 0, 57, 0, 45, 0, 45, 0, 45, 0, 57, 0, 52, 0],
        arp: [69, 73, 76, 81, 83, 81, 76, 73, 69, 73, 76, 81, 83, 85, 83, 76],
        lead: [81, 0, 0, 83, 0, 0, 85, 0, 83, 0, 81, 0, 80, 0, 76, 0],
        chimeScale: STELLAR_CHIME_SCALE,
      },
      // Chorus E/G#
      {
        chordName: 'E/G#',
        pad: [56, 59, 64, 68, 76],
        bass: [44, 0, 44, 0, 56, 0, 44, 0, 40, 0, 40, 0, 52, 0, 47, 0],
        arp: [64, 68, 71, 76, 80, 76, 71, 68, 64, 68, 71, 76, 80, 83, 80, 76],
        lead: [78, 0, 0, 80, 0, 0, 81, 0, 80, 0, 76, 0, 73, 0, 71, 0],
        chimeScale: STELLAR_CHIME_SCALE,
      },
    ],
  },

  'orbital-nocturne': {
    id: 'orbital-nocturne',
    bpm: 84,
    swing: 0.08,
    keySignature: 'C / Am9',
    style: 'nocturne',
    drums: {
      kick: [0.9, 0, 0, 0, 0, 0, 0.5, 0, 0.85, 0, 0.4, 0, 0, 0, 0, 0.22],
      snare: [0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0, 0, 0, 0.74, 0, 0, 0.18],
      hat: [0.32, 0, 0.22, 0, 0.38, 0, 0.22, 0, 0.32, 0, 0.24, 0, 0.38, 0, 0.26, 0.14],
    },
    chorusDrums: {
      kick: [0.92, 0, 0, 0, 0, 0, 0.56, 0, 0.88, 0, 0.45, 0, 0, 0, 0.28, 0],
      snare: [0, 0, 0, 0, 0.76, 0, 0, 0.15, 0, 0, 0, 0, 0.8, 0, 0, 0.22],
      hat: [0.35, 0.12, 0.26, 0.14, 0.4, 0.12, 0.26, 0.14, 0.35, 0.12, 0.28, 0.14, 0.4, 0.12, 0.3, 0.18],
    },
    bars: [
      {
        chordName: 'Fmaj9',
        pad: [53, 60, 64, 67, 72],
        bass: [41, 0, 0, 0, 0, 0, 41, 0, 45, 0, 0, 0, 0, 0, 48, 0],
        arp: [0, 0, 72, 0, 76, 0, 0, 0, 0, 0, 79, 0, 76, 0, 0, 0],
        lead: [76, 0, 0, 0, 79, 0, 81, 0, 76, 0, 0, 74, 72, 0, 0, 0],
        chimeScale: NOCTURNE_CHIME_SCALE,
      },
      {
        chordName: 'G6',
        pad: [55, 59, 62, 67, 76],
        bass: [43, 0, 0, 0, 0, 0, 43, 0, 47, 0, 0, 0, 0, 0, 50, 0],
        arp: [0, 0, 74, 0, 79, 0, 0, 0, 0, 0, 81, 0, 79, 0, 0, 0],
        lead: [74, 0, 0, 76, 0, 0, 79, 0, 76, 0, 0, 0, 74, 0, 72, 0],
        chimeScale: NOCTURNE_CHIME_SCALE,
      },
      {
        chordName: 'Em7',
        pad: [52, 59, 62, 67, 74],
        bass: [40, 0, 0, 0, 0, 0, 40, 0, 43, 0, 0, 0, 0, 0, 47, 0],
        arp: [0, 0, 71, 0, 76, 0, 0, 0, 0, 0, 79, 0, 76, 0, 0, 0],
        lead: [79, 0, 0, 81, 0, 0, 76, 0, 74, 0, 72, 0, 74, 0, 0, 0],
        chimeScale: NOCTURNE_CHIME_SCALE,
      },
      {
        chordName: 'Am9',
        pad: [57, 64, 67, 71, 76],
        bass: [45, 0, 0, 0, 0, 0, 45, 0, 48, 0, 0, 0, 52, 0, 48, 0],
        arp: [0, 0, 72, 0, 76, 0, 0, 0, 0, 0, 81, 0, 79, 0, 0, 0],
        lead: [76, 0, 0, 0, 72, 0, 74, 0, 76, 0, 79, 0, 81, 0, 0, 0],
        chimeScale: NOCTURNE_CHIME_SCALE,
      },
      {
        chordName: 'Dm9',
        pad: [50, 57, 60, 64, 69],
        bass: [38, 0, 0, 0, 0, 0, 38, 0, 45, 0, 0, 0, 0, 0, 41, 0],
        arp: [0, 0, 72, 0, 76, 0, 0, 0, 0, 0, 79, 0, 74, 0, 0, 0],
        lead: [84, 0, 0, 81, 0, 0, 79, 0, 76, 0, 74, 0, 72, 0, 0, 0],
        chimeScale: NOCTURNE_CHIME_SCALE,
      },
      {
        chordName: 'G13',
        pad: [55, 62, 65, 69, 71],
        bass: [43, 0, 0, 0, 0, 0, 43, 0, 47, 0, 0, 0, 50, 0, 47, 0],
        arp: [0, 0, 74, 0, 79, 0, 0, 0, 0, 0, 83, 0, 79, 0, 0, 0],
        lead: [79, 0, 0, 81, 0, 0, 84, 0, 83, 0, 79, 0, 76, 0, 74, 0],
        chimeScale: NOCTURNE_CHIME_SCALE,
      },
      {
        chordName: 'Cmaj9',
        pad: [48, 55, 59, 64, 74],
        bass: [36, 0, 0, 0, 0, 0, 36, 0, 43, 0, 0, 0, 48, 0, 43, 0],
        arp: [0, 0, 72, 0, 76, 0, 0, 0, 0, 0, 79, 0, 76, 0, 0, 0],
        lead: [76, 0, 0, 79, 0, 0, 74, 0, 72, 0, 0, 0, 0, 0, 74, 76],
        chimeScale: NOCTURNE_CHIME_SCALE,
      },
      {
        chordName: 'Cmaj7/G',
        pad: [55, 60, 64, 67, 71],
        bass: [43, 0, 0, 0, 0, 0, 43, 0, 48, 0, 0, 0, 43, 0, 40, 0],
        arp: [0, 0, 76, 0, 79, 0, 0, 0, 0, 0, 84, 0, 79, 0, 76, 0],
        lead: [79, 0, 0, 76, 0, 0, 74, 0, 72, 0, 0, 0, 0, 0, 0, 0],
        chimeScale: NOCTURNE_CHIME_SCALE,
      },
    ],
  },

  'quantum-pulse': {
    id: 'quantum-pulse',
    bpm: 116,
    swing: 0.0,
    keySignature: 'Cm9',
    style: 'cyber',
    drums: {
      kick: [1.0, 0, 0, 0, 0.9, 0, 0, 0, 1.0, 0, 0, 0, 0.92, 0, 0, 0],
      snare: [0, 0, 0, 0, 0.88, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0.2, 0],
      hat: [0.34, 0.16, 0.56, 0.16, 0.34, 0.16, 0.56, 0.16, 0.34, 0.16, 0.56, 0.16, 0.34, 0.16, 0.62, 0.22],
    },
    chorusDrums: {
      kick: [1.0, 0, 0, 0.2, 0.94, 0, 0, 0, 1.0, 0, 0.18, 0, 0.94, 0, 0.26, 0],
      snare: [0, 0, 0, 0, 0.92, 0, 0, 0.16, 0, 0, 0, 0, 0.94, 0, 0.22, 0.25],
      hat: [0.36, 0.22, 0.62, 0.22, 0.36, 0.22, 0.62, 0.24, 0.36, 0.22, 0.62, 0.22, 0.36, 0.24, 0.68, 0.28],
    },
    bars: [
      // Cm9 spread: C3(48), G3(55), Eb4(63), Bb4(70), D5(74) -> pure wide spacing
      {
        chordName: 'Cm9',
        pad: [48, 55, 63, 70, 74],
        bass: [36, 0, 48, 0, 36, 0, 48, 36, 36, 0, 48, 0, 36, 48, 43, 0],
        arp: [60, 63, 67, 70, 72, 70, 67, 63, 60, 63, 67, 72, 74, 72, 67, 63],
        lead: [79, 0, 0, 75, 0, 0, 74, 0, 72, 0, 0, 74, 75, 0, 79, 0],
        chimeScale: QUANTUM_CHIME_SCALE,
      },
      // Abmaj7: Ab3(56), Eb4(63), G4(67), C5(72), Eb5(75)
      {
        chordName: 'Abmaj7',
        pad: [56, 63, 67, 72, 75],
        bass: [44, 0, 56, 0, 44, 0, 56, 44, 44, 0, 56, 0, 44, 56, 51, 0],
        arp: [68, 72, 75, 79, 80, 79, 75, 72, 68, 72, 75, 79, 80, 79, 75, 72],
        lead: [84, 0, 0, 82, 0, 0, 79, 0, 75, 0, 0, 79, 82, 0, 0, 0],
        chimeScale: QUANTUM_CHIME_SCALE,
      },
      // Ebadd9 spread: Eb3(51), Bb3(58), G4(67), D5(74), Eb5(75)? No! Use F5(77) or Bb4(70) -> [51, 58, 63, 67, 74]
      {
        chordName: 'Ebadd9',
        pad: [51, 58, 63, 67, 74],
        bass: [39, 0, 51, 0, 39, 0, 51, 39, 39, 0, 51, 0, 39, 51, 46, 0],
        arp: [63, 67, 70, 74, 75, 74, 70, 67, 63, 67, 70, 74, 75, 74, 70, 67],
        lead: [79, 0, 0, 75, 0, 0, 74, 0, 75, 0, 79, 0, 82, 0, 79, 0],
        chimeScale: QUANTUM_CHIME_SCALE,
      },
      // Bbadd9: Bb2(46), F3(53), D4(62), G4(67), C5(72)
      {
        chordName: 'Bb6/9',
        pad: [46, 53, 62, 67, 72],
        bass: [46, 0, 58, 0, 46, 0, 58, 46, 46, 0, 58, 0, 46, 58, 53, 0],
        arp: [65, 70, 72, 74, 77, 74, 72, 70, 65, 70, 72, 74, 77, 74, 72, 70],
        lead: [77, 0, 0, 79, 0, 0, 74, 0, 77, 0, 79, 0, 82, 0, 74, 0],
        chimeScale: QUANTUM_CHIME_SCALE,
      },
      // Fm9 Chorus: F3(53), C4(60), G4(67), Bb4(70), Eb5(75)
      {
        chordName: 'Fm9',
        pad: [53, 60, 67, 70, 75],
        bass: [41, 0, 53, 0, 41, 0, 53, 41, 41, 0, 53, 0, 41, 53, 48, 0],
        arp: [65, 68, 72, 75, 79, 75, 72, 68, 65, 68, 72, 75, 79, 82, 79, 75],
        lead: [84, 0, 0, 82, 0, 0, 84, 0, 87, 0, 86, 0, 84, 0, 79, 0],
        chimeScale: QUANTUM_CHIME_SCALE,
      },
      // Cm9 Chorus
      {
        chordName: 'Cm9',
        pad: [48, 55, 63, 70, 74],
        bass: [36, 0, 48, 0, 36, 0, 48, 36, 36, 0, 48, 0, 36, 48, 43, 0],
        arp: [60, 63, 67, 72, 75, 72, 67, 63, 60, 63, 67, 72, 75, 79, 75, 72],
        lead: [87, 0, 0, 86, 0, 0, 84, 0, 82, 0, 79, 0, 84, 0, 0, 0],
        chimeScale: QUANTUM_CHIME_SCALE,
      },
      // Abmaj7 Chorus
      {
        chordName: 'Abmaj7',
        pad: [56, 63, 67, 72, 75],
        bass: [44, 0, 56, 0, 44, 0, 56, 44, 44, 0, 56, 0, 44, 56, 51, 0],
        arp: [68, 72, 75, 79, 84, 79, 75, 72, 68, 72, 75, 79, 84, 82, 79, 75],
        lead: [84, 0, 0, 82, 0, 0, 79, 0, 75, 0, 79, 0, 82, 0, 84, 0],
        chimeScale: QUANTUM_CHIME_SCALE,
      },
      // Gm11 release
      {
        chordName: 'Gm11',
        pad: [55, 62, 65, 70, 72],
        bass: [43, 0, 55, 0, 43, 0, 55, 43, 43, 0, 55, 0, 43, 46, 48, 50],
        arp: [67, 70, 74, 77, 79, 77, 74, 70, 67, 70, 74, 79, 82, 79, 74, 70],
        lead: [86, 0, 0, 84, 0, 0, 82, 0, 79, 0, 75, 0, 74, 0, 75, 0],
        chimeScale: QUANTUM_CHIME_SCALE,
      },
    ],
  },

  'nebula-elegy': {
    id: 'nebula-elegy',
    bpm: 92,
    swing: 0.02,
    keySignature: 'G / Em',
    style: 'ambient',
    drums: {
      kick: [0.82, 0, 0, 0, 0, 0, 0, 0, 0.72, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0.35, 0, 0, 0, 0, 0, 0, 0, 0.42, 0, 0, 0],
      hat: [0, 0, 0.22, 0, 0.26, 0, 0.22, 0, 0, 0, 0.24, 0, 0.28, 0, 0.22, 0.14],
    },
    chorusDrums: {
      kick: [0.88, 0, 0, 0, 0, 0, 0.45, 0, 0.85, 0, 0, 0, 0, 0, 0.25, 0],
      snare: [0, 0, 0, 0, 0.56, 0, 0, 0, 0, 0, 0, 0, 0.62, 0, 0, 0.16],
      hat: [0.22, 0, 0.32, 0, 0.25, 0, 0.34, 0.14, 0.22, 0, 0.32, 0, 0.28, 0, 0.38, 0.18],
    },
    bars: [
      // Em9: E3(52), B3(59), G4(67), D5(74), F#5(78)
      {
        chordName: 'Em9',
        pad: [52, 59, 67, 74, 78],
        bass: [40, 0, 0, 0, 0, 0, 47, 0, 52, 0, 0, 0, 0, 0, 47, 0],
        arp: [64, 0, 67, 0, 71, 0, 74, 0, 78, 0, 74, 0, 71, 0, 67, 0],
        lead: [79, 0, 0, 0, 78, 0, 74, 0, 71, 0, 0, 74, 76, 0, 0, 0],
        chimeScale: NEBULA_CHIME_SCALE,
      },
      // Cmaj9: C3(48), G3(55), E4(64), B4(71), D5(74)
      {
        chordName: 'Cmaj9',
        pad: [48, 55, 64, 71, 74],
        bass: [36, 0, 0, 0, 0, 0, 43, 0, 48, 0, 0, 0, 0, 0, 43, 0],
        arp: [60, 0, 64, 0, 67, 0, 71, 0, 74, 0, 71, 0, 67, 0, 64, 0],
        lead: [76, 0, 0, 74, 0, 0, 71, 0, 67, 0, 0, 0, 0, 0, 69, 71],
        chimeScale: NEBULA_CHIME_SCALE,
      },
      // Gmaj7: G3(55), D4(62), F#4(66), B4(71), D5(74)
      {
        chordName: 'Gmaj7',
        pad: [55, 62, 66, 71, 74],
        bass: [43, 0, 0, 0, 0, 0, 50, 0, 55, 0, 0, 0, 0, 0, 50, 0],
        arp: [67, 0, 71, 0, 74, 0, 78, 0, 79, 0, 74, 0, 71, 0, 67, 0],
        lead: [74, 0, 0, 76, 0, 0, 79, 0, 78, 0, 74, 0, 71, 0, 0, 0],
        chimeScale: NEBULA_CHIME_SCALE,
      },
      // Dadd9/F#: D3(50), A3(57), F#4(66), E5(76)
      {
        chordName: 'D/F#',
        pad: [50, 57, 66, 69, 76],
        bass: [42, 0, 0, 0, 0, 0, 45, 0, 50, 0, 0, 0, 0, 0, 45, 0],
        arp: [62, 0, 66, 0, 69, 0, 74, 0, 76, 0, 74, 0, 69, 0, 66, 0],
        lead: [76, 0, 0, 78, 0, 0, 74, 0, 71, 0, 69, 0, 67, 0, 0, 0],
        chimeScale: NEBULA_CHIME_SCALE,
      },
      // Chorus Em9
      {
        chordName: 'Em9',
        pad: [52, 59, 67, 74, 78],
        bass: [40, 0, 0, 47, 52, 0, 47, 0, 40, 0, 0, 47, 52, 0, 47, 0],
        arp: [64, 67, 71, 74, 78, 74, 71, 67, 64, 67, 71, 74, 79, 74, 71, 67],
        lead: [83, 0, 0, 81, 0, 0, 79, 0, 78, 0, 76, 0, 74, 0, 0, 0],
        chimeScale: NEBULA_CHIME_SCALE,
      },
      // Chorus Cmaj9
      {
        chordName: 'Cmaj9',
        pad: [48, 55, 64, 71, 74],
        bass: [36, 0, 0, 43, 48, 0, 43, 0, 36, 0, 0, 43, 48, 0, 43, 0],
        arp: [60, 64, 67, 71, 74, 71, 67, 64, 60, 64, 67, 71, 76, 71, 67, 64],
        lead: [84, 0, 0, 83, 0, 0, 79, 0, 76, 0, 74, 0, 76, 0, 0, 0],
        chimeScale: NEBULA_CHIME_SCALE,
      },
      // Chorus Gmaj7
      {
        chordName: 'Gmaj7',
        pad: [55, 62, 66, 71, 74],
        bass: [43, 0, 0, 50, 55, 0, 50, 0, 43, 0, 0, 50, 55, 0, 50, 0],
        arp: [67, 71, 74, 78, 79, 78, 74, 71, 67, 71, 74, 79, 83, 79, 74, 71],
        lead: [79, 0, 0, 81, 0, 0, 83, 0, 86, 0, 83, 0, 79, 0, 0, 0],
        chimeScale: NEBULA_CHIME_SCALE,
      },
      // Chorus D6/9 turnaround
      {
        chordName: 'D6',
        pad: [50, 57, 66, 71, 76],
        bass: [38, 0, 0, 45, 50, 0, 45, 0, 42, 0, 0, 45, 50, 0, 45, 0],
        arp: [62, 66, 69, 74, 76, 74, 69, 66, 62, 66, 69, 74, 78, 74, 69, 66],
        lead: [81, 0, 0, 79, 0, 0, 78, 0, 76, 0, 74, 0, 71, 0, 0, 0],
        chimeScale: NEBULA_CHIME_SCALE,
      },
    ],
  },
}

export const TRACK_LIST: MusicTrackId[] = [
  'stellar-drift',
  'orbital-nocturne',
  'quantum-pulse',
  'nebula-elegy',
]
