import { Platform } from "./Platform";

export class CraneGirder extends Platform {
    // Hoisting platform moving automatically between minY and maxY
    constructor(
        x: number,
        y: number,
        w: number,
        h: number,
        public minY: number,
        public maxY: number,
        public speed: number,
        public label = "Crane Platform"
    ) {
        super(x, y, w, h);
        this.dy = speed;
    }

    update() {
        this.y += this.dy;
        if (this.y > this.maxY || this.y < this.minY) {
            this.dy *= -1;
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;

        // Draw cables from the upper crane carriage down to the platform ends
        ctx.save();
        ctx.strokeStyle = "rgba(71, 85, 105, 0.75)";
        ctx.lineWidth = 2;
        
        // Left rope
        ctx.beginPath();
        ctx.moveTo(x + 10, 0);
        ctx.lineTo(x + 10, y);
        ctx.stroke();

        // Right rope
        ctx.beginPath();
        ctx.moveTo(x + this.w - 10, 0);
        ctx.lineTo(x + this.w - 10, y);
        ctx.stroke();

        // Girder (High visibility safety yellow with black hazard stripes)
        ctx.fillStyle = "#ca8a04"; // Safety gold/yellow
        ctx.fillRect(x, y, this.w, this.h);

        // Black stripes detail
        ctx.fillStyle = "#1e293b"; // Dark slate
        for (let s = 10; s < this.w; s += 30) {
            ctx.beginPath();
            ctx.moveTo(x + s, y);
            ctx.lineTo(x + s + 15, y + this.h);
            ctx.lineTo(x + s + 5, y + this.h);
            ctx.lineTo(x + s - 10, y);
            ctx.closePath();
            ctx.fill();
        }

        // Heavy iron border framing
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, this.w, this.h);

        // Metal rivet accents
        ctx.fillStyle = "#94a3b8";
        for (let rx = 6; rx < this.w; rx += 25) {
            ctx.beginPath();
            ctx.arc(x + rx, y + this.h / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Label text on side of platform
        ctx.fillStyle = "#ffffff";
        ctx.font = "black 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(this.label, x + this.w / 2, y + this.h + 10);

        ctx.restore();
    }
}
