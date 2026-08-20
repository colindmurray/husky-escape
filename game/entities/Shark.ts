import { MovingPlatform } from "./MovingPlatform";

export class Shark extends MovingPlatform {
    public dir = 1;
    public isControlled = false;

    constructor(x: number, y: number, minX: number, maxX: number, public isGolden: boolean = false) {
        // Golden shark is faster (speed 6 vs 2)
        super(x, y, 120, 40, minX, maxX, isGolden ? 6.0 : 2.0); 
    }

    update() {
        // If controlled by player, position is handled by Player class
        if (this.isControlled) {
            return;
        }
        super.update();
        this.dir = Math.sign(this.dx);
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;

        ctx.save();
        
        // Face direction
        if (this.dir === -1) {
            ctx.translate(x + this.w / 2, y + this.h / 2);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.w / 2), -(y + this.h / 2));
        }

        // --- BODY COLOR ---
        if (this.isGolden) {
             // Golden Body
             ctx.fillStyle = "#f1c40f"; 
             // Shimmer effect
             if (Math.floor(Date.now() / 100) % 2 === 0) {
                 ctx.fillStyle = "#f39c12";
             }
        } else {
             // Normal Blue Grey
             ctx.fillStyle = "#607d8b"; 
        }

        ctx.beginPath();
        // Nose
        ctx.moveTo(x + 120, y + 20); 
        // Top curve
        ctx.quadraticCurveTo(x + 60, y, x, y + 20); 
        // Tail
        ctx.lineTo(x - 20, y);
        ctx.lineTo(x - 20, y + 40);
        ctx.lineTo(x, y + 20);
        // Bottom curve
        ctx.quadraticCurveTo(x + 60, y + 40, x + 120, y + 20);
        ctx.fill();

        // --- FIN ---
        ctx.fillStyle = this.isGolden ? "#d35400" : "#455a64";
        ctx.beginPath();
        ctx.moveTo(x + 50, y + 10);
        ctx.lineTo(x + 70, y - 15);
        ctx.lineTo(x + 80, y + 15);
        ctx.fill();

        // Eye
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(x + 100, y + 15, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(x + 101, y + 15, 1, 0, Math.PI*2); ctx.fill();

        // Gills
        ctx.fillStyle = this.isGolden ? "#d35400" : "#455a64";
        ctx.fillRect(x + 80, y + 20, 2, 10);
        ctx.fillRect(x + 84, y + 20, 2, 10);
        ctx.fillRect(x + 88, y + 20, 2, 10);
        
        // Crown/Sparkle for Golden
        if (this.isGolden) {
            ctx.fillStyle = "white";
            const t = Date.now() / 200;
            const sx = x + 60 + Math.sin(t)*30;
            const sy = y + 10 + Math.cos(t)*10;
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }
}