
import { SoundType } from "../../types";

export function playSoundEffect(type: SoundType, ctx: AudioContext, masterGain: GainNode) {
    if (playTownSound(type, ctx, masterGain, false)) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);

    switch (type) {
        case SoundType.JUMP:
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(300, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
            break;
        
        case SoundType.SWIM:
            // Bubbling sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.linearRampToValueAtTime(600, t + 0.1);
            osc.frequency.linearRampToValueAtTime(200, t + 0.2);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
            break;

        case SoundType.LAND:
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
            break;

        case SoundType.COLLECT:
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, t); // High ping
            osc.frequency.setValueAtTime(1600, t + 0.1); // Higher ping
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
            break;

        case SoundType.SPLASH:
            // Noise buffer logic inside function for simplicity
            const bufferSize = ctx.sampleRate * 0.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, t);
            filter.frequency.exponentialRampToValueAtTime(100, t + 0.4);
            
            // Re-route node graph for noise
            osc.disconnect(); // Not used
            noise.connect(filter);
            filter.connect(gain);
            // gain already connected to masterGain
            
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            noise.start(t);
            break;

        case SoundType.CRASH:
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
            break;

        case SoundType.BOOST:
            // White noise sweep
            const bSize = ctx.sampleRate * 0.5;
            const buff = ctx.createBuffer(1, bSize, ctx.sampleRate);
            const d = buff.getChannelData(0);
            for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
            const n = ctx.createBufferSource();
            n.buffer = buff;
            const f = ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.frequency.setValueAtTime(200, t);
            f.frequency.linearRampToValueAtTime(1000, t + 0.3);
            
            osc.disconnect(); // Not used
            n.connect(f);
            f.connect(gain);
            
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);
            n.start(t);
            break;

        case SoundType.WIN_SHORT:
            osc.type = 'square';
            // Major Arpeggio
            osc.frequency.setValueAtTime(523.25, t); // C5
            osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
            osc.frequency.setValueAtTime(1046.50, t + 0.3); // C6
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.6);
            osc.start(t);
            osc.stop(t + 0.6);
            break;
            
        case SoundType.LOSE_SHORT:
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, t); 
            osc.frequency.linearRampToValueAtTime(100, t + 0.5); 
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.5);
            osc.start(t);
            osc.stop(t + 0.5);
            break;

        case SoundType.BOSS_HIT:
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
            break;

        case SoundType.BOSS_STUN:
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.linearRampToValueAtTime(400, t + 0.1);
            osc.frequency.linearRampToValueAtTime(600, t + 0.2);
            osc.frequency.linearRampToValueAtTime(400, t + 0.3);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.5);
            osc.start(t);
            osc.stop(t + 0.5);
            break;

        case SoundType.BOSS_DEATH:
            const bufferSizeDeath = ctx.sampleRate * 1.5;
            const bufferDeath = ctx.createBuffer(1, bufferSizeDeath, ctx.sampleRate);
            const dataDeath = bufferDeath.getChannelData(0);
            for (let i = 0; i < bufferSizeDeath; i++) dataDeath[i] = Math.random() * 2 - 1;
            const noiseDeath = ctx.createBufferSource();
            noiseDeath.buffer = bufferDeath;
            
            const filterDeath = ctx.createBiquadFilter();
            filterDeath.type = 'lowpass';
            filterDeath.frequency.setValueAtTime(800, t);
            filterDeath.frequency.exponentialRampToValueAtTime(50, t + 1.0);
            
            osc.disconnect();
            noiseDeath.connect(filterDeath);
            filterDeath.connect(gain);
            
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
            noiseDeath.start(t);
            break;

        case SoundType.WOLF_HOWL:
            osc.type = 'triangle'; // Smooth but clear
            // Start mid, go high, sustain, fall
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.linearRampToValueAtTime(700, t + 0.6); // Howl up
            osc.frequency.setValueAtTime(700, t + 1.5); // Sustain
            osc.frequency.linearRampToValueAtTime(300, t + 2.5); // Fall off
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.5);
            gain.gain.setValueAtTime(0.2, t + 1.5);
            gain.gain.linearRampToValueAtTime(0, t + 2.5);
            
            osc.start(t);
            osc.stop(t + 2.6);
            break;

        case SoundType.MEOW:
            // Two-note "me-ow" chirp
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(700, t);
            osc.frequency.linearRampToValueAtTime(500, t + 0.12);
            osc.frequency.setValueAtTime(620, t + 0.14);
            osc.frequency.linearRampToValueAtTime(380, t + 0.34);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
            gain.gain.setValueAtTime(0.12, t + 0.22);
            gain.gain.linearRampToValueAtTime(0, t + 0.36);
            osc.start(t);
            osc.stop(t + 0.38);
            break;

        case SoundType.DRONE_ALERT:
            // Sharp double beep
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.setValueAtTime(0, t + 0.09);
            osc.frequency.setValueAtTime(990, t + 0.14);
            osc.frequency.setValueAtTime(0, t + 0.24);
            gain.gain.setValueAtTime(0.09, t);
            gain.gain.setValueAtTime(0, t + 0.09);
            gain.gain.setValueAtTime(0.09, t + 0.14);
            gain.gain.setValueAtTime(0, t + 0.26);
            osc.start(t);
            osc.stop(t + 0.28);
            break;

        case SoundType.WOLF_GROWL:
            osc.type = 'sawtooth'; // Rough sound
            osc.frequency.setValueAtTime(80, t);
            osc.frequency.linearRampToValueAtTime(60, t + 0.5);
            
            // Add some tremble to the gain for a "rattle" effect
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = 20; // 20Hz rattle
            lfo.connect(lfoGain);
            lfoGain.gain.value = 0.05; // Modulation depth
            lfoGain.connect(gain.gain);
            lfo.start(t);
            lfo.stop(t + 0.5);

            gain.gain.setValueAtTime(0.15, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.5);
            
            osc.start(t);
            osc.stop(t + 0.5);
            break;
    }
}

