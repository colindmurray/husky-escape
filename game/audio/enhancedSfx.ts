
// Enhanced sound effects.
//
// Layered, more organic versions of the classic chiptune SFX. The classic
// implementations in ./sfx.ts remain untouched and are still used whenever the
// audio toggle is set to "Classic". Any SoundType not handled here falls back
// to the classic effect automatically.

import { SoundType } from "../../types";

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
}

export function playSoundEffectEnhanced(type: SoundType, ctx: AudioContext, masterGain: GainNode): boolean {
    const t = ctx.currentTime;

    switch (type) {
        case SoundType.JUMP: {
            // Springy "boing": pitched sine chirp + soft noise breath
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(520, t + 0.09);
            osc.frequency.exponentialRampToValueAtTime(660, t + 0.14);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
            osc.connect(gain).connect(masterGain);
            osc.start(t); osc.stop(t + 0.18);

            const n = ctx.createBufferSource();
            n.buffer = noiseBuffer(ctx, 0.1);
            const nf = ctx.createBiquadFilter();
            nf.type = 'bandpass'; nf.frequency.value = 1800; nf.Q.value = 0.8;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.03, t);
            ng.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            n.connect(nf).connect(ng).connect(masterGain);
            n.start(t);
            return true;
        }

        case SoundType.LAND: {
            // Soft thump: low sine drop + filtered noise pat
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, t);
            osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
            gain.gain.setValueAtTime(0.14, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
            osc.connect(gain).connect(masterGain);
            osc.start(t); osc.stop(t + 0.15);

            const n = ctx.createBufferSource();
            n.buffer = noiseBuffer(ctx, 0.08);
            const nf = ctx.createBiquadFilter();
            nf.type = 'lowpass'; nf.frequency.value = 700;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.05, t);
            ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
            n.connect(nf).connect(ng).connect(masterGain);
            n.start(t);
            return true;
        }

        case SoundType.COLLECT: {
            // Sparkle: two-note bell (sine + shimmering harmonic)
            const notes = [1318.5, 1760.0]; // E6 -> A6
            notes.forEach((f, i) => {
                const start = t + i * 0.07;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = f;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(0.12, start + 0.012);
                gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.28);
                osc.connect(gain).connect(masterGain);
                osc.start(start); osc.stop(start + 0.3);

                const harm = ctx.createOscillator();
                const hg = ctx.createGain();
                harm.type = 'sine';
                harm.frequency.value = f * 2.01;
                hg.gain.setValueAtTime(0.0001, start);
                hg.gain.exponentialRampToValueAtTime(0.035, start + 0.01);
                hg.gain.exponentialRampToValueAtTime(0.0005, start + 0.2);
                harm.connect(hg).connect(masterGain);
                harm.start(start); harm.stop(start + 0.22);
            });
            return true;
        }

        case SoundType.SPLASH: {
            // Big splash: noise burst with falling filter + deep body thud
            const n = ctx.createBufferSource();
            n.buffer = noiseBuffer(ctx, 0.6);
            const f = ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.setValueAtTime(2600, t);
            f.frequency.exponentialRampToValueAtTime(180, t + 0.5);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.24, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
            n.connect(f).connect(g).connect(masterGain);
            n.start(t);

            const osc = ctx.createOscillator();
            const og = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.25);
            og.gain.setValueAtTime(0.12, t);
            og.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(og).connect(masterGain);
            osc.start(t); osc.stop(t + 0.32);
            return true;
        }

        case SoundType.SWIM: {
            // Watery stroke: bubbly sine warble + tiny noise swirl
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, t);
            osc.frequency.linearRampToValueAtTime(540, t + 0.08);
            osc.frequency.exponentialRampToValueAtTime(240, t + 0.2);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.09, t + 0.03);
            gain.gain.linearRampToValueAtTime(0.0001, t + 0.22);
            osc.connect(gain).connect(masterGain);
            osc.start(t); osc.stop(t + 0.24);

            const n = ctx.createBufferSource();
            n.buffer = noiseBuffer(ctx, 0.18);
            const nf = ctx.createBiquadFilter();
            nf.type = 'bandpass'; nf.frequency.setValueAtTime(900, t);
            nf.frequency.linearRampToValueAtTime(2200, t + 0.15); nf.Q.value = 1.4;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.03, t);
            ng.gain.linearRampToValueAtTime(0.0001, t + 0.16);
            n.connect(nf).connect(ng).connect(masterGain);
            n.start(t);
            return true;
        }

        case SoundType.BOOST: {
            // Rocket whoosh: rising band-swept noise + rising saw
            const n = ctx.createBufferSource();
            n.buffer = noiseBuffer(ctx, 0.45);
            const f = ctx.createBiquadFilter();
            f.type = 'bandpass'; f.Q.value = 1.2;
            f.frequency.setValueAtTime(300, t);
            f.frequency.exponentialRampToValueAtTime(3200, t + 0.35);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.12, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
            n.connect(f).connect(g).connect(masterGain);
            n.start(t);

            const osc = ctx.createOscillator();
            const og = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, t);
            osc.frequency.exponentialRampToValueAtTime(720, t + 0.3);
            og.gain.setValueAtTime(0.05, t);
            og.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
            osc.connect(og).connect(masterGain);
            osc.start(t); osc.stop(t + 0.34);
            return true;
        }

        case SoundType.CRASH: {
            // Impact crunch: distorted drop + noise crack
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
            osc.connect(gain).connect(masterGain);
            osc.start(t); osc.stop(t + 0.4);

            const n = ctx.createBufferSource();
            n.buffer = noiseBuffer(ctx, 0.3);
            const nf = ctx.createBiquadFilter();
            nf.type = 'lowpass';
            nf.frequency.setValueAtTime(3000, t);
            nf.frequency.exponentialRampToValueAtTime(200, t + 0.25);
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.16, t);
            ng.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            n.connect(nf).connect(ng).connect(masterGain);
            n.start(t);
            return true;
        }

        case SoundType.WIN_SHORT: {
            // Triumphant fanfare: 3-voice major arpeggio with sparkle top
            const seq = [523.25, 659.25, 783.99, 1046.5];
            seq.forEach((f, i) => {
                const start = t + i * 0.09;
                for (const [type, vol] of [['triangle', 0.09], ['sine', 0.05]] as const) {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = type;
                    osc.frequency.value = type === 'sine' ? f * 2 : f;
                    g.gain.setValueAtTime(0.0001, start);
                    g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
                    g.gain.exponentialRampToValueAtTime(0.0008, start + (i === seq.length - 1 ? 0.7 : 0.3));
                    osc.connect(g).connect(masterGain);
                    osc.start(start); osc.stop(start + 0.75);
                }
            });
            return true;
        }

        case SoundType.LOSE_SHORT: {
            // Sad slide: descending minor pair with vibrato tail
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const lfo = ctx.createOscillator();
            const lfoG = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(330, t);
            osc.frequency.linearRampToValueAtTime(310, t + 0.2);
            osc.frequency.linearRampToValueAtTime(165, t + 0.7);
            lfo.frequency.value = 6.5; lfoG.gain.value = 6;
            lfo.connect(lfoG).connect(osc.frequency);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
            gain.gain.linearRampToValueAtTime(0.0001, t + 0.75);
            osc.connect(gain).connect(masterGain);
            lfo.start(t); lfo.stop(t + 0.75);
            osc.start(t); osc.stop(t + 0.78);
            return true;
        }

        case SoundType.BOSS_HIT: {
            // Heavy metallic clank: square drop + ring
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(240, t);
            osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.connect(gain).connect(masterGain);
            osc.start(t); osc.stop(t + 0.22);

            const ring = ctx.createOscillator();
            const rg = ctx.createGain();
            ring.type = 'triangle';
            ring.frequency.value = 1240;
            rg.gain.setValueAtTime(0.06, t);
            rg.gain.exponentialRampToValueAtTime(0.0005, t + 0.3);
            ring.connect(rg).connect(masterGain);
            ring.start(t); ring.stop(t + 0.32);
            return true;
        }

        case SoundType.WOLF_HOWL: {
            // Evocative howl: two detuned triangles rising & falling with vibrato
            for (const det of [0, 6]) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const lfo = ctx.createOscillator();
                const lfoG = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(380 + det, t);
                osc.frequency.linearRampToValueAtTime(690 + det, t + 0.55);
                osc.frequency.setValueAtTime(690 + det, t + 1.4);
                osc.frequency.linearRampToValueAtTime(290 + det, t + 2.4);
                lfo.frequency.value = 5.2; lfoG.gain.value = 5;
                lfo.connect(lfoG).connect(osc.frequency);
                gain.gain.setValueAtTime(0.0001, t);
                gain.gain.linearRampToValueAtTime(0.09, t + 0.4);
                gain.gain.setValueAtTime(0.09, t + 1.5);
                gain.gain.linearRampToValueAtTime(0.0001, t + 2.45);
                osc.connect(gain).connect(masterGain);
                lfo.start(t); lfo.stop(t + 2.5);
                osc.start(t); osc.stop(t + 2.5);
            }
            return true;
        }

        default:
            // Not enhanced yet — caller should fall back to the classic effect.
            return false;
    }
}
