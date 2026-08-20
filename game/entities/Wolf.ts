
import { Entity } from "./Entity";

export class Wolf extends Entity {
    public origX: number;
    public speed = 1.6;
    public dir = 1;
    public animTimer = 0;

    constructor(x: number, y: number, public patrolDist: number) {
        super(x, y, 50, 30, '#4d4d4d'); 
        this.origX = x;
    }

    update() {
        this.x += this.speed * this.dir;
        if (Math.abs(this.x - this.origX) > this.patrolDist) {
            this.dir *= -1;
        }
        this.animTimer += 0.2;
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

        ctx.fillStyle = "#4d4d4d"; // Darker Grey
        ctx.fillRect(x, y + 5, 40, 20);
        
        ctx.beginPath();
        ctx.arc(x + 40, y + 10, 12, 0, Math.PI*2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + 35, y); ctx.lineTo(x + 38, y - 10); ctx.lineTo(x + 42, y); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 45, y); ctx.lineTo(x + 48, y - 10); ctx.lineTo(x + 52, y); ctx.fill();
        
        ctx.fillStyle = "#d35400";
        ctx.beginPath(); ctx.arc(x + 42, y + 8, 2, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "#4d4d4d"; // Darker Grey
        let legOffset = Math.sin(this.animTimer) * 5;
        ctx.fillRect(x + 5 + legOffset, y + 25, 5, 10);
        ctx.fillRect(x + 30 - legOffset, y + 25, 5, 10);
        
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x - 10, y + 5);
        ctx.lineTo(x, y + 15);
        ctx.fill();

        ctx.restore();
    }
}
