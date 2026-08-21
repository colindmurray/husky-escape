import { InputState } from "../types";

export class InputManager {
    public keys: InputState = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false
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

    private addListeners() {
        window.addEventListener('keydown', (e) => {
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