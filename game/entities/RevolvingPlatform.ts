import { Platform } from "./Platform";

export class RevolvingPlatform extends Platform {
    constructor(
        public cx: number, 
        public cy: number, 
        public radius: number, 
        public speed: number, 
        w: number, 
        h: number, 
        public angle: number = 0
    ) {
        let startX = cx + Math.cos(angle) * radius;
        let startY = cy + Math.sin(angle) * radius;
        super(startX, startY, w, h);
    }

    update() {
        this.angle += this.speed;
        let nextX = this.cx + Math.cos(this.angle) * this.radius;
        let nextY = this.cy + Math.sin(this.angle) * this.radius;

        this.dx = nextX - this.x;
        this.dy = nextY - this.y;

        this.x = nextX;
        this.y = nextY;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number, currentLevel: number) {
        // Draw arm mechanism
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.cx - camX + this.w/2, this.cy + this.h/2);
        ctx.lineTo(this.x - camX + this.w/2, this.y + this.h/2);
        ctx.stroke();

        // Draw pivot point
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(this.cx - camX + this.w/2, this.cy + this.h/2, 8, 0, Math.PI*2);
        ctx.fill();

        super.draw(ctx, camX, currentLevel);
    }
}