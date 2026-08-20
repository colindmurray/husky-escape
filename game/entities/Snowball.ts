import { Entity, GRAVITY } from "./Entity";

export class Snowball extends Entity {
    public origX: number;
    public origY: number;
    public angle = 0;
    public speed = 2; // "roll slowly"
    public dir = -1;
    public bouncing = true;

    constructor(x: number, y: number, dir: number = -1) {
        super(x, y, 80, 80, 'white'); // Size 80x80
        this.origX = x;
        this.origY = y;
        this.dir = dir;
    }

    update(platforms: Entity[]) {
        // Gravity
        this.velY += GRAVITY;
        this.y += this.velY;
        
        // Horizontal Movement
        if (!this.bouncing) {
             this.x += this.speed * this.dir;
        } else {
             this.x += (this.speed * 0.5) * this.dir; // Move slightly while bouncing
        }
        
        // Rotation
        this.angle -= 0.05 * this.dir;

        // Collision Check
        let onGround = false;
        if (platforms) {
             platforms.forEach(platform => {
                 const dir = this.colCheck(platform);
                 if (dir === 'b') {
                     onGround = true;
                     // Bounce Physics
                     if (Math.abs(this.velY) > 2) {
                         this.velY = -this.velY * 0.4; // Decay bounce
                     } else {
                         this.velY = 0;
                         this.bouncing = false;
                     }
                 }
             });
        }
        
        // Respawn Logic (Fall off screen)
        if (this.y > 3000 || (this.y > this.origY + 2000)) { 
            this.reset();
        }
    }

    reset() {
        this.y = this.origY;
        this.x = this.origX;
        this.velY = 0;
        this.velX = 0;
        this.bouncing = true;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX + this.w/2;
        let y = this.y + this.h/2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.angle);

        // Ball
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI*2); // Radius 40 (Size 80)
        ctx.fill();
        
        // Detail
        ctx.strokeStyle = "#bdc3c7";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(10, 10, 20, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
    }
}