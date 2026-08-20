
import { Enemy } from "./Enemy";
import { Exit } from "./Exit";
import { BossWall } from "./BossWall";
import { audioManager } from "../Audio";
import { SoundType, Difficulty } from "../../types";

export class BossWolf extends Enemy {
    public isActive = false;
    public hasHat = true;
    public isStunned = false;
    public stunTimer = 0;
    public health = 3; 
    public maxHealth = 3;
    public animTimer = 0;
    
    // Config
    private minX: number;
    private maxX: number;
    private arenaExit: Exit;
    private walls: BossWall[];
    private difficulty: Difficulty;

    constructor(x: number, y: number, minX: number, maxX: number, exit: Exit, walls: BossWall[], difficulty: Difficulty) {
        super(x, y, 0, 0);
        this.w = 140; 
        this.h = 90;
        this.minX = minX;
        this.maxX = maxX;
        this.arenaExit = exit;
        this.walls = walls;
        this.difficulty = difficulty;
        
        // Base stats
        if (difficulty === Difficulty.HARD || difficulty === Difficulty.HARDCORE) {
             this.speed = 5.5; // Very fast
        } else {
             this.speed = 3.5;
        }
    }

    update(platforms?: any, player?: any) {
        // Activation
        if (!this.isActive && player && player.x > this.minX + 100) {
            this.activate();
        }

        if (!this.isActive) return;

        // Stunned State
        if (this.isStunned) {
            this.stunTimer--;
            this.animTimer += 0.5;
            if (this.stunTimer <= 0) {
                this.recover();
            }
            return;
        }

        // Active State
        this.x += this.speed * this.dir;
        this.animTimer += 0.2;

        // Turn around at bounds
        if (this.x < this.minX || this.x > this.maxX) {
            this.dir *= -1;
        }
    }

    activate() {
        this.isActive = true;
        this.arenaExit.lock();
        this.walls.forEach(w => w.activate());
        audioManager.playMusic(SoundType.THEME_BOSS_WOLF);
        audioManager.playSFX(SoundType.WOLF_HOWL);
    }

    recover() {
        this.isStunned = false;
        this.hasHat = true;
        this.stunTimer = 0;
        // Increase speed per phase
        this.speed += 1.0; 
        audioManager.playSFX(SoundType.WOLF_GROWL);
    }

    takeHit() {
        if (this.isStunned) {
            // Damage Logic
            this.health--;
            if (this.health <= 0) {
                this.die();
            } else {
                this.recover();
            }
        } else if (this.hasHat) {
            // Knock Hat Logic
            this.hasHat = false;
            this.isStunned = true;
            
            // Hard mode: shorter stun time
            this.stunTimer = (this.difficulty === Difficulty.HARD || this.difficulty === Difficulty.HARDCORE) ? 180 : 400; 
            
            audioManager.playSFX(SoundType.BOSS_HIT);
            setTimeout(() => audioManager.playSFX(SoundType.WOLF_GROWL), 200);
        }
    }

    die() {
        this.isActive = false;
        this.markedForDeletion = true;
        this.arenaExit.unlock();
        this.walls.forEach(w => w.deactivate());
        audioManager.playSFX(SoundType.BOSS_DEATH);
        audioManager.playMusic(SoundType.THEME_MOUNTAIN);
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.health <= 0) return;

        let x = this.x - camX;
        let y = this.y;

        // Vibration if stunned
        if (this.isStunned) {
            x += Math.random() * 4 - 2;
        }

        ctx.save();
        if (this.dir === -1) {
            ctx.translate(x + this.w / 2, y);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.w / 2), -y);
        }

        // --- DRAW GIANT WOLF ---
        
        // Body
        ctx.fillStyle = "#4d4d4d"; // Darker Grey
        ctx.fillRect(x, y + 20, this.w - 30, this.h - 20);
        
        // Head
        ctx.beginPath();
        ctx.arc(x + this.w - 30, y + 35, 35, 0, Math.PI*2);
        ctx.fill();
        
        // Snout
        ctx.beginPath();
        ctx.moveTo(x + this.w - 10, y + 20); 
        ctx.lineTo(x + this.w - 5, y); 
        ctx.lineTo(x + this.w + 20, y + 35); 
        ctx.fill();
        
        ctx.fillStyle = "#d35400"; // Red Eye
        // Blinking red eye for danger
        if (this.isStunned) {
             // X eyes
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 3;
            ctx.beginPath(); 
            ctx.moveTo(x + this.w - 40, y + 25); ctx.lineTo(x + this.w - 30, y + 35);
            ctx.moveTo(x + this.w - 30, y + 25); ctx.lineTo(x + this.w - 40, y + 35);
            ctx.stroke();
        } else {
             ctx.beginPath(); ctx.arc(x + this.w - 30, y + 25, 6, 0, Math.PI*2); ctx.fill();
        }

        // HAT (Ranger Hat)
        if (this.hasHat) {
            ctx.fillStyle = "#5d4037"; // Brown leather
            ctx.beginPath();
            ctx.ellipse(x + this.w - 30, y + 5, 45, 10, 0, 0, Math.PI*2); // Brim
            ctx.fill();
            ctx.fillRect(x + this.w - 50, y - 25, 40, 30); // Top
            ctx.fillStyle = "#f1c40f"; // Band
            ctx.fillRect(x + this.w - 50, y - 5, 40, 5);
        }

        // Legs
        ctx.fillStyle = "#4d4d4d"; // Darker Grey
        let legOffset = Math.sin(this.animTimer) * 10;
        ctx.fillRect(x + 10 + legOffset, y + this.h - 20, 20, 20);
        ctx.fillRect(x + 70 - legOffset, y + this.h - 20, 20, 20);
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(x, y + 30);
        ctx.lineTo(x - 20, y + 20 + Math.sin(this.animTimer*2)*10);
        ctx.lineTo(x, y + 50);
        ctx.fill();
        
        // Health Indicators (Scars or Bandages?)
        // Let's use simple hearts or dots above head if needed, or color shifts.
        // For now, simple logic.

        ctx.restore();
    }
}
