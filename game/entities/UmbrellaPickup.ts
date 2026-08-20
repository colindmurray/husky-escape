import { Entity } from "./Entity";

export class UmbrellaPickup extends Entity {
    private bobTimer = 0;

    constructor(x: number, y: number) {
        super(x, y, 30, 30, '#e74c3c');
    }

    update() {
        this.bobTimer += 0.1;
        this.y += Math.sin(this.bobTimer) * 0.2;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;
        
        ctx.save();
        ctx.translate(x + 15, y + 15);
        ctx.rotate(Math.sin(this.bobTimer * 0.5) * 0.2);
        ctx.translate(-(x + 15), -(y + 15));

        // Draw Mini Umbrella Icon
        ctx.fillStyle = "#e74c3c"; // Red
        ctx.beginPath();
        ctx.arc(x + 15, y + 10, 15, Math.PI, 0);
        ctx.fill();
        
        // Handle
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 15, y + 10);
        ctx.lineTo(x + 15, y + 25);
        ctx.arc(x + 12, y + 25, 3, 0, Math.PI, false);
        ctx.stroke();

        // Glow
        ctx.shadowColor = "white";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(x + 15, y + 15, 20, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}