import { Enemy } from "./Enemy";

export class ConstructionWorker extends Enemy {
    constructor(x: number, y: number, patrolDist: number, speed = 1.6) {
        super(x, y, patrolDist, speed);
        this.w = 35;
        this.h = 55;
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

        let legOffset = Math.sin(this.walkAnim) * 5;
        
        // Back Leg
        ctx.fillStyle = "#2c3e50"; 
        ctx.fillRect(x + 10 + legOffset, y + 36, 8, 19);
        ctx.fillStyle = "black";
        ctx.fillRect(x + 8 + legOffset, y + 51, 12, 4);

        // Front Leg
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x + 18 - legOffset, y + 36, 8, 19);
        ctx.fillStyle = "black";
        ctx.fillRect(x + 16 - legOffset, y + 51, 12, 4);

        // Body (Blue overalls under orange safety vest)
        ctx.fillStyle = "#2980b9"; // Blue shirt / overalls
        ctx.fillRect(x + 6, y + 15, 23, 22);
        
        // Safety Vest
        ctx.fillStyle = "#e67e22"; // Safety orange fabric
        ctx.fillRect(x + 6, y + 15, 6, 22);
        ctx.fillRect(x + 23, y + 15, 6, 22);
        ctx.fillRect(x + 6, y + 27, 23, 10);
        
        // Yellow Reflective Stripes
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(x + 8, y + 15, 2, 22);
        ctx.fillRect(x + 25, y + 15, 2, 22);
        ctx.fillRect(x + 6, y + 29, 23, 3);

        // Head
        ctx.fillStyle = "#f1c27d";
        ctx.beginPath();
        ctx.arc(x + 17, y + 8, 9, 0, Math.PI*2);
        ctx.fill();

        // Safety Hard Hat
        ctx.fillStyle = "#f1c40f"; // Yellow helmet
        ctx.beginPath();
        ctx.arc(x + 17, y + 7, 10, Math.PI, 0); 
        ctx.fill();
        ctx.fillRect(x + 5, y + 5, 24, 3); // Brim
        ctx.fillStyle = "#d35400"; // Ridge detail
        ctx.fillRect(x + 15, y - 1, 4, 8);

        // Face Details
        ctx.fillStyle = "#333";
        ctx.fillRect(x + 19, y + 7, 2, 3); // Eye
        
        // Overhanging safety glasses
        ctx.fillStyle = "#34495e";
        ctx.fillRect(x + 14, y + 5, 8, 2);

        // Patrolling tool (Warning LED pointer baton or orange cone flag)
        ctx.save();
        ctx.translate(x + 17, y + 22);
        ctx.rotate(Math.sin(this.walkAnim) * 0.4);
        
        ctx.fillStyle = "#7f8c8d";
        ctx.fillRect(2, 2, 10, 4); // Handle
        ctx.fillStyle = "#e74c3c"; // Neon Red flashing baton
        ctx.fillRect(12, 1, 14, 6);
        ctx.fillStyle = "rgba(231, 76, 60, 0.4)"; // Bright orange glow
        ctx.beginPath();
        ctx.arc(20, 4, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();

        ctx.restore();
    }
}