export function playTownSound(type: SoundType, ctx: AudioContext, masterGain: GainNode, enhanced: boolean): boolean {
    if (type === SoundType.RACCOON_CHATTER) {
        for (let i = 0; i < 5; i++) {
            const start = ctx.currentTime + i * .065, osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = enhanced ? 'triangle' : 'square'; osc.frequency.setValueAtTime(330 + i % 2 * 180, start); osc.frequency.exponentialRampToValueAtTime(180, start + .055);
            gain.gain.setValueAtTime(.055, start); gain.gain.exponentialRampToValueAtTime(.001, start + .06);
            osc.connect(gain).connect(masterGain); osc.start(start); osc.stop(start + .065);
        }
        return true;
    }
    if (type !== SoundType.BIKE_BELL && type !== SoundType.DOG_BARK && type !== SoundType.WATER_JET && type !== SoundType.ROADWORK) return false;
    const t = ctx.currentTime;
    if (type === SoundType.ROADWORK) {
        for (let i = 0; i < (enhanced ? 3 : 2); i++) {
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            const start = t + i * 0.09;
            osc.type = i === 2 ? 'sawtooth' : 'square';
            osc.frequency.setValueAtTime(i === 2 ? 110 : 620, start);
            osc.frequency.exponentialRampToValueAtTime(i === 2 ? 45 : 420, start + 0.09);
            gain.gain.setValueAtTime(0.0001, start); gain.gain.linearRampToValueAtTime(0.045, start + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
            osc.connect(gain).connect(masterGain); osc.start(start); osc.stop(start + 0.12);
        }
        return true;
    }
    if (type === SoundType.WATER_JET) {
        const length = Math.floor(ctx.sampleRate * 0.35);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        const source = ctx.createBufferSource(); source.buffer = buffer;
        const filter = ctx.createBiquadFilter(); filter.type = 'bandpass';
        filter.frequency.setValueAtTime(enhanced ? 2400 : 1500, t);
        filter.frequency.exponentialRampToValueAtTime(700, t + 0.3);
        const gain = ctx.createGain(); gain.gain.setValueAtTime(0.07, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        source.connect(filter).connect(gain).connect(masterGain); source.start(t); source.stop(t + 0.36);
        return true;
    }
    const bell = type === SoundType.BIKE_BELL;
    for (let i = 0; i < 2; i++) {
        const start = t + i * (bell ? 0.19 : 0.2);
        const duration = bell ? 0.34 : 0.14;
        for (let layer = 0; layer < (enhanced ? 2 : 1); layer++) {
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = bell ? (enhanced ? 'sine' : 'triangle') : (enhanced ? 'sawtooth' : 'square');
            const frequency = bell ? (i === 0 ? 1568 : 2093) : 210;
            osc.frequency.setValueAtTime(frequency * (layer ? 2.01 : 1), start);
            if (!bell) osc.frequency.exponentialRampToValueAtTime(layer ? 135 : 90, start + duration);
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.linearRampToValueAtTime(layer ? 0.025 : 0.085, start + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            osc.connect(gain).connect(masterGain); osc.start(start); osc.stop(start + duration + 0.02);
        }
    }
    return true;
}
