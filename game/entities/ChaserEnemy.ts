
import { Entity, GRAVITY } from "./Entity";
import { Enemy } from "./Enemy"; 
import { SimpleChaserAI } from "../ai/index";
import { Player } from "./Player";
import { Porcupine } from "./Porcupine";

export class ChaserEnemy extends Enemy {
    // Player max speed is approx 2.8
    // Increased by 30% from 2.5 to 3.25 to make the chase more intense
    public speed = 3.25; 
    public grounded = false;
    public velY = 0;
    public velX = 0;
    
    // Stun Logic
    private stunTimer = 0;
    private stunCooldown = 0;

    // Respawn Logic
    private respawnTimer = 0;

    private ai: SimpleChaserAI;

    constructor(x: number, y: number) {
        super(x, y, 0, 0); 
        this.ai = new SimpleChaserAI();
    }

    update(platforms?: Entity[], player?: Player, enemies?: Entity[]) {
        // Handle Respawn Timer
        if (this.respawnTimer > 0) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0 && player) {
                 this.x = player.x - 500;
                 this.y = player.y - 200;
                 this.velY = 0;
                 this.velX = 0;
            }
            return;
        }

        // Handle Stun State
        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.velX = 0;
            // Visual shake or color change handled in draw?
            if (this.stunTimer <= 0) {
                this.stunCooldown = 120; // 2 seconds invincibility after stun
            }
            // Apply gravity even while stunned
            this.velY += GRAVITY;
            this.y += this.velY;
            // Simple ground check for stun falling
            if (platforms) {
                platforms.forEach(platform => {
                     if (this.colCheck(platform) === 'b') {
                         this.grounded = true;
                         this.velY = 0;
                     }
                });
            }
            // If stunned and falling
            if (this.y > 3000) {
                this.respawnTimer = 120;
            }
            return;
        }

        if (this.stunCooldown > 0) {
            this.stunCooldown--;
        }

        // Apply AI Logic
        if (platforms) {
            this.ai.update(this, player || null, platforms, enemies);
        }

        // Apply Physics
        this.x += this.velX;
        
        // Gravity
        this.velY += GRAVITY;
        this.y += this.velY;
        this.grounded = false;

        this.walkAnim += Math.abs(this.velX) * 0.1;

        // Collision Check
        if (platforms) {
            platforms.forEach(platform => {
                const dir = this.colCheck(platform);
                if (dir === "l" || dir === "r") {
                    this.velX = 0; 
                } else if (dir === "b") {
                    this.grounded = true;
                    this.velY = 0;
                } else if (dir === "t") {
                    this.velY *= -1;
                }
            });
        }
        
        // Collision with Hazards (Porcupines)
        if (enemies && this.stunCooldown <= 0) {
            enemies.forEach(e => {
                if (e instanceof Porcupine) {
                    // Simple box collision check since colCheck moves us
                    // We just want to detect overlapping
                    if (this.x < e.x + e.w &&
                        this.x + this.w > e.x &&
                        this.y < e.y + e.h &&
                        this.y + this.h > e.y) {
                            // Get stunned!
                            this.stunTimer = 60; // 1 second (approx 60 frames)
                            this.velY = -5; // Small hop from pain
                            this.velX = -this.velX; // Bounce back
                    }
                }
            });
        }

        // Respawn / Fall Logic
        if (this.y > 3000) {
            this.respawnTimer = 120; // 2 seconds at 60fps
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.respawnTimer > 0) return;

        // Draw normal enemy
        super.draw(ctx, camX);
        
        // Draw Stun Effect
        if (this.stunTimer > 0) {
            const x = this.x - camX + this.w/2;
            const y = this.y - 10;
            ctx.fillStyle = "yellow";
            ctx.font = "20px Arial";
            ctx.fillText(this.stunTimer % 20 < 10 ? "★" : "☆", x - 5, y);
            ctx.fillText(this.stunTimer % 20 > 10 ? "★" : "☆", x + 5, y - 5);
            ctx.fillText(this.stunTimer % 20 < 10 ? "★" : "☆", x, y - 10);
        }
    }
}
