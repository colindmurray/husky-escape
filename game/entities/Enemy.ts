
import { Entity } from "./Entity";

export class Enemy extends Entity {
    public origX: number;
    public dir = 1;
    public walkAnim = 0;

    constructor(x: number, y: number, public patrolDist: number, public speed = 1.3) {
        super(x, y, 30, 50, '#e74c3c');
        this.origX = x;
    }

    update(...args: any[]) {
        this.x += this.speed * this.dir;
        if (Math.abs(this.x - this.origX) > this.patrolDist) {
            this.dir *= -1;
        }
        this.walkAnim += 0.15;
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

        // --- Draw Human Dog Catcher ---
        let legOffset = Math.sin(this.walkAnim) * 5;
        
        // Back Leg
        ctx.fillStyle = "#2c3e50"; 
        ctx.fillRect(x + 10 + legOffset, y + 35, 8, 15);
        ctx.fillStyle = "black";
        ctx.fillRect(x + 8 + legOffset, y + 50, 12, 4);

        // Front Leg
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x + 10 - legOffset, y + 35, 8, 15);
        ctx.fillStyle = "black";
        ctx.fillRect(x + 8 - legOffset, y + 50, 12, 4);

        // Body (Shirt)
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(x + 5, y + 15, 20, 22);

        // Badge
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.arc(x + 15, y + 22, 3, 0, Math.PI*2);
        ctx.fill();

        // Head
        ctx.fillStyle = "#f1c27d";
        ctx.beginPath();
        ctx.arc(x + 15, y + 8, 9, 0, Math.PI*2);
        ctx.fill();

        // Cap
        ctx.fillStyle = "#2c3e50";
        ctx.beginPath();
        ctx.arc(x + 15, y + 6, 9, Math.PI, 0); 
        ctx.fill();
        ctx.fillRect(x + 14, y + 6, 12, 3);

        // Face details
        ctx.fillStyle = "#333";
        ctx.fillRect(x + 18, y + 7, 2, 2);

        // Arms (holding net)
        ctx.save();
        ctx.translate(x + 15, y + 20);
        ctx.rotate(Math.sin(this.walkAnim) * 0.5); 
        
        ctx.fillStyle = "#c0392b"; 
        ctx.fillRect(-2, 0, 6, 8);
        ctx.fillStyle = "#f1c27d";
        ctx.fillRect(-2, 8, 6, 7);
        ctx.fillStyle = "#795548";
        ctx.fillRect(0, 10, 25, 3); 
        ctx.strokeStyle = "#ecf0f1";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(25, 11, 10, 0, Math.PI*2);
        ctx.stroke();

        ctx.restore();
        ctx.restore();
    }
}