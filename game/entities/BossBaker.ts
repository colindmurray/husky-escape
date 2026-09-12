import { Enemy } from "./Enemy";
import { gfxSettings } from "../GfxSettings";
import { drawBakerPolish } from "../engine/enhanced/BakerySprites";
import { Exit } from "./Exit";
import { BossWall } from "./BossWall";
import { Pastry } from "./Pastry";
import { audioManager } from "../Audio";
import { SoundType, Difficulty } from "../../types";

/**
 * BOSS: The Night Baker. He blocks the bakery's back door (locked Exit +
 * rising walls, same arena idiom as the Excavator) and Onyx must bonk the
 * toque off his head, then bonk him while he's dizzy — 3x (EASY) or 4x (HARD).
 *
 * Attacks:
 *   1. Rolling-pin slam — telegraphed shake, then a slam zone in front of
 *      him spikes Onyx down (mercy bounce + brief invincibility, not a KO).
 *   2. Pastry toss — lobs frosting grenades in an arc at Onyx. They shatter
 *      on landing but are lethal in flight.
 * He gets faster and throws more volleys as his health drops.
 */
export class BossBaker extends Enemy {
    public isActive = false;
    public hasHat = true;
    public isStunned = false;
    public stunTimer = 0;
    public health = 3;
    public maxHealth = 3;
    public animTimer = 0;

    // Rolling-pin state machine: 'carry' | 'warn' | 'slamming' | 'rest' | 'recover'
    private pinState: 'carry' | 'warn' | 'slamming' | 'rest' | 'recover' = 'carry';
    private pinTimer = 0;
    private tossTimer = 0;

    private minX: number;
    private maxX: number;
    private arenaExit: Exit;
    private walls: BossWall[];
    private difficulty: Difficulty;

