
import { Enemy } from "./Enemy";
import { gfxSettings } from "../GfxSettings";
import { drawBossCatcherEnhanced } from "../engine/enhanced/EnhancedSprites";
import { Exit } from "./Exit";
import { BossWall } from "./BossWall";
import { audioManager } from "../Audio";
import { SoundType, Difficulty } from "../../types";

export class BossCatcher extends Enemy {
    public isActive = false;
    public hasHat = true;
    public isStunned = false;
    public stunTimer = 0;
    public health = 1; 
    public maxHealth = 1;
    public animTimer = 0;
    
    // Config
    private startX: number;
    private minX: number;
    private maxX: number;
    private arenaExit: Exit;
    private walls: BossWall[];

    constructor(x: number, y: number, minX: number, maxX: number, exit: Exit, walls: BossWall[], difficulty: Difficulty) {
        super(x, y, 0, 0); // Speed set manually
        this.w = 100;
        this.h = 150;
        this.startX = x;
        this.minX = minX;
        this.maxX = maxX;
        this.arenaExit = exit;
        this.walls = walls;
        
        // Difficulty scaling
        if (difficulty === Difficulty.HARD || difficulty === Difficulty.HARDCORE) {
            this.maxHealth = 3;
            this.speed = 4.0;
        } else {
            this.maxHealth = 1;
            this.speed = 3.5;
        }
        this.health = this.maxHealth;
    }

    update(platforms?: any, player?: any) {
        // Activation Check
        if (!this.isActive && player && player.x > this.minX + 100) {
            this.activate();
        }

        if (!this.isActive) return;

        // Stun Logic
        if (this.isStunned) {
            this.stunTimer--;
            this.animTimer += 0.5; // Shake effect
            if (this.stunTimer <= 0) {
                this.recover();
            }
            return; 
        }

        // Movement
        this.x += this.speed * this.dir;
        this.animTimer += 0.1;

        if (this.x < this.minX || this.x > this.maxX) {
            this.dir *= -1;
        }
    }

    activate() {
        this.isActive = true;
        this.arenaExit.lock();
        this.walls.forEach(w => w.activate());
        audioManager.playMusic(SoundType.THEME_BOSS);
    }

    recover() {
        this.isStunned = false;
        this.hasHat = true; // Gets hat back
        this.stunTimer = 0;
        // If recovered from timeout without being hit, just resume
        // If recovered via damage logic, speed might have increased already
        audioManager.playSFX(SoundType.BOSS_STUN); 
    }

    takeHit() {
        if (this.isStunned) {
            // DAMAGE PHASE
            this.health--;
            
            if (this.health <= 0) {
                // DEAD
                this.isActive = false; // Stop logic
                this.markedForDeletion = true;
                this.arenaExit.unlock();
                this.walls.forEach(w => w.deactivate());
                audioManager.playSFX(SoundType.BOSS_DEATH);
                audioManager.playMusic(SoundType.THEME_POUND); // Back to normal music
            } else {
                // SURVIVED - GET HAT BACK
                this.recover();
                this.speed += 1.0; // Gets angry/faster
                // Bounce player is handled by World collision, but let's add visual feedback
                // Flash red? (Handled in draw implicitly by state change)
            }
            
        } else if (this.hasHat) {
            // KNOCK HAT PHASE
            this.hasHat = false;
            this.isStunned = true;
            this.stunTimer = 600; // 10 seconds at 60fps
            audioManager.playSFX(SoundType.BOSS_HIT);
            setTimeout(() => audioManager.playSFX(SoundType.BOSS_STUN), 200);
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.health <= 0) return; // Don't draw if dead

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

        if (gfxSettings.visualMode === 'enhanced') {
            drawBossCatcherEnhanced(ctx, x, y, this.w, this.h, this.animTimer, this.isStunned);
            ctx.restore();
            return;
        }

        // --- DRAW BOSS ---
        let legOffset = Math.sin(this.animTimer) * 10;
        
        // Legs
        ctx.fillStyle = "#2c3e50"; 
        ctx.fillRect(x + 20 + legOffset, y + 100, 20, 50);
        ctx.fillRect(x + 60 - legOffset, y + 100, 20, 50);

        // Body
        // Color changes based on health/anger?
        ctx.fillStyle = this.health === 1 && this.maxHealth > 1 ? "#8e44ad" : "#c0392b"; // Turn purple if low health on hard mode
        ctx.fillRect(x + 10, y + 40, 80, 80);
        
        // Badge (BIG)
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath(); ctx.arc(x + 50, y + 60, 10, 0, Math.PI*2); ctx.fill();

        // Arms
        ctx.fillStyle = "#e67e22";
        ctx.fillRect(x + 30, y + 50, 40, 20); 
        
        // Head
        ctx.fillStyle = "#f1c27d";
        ctx.beginPath(); ctx.arc(x + 50, y + 25, 30, 0, Math.PI*2); ctx.fill();

        // Face
        if (this.isStunned) {
            // X eyes
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 3;
            ctx.beginPath(); 
            ctx.moveTo(x + 35, y + 15); ctx.lineTo(x + 45, y + 25);
            ctx.moveTo(x + 45, y + 15); ctx.lineTo(x + 35, y + 25);
            ctx.moveTo(x + 55, y + 15); ctx.lineTo(x + 65, y + 25);
            ctx.moveTo(x + 65, y + 15); ctx.lineTo(x + 55, y + 25);
            ctx.stroke();
            
            // Dizzy stars
            ctx.fillStyle = "#f1c40f";
            let starX = x + 50 + Math.sin(this.animTimer)*40;
            let starY = y - 10 + Math.cos(this.animTimer)*10;
            ctx.fillRect(starX, starY, 10, 10);
        } else {
            // Angry Eyes
            ctx.fillStyle = "white";
            ctx.beginPath(); ctx.arc(x + 40, y + 20, 8, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 60, y + 20, 8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "black";
            ctx.beginPath(); ctx.arc(x + 40, y + 20, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 60, y + 20, 3, 0, Math.PI*2); ctx.fill();
            
            // Brows
            ctx.fillStyle = "black";
            ctx.beginPath(); ctx.moveTo(x + 30, y + 10); ctx.lineTo(x + 50, y + 18); ctx.lineTo(x + 48, y + 10); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x + 70, y + 10); ctx.lineTo(x + 50, y + 18); ctx.lineTo(x + 52, y + 10); ctx.fill();
        }

        // HAT
        if (this.hasHat) {
            ctx.fillStyle = "#2c3e50";
            ctx.fillRect(x + 10, y - 5, 80, 10); // Brim
            ctx.fillRect(x + 20, y - 55, 60, 50); // Top
            ctx.fillStyle = "#f1c40f";
            ctx.fillRect(x + 20, y - 15, 60, 5); // Band
        }

        ctx.restore();
    }
}
