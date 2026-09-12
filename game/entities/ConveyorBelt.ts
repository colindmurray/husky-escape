import { Platform } from "./Platform";
import { gfxSettings } from "../GfxSettings";

/**
 * Bakery conveyor belt. A solid platform that drags anything standing on it
 * along at `beltSpeed` px/frame (positive = right, negative = left).
 *
 * The push is free: Player.update already applies `platform.dx` to a grounded
 * player, so the belt just publishes its speed as dx every frame.
 * Keep |beltSpeed| well under Onyx's ~3.5 top speed so kids can fight it.
 */
export class ConveyorBelt extends Platform {
    public beltSpeed: number;
    private animPhase = 0;

    constructor(x: number, y: number, w: number, h: number, beltSpeed: number) {
        super(x, y, w, h);
        this.beltSpeed = beltSpeed;
        this.dx = beltSpeed;
    }

    update() {
        this.dx = this.beltSpeed;
        this.dy = 0;
        this.animPhase += Math.abs(this.beltSpeed) * 0.06;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        // Viewport culling: skip drawing belts that are entirely offscreen
        if (x + this.w < -60 || x > ctx.canvas.width + 60) return;

        const y = this.y;
        const dir = this.beltSpeed >= 0 ? 1 : -1;
        const t = Date.now() / 1000;

        if (gfxSettings.visualMode === 'enhanced') {
            // Copper-brown belt with warm under-glow and flowing chevrons
            ctx.save();
            ctx.fillStyle = '#241a12';
            ctx.beginPath();
            ctx.roundRect(x - 2, y - 2, this.w + 4, this.h + 4, 6);
            ctx.fill();
            const g = ctx.createLinearGradient(0, y, 0, y + this.h);
            g.addColorStop(0, '#8a5a2e');
            g.addColorStop(0.5, '#5d3a1c');
            g.addColorStop(1, '#3a2412');
            ctx.fillStyle = g;
            ctx.fillRect(x, y, this.w, this.h);
            // Roller end caps
            ctx.fillStyle = '#2c2118';
            ctx.beginPath();
            ctx.arc(x + 8, y + this.h / 2, this.h / 2 - 2, 0, Math.PI * 2);
            ctx.arc(x + this.w - 8, y + this.h / 2, this.h / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#c98f4a';
            ctx.beginPath();
            ctx.arc(x + 8, y + this.h / 2, 2.5, 0, Math.PI * 2);
            ctx.arc(x + this.w - 8, y + this.h / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Heat glow strip along the top edge
            const glow = 0.35 + 0.15 * Math.sin(t * 3);
            ctx.fillStyle = `rgba(255,170,80,${glow})`;
            ctx.fillRect(x, y, this.w, 3);

            // Flowing chevrons show direction — batched into single path
            ctx.strokeStyle = 'rgba(255,220,160,0.85)';
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            const spacing = 30;
            const off = (this.animPhase * 22 * dir) % spacing;
            ctx.beginPath();
            for (let d = -spacing; d < this.w + spacing; d += spacing) {
                const cxp = x + ((d + off + spacing * 4) % (this.w + spacing)) - spacing / 2;
                const mid = y + this.h / 2 + 2;
                ctx.moveTo(cxp - dir * 5, mid - 5);
                ctx.lineTo(cxp + dir * 5, mid);
                ctx.lineTo(cxp - dir * 5, mid + 5);
            }
            ctx.stroke();
            ctx.restore();
            return;
        }

        // ---- Classic look: steel frame + rubber belt + direction ticks ----
        ctx.fillStyle = "#3e2723";
        ctx.fillRect(x, y, this.w, this.h);
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(x, y, this.w, 8); // belt surface
        // Frame bolts
        ctx.fillStyle = "#212121";
        for (let bx = x + 8; bx < x + this.w - 4; bx += 40) {
            ctx.fillRect(bx, y + this.h - 8, 6, 6);
        }
        // Moving ticks — batched into single path
        ctx.fillStyle = "#ffcc80";
        const spacing = 26;
        const off = (this.animPhase * 20 * dir) % spacing;
        ctx.beginPath();
        for (let d = 0; d < this.w; d += spacing) {
            let tx = x + ((d + off) % this.w + this.w) % this.w;
            ctx.moveTo(tx, y + 2);
            ctx.lineTo(tx + dir * 6, y + 5);
            ctx.lineTo(tx, y + 8);
            ctx.closePath();
        }
        ctx.fill();
    }
}
