
import { Entity } from "./Entity";

export class Exit extends Entity {
    public locked = false;

    constructor(x: number, y: number) {
        super(x, y, 60, 80, '#27ae60');
    }
    
    unlock() {
        this.locked = false;
    }

    lock() {
        this.locked = true;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        ctx.fillStyle = "#bdc3c7";
        ctx.fillRect(x-5, this.y-5, this.w+10, this.h+5);
        ctx.fillStyle = this.locked ? "#555" : this.color;
        ctx.fillRect(x, this.y, this.w, this.h);
        
        if (this.locked) {
            // Draw Chains
            ctx.strokeStyle = "#222";
            ctx.lineWidth = 4;
            
            // X chains
            ctx.beginPath();
            ctx.moveTo(x, this.y); ctx.lineTo(x + this.w, this.y + this.h);
            ctx.moveTo(x + this.w, this.y); ctx.lineTo(x, this.y + this.h);
            ctx.stroke();

            // Padlock
            ctx.fillStyle = "#f1c40f";
            ctx.fillRect(x + 20, this.y + 30, 20, 15);
            ctx.strokeStyle = "#f1c40f";
            ctx.beginPath();
            ctx.arc(x + 30, this.y + 30, 8, Math.PI, 0);
            ctx.stroke();
        } else {
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.arc(x + 10, this.y + 40, 5, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "#c0392b";
            ctx.fillRect(x + 10, this.y - 15, 40, 12);
            ctx.fillStyle = "white";
            ctx.font = "10px Arial";
            ctx.fillText("EXIT", x + 18, this.y - 6);
        }
    }
}
