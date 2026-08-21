import { Enemy } from "./Enemy";
import { gfxSettings } from "../GfxSettings";
import { drawWorkerPolish } from "../engine/enhanced/EnhancedSprites";

import { FallingDebris } from "./FallingDebris";

export class LunchboxThrower extends Enemy {
    private throwCooldown = 0;
    private maxCooldown = 150; // Every 2.5 seconds

    constructor(x: number, y: number, cooldown = 150) {
        super(x, y, 0, 0); // Stationary, no movement
        this.w = 35;
        this.h = 55;
        this.maxCooldown = cooldown;
        this.throwCooldown = 30 + Math.random() * 45; // Stagger initial throws
    }

    update(platforms?: any[], player?: any, enemies?: any[]) {
        if (!enemies) return;

        this.throwCooldown--;
        if (this.throwCooldown <= 0) {
            this.throwCooldown = this.maxCooldown;
            
            // Add a piece of falling debris right underneath us
            const debris = new FallingDebris(this.x + this.w / 2 - 10, this.y + this.h);
            enemies.push(debris);
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        let x = this.x - camX;
        let y = this.y;

        ctx.save();

        // Leg scaffolding standing pose
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x + 10, y + 36, 8, 19);
        ctx.fillRect(x + 18, y + 36, 8, 19);
        ctx.fillStyle = "black";
        ctx.fillRect(x + 8, y + 51, 11, 4);
        ctx.fillRect(x + 16, y + 51, 11, 4);

        // Body (High visibility fluorescent green/yellow vest)
        ctx.fillStyle = "#1abc9c"; // Cyan shirt
        ctx.fillRect(x + 6, y + 15, 23, 22);
        
        ctx.fillStyle = "#2ecc71"; // Hi-vis green vest
        ctx.fillRect(x + 6, y + 15, 6, 22);
        ctx.fillRect(x + 23, y + 15, 6, 22);
        ctx.fillRect(x + 6, y + 27, 23, 10);
        
        // Silver reflective ribbons
        ctx.fillStyle = "#ecf0f1";
        ctx.fillRect(x + 8, y + 15, 2, 22);
        ctx.fillRect(x + 25, y + 15, 2, 22);

        // Head
        ctx.fillStyle = "#f1c27d";
        ctx.beginPath();
        ctx.arc(x + 17, y + 8, 9, 0, Math.PI*2);
        ctx.fill();

        // Safety Hard Hat (White color for foreman/thrower)
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x + 17, y + 7, 10, Math.PI, 0); 
        ctx.fill();
        ctx.fillRect(x + 5, y + 5, 24, 3); // Brim
        ctx.fillStyle = "#bdc3c7";
        ctx.fillRect(x + 15, y - 1, 4, 8);

        // Face Details
        ctx.fillStyle = "#333";
        ctx.fillRect(x + 14, y + 7, 2, 3); // Eye
        
        // Throwing animation helper
        if (this.throwCooldown < 15) {
            // Hand holding a projectile upwards ready to launch!
            ctx.fillStyle = "#f1c27d";
            ctx.fillRect(x + 25, y + 8, 7, 7);
            ctx.fillStyle = "#bdc3c7"; // Wrench or lunch box peak
            ctx.fillRect(x + 24, y + 2, 9, 5);
        } else {
            // Hanging arms
            ctx.fillStyle = "#f1c27d";
            ctx.fillRect(x + 24, y + 22, 5, 12);
        }

        if (gfxSettings.visualMode === 'enhanced') {
            drawWorkerPolish(ctx, x, y, this.w, this.h, '#ffffff');
        }

        ctx.restore();
    }
}
