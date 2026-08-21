import { Entity } from "./Entity";
import { gfxSettings } from "../GfxSettings";
import { drawWaterEnhanced } from "../engine/enhanced/EnhancedSprites";

export class Water extends Entity {
    public waveOffset = 0;
    public baseY: number;

    constructor(x: number, y: number, w: number, h: number, public isTide: boolean = false) {
        super(x, y, w, h, '#3498db');
        this.baseY = y;
    }

    update() {
        this.waveOffset += 0.05;
        if (this.isTide) {
            this.y = this.baseY + Math.sin(this.waveOffset * 0.5) * 30;
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;

        if (gfxSettings.visualMode === 'enhanced') {
            drawWaterEnhanced(ctx, x, y, this.w, this.h, this.waveOffset, Date.now() / 1000);
            return;
        }

        ctx.fillStyle = "rgba(52, 152, 219, 0.6)";
        ctx.fillRect(x, y, this.w, this.h + 50);

        // Surface Waves
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        for(let i=0; i <= this.w; i+=20) {
             let waveY = Math.sin(this.waveOffset + (i * 0.1)) * 5;
             ctx.lineTo(x + i, y + waveY);
        }
        ctx.lineTo(x + this.w, y + 10);
        ctx.lineTo(x, y + 10);
        ctx.fill();
    }
}