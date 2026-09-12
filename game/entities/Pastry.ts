import { Entity, GRAVITY } from "./Entity";
import { ConveyorBelt } from "./ConveyorBelt";
import { Water } from "./Water";
import { gfxSettings } from "../GfxSettings";

export type PastryKind = 'cupcake' | 'layercake';

/**
 * Falling bakery pastry. Drops from the ceiling, lands on a conveyor belt,
 * rides it to the downhill edge, then tumbles to the tier below — cascading
 * all the way down to the main belt (or into an oven, where it respawns).
 *
 * This is Snowball physics with a second state: FALLING (gravity) vs RIDING
 * (locked to a belt, moving at belt speed). Pastries only ever RIDE belts;
 * landing on static rock makes them splat and respawn at their spawner.
 *
 * Boss-thrown pastries (`thrown = true`) skip riding entirely and shatter on
 * the first platform they touch.
 */
export class Pastry extends Entity {
    public origX: number;
    public origY: number;
    public kind: PastryKind;
    public thrown = false;

    private riding: ConveyorBelt | null = null;
    private respawnTimer = 0;
    private shadowT = 0; // telegraph shimmer while falling
    private targetPlatformY: number | null = null;

    constructor(x: number, y: number, kind: PastryKind = 'cupcake', spawnDelay: number = 0) {
        const w = kind === 'cupcake' ? 26 : 58;
        const h = kind === 'cupcake' ? 26 : 38;
        super(x, y, w, h, '#f5d0a9');
        this.origX = x;
        this.origY = y;
        this.kind = kind;
        this.respawnTimer = spawnDelay;
        if (spawnDelay > 0) {
            this.y = 5000;
        }
    }

    /** Boss toss: fling toward the player in an arc, shatter on landing. */
    public toss(x: number, y: number, velX: number) {
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = -7;
        this.thrown = true;
        this.riding = null;
    }

