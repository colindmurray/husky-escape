import { Enemy } from "./Enemy";

export class WreckingBall extends Enemy {
    private angle = 0;

    constructor(
        public pivotX: number,
        public pivotY: number,
        public length: number,
        public maxAngleDeg = 45,
        public swingSpeed = 1.6
    ) {
        // Simple initialization, update() will set exact coordinates
        super(pivotX, pivotY + length, 0, 0);
        this.w = 45;
        this.h = 45;
    }

    update() {
        const time = Date.now() / 1000;
        const maxAngleRad = (this.maxAngleDeg * Math.PI) / 180;
        this.angle = maxAngleRad * Math.sin(time * this.swingSpeed);

        // Update physical coordinate matches based on pendulum trigonometry
        this.x = this.pivotX + Math.sin(this.angle) * this.length - this.w / 2;
        this.y = this.pivotY + Math.cos(this.angle) * this.length - this.h / 2;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const px = this.pivotX - camX;
        const py = this.pivotY;
        const bx = this.x - camX + this.w / 2;
        const by = this.y + this.h / 2;

        ctx.save();

        // 1. Draw Anchor Point
        ctx.fillStyle = "#34495e";
        ctx.fillRect(px - 15, py - 5, 30, 10);
        ctx.strokeStyle = "#1e272e";
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 15, py - 5, 30, 10);

        // 2. Draw Wire/Chain
        ctx.strokeStyle = "#7f8c8d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(bx, by);
        ctx.stroke();

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Draw Wrecking Ball Metallic Sphere with lighting gradients
        const grad = ctx.createRadialGradient(bx - 8, by - 8, 4, bx, by, 22);
        grad.addColorStop(0, "#cbd5e1");
        grad.addColorStop(0.5, "#475569");
        grad.addColorStop(1, "#0f172a");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, by, 22, 0, Math.PI * 2);
        ctx.stroke();

        // Overlay caution colors
        ctx.fillStyle = "#eab308";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚠️", bx, by);

        ctx.restore();
    }
}
