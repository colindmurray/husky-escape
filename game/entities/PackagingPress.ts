import { Entity } from "./Entity";
import { Enemy } from "./Enemy";
import { audioManager } from "../Audio";
import { SoundType } from "../../types";
import { gfxSettings } from "../GfxSettings";

/**
 * PackagingPress: a box-sealing press straddling the main belt. Its head
 * cycles UP (safe to dash under) -> WARN (shake + hiss telegraph) -> SLAM
 * (lethal) -> DOWN (pause) -> RAISE. The collision box IS the head, so the
 * legs and frame are purely visual.
 *
 * Kid-fair rules: the warn shake is long on EASY, and the slam is always
 * narrower than the visual head.
 */
export class PackagingPress extends Enemy {
    private state: 'up' | 'warn' | 'slamming' | 'down' | 'raising' = 'up';
    private timer = 0;
    private headTravel: number;
    private legTop: number;
    private beltTop: number;
    private baseY: number; // head rest (up) y
    private slamY: number; // head slammed y
    private hard: boolean;

    constructor(x: number, beltTopY: number, hard = false) {
        // Hitbox starts as the raised head; resized every frame in update().
        super(x, beltTopY - 170, 0, 0);
        this.w = 96;
        this.h = 34;
        this.hard = hard;
        this.beltTop = beltTopY;
        this.legTop = beltTopY - 190;
        this.headTravel = 118;
        this.baseY = beltTopY - 168;
        this.slamY = beltTopY - 50;
        this.x = x;
        this.y = this.baseY;
        this.timer = 60 + Math.floor(Math.random() * 60); // stagger presses
    }

    update() {
        this.timer++;

        const upTime = this.hard ? 110 : 170;
        const warnTime = this.hard ? 28 : 48;
        const downTime = this.hard ? 80 : 120;

        switch (this.state) {
            case 'up':
                this.y = this.baseY;
                if (this.timer > upTime) { this.state = 'warn'; this.timer = 0; }
                break;
            case 'warn':
                // Shudder in place — RUN!
                this.y = this.baseY + (Math.random() - 0.5) * 4;
                if (this.timer === 1) audioManager.playSFX(SoundType.BOSS_STUN);
                if (this.timer > warnTime) { this.state = 'slamming'; this.timer = 0; }
                break;
            case 'slamming':
                this.y += 26;
                if (this.y >= this.slamY) {
                    this.y = this.slamY;
                    this.state = 'down';
                    this.timer = 0;
                    audioManager.playSFX(SoundType.CRASH);
                }
                break;
            case 'down':
                this.y = this.slamY;
                if (this.timer > downTime) { this.state = 'raising'; this.timer = 0; }
                break;
            case 'raising':
                this.y -= 3;
                if (this.y <= this.baseY) {
                    this.y = this.baseY;
                    this.state = 'up';
                    this.timer = 0;
                }
                break;
        }
        this.walkAnim += 0.1;
    }

    /** Lethal only while slamming or fully down. */
    public isLethal() {
        return this.state === 'slamming' || this.state === 'down';
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const headY = this.y;
        const warn = this.state === 'warn' && Math.floor(Date.now() / 120) % 2 === 0;

        ctx.save();

        // Gantry legs (visual only)
        ctx.fillStyle = gfxSettings.visualMode === 'enhanced' ? '#2e3440' : "#34495e";
        ctx.fillRect(x - 14, this.legTop, 14, this.beltTop - this.legTop);
        ctx.fillRect(x + this.w, this.legTop, 14, this.beltTop - this.legTop);
        // Top beam
        ctx.fillStyle = gfxSettings.visualMode === 'enhanced' ? '#3d4454' : "#2c3e50";
        ctx.fillRect(x - 14, this.legTop - 16, this.w + 28, 20);
        // Hazard stripes on beam
        for (let sx = x - 14; sx < x + this.w + 14; sx += 16) {
            ctx.fillStyle = (sx / 16) % 2 === 0 ? "#f1c40f" : "#1a1a1a";
            ctx.fillRect(sx, this.legTop - 16, 8, 20);
        }

        // Piston rods connect beam to head
        ctx.fillStyle = "#95a5a6";
        ctx.fillRect(x + 12, this.legTop + 4, 8, headY - this.legTop);
        ctx.fillRect(x + this.w - 20, this.legTop + 4, 8, headY - this.legTop);

        // The head (this is the hitbox)
        const headCol = warn ? "#e74c3c" : gfxSettings.visualMode === 'enhanced' ? '#4a5266' : "#566573";
        ctx.fillStyle = headCol;
        ctx.fillRect(x, headY, this.w, this.h);
        ctx.fillStyle = warn ? "#ff8a80" : "#7f8c8d";
        ctx.fillRect(x, headY + this.h - 8, this.w, 8); // crush plate
        // Warning light
        ctx.fillStyle = warn ? "#ff1744" : (this.state === 'up' ? "#2ecc71" : "#f1c40f");
        ctx.beginPath();
        ctx.arc(x + this.w / 2, this.legTop - 6, 5, 0, Math.PI * 2);
        ctx.fill();
        if (warn) {
            ctx.fillStyle = "rgba(255,23,68,0.25)";
            ctx.beginPath();
            ctx.arc(x + this.w / 2, this.legTop - 6, 16, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Re-export guard so World.ts can treat presses distinctly from touchables.
export type PressLike = Entity & { isLethal?: () => boolean };