    private flourPuffs: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];

    constructor(x: number, y: number, minX: number, maxX: number, exit: Exit, walls: BossWall[], difficulty: Difficulty) {
        super(x, y, 0, 0);
        this.w = 110;
        this.h = 118;
        this.minX = minX;
        this.maxX = maxX;
        this.arenaExit = exit;
        this.walls = walls;
        this.difficulty = difficulty;

        const hard = difficulty === Difficulty.HARD || difficulty === Difficulty.HARDCORE;
        this.maxHealth = hard ? 4 : 3;
        this.health = this.maxHealth;
        this.speed = hard ? 3.0 : 2.2;
    }

    update(_platforms?: any, player?: any, enemies?: any[]) {
        const time = Date.now() / 1000;

        if (!this.isActive && player && player.x > this.minX + 80) {
            this.activate();
        }

        // Flour puff particles
        for (const p of this.flourPuffs) {
            p.x += p.vx; p.y += p.vy; p.vy -= 0.05; p.life++;
        }
        this.flourPuffs = this.flourPuffs.filter(p => p.life < p.maxLife);
        if (!this.isActive) return;

        if (this.isStunned) {
            this.stunTimer--;
            if (Math.random() < 0.2) {
                this.puff(this.x + 55 + (Math.random() - 0.5) * 40, this.y + 20);
            }
            if (this.stunTimer <= 0) this.recover();
            return;
        }

        this.animTimer += 0.15;

        // Patrol the arena (pauses to slam)
        if (this.pinState === 'carry' || this.pinState === 'recover') {
            this.x += this.speed * this.dir;
            if (this.x < this.minX || this.x > this.maxX) this.dir *= -1;
        }

        // --- Rolling-pin slam cycle ---
        this.pinTimer++;
        const slamEvery = this.difficulty === Difficulty.EASY ? 230 : 170;
        if (this.pinState === 'carry' && this.pinTimer > slamEvery) {
            this.pinState = 'warn';
            this.pinTimer = 0;
        } else if (this.pinState === 'warn') {
            // Shudder telegraph
            this.x += (Math.random() - 0.5) * 2;
            if (this.pinTimer === 1) audioManager.playSFX(SoundType.BOSS_STUN);
            if (this.pinTimer > (this.difficulty === Difficulty.EASY ? 55 : 38)) {
                this.pinState = 'slamming';
                this.pinTimer = 0;
                audioManager.playSFX(SoundType.CRASH);
            }
        } else if (this.pinState === 'slamming') {
            // Slam zone check: mercy bounce, not a KO
            if (player && !player.invincibleTimer) {
                const pad = 8;
                const zx = this.dir === 1 ? this.x + 80 : this.x - 90;
                if (player.x + pad < zx + 110 - pad &&
                    player.x + player.w - pad > zx + pad &&
                    player.y + pad < this.y + this.h &&
                    player.y + player.h - pad > this.y + 40) {
                    player.velY = 12;
                    player.invincibleTimer = 50;
                    audioManager.playSFX(SoundType.CRASH);
                }
            }
            if (this.pinTimer > 14) {
                this.pinState = 'rest';
                this.pinTimer = 0;
                // Slam kicks up a flour cloud
                for (let i = 0; i < 8; i++) {
                    this.puff(
                        (this.dir === 1 ? this.x + 130 : this.x - 20) + (Math.random() - 0.5) * 30,
                        this.y + this.h - 6
                    );
                }
            }
        } else if (this.pinState === 'rest') {
            if (this.pinTimer > (this.difficulty === Difficulty.EASY ? 120 : 85)) {
                this.pinState = 'recover';
                this.pinTimer = 0;
            }
        } else if (this.pinState === 'recover') {
            if (this.pinTimer > 50) {
                this.pinState = 'carry';
                this.pinTimer = 0;
            }
        }

        // --- Pastry toss volleys (only while carrying the pin, keeps it fair) ---
        this.tossTimer++;
        const tossEvery = this.difficulty === Difficulty.EASY ? 240 : 170;
        if (this.pinState === 'carry' && this.tossTimer > tossEvery && player && enemies) {
            this.tossTimer = 0;
            const volleys = this.difficulty === Difficulty.EASY ? 2 : 3;
            const dirToPlayer = Math.sign((player.x - this.x)) || 1;
            for (let i = 0; i < volleys; i++) {
                const p = new Pastry(this.x + 40, this.y - 10, i % 2 === 0 ? 'cupcake' : 'layercake');
                p.toss(
                    this.x + 40,
                    this.y - 10,
                    dirToPlayer * (2.4 + i * 0.9 + (this.maxHealth - this.health) * 0.3)
                );
                // Arc height stagger: later pastries fly higher/longer
                p.velY = -7 - i * 1.2;
                enemies.push(p);
            }
            audioManager.playSFX(SoundType.BOOST);
        }
    }

    private puff(x: number, y: number) {
        this.flourPuffs.push({
            x, y,
            vx: (Math.random() - 0.5) * 2,
            vy: -1 - Math.random() * 2,
            life: 0,
            maxLife: 26 + Math.random() * 14,
            size: 5 + Math.random() * 7,
        });
    }

    activate() {
        this.isActive = true;
        this.arenaExit.lock();
        this.walls.forEach(w => w.activate());
        audioManager.playMusic(SoundType.THEME_BOSS_BAKER);
    }

    recover() {
        this.isStunned = false;
        this.hasHat = true;
        this.stunTimer = 0;
        const hard = this.difficulty === Difficulty.HARD || this.difficulty === Difficulty.HARDCORE;
        this.speed = (hard ? 3.0 : 2.2) + (this.maxHealth - this.health) * 0.5;
        this.pinState = 'recover';
        this.pinTimer = 0;
        audioManager.playSFX(SoundType.BOSS_STUN);
    }

    takeHit() {
        if (this.isStunned) {
            this.health--;
            for (let i = 0; i < 14; i++) this.puff(this.x + 55, this.y + 40);
            if (this.health <= 0) this.die();
            else this.recover();
        } else if (this.hasHat) {
            this.hasHat = false;
            this.isStunned = true;
            const hard = this.difficulty === Difficulty.HARD || this.difficulty === Difficulty.HARDCORE;
            this.stunTimer = hard ? 220 : 360;
            for (let i = 0; i < 8; i++) this.puff(this.x + 55, this.y);
            audioManager.playSFX(SoundType.BOSS_HIT);
            setTimeout(() => audioManager.playSFX(SoundType.CRASH), 300);
        }
    }

    die() {
        this.isActive = false;
        this.markedForDeletion = true;
        this.arenaExit.unlock();
        this.walls.forEach(w => w.deactivate());
        audioManager.playSFX(SoundType.BOSS_DEATH);
        audioManager.playMusic(SoundType.THEME_BAKERY);
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.health <= 0) return;
        const x = this.x - camX;
        const y = this.y;
        const time = Date.now() / 1000;

        // Flour puffs behind him
        ctx.save();
        for (const p of this.flourPuffs) {
            ctx.fillStyle = `rgba(245,230,200,${Math.max(0, 1 - p.life / p.maxLife) * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x - camX, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        if (gfxSettings.visualMode === 'enhanced') {
            const slamming = this.pinState === 'slamming' || this.pinState === 'warn';
            drawBakerPolish(ctx, x, y, this.w, this.h, this.animTimer, this.dir, true, slamming, this.isStunned);
            this.drawHealthBar(ctx, x, y);
            void time;
            return;
        }

        ctx.save();
        if (this.dir === -1) {
            ctx.translate(x + this.w / 2, y);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.w / 2), -y);
        }

        const bounce = this.pinState === 'warn' ? (Math.random() - 0.5) * 4 : Math.abs(Math.sin(this.animTimer)) * 3;

        // Big body + apron
        ctx.fillStyle = "#ecf0f1";
        ctx.fillRect(x + 15, y + 40 + bounce * 0.3, 80, 70);
        ctx.fillStyle = "#b03a2e";
        ctx.fillRect(x + 45, y + 40 + bounce * 0.3, 20, 12); // neckerchief
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(x + 15, y + 90, 80, 20); // flour stains
        // Arms
        ctx.fillStyle = "#f1c27d";
        const armSwing = Math.sin(this.animTimer * 2) * 6;
        ctx.fillRect(x + 5, y + 50 + armSwing, 12, 30);
        // Rolling pin arm (right side, raised when warning/slamming)
        const pinUp = this.pinState === 'warn' || this.pinState === 'carry';
        ctx.save();
        ctx.translate(x + 95, y + 55);
        ctx.rotate(pinUp ? -0.9 : 0.5);
        ctx.fillStyle = "#a4713d";
        ctx.fillRect(-8, -50, 16, 60); // pin
        ctx.fillStyle = "#7d5227";
        ctx.fillRect(-12, -56, 24, 8);
        ctx.fillRect(-12, 2, 24, 8);
        ctx.restore();
        // Legs stomping
        ctx.fillStyle = "#34495e";
        const stomp = Math.sin(this.animTimer * 2) > 0 ? 0 : 4;
        ctx.fillRect(x + 30, y + 108, 16, 12 - stomp);
        ctx.fillRect(x + 64, y + 108, 16, 8 + stomp);
        // Head
        ctx.fillStyle = "#f1c27d";
        ctx.beginPath();
        ctx.arc(x + 55, y + 26 + bounce * 0.3, 17, 0, Math.PI * 2);
        ctx.fill();
        // Moustache + angry brows
        ctx.fillStyle = "#4e342e";
        ctx.fillRect(x + 44, y + 32 + bounce * 0.3, 22, 5);
        ctx.fillStyle = "#222";
        ctx.fillRect(x + 44, y + 18 + bounce * 0.3, 8, 3);
        ctx.fillRect(x + 58, y + 18 + bounce * 0.3, 8, 3);

        // The famous toque (target!)
        if (this.hasHat) {
            const pulse = Math.sin(Date.now() / 150) > 0;
            ctx.fillStyle = "white";
            ctx.fillRect(x + 33, y - 8 + bounce * 0.3, 44, 22);
            ctx.beginPath();
            ctx.arc(x + 55, y - 8 + bounce * 0.3, 24, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = "#bdc3c7";
            ctx.fillRect(x + 33, y + 12 + bounce * 0.3, 44, 4);
            if (pulse) {
                ctx.fillStyle = "rgba(241,196,15,0.35)";
                ctx.beginPath();
                ctx.arc(x + 55, y - 2 + bounce * 0.3, 32, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (this.isStunned) {
            ctx.fillStyle = "#f1c40f";
            ctx.font = "bold 15px Arial";
            ctx.fillText("★ ★ ★", x + 28, y - 26 + Math.sin(time * 10) * 3);
            ctx.fillStyle = "#c0392b";
            ctx.font = "bold 12px Arial";
            ctx.fillText("DIZZY! BONK HIM!", x + 8, y + 126);
        }

        ctx.restore();
        this.drawHealthBar(ctx, x, y);
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x + 5, y - 16, 100, 7);
        ctx.fillStyle = this.isStunned ? "#f1c40f" : "#e74c3c";
        ctx.fillRect(x + 5, y - 16, 100 * (this.health / this.maxHealth), 7);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + 5, y - 16, 100, 7);
    }
}
