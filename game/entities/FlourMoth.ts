import { Enemy } from "./Enemy";
import { gfxSettings } from "../GfxSettings";

/**
 * Flour Moth: the bakery's airborne pest. Patrols horizontally around the
 * hanging lamps and upper belts with a Seagull-style sine hover. Lethal on
 * touch — watch the wings, time your jump between flaps.
 */
export class FlourMoth extends Enemy {
    public origY: number;
    private hoverT = 0;
    private hoverAmp: number;

    constructor(x: number, y: number, patrolDist: number, speed = 1.6) {
        super(x, y, patrolDist, speed);
        this.w = 36;
        this.h = 24;
        this.origY = y;
        this.hoverT = Math.random() * 100;
        this.hoverAmp = 26;
    }

    update() {
        this.x += this.speed * this.dir;
        if (Math.abs(this.x - this.origX) > this.patrolDist) {
            this.dir *= -1;
        }
        this.hoverT += 0.06;
        this.y = this.origY + Math.sin(this.hoverT * 2) * this.hoverAmp;
        this.walkAnim += 0.35;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;
        const flap = Math.sin(this.walkAnim * 4) * 0.7;

        ctx.save();
        if (this.dir === -1) {
            ctx.translate(x + this.w / 2, y);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.w / 2), -y);
        }

        if (gfxSettings.visualMode === 'enhanced') {
            // Dusty glowing wings
            ctx.fillStyle = 'rgba(255,240,210,0.25)';
            ctx.beginPath();
            ctx.ellipse(x + 18, y + 12, 20, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Wings
        ctx.fillStyle = gfxSettings.visualMode === 'enhanced' ? '#f5e6c8' : "#efe6d0";
        for (const s of [-1, 1]) {
            ctx.save();
            ctx.translate(x + 18, y + 12);
            ctx.rotate(s * (0.5 + flap * 0.5));
            ctx.beginPath();
            ctx.ellipse(s * 12, -4, 12, 7, s * 0.4, 0, Math.PI * 2);
            ctx.fill();
            // Wing spots
            ctx.fillStyle = "rgba(160,120,80,0.7)";
            ctx.beginPath();
            ctx.arc(s * 14, -5, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = gfxSettings.visualMode === 'enhanced' ? '#f5e6c8' : "#efe6d0";
            ctx.restore();
        }

        // Fuzzy body
        ctx.fillStyle = "#8d6e63";
        ctx.beginPath();
        ctx.ellipse(x + 18, y + 13, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Antennae
        ctx.strokeStyle = "#5d4037";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 6); ctx.lineTo(x + 12, y - 2);
        ctx.moveTo(x + 20, y + 6); ctx.lineTo(x + 24, y - 2);
        ctx.stroke();
        // Eyes (glow in enhanced)
        ctx.fillStyle = gfxSettings.visualMode === 'enhanced' ? '#ff5a5a' : "#3e2723";
        ctx.beginPath();
        ctx.arc(x + 16, y + 9, 1.8, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 9, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
