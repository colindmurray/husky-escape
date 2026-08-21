import { Entity } from "./Entity";
import { gfxSettings } from "../GfxSettings";
import { drawPorcupineEnhanced } from "../engine/enhanced/EnhancedSprites";

export class Porcupine extends Entity {
    public origX: number;
    public speed = 0.8;
    public dir = 1;
    public walkAnim = 0;

    constructor(x: number, y: number, public patrolDist: number) {
        super(x, y, 50, 30, '#5e4034'); // Brownish
        this.origX = x;
    }

    update() {
        this.x += this.speed * this.dir;
        if (Math.abs(this.x - this.origX) > this.patrolDist) {
            this.dir *= -1;
        }
        this.walkAnim += 0.1;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;

        ctx.save();
        if (this.dir === -1) {
            ctx.translate(x + this.w / 2, y);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.w / 2), -y);
        }

        if (gfxSettings.visualMode === 'enhanced') {
            drawPorcupineEnhanced(ctx, x, y, this.w, this.h, this.walkAnim);
            ctx.restore();
            return;
        }

        // Body
        ctx.fillStyle = "#5d4037";
        ctx.beginPath();
        ctx.arc(x + 25, y + 20, 15, Math.PI, 0); // Hump
        ctx.fill();
        ctx.fillRect(x + 10, y + 20, 30, 10);

        // Head
        ctx.fillStyle = "#795548";
        ctx.beginPath();
        ctx.arc(x + 40, y + 25, 10, 0, Math.PI*2);
        ctx.fill();

        // Eye
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(x + 42, y + 22, 2, 0, Math.PI*2); ctx.fill();

        // Spikes
        ctx.fillStyle = "#bdc3c7"; // Silver/White tips
        for(let i=0; i<5; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 10 + (i*6), y + 20);
            ctx.lineTo(x + 13 + (i*6), y - 5);
            ctx.lineTo(x + 16 + (i*6), y + 20);
            ctx.fill();
        }

        // Legs
        ctx.fillStyle = "#3e2723";
        let legOffset = Math.sin(this.walkAnim) * 3;
        ctx.fillRect(x + 15 + legOffset, y + 28, 4, 6);
        ctx.fillRect(x + 35 - legOffset, y + 28, 4, 6);

        ctx.restore();
    }
}