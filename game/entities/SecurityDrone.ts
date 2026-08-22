
import { Enemy } from "./Enemy";
import { Entity } from "./Entity";
import { audioManager } from "../Audio";
import { SoundType } from "../../types";
import { gfxSettings } from "../GfxSettings";
import { drawSecurityDroneNeon } from "../engine/enhanced/EnhancedSprites";

/**
 * Zone 11 security drone. Hovers on a horizontal patrol with a bobbing sine,
 * sweeping a red scan cone beneath it.
 *
 * AI is a three-state leash loop:
 *   PATROL — sweeps its beat until Onyx enters the detection cone.
 *   CHASE  — aggressive 2-axis pursuit (faster than patrol, but always a bit
 *            slower than Onyx's top speed, so a full sprint escapes it). It
 *            gives up as soon as Onyx leaves the leash radius around the
 *            drone's SPAWN point.
 *   RETURN — flies back home to its spawn, ignoring everything unless Onyx
 *            practically bumps into it, then resumes patrolling.
 */
export class SecurityDrone extends Enemy {
    public origY: number;
    public alertTimer = 0;
    private alertCooldown = 0;

    private state: 'patrol' | 'chase' | 'return' = 'patrol';
    /** Pursuit speed. Player tops out at 3.5 px/frame — this stays below it. */
    private readonly chaseSpeed: number;
    /** Chase gives up when Onyx gets this far from the drone's spawn point. */
    private readonly leashRange = 520;
    /** While flying home, only re-detects Onyx this close. */
    private readonly returnDetectRange = 110;

    constructor(x: number, y: number, patrolDist: number, aggression: number = 1) {
        super(x, y, patrolDist, 1.5);
        this.w = 46;
        this.h = 26;
        this.origY = y;
        // Chase speed scales with difficulty as a fraction of Onyx's top
        // running speed (3.5 px/frame): EASY ~30% (slow, easy shake), HARD
        // ~70% (pressuring but still outrunnable).
        const PLAYER_MAX_SPEED = 3.5;
        const norm = Math.max(0, Math.min(1, (aggression - 0.55) / 0.45));
        this.chaseSpeed = PLAYER_MAX_SPEED * (0.30 + 0.40 * norm);
        this.detectRange = 250 * aggression;
    }

    public detectRange = 250;

    update(platforms?: Entity[], player?: Entity) {
        if (this.alertCooldown > 0) this.alertCooldown--;

        if (this.state === 'patrol') {
            // Sweep the beat
            this.x += this.speed * this.dir;
            if (Math.abs(this.x - this.origX) > this.patrolDist) {
                this.dir *= -1;
            }
            // Hover bob
            this.y = this.origY + Math.sin(Date.now() / 620 + this.origX * 0.01) * 13;
            if (this.alertTimer > 0) this.alertTimer--;
            this.walkAnim += 0.12;

            // Detection cone
            if (player && this.alertCooldown <= 0 && !player.markedForDeletion) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                if (Math.abs(dx) < this.detectRange && dy > -40 && dy < 150) {
                    this.state = 'chase';
                    this.alertTimer = 100000; // stays hot while chasing
                    this.dir = Math.sign(dx) || this.dir;
                    audioManager.playSFX(SoundType.DRONE_ALERT);
                }
            }
            return;
        }

        if (this.state === 'chase') {
            this.walkAnim += 0.3;
            if (!player || player.markedForDeletion) {
                this.giveUp();
                return;
            }
            const px = player.x + player.w / 2;
            const py = player.y + player.h / 2;
            const dx = px - (this.x + this.w / 2);
            const dy = py - (this.y + this.h / 2);

            // Leash: too far from spawn -> shake him off and go home
            if (Math.hypot(player.x - this.origX, player.y - this.origY) > this.leashRange) {
                this.giveUp();
                return;
            }

            const d = Math.hypot(dx, dy);
            if (d > 4) {
                const sp = Math.min(this.chaseSpeed, d);
                this.x += (dx / d) * sp;
                this.y += (dy / d) * sp;
            }
            this.dir = Math.sign(dx) || this.dir;
            return;
        }

        // RETURN: fly home; only notices Onyx right under its nose
        this.walkAnim += 0.18;
        const dx = this.origX - this.x;
        const dy = this.origY - this.y;
        const d = Math.hypot(dx, dy);
        if (d < 6) {
            this.x = this.origX;
            this.y = this.origY;
            this.state = 'patrol';
            this.alertTimer = 0;
            this.alertCooldown = 180; // brief scan-recalibration before spotting again
        } else {
            const sp = Math.min(2.2, d);
            this.x += (dx / d) * sp;
            this.y += (dy / d) * sp;
            this.dir = Math.sign(dx) || this.dir;
            if (this.alertTimer > 0) this.alertTimer--;
            if (player && !player.markedForDeletion && this.alertCooldown <= 0 &&
                Math.hypot(player.x - this.x, player.y - this.y) < this.returnDetectRange) {
                this.state = 'chase';
                audioManager.playSFX(SoundType.DRONE_ALERT);
            }
        }
    }

    private giveUp() {
        this.state = 'return';
        this.alertCooldown = 140;
        if (this.alertTimer > 60) this.alertTimer = 40; // blink down, don't flash forever
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
