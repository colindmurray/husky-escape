import { Enemy } from "./Enemy";
import { FallingDebris } from "./FallingDebris";

export class Supervisor extends Enemy {
    private throwTimer = 0;
    private throwCooldown = 130 + Math.random() * 60; // cooldown in frames
    private yellTimer = 0;
    private yellText = "";

    constructor(x: number, y: number, patrolDist: number, speed = 1.3) {
        super(x, y, patrolDist, speed);
        this.w = 35;
        this.h = 55;
    }

    update(platforms?: any[], player?: any, enemies?: any[]) {
        if (!player || !enemies) {
            super.update();
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If player is within 380px, think about throwing blueprints!
        if (dist < 380) {
            this.throwTimer++;
            
            // Decelerate / pause to throw when ready
            if (this.throwTimer > this.throwCooldown - 25) {
                // Stand still while preparing to throw
                if (this.yellTimer === 0) {
                    this.yellTimer = 25;
                    const phrases = ["NO DOGS!", "STOP THERE!", "HEY!", "UNAUTHORIZED!", "GET OFF!"];
                    this.yellText = phrases[Math.floor(Math.random() * phrases.length)];
                }
                
                // Turn to face the player
                this.dir = dx > 0 ? 1 : -1;
            } else {
                // Otherwise do normal walking/patrolling
                super.update();
            }

            if (this.throwTimer >= this.throwCooldown) {
                // Spawn a thrown blueprint projectile!
                const pDir = dx > 0 ? 1 : -1;
                const projX = this.x + (pDir === 1 ? this.w : -10);
                const projY = this.y + 12;

                const blueprint = new FallingDebris(projX, projY, "blueprint");
                
                // Launch at player in parabolic arc
                const speedScale = 4.5;
                blueprint.velX = (dx / dist) * speedScale;
                blueprint.velY = -4.5; // upward launch momentum

                enemies.push(blueprint);

                // Reset throwing schedule
                this.throwTimer = 0;
                this.throwCooldown = 120 + Math.random() * 50;
            }
        } else {
            // Normal pacing patrol
            super.update();
            if (this.throwTimer > 0) this.throwTimer--;
        }

        if (this.yellTimer > 0) {
            this.yellTimer--;
        }
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

        // Body with Orange Safety Vest
        ctx.fillStyle = "#2980b9"; // Blue shirt
        ctx.fillRect(x + 6, y + 15, 23, 22);
        
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
        
        // Blueprints roll in arms
        ctx.save();
        
        // Modify arm stance if about to throw!
        const isPreparing = (this.throwTimer > this.throwCooldown - 25);
        if (isPreparing) {
            // Hand raised ready to slide pitch
            ctx.translate(x + 20, y + 10);
            ctx.rotate(-1.2 + Math.sin(Date.now() / 80) * 0.15); // raised back posture
        } else {
            ctx.translate(x + 17, y + 22);
            ctx.rotate(0.3 + Math.sin(this.walkAnim) * 0.1);
        }
        
        // Rolled blueprints
        ctx.fillStyle = "#3498db"; // Engineering light blue
        ctx.fillRect(2, 2, 18, 7);
        ctx.fillStyle = "white"; // Paper edge
        ctx.fillRect(20, 3, 2, 5);
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(5, 4, 12, 1);
        
        ctx.restore();

        ctx.restore();

        // Draw yelling visual bubble (always facing forward, non-flipped text)
        if (this.yellTimer > 0 && this.yellText) {
            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#e74c3c";
            ctx.lineWidth = 1.5;
            
            const bx = x - 20;
            const by = y - 32;
            const bw = 75;
            const bh = 18;
            
            // Draw Speech bubble box
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 5);
            ctx.fill();
            ctx.stroke();

            // Arrow pointing down from bubble to head
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#e74c3c";
            ctx.beginPath();
            ctx.moveTo(x + 12, by + bh);
            ctx.lineTo(x + 17, by + bh + 6);
            ctx.lineTo(x + 22, by + bh);
            ctx.fill();
            
            // Red warning text
            ctx.fillStyle = "#e74c3c";
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.yellText, bx + bw / 2, by + bh / 2);
            
            ctx.restore();
        }
    }
}
