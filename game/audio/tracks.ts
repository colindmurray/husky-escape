
import { SoundType } from "../../types";
import { Notes } from "./notes";

export interface TrackData {
    tempo: number;
    sequence: number[][]; // [Frequency, Duration in 16th notes]
    instrument: {
        type: OscillatorType;
        attack: number;
        release: number;
        isPlucky?: boolean; // Special handling for Beach theme
    };
}

const { 
    A2, B2, C3, D3, Eb3, E3, F3, G3, Gb3, Ab3,
    A3, Bb3, B3, C4, Db4, D4, E4, F4, Gb4, G4, Ab4, Eb4,
    A4, Bb4, B4, C5, D5, E5, F5, G5, A5,
    Db5 
} = Notes;

// Default Instrument Settings
const DEFAULT_INSTRUMENT = { type: 'triangle' as OscillatorType, attack: 0.05, release: 0.05 };

export const MUSIC_TRACKS: Partial<Record<SoundType, TrackData>> = {
    [SoundType.THEME_POUND]: {
        tempo: 100,
        instrument: { ...DEFAULT_INSTRUMENT, attack: 0.02 },
        sequence: [
            [A2, 4], [0, 2], [C3, 2], [D3, 4], [Eb3, 1], [E3, 3],
            [0, 2], [G3, 2], [E3, 2], [D3, 2], [C3, 2], [A2, 6],
            [A2, 4], [0, 2], [C3, 2], [D3, 4], [Eb3, 1], [E3, 3],
            [G3, 2], [E3, 2], [Eb3, 2], [E3, 2], [A2, 8],
            [A2, 2], [0, 2], [A2, 2], [0, 2], [Bb3, 2], [A3, 2], [G3, 2], [F3, 2],
            [E3, 8], [0, 8]
        ]
    },
    [SoundType.THEME_FOREST]: {
        tempo: 130,
        instrument: { ...DEFAULT_INSTRUMENT, type: 'sine' },
        sequence: [
            [C4, 2], [E4, 2], [G4, 4], [A4, 2], [G4, 2], [E4, 4],
            [C4, 2], [E4, 2], [G4, 2], [C4, 2], [D4, 8],
            [D4, 2], [F4, 2], [A4, 4], [B4, 2], [A4, 2], [F4, 4],
            [D4, 2], [F4, 2], [G4, 2], [E4, 2], [C4, 8],
            [C4, 2], [0, 2], [C4, 2], [0, 2], [E4, 2], [0, 2], [E4, 2], [0, 2],
            [G4, 2], [A4, 2], [G4, 2], [F4, 2], [E4, 4], [D4, 4]
        ]
    },
    [SoundType.THEME_BEACH]: {
        tempo: 110,
        instrument: { type: 'sine', attack: 0.01, release: 0.2, isPlucky: true },
        sequence: [
            [F4, 3], [A4, 1], [C5, 2], [0, 2], [A4, 2], [F4, 2], [0, 2], [F4, 2],
            [G4, 3], [Bb3, 1], [G4, 2], [0, 2], [F4, 2], [C4, 2], [0, 2], [C4, 2],
            [F4, 3], [A4, 1], [C5, 2], [D5, 2], [C5, 2], [A4, 2], [F4, 2], [G4, 2],
            [G4, 2], [A4, 2], [Bb3, 2], [G4, 2], [F4, 8],
            [F4, 2], [A4, 2], [C5, 2], [A4, 2], [F4, 2], [A4, 2], [G4, 2], [E4, 2],
            [C4, 2], [E4, 2], [G4, 2], [Bb3, 2], [A4, 4], [F4, 4]
        ]
    },
    [SoundType.THEME_MOUNTAIN]: {
        tempo: 120,
        instrument: { ...DEFAULT_INSTRUMENT, type: 'sawtooth' },
        sequence: [
            [D3, 2], [D3, 2], [F3, 2], [A3, 2], [D4, 4], [A3, 4],
            [F3, 2], [A3, 2], [D4, 2], [F4, 2], [E4, 4], [C4, 4],
            [D3, 2], [D3, 2], [F3, 2], [A3, 2], [D4, 2], [F4, 2], [A4, 4],
            [G4, 2], [F4, 2], [E4, 2], [D4, 2], [C4, 4], [A3, 4],
            [D3, 1], [F3, 1], [A3, 1], [D4, 1], [F4, 4],
            [C3, 1], [E3, 1], [G3, 1], [C4, 1], [E4, 4],
            [D3, 8], [0, 4], [A2, 4]
        ]
    },
    [SoundType.THEME_SKI]: {
        tempo: 160,
        instrument: { ...DEFAULT_INSTRUMENT, type: 'square' },
        sequence: [
            [A3, 2], [0, 2], [A3, 2], [0, 2], [E4, 2], [C4, 2], [B3, 2], [G3, 2],
            [A3, 2], [0, 2], [A3, 2], [0, 2], [G3, 4], [E3, 4],
            [A3, 2], [C4, 2], [D4, 2], [E4, 2], [F4, 2], [E4, 2], [D4, 2], [C4, 2],
            [B3, 2], [C4, 2], [B3, 2], [G3, 2], [A3, 4], [0, 4],
            [A2, 1], [A2, 1], [C3, 1], [C3, 1], [E3, 1], [E3, 1], [A3, 2],
            [G3, 2], [F3, 2], [E3, 2], [D3, 2], [C3, 2], [B2, 2],
            [A2, 8], [E3, 4], [G3, 4]
        ]
    },
    [SoundType.THEME_CHASE]: {
        tempo: 170,
        instrument: { type: 'sawtooth', attack: 0.01, release: 0.01 },
        sequence: [
            [D3, 2], [Eb3, 2], [E3, 2], [F3, 2], [Gb3, 2], [G3, 2], [Ab3, 2], [A3, 2],
            [Bb3, 1], [B3, 1], [C4, 1], [Db4, 1], [D4, 2], [A3, 2], [D4, 4],
            [D3, 2], [Eb3, 2], [E3, 2], [F3, 2], [Gb3, 2], [G3, 2], [Ab3, 2], [A3, 2],
            [D4, 1], [Db4, 1], [C4, 1], [B3, 1], [Bb3, 2], [A3, 2], [Ab3, 4],
            [D3, 1], [D3, 1], [F3, 1], [F3, 1], [A3, 1], [A3, 1], [D4, 1], [D4, 1],
            [Eb3, 1], [Eb3, 1], [Gb3, 1], [Gb3, 1], [Bb3, 1], [Bb3, 1], [Eb4, 1], [Eb4, 1],
            [E3, 8], [F3, 8], [Gb3, 8], [G3, 8],
            [A3, 1], [0, 1], [A3, 1], [0, 1], [A3, 2], [D4, 2]
        ]
    },
    [SoundType.THEME_UNDERWATER]: {
        tempo: 100,
        instrument: { type: 'sine', attack: 0.2, release: 0.3 },
        sequence: [
            [E3, 2], [B3, 2], [Eb4, 2], 
            [E3, 2], [B3, 2], [E4, 2],
            [A2, 2], [E3, 2], [C4, 2],
            [A2, 2], [E3, 2], [B3, 2],
            [G3, 2], [D4, 2], [Gb4, 2],
            [G3, 2], [D4, 2], [G4, 2],
            [C3, 2], [G3, 2], [E4, 2],
            [C3, 2], [G3, 2], [D4, 2],
            [B2, 6], [Gb3, 6], [B3, 6],
            [E3, 6]
        ]
    },
    [SoundType.THEME_GOLDEN_SHARK]: {
        tempo: 180,
        instrument: { type: 'square', attack: 0.01, release: 0.05 },
        sequence: [
            [D4, 2], [D4, 2], [D4, 2], [0, 2], [F4, 2], [D4, 2], [0, 2], [F4, 2],
            [G4, 2], [F4, 2], [G4, 2], [A4, 2], [G4, 2], [F4, 2], [D4, 4],
            [D4, 2], [D4, 2], [D4, 2], [0, 2], [A4, 2], [G4, 2], [0, 2], [F4, 2],
            [G4, 2], [A4, 2], [Bb4, 2], [A4, 2], [G4, 4], [F4, 4],
            [D5, 2], [D5, 2], [D5, 2], [0, 2], [A4, 2], [D5, 2], [0, 2], [F5, 2],
            [E5, 2], [D5, 2], [C5, 2], [D5, 2], [E5, 8]
        ]
    },
    [SoundType.THEME_PIER]: {
        tempo: 140,
        instrument: { type: 'triangle', attack: 0.01, release: 0.1 },
        sequence: [
            // Rapid minor arpeggios for stormy feel
            [A3, 1], [C4, 1], [E4, 1], [A3, 1], [C4, 1], [E4, 1], [A3, 1], [C4, 1],
            [F3, 1], [A3, 1], [C4, 1], [F3, 1], [A3, 1], [C4, 1], [F3, 1], [A3, 1],
            [G3, 1], [B3, 1], [D4, 1], [G3, 1], [B3, 1], [D4, 1], [G3, 1], [B3, 1],
            [E3, 1], [G3, 1], [B3, 1], [E3, 1], [G3, 1], [B3, 1], [E3, 1], [G3, 1],
            // Melody overlay
            [A4, 4], [E4, 4], [C4, 2], [D4, 2], [E4, 4],
            [F4, 4], [C4, 4], [A3, 2], [Bb3, 2], [C4, 4],
            [G4, 4], [D4, 4], [B3, 2], [C4, 2], [D4, 4],
            [E4, 2], [D4, 2], [C4, 2], [B3, 2], [A3, 8]
        ]
    },
    [SoundType.THEME_BOSS]: {
        tempo: 150,
        instrument: { type: 'sawtooth', attack: 0.01, release: 0.05 },
        sequence: [
            [A2, 2], [A2, 2], [A3, 2], [A2, 2], [Eb3, 2], [E3, 2], [A2, 4],
            [A2, 2], [A2, 2], [C3, 2], [A2, 2], [F3, 4], [E3, 4],
            [A2, 2], [A2, 2], [A3, 2], [A2, 2], [Eb3, 2], [E3, 2], [A2, 4],
            [D3, 2], [F3, 2], [A3, 2], [D4, 2], [F4, 4], [E4, 4],
            [A2, 2], [C3, 2], [E3, 2], [G3, 2], [Bb3, 4], [A3, 4],
            [A2, 1], [C3, 1], [E3, 1], [G3, 1], [A3, 8]
        ]
    },
    [SoundType.THEME_BOSS_WOLF]: {
        tempo: 160,
        instrument: { type: 'square', attack: 0.01, release: 0.1 },
        sequence: [
            // E minor driving bass with tritone danger
            [E3, 2], [E3, 2], [E3, 2], [Bb3, 2], [E3, 2], [E3, 2], [G3, 2], [E3, 2],
            [E3, 2], [E3, 2], [E3, 2], [Bb3, 2], [A3, 4], [G3, 4],
            
            // Repetitive Stalking feel
            [E3, 2], [E3, 2], [E3, 2], [Bb3, 2], [E3, 2], [E3, 2], [B3, 2], [E3, 2],
            [E3, 2], [E3, 2], [D4, 4], [B3, 4], [Bb3, 4],
            
            // Chase section
            [E3, 1], [G3, 1], [B3, 1], [E4, 1], [B3, 1], [G3, 1], [E3, 1], [0, 1],
            [F3, 1], [A3, 1], [C4, 1], [F4, 1], [C4, 1], [A3, 1], [F3, 1], [0, 1],
            [E3, 2], [Bb3, 2], [E3, 2], [Bb3, 2], [E4, 8] 
        ]
    },
    [SoundType.THEME_CONSTRUCTION]: {
        tempo: 125,
        instrument: { type: 'square', attack: 0.01, release: 0.08 },
        sequence: [
            // Busy mechanical techno style sequence with steady industrial pulse
            [C3, 2], [0, 2], [C3, 2], [0, 2], [Eb3, 2], [F3, 2], [Gb3, 2], [G3, 2],
            [C3, 2], [Eb3, 2], [G3, 2], [C4, 4], [Eb4, 2], [C4, 4],
            [C3, 2], [0, 2], [C3, 2], [0, 2], [Gb3, 4], [F3, 4],
            [Bb3, 2], [A3, 2], [G3, 2], [F3, 2], [Eb3, 4], [C3, 4]
        ]
    },
    [SoundType.THEME_BOSS_EXCAVATOR]: {
        tempo: 155,
        instrument: { type: 'sawtooth', attack: 0.01, release: 0.05 },
        sequence: [
            // Intense, driving mechanical combat march in Eb minor with high syncopation
            [Eb3, 2], [Eb3, 2], [Gb3, 2], [Eb3, 2], [A3, 4], [Ab3, 4],
            [Eb3, 2], [Eb3, 2], [Gb3, 2], [Eb3, 2], [C4, 4], [A3, 4],
            [Eb3, 2], [Gb3, 2], [A3, 2], [C4, 2], [Eb4, 4], [D4, 4],
            [C4, 2], [A3, 2], [Gb3, 2], [Eb3, 2], [D3, 4], [Eb3, 4]
        ]
    }
};
