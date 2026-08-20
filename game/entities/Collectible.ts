import { Entity } from "./Entity";

export class Collectible extends Entity {
    public floatY = 0;

    constructor(x: number, y: number) {
        super(x, y, 20, 10, '#fff');
    }
    
    update() {
        this.floatY = Math.sin(Date.now() / 200) * 5;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y + this.floatY;
        
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.moveTo(x + 5, y);
        ctx.lineTo(x + 15, y);
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.strokeStyle = "white";
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x + 2, y, 4, 0, Math.PI*2);
        ctx.arc(x + 18, y, 4, 0, Math.PI*2);
        ctx.fill();
    }
}