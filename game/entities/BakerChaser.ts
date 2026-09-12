import { Entity, GRAVITY } from "./Entity";
import { Enemy } from "./Enemy";
import { Player } from "./Player";
import { gfxSettings } from "../GfxSettings";
import { drawBakerPolish } from "../engine/enhanced/BakerySprites";

/**
 * Apprentice Baker: the "SPOTTED!" moment halfway through the bakery. Once
 * Onyx passes him he gives chase on foot — slower than Onyx's top speed, so
 * a steady sprint shakes him, but stopping to grab bones lets him catch up.
 * Simple pursuit AI with platformer gravity (no pathfinding, leashes by
 * falling behind and teleporting back like the pound chasers).
 */
export class BakerChaser extends Enemy {
    public velX = 0;
    public velY = 0;
    public grounded = false;
    private spotted = false;
    private spotX: number;

    constructor(x: number, y: number, speed = 2.2) {
        super(x, y, 0, speed);
        this.w = 32;
        this.h = 52;
        this.spotX = x;
    }

    public get hasSpotted() {
        return this.spotted;
    }

    update(platforms?: Entity[], player?: Player) {
        const p = player as Player | undefined;
        if (!p || p.markedForDeletion) return;

        // Wake up once Onyx runs past
        if (!this.spotted) {
            if (p.x > this.spotX - 40) this.spotted = true;
            else {
                this.walkAnim += 0.05; // idle sway
                this.applyPhysics(platforms);
                return;
            }
        }

        // Run toward the player, but never faster than configured speed
        const dir = Math.sign(p.x - this.x) || 1;
        this.dir = dir;
        this.velX = dir * this.speed;
        this.walkAnim += Math.abs(this.velX) * 0.12;

        this.applyPhysics(platforms);

        // Fell into a vat / off the world: pop back behind Onyx and keep coming
        if (this.y > 2500) {
            this.x = p.x - 450 * dir;
            this.y = p.y - 150;
            this.velX = 0;
            this.velY = 0;
        }
    }

    private applyPhysics(platforms?: Entity[]) {
        this.x += this.velX;
        this.velY += GRAVITY;
        this.y += this.velY;
        this.grounded = false;
        if (platforms) {
            for (const platform of platforms) {
                const dir = this.colCheck(platform);
                if (dir === 'l' || dir === 'r') this.velX = 0;
                else if (dir === 'b') {
                    this.grounded = true;
                    this.velY = 0;
                } else if (dir === 't') this.velY *= -1;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;

        if (gfxSettings.visualMode === 'enhanced') {
            drawBakerPolish(ctx, x, y, this.w, this.h, this.walkAnim, this.dir, false);
            // "!" alert while unspotted and Onyx is near is drawn by World? No —
            // draw it here cheaply based on proximity is impossible without player.
            // The spotted roar is announced by level design (SFX at trigger).
            return;
        }

        ctx.save();
        if (this.dir === -1) {
            ctx.translate(x + this.w / 2, y);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.w / 2), -y);
        }

        const legSwing = this.spotted ? Math.sin(this.walkAnim) * 5 : 0;
        // Legs
        ctx.fillStyle = "#34495e";
        ctx.fillRect(x + 9 + legSwing, y + 36, 7, 14);
        ctx.fillRect(x + 16 - legSwing, y + 36, 7, 14);
        // Shoes
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(x + 7 + legSwing, y + 48, 11, 4);
        ctx.fillRect(x + 14 - legSwing, y + 48, 11, 4);
        // Apron body
        ctx.fillStyle = "#ecf0f1";
        ctx.fillRect(x + 5, y + 16, 22, 22);
        ctx.fillStyle = "#b03a2e"; // neckerchief
        ctx.fillRect(x + 12, y + 16, 8, 5);
        // Arms pumping
        ctx.fillStyle = "#f1c27d";
        ctx.fillRect(x + 1, y + 20 - legSwing * 0.6, 5, 12);
        ctx.fillRect(x + 26, y + 20 + legSwing * 0.6, 5, 12);
        // Head
        ctx.fillStyle = "#f1c27d";
        ctx.beginPath();
        ctx.arc(x + 16, y + 9, 8, 0, Math.PI * 2);
        ctx.fill();
        // Tall chef hat
        ctx.fillStyle = "white";
        ctx.fillRect(x + 7, y - 6, 18, 10);
        ctx.beginPath();
        ctx.arc(x + 16, y - 6, 10, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#bdc3c7";
        ctx.fillRect(x + 7, y + 3, 18, 2);
        // Angry eyes + moustache (he means business)
        ctx.fillStyle = "#222";
        ctx.fillRect(x + 18, y + 7, 3, 3);
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(x + 17, y + 13, 8, 2);

        ctx.restore();

        // Unspotted "Zzz" — he dozes until you pass
        if (!this.spotted) {
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.font = "bold 13px Arial";
            const bob = Math.sin(Date.now() / 400) * 3;
            ctx.fillText("Z", x + this.w + 4, y - 4 + bob);
        }
    }
}
