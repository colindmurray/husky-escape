
import { Platform } from "./Platform";
import { Entity } from "./Entity";
import { audioManager } from "../Audio";
import { SoundType } from "../../types";
import { gfxSettings } from "../GfxSettings";

/**
 * Neon dash pad: a glowing strip set into the rooftop that launches Onyx
 * forward at high speed when he lands on it (mirrors the SkiJump idiom).
 * `padDir` is the launch direction: 1 = right, -1 = left.
 */
export class BoostPad extends Platform {
    constructor(x: number, y: number, public padDir: 1 | -1 = 1, w: number = 90) {
        super(x, y, w, 14);
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;
        const t = Date.now() / 1000;

        if (gfxSettings.visualMode === 'enhanced') {
            // Neon strip with flowing arrows
            const glow = 0.5 + 0.5 * Math.sin(t * 5);
            ctx.save();
            ctx.fillStyle = '#141824';
            ctx.beginPath();
            ctx.roundRect(x - 3, y - 3, this.w + 6, this.h + 6, 5);
            ctx.fill();
            // Neon edge
            ctx.strokeStyle = `rgba(80,240,220,${0.65 + glow * 0.35})`;
            ctx.lineWidth = 2.4;
            ctx.stroke();
            // Glow halo
            ctx.globalCompositeOperation = 'screen';
            const g = ctx.createLinearGradient(x, y - 16, x, y + this.h);
            g.addColorStop(0, `rgba(80,240,220,${0.22 * (0.6 + glow * 0.4)})`);
            g.addColorStop(1, 'rgba(80,240,220,0)');
            ctx.fillStyle = g;
            ctx.fillRect(x, y - 16, this.w, 30);
            // Flowing chevrons
            const phase = (t * 70) % 26;
            ctx.strokeStyle = 'rgba(200,255,245,0.9)';
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            for (let d = phase; d < this.w - 10; d += 26) {
                const axp = x + (this.padDir === 1 ? d : this.w - d);
                const mid = y + this.h / 2;
                ctx.beginPath();
                ctx.moveTo(axp - this.padDir * 4, mid - 4.4);
                ctx.lineTo(axp + this.padDir * 4, mid);
                ctx.lineTo(axp - this.padDir * 4, mid + 4.4);
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        // ---- Classic look ----
        ctx.fillStyle = "#34495e";
        ctx.fillRect(x, y, this.w, this.h);
        ctx.fillStyle = "#1abc9c";
        for (let i = 6; i < this.w - 12; i += 18) {
            const axp = x + (this.padDir === 1 ? i : this.w - i);
            ctx.beginPath();
            ctx.moveTo(axp, y + 2);
            ctx.lineTo(axp + this.padDir * 7, y + this.h / 2);
            ctx.lineTo(axp, y + this.h - 2);
            ctx.closePath();
            ctx.fill();
        }
    }
}

/**
 * Decorative roof cat. Sits on a ledge with a swaying tail and blinking eyes;
 * gives a small "meow" (with cooldown) when Onyx runs past. Purely cosmetic.
 */
export class RoofCat extends Entity {
    private meowCooldown = 120;

    constructor(x: number, y: number) {
        super(x, y, 34, 22, '#1a1a24');
    }

    update(player?: { x: number }) {
        if (this.meowCooldown > 0) {
            this.meowCooldown--;
            return;
        }
        if (player && Math.abs(player.x - this.x) < 160) {
            this.meowCooldown = 420; // ~7 s between meows
            audioManager.playSFX(SoundType.MEOW);
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;
        const t = Date.now() / 1000;

        const bodyCol = gfxSettings.visualMode === 'enhanced' ? '#232838' : '#1a1a24';
        ctx.save();

        // Sitting cat silhouette
        ctx.fillStyle = bodyCol;
        // Haunch + torso leaning forward
        ctx.beginPath();
        ctx.ellipse(x + 13, y + 13, 10, 9, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x + 3, y + 13, 20, 9);
        // Front legs
        ctx.fillRect(x + 19, y + 8, 4, 14);
        // Head
        ctx.beginPath();
        ctx.arc(x + 25, y + 6, 6.4, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.beginPath();
        ctx.moveTo(x + 20.4, y + 2); ctx.lineTo(x + 21.4, y - 5); ctx.lineTo(x + 25.4, y + 0.4); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 25, y + 0.4); ctx.lineTo(x + 28.4, y - 5.4); ctx.lineTo(x + 30.4, y + 2); ctx.closePath(); ctx.fill();
        // Swaying tail wrapped around the front
        ctx.strokeStyle = bodyCol;
        ctx.lineWidth = 3.4;
        ctx.lineCap = 'round';
        const sway = Math.sin(t * 1.8) * 3;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 20);
        ctx.quadraticCurveTo(x - 4, y + 18 + sway * 0.3, x + 2 + sway * 0.4, y + 12 + sway * 0.6);
        ctx.stroke();

        // Eyes: blink occasionally; glint in enhanced mode
        const blink = (t * 0.7 + x * 0.01) % 3 < 0.12;
        if (!blink) {
            if (gfxSettings.visualMode === 'enhanced') {
                ctx.fillStyle = 'rgba(140,240,220,0.95)';
                ctx.beginPath();
                ctx.ellipse(x + 23.4, y + 5.4, 1.7, 2.2, 0, 0, Math.PI * 2);
                ctx.ellipse(x + 27.4, y + 5.4, 1.7, 2.2, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#cfe3d8';
                ctx.fillRect(x + 22.4, y + 4.4, 2, 2);
                ctx.fillRect(x + 26.4, y + 4.4, 2, 2);
            }
        }
        ctx.restore();
    }
}

