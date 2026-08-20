import { Enemy } from "./Enemy";

export class JackhammerOperator extends Enemy {
    public isDrilling = true;
    private stateTimer = 0;
    private drillAnim = 0;

    constructor(x: number, y: number) {
        super(x, y, 0, 0); // Stationary enemy, 0 range / 0 speed
        this.w = 40;
        this.h = 55;
    }

    update(platforms?: any[]) {
        this.stateTimer++;
        if (this.stateTimer > 90) { // Toggle drilling state every 90 frames
            this.isDrilling = !this.isDrilling;
            this.stateTimer = 0;
        }

        if (this.isDrilling) {
            this.drillAnim += 0.8;
            
            // Shake nearby metallic scaffolds/platforms
            if (platforms) {
                platforms.forEach(p => {
                    const dx = Math.abs(p.x - this.x);
                    const dy = Math.abs(p.y - this.y);
                    if (dx < 250 && dy < 150) {
                        p.isShaking = true;
                    }
                });
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;

        // Apply severe drilling physical shakiness to operator drawing
        if (this.isDrilling) {
            x += (Math.random() - 0.5) * 2.2;
            y += (Math.random() - 0.5) * 2.2;
        }

        ctx.save();

        // 1. Draw Legs
        ctx.fillStyle = "#2c3e50"; // Dark blue pants
        ctx.fillRect(x + 10, y + 36, 8, 19);
        ctx.fillRect(x + 22, y + 36, 8, 19);
        ctx.fillStyle = "black";
        ctx.fillRect(x + 8, y + 51, 11, 4);
        ctx.fillRect(x + 20, y + 51, 11, 4);

        // 2. Body (Vest and harness)
        ctx.fillStyle = "#2980b9"; // Shirt
        ctx.fillRect(x + 8, y + 15, 24, 22);
        ctx.fillStyle = "#e67e22"; // Orange vest
        ctx.fillRect(x + 8, y + 15, 7, 22);
        ctx.fillRect(x + 25, y + 15, 7, 22);
        ctx.fillRect(x + 8, y + 27, 24, 10);

        // Reflective yellow lines
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(x + 10, y + 15, 2, 22);
        ctx.fillRect(x + 28, y + 15, 2, 22);

        // 3. Head
        ctx.fillStyle = "#f1c27d";
        ctx.beginPath();
        ctx.arc(x + 20, y + 8, 9, 0, Math.PI * 2);
        ctx.fill();

        // Safety ear muffs
        ctx.fillStyle = "#34495e";
        ctx.fillRect(x + 9, y + 4, 3, 8);
        ctx.fillRect(x + 28, y + 4, 3, 8);
        ctx.strokeStyle = "#34495e";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + 20, y + 4, 10, Math.PI, 0);
        ctx.stroke();

        // Hard Hat
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.arc(x + 20, y + 7, 10, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x + 8, y + 5, 24, 3); // brim

        // 4. Heavy Heavy pneumatic jackhammer tool
        ctx.save();
        ctx.translate(x + 20, y + 24);
        
        ctx.fillStyle = "#7f8c8d"; // Iron body
        ctx.fillRect(-12, -2, 24, 5); // T-handle bar
        ctx.fillRect(-6, 3, 12, 18); // Hammer cylinder body
        ctx.fillStyle = "#34495e";
        ctx.fillRect(-3, 21, 6, 8); // Chuck latch

        // Shovel drill bit
        ctx.fillStyle = "#bdc3c7";
        ctx.fillRect(-1.5, 29, 3, 14); // Paving drill bit tip
        
        // Drilled earth debris sparks
        if (this.isDrilling) {
            ctx.fillStyle = "#d35400";
            const sparklePulse = Math.sin(this.drillAnim) * 5;
            ctx.fillRect(-12 - sparklePulse, 38 + (Math.random()*4), 3, 3);
            ctx.fillRect(10 + sparklePulse, 40 + (Math.random()*4), 4, 4);
            ctx.fillRect(-4 + sparklePulse, 35, 2, 2);
        }
        ctx.restore();

        // Drawing dynamic warning smoke or vibration waves
        if (this.isDrilling) {
            ctx.strokeStyle = "rgba(230, 126, 34, 0.5)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x + 20, y + 53, 20 + Math.sin(this.drillAnim) * 10, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "rgba(255, 63, 52, 0.7)";
            ctx.font = "bold 9px monospace";
            ctx.fillText("DRILLING!", x - 10, y - 10);
        }

        ctx.restore();
    }
}
