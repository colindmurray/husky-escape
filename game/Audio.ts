
import { SoundType } from '../types';
import { MUSIC_TRACKS, TrackData } from './audio/tracks';
import { playSoundEffect } from './audio/sfx';

class AudioController {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    
    // Settings
    public musicEnabled = true;
    public sfxEnabled = true;
    public volume = 0.3;
    
    // Music State
    private currentTrack: SoundType | null = null;
    private nextNoteTime: number = 0;
    private currentNoteIndex: number = 0;
    private isPlaying: boolean = false;
    private timerID: number | undefined;
    private currentTrackData: TrackData | null = null;

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = this.volume; // Global volume
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(value: number) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    setMusic(enabled: boolean) {
        this.musicEnabled = enabled;
        if (!enabled) this.stopMusic();
        else if (this.currentTrack && !this.isPlaying) this.playMusic(this.currentTrack);
    }

    setSFX(enabled: boolean) {
        this.sfxEnabled = enabled;
    }

    playSFX(type: SoundType) {
        if (!this.ctx || !this.sfxEnabled || !this.masterGain) return;
        this.init(); // Ensure init
        playSoundEffect(type, this.ctx, this.masterGain);
    }

    // --- MUSIC SEQUENCER ---

    playMusic(track: SoundType) {
        if (this.currentTrack === track && this.isPlaying) return;
        this.stopMusic();
        this.currentTrack = track;
        
        const data = MUSIC_TRACKS[track];
        if (!data) return;
        this.currentTrackData = data;

        if (!this.musicEnabled) return;

        this.init();
        this.isPlaying = true;
        this.currentNoteIndex = 0;
        
        if (this.ctx) {
            this.nextNoteTime = this.ctx.currentTime;
            this.scheduleNote();
        }
    }

    stopMusic() {
        this.isPlaying = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = undefined;
        }
    }

    private scheduleNote() {
        if (!this.isPlaying || !this.ctx || !this.masterGain || !this.currentTrackData) return;
        const { sequence, tempo, instrument } = this.currentTrackData;
        
        if (sequence.length === 0) return;

        const secondsPerBeat = 60.0 / tempo;
        const secondsPer16th = secondsPerBeat / 4; // 16th notes
        
        // Schedule slightly ahead
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            const noteData = sequence[this.currentNoteIndex];
            if (!noteData) {
                this.currentNoteIndex = 0;
                break; 
            }

            const freq = noteData[0];
            const durationSteps = noteData[1];
            
            if (freq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = instrument.type;
                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.frequency.value = freq;
                
                // Envelope
                const noteDuration = (durationSteps * secondsPer16th);
                const attack = instrument.attack;
                const release = instrument.release;

                gain.gain.setValueAtTime(0, this.nextNoteTime);
                gain.gain.linearRampToValueAtTime(0.05, this.nextNoteTime + attack);
                
                if (instrument.isPlucky) {
                     gain.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + noteDuration);
                } else {
                     gain.gain.setValueAtTime(0.05, this.nextNoteTime + noteDuration - release);
                     gain.gain.linearRampToValueAtTime(0, this.nextNoteTime + noteDuration);
                }

                osc.start(this.nextNoteTime);
                osc.stop(this.nextNoteTime + noteDuration + 0.1);
            }

            this.nextNoteTime += (durationSteps * secondsPer16th);
            
            // Loop
            this.currentNoteIndex++;
            if (this.currentNoteIndex >= sequence.length) {
                this.currentNoteIndex = 0;
            }
        }

        this.timerID = window.setTimeout(this.scheduleNote.bind(this), 25);
    }
}

export const audioManager = new AudioController();
