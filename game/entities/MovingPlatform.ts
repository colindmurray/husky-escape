import { Platform } from "./Platform";

export class MovingPlatform extends Platform {
    constructor(x: number, y: number, w: number, h: number, public minX: number, public maxX: number, public speed: number) {
        super(x, y, w, h);
        this.dx = speed;
    }

    update() {
        this.x += this.dx;
        if (this.x > this.maxX || this.x < this.minX) {
            this.dx *= -1;
        }
    }
    
    draw(ctx: CanvasRenderingContext2D, camX: number) {
         let x = this.x - camX;
         let y = this.y;
         
         // Draw Log Texture
         ctx.fillStyle = "#5d4037"; // Wood
         ctx.fillRect(x, y, this.w, this.h);
         
         // Rings/Bark
         ctx.fillStyle = "#3e2723";
         ctx.beginPath();
         ctx.arc(x, y + this.h/2, this.h/2, 0, Math.PI*2);
         ctx.fill();
         
         ctx.beginPath();
         ctx.arc(x + this.w, y + this.h/2, this.h/2, 0, Math.PI*2);
         ctx.fill();
         
         // Light top
         ctx.fillStyle = "#795548";
         ctx.fillRect(x, y + 2, this.w, 4);
    }
}