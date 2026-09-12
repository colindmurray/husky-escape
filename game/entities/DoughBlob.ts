import { Enemy } from "./Enemy";
import { gfxSettings } from "../GfxSettings";

/**
 * Dough Blob: a living lump of escaped bread dough. Wobbles along the belts
 * on a Crab-style ground patrol. Slow, squishy, and absolutely lethal to hug.
 * Cute enough that Maria will forgive it for ending her run.
 */
export class DoughBlob extends Enemy {
    private squash = 0;

    constructor(x: number, y: number, patrolDist: number, speed = 0.9) {
        super(x, y, patrolDist, speed);
        this.w = 44;
        this.h = 28;
    }

    update() {
        this.x += this.speed * this.dir;
        if (Math.abs(this.x - this.origX) > this.patrolDist) {
            this.dir *= -1;
        }
        this.squash += 0.12;
        this.walkAnim += 0.1;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;
        // Wobble: squash & stretch as it crawls
        const wob = Math.sin(this.squash) * 3;
        const bw = this.w + wob;
        const bh = this.h - wob * 0.6;
        const bx = x + (this.w - bw) / 2;
        const by = y + (this.h - bh);

        ctx.save();

        if (gfxSettings.visualMode === 'enhanced') {
            ctx.fillStyle = 'rgba(255,200,130,0.25)';
            ctx.beginPath();
            ctx.ellipse(bx + bw / 2, by + bh, bw / 2, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Blob body
        const grad = ctx.createLinearGradient(0, by, 0, by + bh);
        if (gfxSettings.visualMode === 'enhanced') {
            grad.addColorStop(0, '#ffe0b2');
            grad.addColorStop(1, '#d9a05f');
        } else {
            grad.addColorStop(0, '#f5d7a1');
            grad.addColorStop(1, '#d9a05f');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crawling drips at the leading edge
        ctx.fillStyle = '#d9a05f';
        const lead = this.dir === 1 ? bx + bw - 4 : bx + 2;
        const drip = Math.abs(Math.sin(this.squash)) * 4;
        ctx.beginPath();
        ctx.ellipse(lead, by + bh - 2 + drip * 0.3, 4, 4 + drip, 0, 0, Math.PI * 2);
        ctx.fill();

        // Worried eyes look toward travel direction
        const ex = bx + bw / 2 + this.dir * 6;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(ex - 6, by + 9, 4.5, 0, Math.PI * 2);
        ctx.arc(ex + 6, by + 9, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3e2723";
        ctx.beginPath();
        ctx.arc(ex - 6 + this.dir * 1.5, by + 9.5, 2, 0, Math.PI * 2);
        ctx.arc(ex + 6 + this.dir * 1.5, by + 9.5, 2, 0, Math.PI * 2);
        ctx.fill();
        // Little frown
        ctx.strokeStyle = "#5d4037";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ex, by + 18, 4, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();

        ctx.restore();
    }
}
