import { Enemy } from "./Enemy";
import { Entity } from "./Entity";

export class Jellyfish extends Enemy {
    public origY: number;
    public bobTimer = 0;
    
    // Player speed ~2.8. 20% is ~0.56
    public chaseSpeed = 0.56; 

    constructor(x: number, y: number) {
        super(x, y, 0, 0);
        this.w = 30;
        this.h = 40;
        this.origY = y;
        // Randomize start phase
        this.bobTimer = Math.random() * 100;
    }

    update(platforms?: Entity[], player?: Entity) {
        this.bobTimer += 0.05;
        
        // Bobbing motion (Sin wave)
        this.y += Math.sin(this.bobTimer) * 0.5;

        // Slow chase logic
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Only chase if within reasonable range (e.g., 600px)
            if (dist < 600) {
                // Normalize and apply speed
                this.x += (dx / dist) * this.chaseSpeed;
                this.y += (dy / dist) * this.chaseSpeed;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;

        ctx.save();
        
        // Transparency
        ctx.globalAlpha = 0.7;
        
        // Dome
        ctx.fillStyle = "#e056fd"; // Pink/Purple
        ctx.beginPath();
        ctx.arc(x + 15, y + 10, 15, Math.PI, 0);
        ctx.lineTo(x + 30, y + 15);
        ctx.lineTo(x, y + 15);
        ctx.fill();

        // Tentacles
        ctx.strokeStyle = "#e056fd";
        ctx.lineWidth = 2;
        for(let i=5; i<30; i+=6) {
            let offset = Math.sin(this.bobTimer + (i*0.5)) * 5;
            ctx.beginPath();
            ctx.moveTo(x + i, y + 15);
            ctx.quadraticCurveTo(x + i - 5, y + 25, x + i + offset, y + 35);
            ctx.stroke();
        }

        // Eyes
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(x + 10, y + 8, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 20, y + 8, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(x + 10, y + 8, 1, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 20, y + 8, 1, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    }
}