import { Entity } from "./Entity";
import { Enemy } from "./Enemy";

export class Seagull extends Enemy {
    public origY: number;
    public flightTimer = 0;
    
    constructor(x: number, y: number, patrolDist: number) {
        super(x, y, patrolDist, 2.0); // Faster than normal enemies
        this.w = 40;
        this.h = 20;
        this.origY = y;
        this.flightTimer = Math.random() * 100;
    }

    update() {
        super.update(); // Horizontal patrol
        
        this.flightTimer += 0.05;
        // Swooping motion (Figure 8-ish or simple Sine)
        this.y = this.origY + Math.sin(this.flightTimer * 2) * 40;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;

        ctx.save();
        if (this.dir === -1) {
            ctx.translate(x + this.w / 2, y + this.h / 2);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.w / 2), -(y + this.h / 2));
        }

        // Body
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 10, 15, 8, 0, 0, Math.PI*2);
        ctx.fill();

        // Wings
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        const wingFlap = Math.sin(this.flightTimer * 10) * 10;
        
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 5);
        ctx.lineTo(x + 10, y - 10 + wingFlap);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 5);
        ctx.lineTo(x + 35, y - 10 + wingFlap);
        ctx.stroke();

        // Beak
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.moveTo(x + 32, y + 8);
        ctx.lineTo(x + 40, y + 12);
        ctx.lineTo(x + 32, y + 12);
        ctx.fill();

        // Eye
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(x + 28, y + 8, 2, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}