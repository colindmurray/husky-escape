
import { Platform } from "./Platform";
import { Entity } from "./Entity";
import { gfxSettings } from "../GfxSettings";
import { drawFanNeon } from "../engine/enhanced/EnhancedSprites";

/**
 * Industrial fan embedded in a rooftop. NOT solid — standing in its upward
 * air column lifts Onyx (used for high-verticality sections of Zone 11).
 * Modes: 'steady' blows constantly; 'pulse' spins up and down cyclically so
 * the player times their entry.
 */
export class Fan extends Platform {
    public mode: 'steady' | 'pulse';
    public columnHeight: number;
    private phase: number;

    // Live lift factor 0..1 (drives both physics feel and visuals)
    public power = 1;

    constructor(x: number, y: number, mode: 'steady' | 'pulse' = 'steady', columnHeight = 340, phase = 0) {
        super(x, y, 92, 26);
        this.mode = mode;
        this.columnHeight = columnHeight;
        this.phase = phase;
    }

    update() {
        super.update();
        const t = Date.now() / 1000;
        if (this.mode === 'pulse') {
            // Spin-up/spin-down cycle: ~0.35 of the cycle is near-full power
            const c = (t * 0.55 + this.phase) % 1;
            this.power = c < 0.45 ? Math.min(1, c / 0.18) : Math.max(0, 1 - (c - 0.45) / 0.25);
        } else {
            this.power = 1;
        }
    }

    /** Applies the air-column lift to the player while he overlaps the column. */
    public applyLift(p: Entity) {
        if (this.power <= 0.05) return;
        const colTop = this.y - this.columnHeight;
        const overlap =
            p.x + p.w > this.x - 8 &&
            p.x < this.x + this.w + 8 &&
            p.y + p.h > colTop &&
            p.y < this.y;
        if (!overlap) return;

        const lift = 0.95 * this.power;
        p.velY -= lift;
        if (p.velY < -11.5) p.velY = -11.5;
        // Refresh double-jump inside the column so exits stay forgiving
        if (p.grounded || true) {
            (p as any).jumpsLeft = 2;
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;
        const t = Date.now() / 1000;

        // Shared geometry — housing + rotating blades (classic palette)
        ctx.save();

        if (gfxSettings.visualMode === 'enhanced') {
            drawFanNeon(ctx, x, y, this.w, this.h, t, this.power);
            ctx.restore();
            return;
        }

        // ---- Classic look: flat metal box + spinning blade cross ----
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x, y, this.w, this.h);
        ctx.fillStyle = "#1a252f";
        ctx.fillRect(x + 6, y + 5, this.w - 12, this.h - 10);

        // Blades (rotation speed reflects power)
        const spin = t * (this.power * 14 + 0.5);
        ctx.save();
        ctx.translate(x + this.w / 2, y + this.h / 2);
        ctx.rotate(spin);
        ctx.fillStyle = "#7f8c8d";
        for (let i = 0; i < 3; i++) {
            ctx.rotate((Math.PI * 2) / 3);
            ctx.beginPath();
            ctx.ellipse(0, -10, 4.4, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        // Hub
        ctx.fillStyle = "#95a5a6";
        ctx.beginPath();
        ctx.arc(x + this.w / 2, y + this.h / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        // Grill bars
        ctx.strokeStyle = "#34495e";
        ctx.lineWidth = 2;
        for (let gx = x + 14; gx < x + this.w - 8; gx += 16) {
            ctx.beginPath();
            ctx.moveTo(gx, y + 4);
            ctx.lineTo(gx, y + this.h - 4);
            ctx.stroke();
        }
        // Pulsing fans show a status dot
        if (this.mode === 'pulse') {
            ctx.fillStyle = this.power > 0.4 ? "#2ecc71" : "#e74c3c";
            ctx.beginPath();
            ctx.arc(x + this.w - 10, y + 8, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
