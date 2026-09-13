import { InputState } from "../types";

export class InputManager {
    private presses = new Set<string>();
    public consumePress(key: string) { const pressed = this.presses.has(key); this.presses.delete(key); return pressed; }
    public keys: InputState = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false, KeyE: false, Digit1: false, Digit2: false, Digit3: false, Escape: false
    };

    constructor() {
        this.addListeners();
    }

    // WASD -> arrow-key aliases, so both control schemes drive the same
    // InputState flags and gameplay code stays untouched.
    private static readonly KEY_ALIASES: Record<string, keyof InputState> = {
        KeyW: 'ArrowUp',
        KeyA: 'ArrowLeft',
        KeyS: 'ArrowDown',
        KeyD: 'ArrowRight',
        Space: 'ArrowUp',
    };

    public clear() { this.presses.clear(); for (const key of Object.keys(this.keys)) this.keys[key as keyof InputState] = false; }

    private addListeners() {
        window.addEventListener('blur', () => this.clear());
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
            if (['KeyE', 'Digit1', 'Digit2', 'Digit3', 'Escape'].includes(e.code)) this.presses.add(e.code);
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && !(e.target instanceof HTMLButtonElement)) e.preventDefault();
            if (this.keys.hasOwnProperty(e.code)) (this.keys as any)[e.code] = true;
            const alias = InputManager.KEY_ALIASES[e.code];
            if (alias) this.keys[alias] = true;
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.code)) (this.keys as any)[e.code] = false;
            const alias = InputManager.KEY_ALIASES[e.code];
            if (alias) this.keys[alias] = false;
        });
    }

    // Call from React components for touch/mouse UI buttons
    public setKey(key: keyof InputState, value: boolean) {
        this.keys[key] = value;
    }
}

export const inputManager = new InputManager();