    update(platforms?: Entity[], _player?: any, _enemies?: any[], waters?: any[]) {
        // Respawning: invisible countdown, then back to the spawner
        if (this.respawnTimer > 0) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) this.reset();
            return;
        }

        const checkWater = () => {
            if (!waters) return false;
            for (const w of waters) {
                if (this.x + this.w > w.x && this.x < w.x + w.w &&
                    this.y + this.h > w.y + 10 && this.y < w.y + w.h) {
                    this.splat();
                    return true;
                }
            }
            return false;
        };

        if (this.riding) {
            const belt = this.riding;
            // Still over the belt? Otherwise drop off the edge.
            const overBelt =
                this.x + this.w > belt.x + 2 && this.x < belt.x + belt.w - 2;
            if (overBelt) {
                this.x += belt.beltSpeed;
                this.y = belt.y - this.h;
                this.velY = 0;
                if (checkWater()) return;
                return;
            }
            // Rolled off the edge Donkey Kong barrel style: small forward push, drops down
            this.velX = Math.sign(belt.beltSpeed) * Math.min(Math.abs(belt.beltSpeed) * 0.45, 0.75);
            this.velY = 0.5;
            this.riding = null;
        }

        this.velY += GRAVITY;
        this.x += this.velX;
        this.y += this.velY;
        this.velX *= 0.95;
        this.shadowT += 0.1;

        if (checkWater()) return;

        // Find platform landing target for telegraphing
        this.targetPlatformY = null;
        if (platforms && !this.riding) {
            let bestY = 99999;
            const midX = this.x + this.w / 2;
            for (const p of platforms) {
                if (midX >= p.x && midX <= p.x + p.w && p.y >= this.y + this.h - 5) {
                    if (p.y < bestY) bestY = p.y;
                }
            }
            if (bestY < 99999) this.targetPlatformY = bestY;
        }

        if (platforms && this.velY > 0) {
            for (const p of platforms) {
                const prevBottom = this.y + this.h - this.velY;
                const currBottom = this.y + this.h;
                // If bottom crosses the platform top surface during this frame
                if (prevBottom <= p.y + 12 && currBottom >= p.y) {
                    // Check horizontal overlap
                    if (this.x + this.w > p.x + 2 && this.x < p.x + p.w - 2) {
                        if (this.thrown) {
                            this.markedForDeletion = true;
                            return;
                        }
                        this.y = p.y - this.h;
                        this.velY = 0;
                        this.velX = 0;
                        if (p instanceof ConveyorBelt) {
                            this.riding = p;
                            return;
                        }
                        // Static platform: slide toward nearest edge instead of vanishing
                        const midPastry = this.x + this.w / 2;
                        const midPlat = p.x + p.w / 2;
                        this.velX = midPastry >= midPlat ? 1.0 : -1.0;
                        this.x += this.velX;
                        return;
                    }
                }
            }
        }

        if (this.y > 1500) this.splat();
    }

    /** Splat + schedule a fresh drop from the spawner (endless bakery rain). */
    public splat() {
        this.riding = null;
        this.y = 5000;
        this.velY = 0;
        this.velX = 0;
        this.respawnTimer = 70 + Math.floor(Math.random() * 50);
    }

    reset() {
        this.x = this.origX;
        this.y = this.origY;
        this.velX = 0;
        this.velY = 0;
        this.riding = null;
        this.thrown = false;
        this.respawnTimer = 0;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.respawnTimer > 0) return;
        const x = this.x - camX;
        const y = this.y;
        const midScreenX = x + this.w / 2;
        if (x + this.w < -60 || x > ctx.canvas.width + 60) return;

        // 1. Off-screen rafter warning beacon (when falling from high above screen)
        if (this.y + this.h < 0 && midScreenX >= 10 && midScreenX <= ctx.canvas.width - 10) {
            const warnPulse = 0.5 + 0.5 * Math.sin(Date.now() / 100);
            const badgeY = 22;
            ctx.save();
            // Glowing aura
            ctx.fillStyle = `rgba(255, 170, 40, ${0.25 + 0.3 * warnPulse})`;
            ctx.beginPath();
            ctx.arc(midScreenX, badgeY, 18 + warnPulse * 4, 0, Math.PI * 2);
            ctx.fill();
            // Badge background
            ctx.fillStyle = "#c0392b";
            ctx.beginPath();
            ctx.arc(midScreenX, badgeY, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 2.5;
            ctx.stroke();
            // Downward arrow
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(midScreenX - 6, badgeY - 4);
            ctx.lineTo(midScreenX + 6, badgeY - 4);
            ctx.lineTo(midScreenX, badgeY + 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // 2. Landing target shadow on receiving conveyor belt surface
        if (!this.riding && this.velY > 0 && this.targetPlatformY !== null) {
            const targetScreenY = this.targetPlatformY;
            const d = targetScreenY - (this.y + this.h);
            if (d > 0 && d < 750) {
                const progress = Math.max(0, Math.min(1, 1 - d / 650));
                const shadowW = (8 + (this.w / 2) * progress) * 1.2;
                const shadowH = (3 + 3 * progress) * 1.2;
                const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 90);

                ctx.save();
                // Darkening impact shadow on platform surface
                ctx.fillStyle = `rgba(0, 0, 0, ${0.15 + 0.35 * progress})`;
                ctx.beginPath();
                ctx.ellipse(midScreenX, targetScreenY + 2, shadowW, shadowH, 0, 0, Math.PI * 2);
                ctx.fill();

                // Glowing flour warning ring that tightens as it approaches
                const ringRadius = shadowW + (1 - progress) * 14;
                ctx.strokeStyle = `rgba(255, 200, 110, ${0.3 + 0.5 * progress * pulse})`;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.ellipse(midScreenX, targetScreenY + 2, ringRadius, ringRadius * 0.35, 0, 0, Math.PI * 2);
                ctx.stroke();

                // Flour dust motes when close (< 180px)
                if (d < 180) {
                    ctx.fillStyle = "rgba(255, 245, 220, 0.6)";
                    for (let i = 0; i < 4; i++) {
                        const ang = (i * Math.PI) / 2 + Date.now() * 0.003;
                        const sx = midScreenX + Math.cos(ang) * (shadowW * 0.8);
                        const sy = targetScreenY + 2 + Math.sin(ang) * (shadowH * 0.8);
                        ctx.fillRect(sx - 1, sy - 1, 2, 2);
                    }
                }
                ctx.restore();
            }
        }

        // Only draw the pastry itself if it's on or near the visible screen
        if (this.y + this.h < 0 || this.y > ctx.canvas.height + 60) return;

        ctx.save();
        // Upright at all times (no tumbling or rotation)
        ctx.translate(x + this.w / 2, y + this.h / 2);

        const enhanced = gfxSettings.visualMode === 'enhanced';
        if (this.kind === 'cupcake') {
            // Wrapper
            ctx.fillStyle = enhanced ? '#b5652a' : "#8d4e2c";
            ctx.beginPath();
            ctx.moveTo(-11, -2); ctx.lineTo(11, -2); ctx.lineTo(7, 12); ctx.lineTo(-7, 12);
            ctx.closePath(); ctx.fill();
            // Frosting swirl
            ctx.fillStyle = enhanced ? '#ffd9e8' : "#f8bbd0";
            ctx.beginPath();
            ctx.arc(0, -4, 10, Math.PI, 0);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, -8, 5, Math.PI, 0);
            ctx.fill();
            // Cherry
            ctx.fillStyle = "#e74c3c";
            ctx.beginPath();
            ctx.arc(0, -10, 3, 0, Math.PI * 2);
            ctx.fill();
            if (enhanced) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.beginPath();
                ctx.arc(-3, -6, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Layer cake: sponge + jam + sponge + frosting top
            const w = this.w / 2, h = this.h / 2;
            ctx.fillStyle = enhanced ? '#e8a95d' : "#deb887";
            ctx.fillRect(-w, -2, this.w, h + 2);
            ctx.fillStyle = "#c0392b"; // jam layer
            ctx.fillRect(-w, -4, this.w, 5);
            ctx.fillStyle = enhanced ? '#e8a95d' : "#deb887";
            ctx.fillRect(-w, -h, this.w, h - 4);
            ctx.fillStyle = enhanced ? '#fff3e0' : "#fff8e1"; // frosting cap
            ctx.fillRect(-w, -h - 3, this.w, 6);
            // Drips
            ctx.fillRect(-w + 6, -h, 4, 8);
            ctx.fillRect(w - 12, -h, 4, 10);
            // Candle
            ctx.fillStyle = "#7e57c2";
            ctx.fillRect(-2, -h - 12, 4, 9);
            const flick = Math.sin(Date.now() / 90) > 0;
            ctx.fillStyle = flick ? "#ffeb3b" : "#ff9800";
            ctx.beginPath();
            ctx.arc(0, -h - 14, 2.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
