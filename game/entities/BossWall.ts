
import { Platform } from "./Platform";

export class BossWall extends Platform {
    public isActive = false;
    public targetY: number;
    public hiddenY: number;

    constructor(x: number, y: number, height: number) {
        super(x, y, 50, height, "#2c3e50");
        this.targetY = y - height;
        this.hiddenY = y;
    }

    activate() {
        this.isActive = true;
    }

    deactivate() {
        this.isActive = false;
    }

    update() {
        if (this.isActive) {
            if (this.y > this.targetY) {
                this.y -= 5;
            }
        } else {
            if (this.y < this.hiddenY) {
                this.y += 5;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number, currentLevel: number) {
        let x = this.x - camX;
        let y = this.y;
        
        // Iron gate look
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x, y, this.w, this.h);
        
        ctx.fillStyle = "#1a252f";
        for(let i=0; i<this.h; i+=40) {
            ctx.fillRect(x + 5, y + i, this.w - 10, 10);
        }
        
        ctx.strokeStyle = "#7f8c8d";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, this.w, this.h);
    }
}
