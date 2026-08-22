
import { Enemy } from "./Enemy";
import { Entity } from "./Entity";
import { audioManager } from "../Audio";
import { SoundType } from "../../types";
import { gfxSettings } from "../GfxSettings";
import { drawSecurityDroneNeon } from "../engine/enhanced/EnhancedSprites";

/**
 * Zone 11 security drone. Hovers on a horizontal patrol with a bobbing sine,
 * sweeping a red scan cone beneath it. If Onyx strays into its detection zone
 * the drone chirps an alarm and bursts toward him for a short pursuit before
 * giving up and returning to patrol speed.
 */
export class SecurityDrone extends Enemy {
    public origY: number;
    public alertTimer = 0;
    private alertCooldown = 0;
    private baseSpeed: number;

    constructor(x: number, y: number, patrolDist: number, aggression: number = 1) {
        super(x, y, patrolDist, 1.5);
        this.w = 46;
        this.h = 26;
        this.origY = y;
        // Gentler pursuit on lower difficulties
        this.baseSpeed = this.speed * aggression;
        this.detectRange = 250 * aggression;
    }

    public detectRange = 250;

    update(platforms?: Entity[], player?: Entity) {
        // Patrol
        this.x += this.speed * this.dir;
        if (Math.abs(this.x - this.origX) > this.patrolDist) {
            this.dir *= -1;
        }
        // Hover bob
        this.y = this.origY + Math.sin(Date.now() / 620 + this.origX * 0.01) * 13;
        this.walkAnim += this.alertTimer > 0 ? 0.3 : 0.12;

        // Detection + pursuit burst
        if (this.alertCooldown > 0) this.alertCooldown--;
        if (this.alertTimer > 0) {
            this.alertTimer--;
            if (player) {
                this.x += Math.sign(player.x - this.x) * this.baseSpeed * 0.85;
                if (Math.abs(player.x - this.x) > 520) this.alertTimer = 0;
            }
        } else if (player && this.alertCooldown <= 0 && !player.markedForDeletion) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            if (Math.abs(dx) < this.detectRange && dy > -40 && dy < 150) {
                this.alertTimer = 100;
                this.dir = Math.sign(dx) || this.dir;
                this.alertCooldown = 260;
                audioManager.playSFX(SoundType.DRONE_ALERT);
            }
        }

        // Face travel direction
        if (this.speed !== 0) this.dir = this.dir;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;
        const t = Date.now() / 1000;

        ctx.save();

        if (gfxSettings.visualMode === 'enhanced') {
            drawSecurityDroneNeon(ctx, x, y, this.w, this.h, t, this.alertTimer > 0, this.dir);
            ctx.restore();
            return;
        }

        // ---- Classic look: flat grey body, rotor line, blinking red light ----
        // Rotor
        const blade = Math.sin(t * 30) * 16;
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x + this.w / 2 - blade, y - 5);
        ctx.lineTo(x + this.w / 2 + blade, y - 5);
        ctx.stroke();
        ctx.fillRect(x + this.w / 2 - 2, y - 6, 4, 6);

        // Body
        ctx.fillStyle = "#7f8c8d";
        ctx.beginPath();
        ctx.roundRect(x, y, this.w, this.h - 8, 8);
        ctx.fill();
        ctx.fillStyle = "#2c3e50";
        ctx.beginPath();
        ctx.arc(x + this.w / 2 + this.dir * 6, y + 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#95a5a6";
        ctx.fillRect(x + 4, y + this.h - 14, this.w - 8, 3);

        // Blinking scanning light
        const blink = this.alertTimer > 0 ? Math.floor(t * 12) % 2 === 0 : Math.floor(t * 3) % 2 === 0;
        ctx.fillStyle = blink ? "#e74c3c" : "#5b1f18";
        ctx.beginPath();
        ctx.arc(x + this.w / 2, y + this.h - 6, 3.4, 0, Math.PI * 2);
        ctx.fill();
        // Scan cone hint
        if (blink) {
            ctx.fillStyle = "rgba(231, 76, 60, 0.15)";
            ctx.beginPath();
            ctx.moveTo(x + this.w / 2, y + this.h - 6);
            ctx.lineTo(x + this.w / 2 - 22, y + this.h + 42);
            ctx.lineTo(x + this.w / 2 + 22, y + this.h + 42);
            ctx.closePath();
            ctx.fill();
        }
        // Alert marker
        if (this.alertTimer > 0 && blink) {
            ctx.fillStyle = "#e74c3c";
            ctx.font = "bold 12px Arial";
            ctx.fillText("!", x + this.w / 2 - 3, y - 10);
        }

        ctx.restore();
    }
}
