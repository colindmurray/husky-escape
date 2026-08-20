import { Platform } from "./Platform";

export class SkiJump extends Platform {
    constructor(x: number, y: number) {
        super(x, y, 80, 40);
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;

        // Ramp Shape
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.moveTo(x, y + this.h);
        ctx.lineTo(x + this.w, y); 
        ctx.lineTo(x + this.w, y + this.h);
        ctx.fill();

        // Details
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + this.h);
        ctx.lineTo(x + this.w, y);
        ctx.stroke();
        
        // Symbol
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText(">>>", x + 20, y + 30);
    }
}