
import { SoundType } from '../types';
import { MUSIC_TRACKS, TrackData } from './audio/tracks';
import { playSoundEffect } from './audio/sfx';
import { playSoundEffectEnhanced } from './audio/enhancedSfx';
import { gfxSettings } from './GfxSettings';

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

    // Enhanced-audio state (additive layers; classic path untouched when off)
    private delaySend: GainNode | null = null;
    private nextPercTime: number = 0;
    private percStep: number = 0;

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
        if (gfxSettings.audioMode === 'enhanced') {
            const handled = playSoundEffectEnhanced(type, this.ctx, this.masterGain);
            if (handled) return;
        }
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
        const enhanced = gfxSettings.audioMode === 'enhanced';

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

                // --- ENHANCED: warm detuned double + sub-octave + echo send ---
                // (purely additive voices; the classic voice above is unchanged)
                if (enhanced) {
                    const send = this.ensureDelaySend();
                    const dur = noteDuration;

                    const detune = this.ctx.createOscillator();
                    const dg = this.ctx.createGain();
                    detune.type = instrument.type;
                    detune.frequency.value = freq;
                    detune.detune.value = 7;
                    dg.gain.setValueAtTime(0, this.nextNoteTime);
                    dg.gain.linearRampToValueAtTime(0.022, this.nextNoteTime + attack + 0.01);
                    dg.gain.setValueAtTime(0.022, Math.max(this.nextNoteTime + attack, this.nextNoteTime + dur - release));
                    dg.gain.linearRampToValueAtTime(0, this.nextNoteTime + dur);
                    detune.connect(dg);
                    dg.connect(this.masterGain);
                    if (send) dg.connect(send);
                    detune.start(this.nextNoteTime);
                    detune.stop(this.nextNoteTime + dur + 0.05);

                    const sub = this.ctx.createOscillator();
                    const sg = this.ctx.createGain();
                    sub.type = 'sine';
                    sub.frequency.value = freq / 2;
                    sg.gain.setValueAtTime(0, this.nextNoteTime);
                    sg.gain.linearRampToValueAtTime(0.028, this.nextNoteTime + 0.02);
                    sg.gain.exponentialRampToValueAtTime(0.0008, this.nextNoteTime + dur);
                    sub.connect(sg).connect(this.masterGain);
                    sub.start(this.nextNoteTime);
                    sub.stop(this.nextNoteTime + dur + 0.05);
                }
            }

            this.nextNoteTime += (durationSteps * secondsPer16th);

            // Loop
            this.currentNoteIndex++;
            if (this.currentNoteIndex >= sequence.length) {
                this.currentNoteIndex = 0;
            }
        }

        if (enhanced) this.schedulePercussion();

        this.timerID = window.setTimeout(this.scheduleNote.bind(this), 25);
    }

    /**
     * Lazy echo/delay bus used by the enhanced music layers only. Created on
     * demand and torn down never — cheap, and classic mode never touches it.
     */
    private ensureDelaySend(): GainNode | null {
        if (!this.ctx || !this.masterGain) return null;
        if (this.delaySend) return this.delaySend;

        const input = this.ctx.createGain();
        input.gain.value = 0.35;

        const delay = this.ctx.createDelay(1.0);
        const tempo = this.currentTrackData?.tempo ?? 120;
        delay.delayTime.value = (60 / tempo) / 2; // eighth-note echo

        const feedback = this.ctx.createGain();
        feedback.gain.value = 0.3;

        const damp = this.ctx.createBiquadFilter();
        damp.type = 'lowpass';
        damp.frequency.value = 2400;

        input.connect(delay);
        delay.connect(damp);
        damp.connect(feedback);
        feedback.connect(delay);
        damp.connect(this.masterGain);

        this.delaySend = input;
        return input;
    }

    /**
     * Enhanced-only percussion grid, locked to the track's 16th-note clock.
     * Kicks, snares and hats are synthesized from noise/oscillators at low
     * volume to sit under the melody. Runs only while a track is playing and
     * audio mode is Enhanced.
     */
    private schedulePercussion() {
        if (!this.isPlaying || !this.ctx || !this.masterGain || !this.currentTrackData) return;
        const { tempo } = this.currentTrackData;
        const sp16 = (60 / tempo) / 4;

        if (this.nextPercTime < this.ctx.currentTime) {
            this.nextPercTime = this.ctx.currentTime + 0.05;
            this.percStep = 0;
        }

        while (this.nextPercTime < this.ctx.currentTime + 0.12) {
            const step = this.percStep % 16;

            // Kick on 0 and 8 (plus a driving extra on 10 for fast tracks)
            if (step === 0 || step === 8 || (tempo >= 150 && step === 10)) {
                const k = this.ctx.createOscillator();
                const kg = this.ctx.createGain();
                k.type = 'sine';
                k.frequency.setValueAtTime(130, this.nextPercTime);
                k.frequency.exponentialRampToValueAtTime(42, this.nextPercTime + 0.1);
                kg.gain.setValueAtTime(0.09, this.nextPercTime);
                kg.gain.exponentialRampToValueAtTime(0.001, this.nextPercTime + 0.12);
                k.connect(kg).connect(this.masterGain);
                k.start(this.nextPercTime);
                k.stop(this.nextPercTime + 0.14);
            }

            // Snare-ish brush on 4 and 12
            if (step === 4 || step === 12) {
                const len = Math.floor(this.ctx.sampleRate * 0.12);
                const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
                const n = this.ctx.createBufferSource();
                n.buffer = buf;
                const f = this.ctx.createBiquadFilter();
                f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.7;
                const g = this.ctx.createGain();
                g.gain.setValueAtTime(0.05, this.nextPercTime);
                g.gain.exponentialRampToValueAtTime(0.001, this.nextPercTime + 0.11);
                n.connect(f).connect(g).connect(this.masterGain);
                n.start(this.nextPercTime);
            }

            // Closed hats on the off-beats
            if (step % 2 === 1) {
                const len = Math.floor(this.ctx.sampleRate * 0.03);
                const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
                const n = this.ctx.createBufferSource();
                n.buffer = buf;
                const f = this.ctx.createBiquadFilter();
                f.type = 'highpass'; f.frequency.value = 7000;
                const g = this.ctx.createGain();
                g.gain.setValueAtTime(0.022, this.nextPercTime);
                g.gain.exponentialRampToValueAtTime(0.001, this.nextPercTime + 0.03);
                n.connect(f).connect(g).connect(this.masterGain);
                n.start(this.nextPercTime);
            }

            this.nextPercTime += sp16;
            this.percStep++;
        }
    }
}

export const audioManager = new AudioController();
