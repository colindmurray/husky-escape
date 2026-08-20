
import { Entity } from "./Entity";

export class Platform extends Entity {
    public dx = 0;
    public dy = 0;
    public isShaking = false;

    constructor(x: number, y: number, w: number, h: number, color?: string) {
        super(x, y, w, h, color || '#7f8c8d');
    }
    
    update() {
        this.dx = 0;
        this.dy = 0;
        this.isShaking = false;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number, currentLevel: number) {
        let drawX = this.x - camX;
        let drawY = this.y;

        if (this.isShaking) {
            drawX += (Math.random() - 0.5) * 3;
            drawY += (Math.random() - 0.5) * 3;
        }

        if (currentLevel === 4) {
             // Sand
             ctx.fillStyle = "#f1c40f";
             ctx.fillRect(drawX, drawY, this.w, this.h);
             // Detail
             ctx.fillStyle = "#e67e22";
             ctx.fillRect(drawX, drawY + this.h - 5, this.w, 5);
        } else if (currentLevel === 6) {
             // Snow
             ctx.fillStyle = "#fff"; 
             ctx.fillRect(drawX, drawY, this.w, this.h);
             // Icy top
             ctx.fillStyle = "#dbeeff";
             ctx.fillRect(drawX, drawY, this.w, 10);
        } else if (currentLevel === 3) {
             // Spooky Forest Platform
             ctx.fillStyle = "#3d2b1f"; // Dark gnarled wood
             ctx.fillRect(drawX, drawY, this.w, this.h);
             
             // Dark green mossy top
             ctx.fillStyle = "#1b4d3e"; 
             ctx.fillRect(drawX, drawY, this.w, 15);
             
             // Texture detail
             ctx.strokeStyle = "rgba(0,0,0,0.3)";
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(drawX, drawY + 20);
             ctx.lineTo(drawX + this.w, drawY + 20);
             ctx.stroke();
        } else {
             // Draw cage/metal texture (Default/Pound)
             ctx.fillStyle = currentLevel >= 5 ? "#5D4037" : "#555"; 
             ctx.fillRect(drawX, drawY, this.w, this.h);
             
             if (currentLevel < 3) {
                 // Cage look for pound
                 ctx.strokeStyle = "#333";
                 ctx.lineWidth = 2;
                 ctx.beginPath();
                 ctx.rect(drawX, drawY, this.w, this.h);
                 for(let i=0; i < this.w; i+=20) {
                     ctx.moveTo(drawX + i, drawY);
                     ctx.lineTo(drawX + i, drawY + this.h);
                 }
                 ctx.stroke();
             } else {
                 // Grassy top for mountain/forest default
                 ctx.fillStyle = "#2ecc71";
                 ctx.fillRect(drawX, drawY, this.w, 15);
             }
        }
    }
}
