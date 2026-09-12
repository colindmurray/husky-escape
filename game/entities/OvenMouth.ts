import { Water } from "./Water";
import { gfxSettings } from "../GfxSettings";

/**
 * OvenMouth: a gaping deck-oven set INTO the main belt. Anything that touches
 * the glow — Onyx or a riding pastry — gets baked. The only way past is up
 * and over on the cooling-rack tier. (Lethal logic is free: it IS Water.)
 */
export class OvenMouth extends Water {
    constructor(x: number, y: number, w: number, h: number) {
        super(x, y, w, h);
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;
        const t = Date.now() / 1000;
        const flick = 0.6 + 0.4 * Math.sin(t * 9 + this.x * 0.05);

        // Oven iron body
        ctx.fillStyle = gfxSettings.visualMode === 'enhanced' ? '#191410' : "#2c3e50";
        ctx.fillRect(x - 6, y - 46, this.w + 12, 46);
        // Rivets
        ctx.fillStyle = "#7f8c8d";
        for (let rx = x + 2; rx < x + this.w + 4; rx += 22) {
            ctx.fillRect(rx, y - 42, 4, 4);
        }
        // Mouth glow
        const glow = ctx.createLinearGradient(0, y, 0, y + this.h);
        glow.addColorStop(0, `rgba(255,${120 + Math.floor(60 * flick)},20,0.95)`);
        glow.addColorStop(1, "rgba(160,30,0,0.9)");
        ctx.fillStyle = glow;
        ctx.fillRect(x, y, this.w, this.h + 20);
        // Licking flames
        ctx.fillStyle = `rgba(255,220,120,${0.5 + 0.4 * flick})`;
        for (let fx = x + 6; fx < x + this.w - 4; fx += 18) {
            const fh = 14 + 10 * Math.abs(Math.sin(t * 7 + fx * 0.3));
            ctx.beginPath();
            ctx.moveTo(fx, y + 6);
            ctx.quadraticCurveTo(fx + 5, y - fh, fx + 10, y + 6);
            ctx.fill();
        }
        // Warning sign
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(x + this.w / 2 - 14, y - 40, 28, 16);
        ctx.fillStyle = "#c0392b";
        ctx.font = "bold 11px Arial";
        ctx.fillText("HOT!", x + this.w / 2 - 11, y - 28);

        if (gfxSettings.visualMode === 'enhanced') {
            // Heat shimmer halo above the mouth
            ctx.fillStyle = `rgba(255,120,30,${0.10 + 0.06 * flick})`;
            ctx.fillRect(x - 6, y - 70, this.w + 12, 24);
        }
    }
}

/**
 * BatterVat: a tank of raw cake batter sunk between belt segments. Jump it
 * (140px wide, easy) or wear it. (Also Water — same free lethal logic.)
 */
export class BatterVat extends Water {
    constructor(x: number, y: number, w: number, h: number) {
        super(x, y, w, h);
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;
        const t = Date.now() / 1000;

        // Steel tank
        ctx.fillStyle = gfxSettings.visualMode === 'enhanced' ? '#3a3f4a' : "#566573";
        ctx.fillRect(x - 5, y - 14, this.w + 10, 14);
        ctx.fillRect(x - 5, y - 14, 8, this.h + 14);
        ctx.fillRect(x + this.w - 3, y - 14, 8, this.h + 14);
        // Goo surface with slow bubbles
        ctx.fillStyle = gfxSettings.visualMode === 'enhanced' ? '#f2d49b' : "#f0d9a8";
        ctx.fillRect(x, y, this.w, this.h + 40);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        for (let i = 0; i < 3; i++) {
            const bx = x + ((i * 47 + t * 12) % this.w);
            const by = y + 12 + ((i * 31) % 30);
            ctx.beginPath();
            ctx.arc(bx, by, 3 + (i % 2), 0, Math.PI * 2);
            ctx.fill();
        }
        // Surface wave line
        ctx.strokeStyle = "#d9a05f";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i <= this.w; i += 12) {
            ctx.lineTo(x + i, y + Math.sin(t * 2 + i * 0.2) * 2.5);
        }
        ctx.stroke();
    }
}
