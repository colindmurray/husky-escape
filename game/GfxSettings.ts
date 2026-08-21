
// Central graphics/audio presentation settings.
// These are read every frame by the Renderer / AudioController, so flipping
// them mid-level switches presentation instantly WITHOUT touching world state,
// entities, physics or gameplay logic. Classic paths remain fully intact.

export type PresentationMode = 'classic' | 'enhanced';

const VISUAL_KEY = 'husky-escape:visual-mode';
const AUDIO_KEY = 'husky-escape:audio-mode';

function loadMode(key: string): PresentationMode {
    try {
        const v = localStorage.getItem(key);
        if (v === 'classic' || v === 'enhanced') return v;
    } catch {
        // localStorage may be unavailable; default to enhanced
    }
    return 'enhanced';
}

class GfxSettingsController {
    public visualMode: PresentationMode = loadMode(VISUAL_KEY);
    public audioMode: PresentationMode = loadMode(AUDIO_KEY);

    private listeners: Array<() => void> = [];

    onChange(fn: () => void) {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter(l => l !== fn);
        };
    }

    private notify() {
        this.listeners.forEach(fn => fn());
    }

    setVisualMode(mode: PresentationMode) {
        if (this.visualMode === mode) return;
        this.visualMode = mode;
        try { localStorage.setItem(VISUAL_KEY, mode); } catch { /* ignore */ }
        this.notify();
    }

    setAudioMode(mode: PresentationMode) {
        if (this.audioMode === mode) return;
        this.audioMode = mode;
        try { localStorage.setItem(AUDIO_KEY, mode); } catch { /* ignore */ }
        this.notify();
    }
}

export const gfxSettings = new GfxSettingsController();
