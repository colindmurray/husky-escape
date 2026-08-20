import { Enemy } from "./Enemy";

export type DebrisType = "lunchbox" | "hardhat" | "wrench" | "bolt" | "blueprint";

export class FallingDebris extends Enemy {
    public debrisType: DebrisType;
    private rotation = 0;
    private spinSpeed = 0.08;

    constructor(x: number, y: number, debrisType?: DebrisType) {
        super(x, y, 0, 0); // Speed/patrol handled manually
        this.w = 20;
        this.h = 20;
        
        const types: DebrisType[] = ["lunchbox", "hardhat", "wrench", "bolt", "blueprint"];
        this.debrisType = debrisType || types[Math.floor(Math.random() * types.length)];
        
        this.velY = 1.5; // Initial fall rate
        this.spinSpeed = 0.04 + Math.random() * 0.08;
    }

    update(platforms?: any[]) {
        // Accelerate downwards under gravity
        this.velY += 0.15;
        this.x += this.velX;
        this.y += this.velY;
        this.rotation += this.spinSpeed;

        // Eliminate if off-screen bottom
        if (this.y > 1000) {
            this.markedForDeletion = true;
            return;
        }

        // Test collision with platforms (deletes if impacts a standard girder)
        if (platforms) {
            platforms.forEach(p => {
                if (p.x < this.x + this.w && p.x + p.w > this.x &&
                    p.y < this.y + this.h && p.y + p.h > this.y
                ) {
                    // Shattered!
                    this.markedForDeletion = true;
                }
            });
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX + this.w / 2;
        const y = this.y + this.h / 2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);

        if (this.debrisType === "lunchbox") {
            // Blue overall lunch container / tin box
            ctx.fillStyle = "#2c3e50";
            ctx.fillRect(-10, -5, 20, 12);
            // Handle
            ctx.strokeStyle = "#7f8c8d";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -5, 6, Math.PI, 0);
            ctx.stroke();
            // Latches
            ctx.fillStyle = "#f1c40f";
            ctx.fillRect(-5, -2, 2, 4);
            ctx.fillRect(3, -2, 2, 4);
        } else if (this.debrisType === "hardhat") {
            // Orange protective helmet dome
            ctx.fillStyle = "#e67e22";
            ctx.beginPath();
            ctx.arc(0, 2, 8, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(-11, 2, 22, 2.5); // Brim
            ctx.fillStyle = "#d35400"; // Top ridge
            ctx.fillRect(-2, -6, 4, 8);
        } else if (this.debrisType === "wrench") {
            // Cast iron double-end wrench
            ctx.strokeStyle = "#bdc3c7";
            ctx.lineWidth = 3.5;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(-10, -5);
            ctx.lineTo(10, 5);
            ctx.stroke();
            
            // Jaws
            ctx.fillStyle = "#bdc3c7";
            ctx.beginPath();
            ctx.arc(-10, -5, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(-10, -5, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.debrisType === "bolt") {
            // Steel threaded Hex bolt
            ctx.fillStyle = "#7f8c8d";
            ctx.fillRect(-4, -6, 8, 4); // Bolt head
            ctx.fillStyle = "#95a5a6";
            ctx.fillRect(-2, -2, 4, 10); // Screw shaft
            // Thread grooves
            ctx.fillStyle = "#555";
            ctx.fillRect(-2, 1, 4, 1.2);
            ctx.fillRect(-2, 4, 4, 1.2);
            ctx.fillRect(-2, 7, 4, 1.2);
        } else {
            // Blueprint rolled scroll
            // Engineering blue paper cylinder
            ctx.fillStyle = "#3498db";
            ctx.fillRect(-12, -4, 24, 8);
            // White ends (the paper rolled up)
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-14, -3, 2, 6);
            ctx.fillRect(12, -3, 2, 6);
            // Blueprint sketch lines on rolled paper
            ctx.strokeStyle = "rgba(255,255,255,0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-6, -1);
            ctx.lineTo(6, -1);
            ctx.moveTo(-4, 1);
            ctx.lineTo(4, 1);
            ctx.stroke();
            // Tie string in the middle
            ctx.fillStyle = "#e74c3c"; // Red rubber band/ribbon
            ctx.fillRect(-1.5, -4.5, 3, 9);
        }

        ctx.restore();
    }
}
