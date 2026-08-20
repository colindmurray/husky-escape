import { Platform } from "./Platform";

export class Umbrella extends Platform {
    constructor(x: number, y: number) {
        super(x, y, 60, 10);
        this.color = "#e74c3c";
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;

        // Pole
        ctx.fillStyle = "#ecf0f1"; 
        ctx.fillRect(x + 28, y, 4, 60);
        
        // Handle
        ctx.beginPath();
        ctx.arc(x + 30, y + 60, 4, 0, Math.PI, false);
        ctx.strokeStyle = "#ecf0f1";
        ctx.stroke();

        // Top (Canopy)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x + 30, y + 5, 30, Math.PI, 0);
        ctx.fill();
        
        // White Stripes
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(x + 30, y + 5);
        ctx.arc(x + 30, y + 5, 30, Math.PI * 1.2, Math.PI * 1.4);
        ctx.lineTo(x + 30, y + 5);
        ctx.arc(x + 30, y + 5, 30, Math.PI * 1.6, Math.PI * 1.8);
        ctx.fill();
    }
}