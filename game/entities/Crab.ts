import { Entity } from "./Entity";
import { gfxSettings } from "../GfxSettings";
import { drawCrabEnhanced } from "../engine/enhanced/EnhancedSprites";

export class Crab extends Entity {
    public origX: number;
    public speed = 1.0;
    public dir = 1;
    public clawAnim = 0;

    constructor(x: number, y: number, public patrolDist: number) {
        super(x, y, 40, 25, '#e74c3c');
        this.origX = x;
    }

    update() {
        this.x += this.speed * this.dir;
        if (Math.abs(this.x - this.origX) > this.patrolDist) {
            this.dir *= -1;
        }
        this.clawAnim += 0.2;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;

        if (gfxSettings.visualMode === 'enhanced') {
            drawCrabEnhanced(ctx, x, y, this.w, this.h, this.clawAnim, this.dir);
            return;
        }

        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 15, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x + 15, y + 5, 4, 0, Math.PI*2);
        ctx.arc(x + 25, y + 5, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(x + 15 + this.dir, y + 5, 2, 0, Math.PI*2);
        ctx.arc(x + 25 + this.dir, y + 5, 2, 0, Math.PI*2);
        ctx.fill();

        ctx.strokeStyle = "#c0392b";
        ctx.lineWidth = 3;
        let clawOffset = Math.sin(this.clawAnim) * 3;
        
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 15);
        ctx.lineTo(x, y + 5 + clawOffset);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + 30, y + 15);
        ctx.lineTo(x + 40, y + 5 - clawOffset);
        ctx.stroke();
        
        ctx.strokeStyle = "#e74c3c";
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 20); ctx.lineTo(x + 5, y + 25);
        ctx.moveTo(x + 15, y + 22); ctx.lineTo(x + 10, y + 25);
        ctx.moveTo(x + 30, y + 20); ctx.lineTo(x + 35, y + 25);
        ctx.moveTo(x + 25, y + 22); ctx.lineTo(x + 30, y + 25);
        ctx.stroke();
    }
}