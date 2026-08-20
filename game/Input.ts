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

    private addListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.code)) (this.keys as any)[e.code] = true;
            if (e.code === 'Space') this.keys['ArrowUp'] = true;
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.code)) (this.keys as any)[e.code] = false;
            if (e.code === 'Space') this.keys['ArrowUp'] = false;
        });
    }

    // Call from React components for touch/mouse UI buttons
    public setKey(key: keyof InputState, value: boolean) {
        this.keys[key] = value;
    }
}

export const inputManager = new InputManager();