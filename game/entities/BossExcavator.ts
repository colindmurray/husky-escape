import { Enemy } from "./Enemy";
import { Exit } from "./Exit";
import { BossWall } from "./BossWall";
import { Platform } from "./Platform";
import { audioManager } from "../Audio";
import { SoundType, Difficulty } from "../../types";

export class BossExcavator extends Enemy {
    public isActive = false;
    public hasHat = true; // Flashing neon hazard strobe light on top of cabin
    public isStunned = false;
    public stunTimer = 0;
    public health = 3; 
    public maxHealth = 3;
    public animTimer = 0;

    // Sub-platforms to attach to the world dynamically
    public cabinPlatform: Platform;
    public armPlatform: Platform;

    // Attack Routine: 'up' | 'slamming' | 'down' | 'raising'
    public armState: 'up' | 'slamming' | 'down' | 'raising' = 'up';
    private armCycleTimer = 0;
    private armAngle = 55; // Angle in degrees
    private impactVibe = 0;

    // Config bounds
    private minX: number;
    private maxX: number;
    private arenaExit: Exit;
    private walls: BossWall[];
    private difficulty: Difficulty;

    // Smoke effect particles
    private smokeParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; maxLife: number; life: number }[] = [];

    constructor(x: number, y: number, minX: number, maxX: number, exit: Exit, walls: BossWall[], difficulty: Difficulty) {
        super(x, y, 0, 0);
        this.w = 200; 
        this.h = 130;
        this.minX = minX;
        this.maxX = maxX;
        this.arenaExit = exit;
        this.walls = walls;
        this.difficulty = difficulty;

        // Create platforms. We place these in levels platforms so player can walk on them!
        // These bounds will be updated dynamically based on excavator position.
        this.cabinPlatform = new Platform(x, y, 90, 15, "transparent"); // Invisible but collidable
        this.armPlatform = new Platform(x, y, 110, 15, "transparent");

        // Difficulty scaling
        if (difficulty === Difficulty.HARD || difficulty === Difficulty.HARDCORE) {
            this.maxHealth = 4;
            this.speed = 4.2;
        } else {
            this.maxHealth = 3;
            this.speed = 3.2;
        }
        this.health = this.maxHealth;
    }

    update(platforms?: any, player?: any) {
        const time = Date.now() / 1000;

        // 1. Activation Check
        if (!this.isActive && player && player.x > this.minX + 80) {
            this.activate();
        }

        // 2. Smoke Particle Update
        this.smokeParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life++;
            p.size += 0.3;
            p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
        });
        this.smokeParticles = this.smokeParticles.filter(p => p.life < p.maxLife);

        if (!this.isActive) {
            // Keep platforms out of bounds before activation
            this.cabinPlatform.x = -5000;
            this.armPlatform.x = -5000;
            return;
        }

        // 3. Stunned Logic
        if (this.isStunned) {
            this.stunTimer--;
            this.impactVibe = Math.sin(time * 50) * 3;
            this.speed = 0;
            this.armState = 'down'; // Arm drops idle

            // Spew constant smoke puffs!
            if (Math.random() < 0.25) {
                this.addSmoke(
                    this.x + (this.dir === 1 ? 55 : 135), 
                    this.y + 20, 
                    (Math.random() - 0.5) * 2, 
                    -2 - Math.random() * 2
                );
            }

            // Stun End
            if (this.stunTimer <= 0) {
                this.recover();
            }

            // Sync platforms (Stunned: player can walk on arm & cabin)
            this.updatePlatformPositions();
            return;
        }

        this.impactVibe = 0;
        this.animTimer += 0.15;

        // 4. Movement Logic (Patrol / Chase back-and-forth)
        // If arm is NOT down, it rolls to patrol boundaries
        if (this.armState === 'up' || this.armState === 'raising') {
            this.x += this.speed * this.dir;
            if (this.x < this.minX || this.x > this.maxX) {
                this.dir *= -1;
            }
        }

        // 5. Arm Arm State-machine
        this.armCycleTimer++;
        if (this.armState === 'up' && this.armCycleTimer > 180) {
            // Slam initiation
            this.armState = 'slamming';
            this.armCycleTimer = 0;
        }

        if (this.armState === 'slamming') {
            const slamSpeed = (this.difficulty === Difficulty.HARD || this.difficulty === Difficulty.HARDCORE) ? 4.5 : 3;
            this.armAngle -= slamSpeed; // Rotate downwards
            if (this.armAngle <= 0) {
                this.armAngle = 0;
                this.armState = 'down';
                this.armCycleTimer = 0;
                this.impactVibe = 8; // Screen rumble feel
                audioManager.playSFX(SoundType.CRASH);
            }
        } else if (this.armState === 'down') {
            // Idle down: Stay on ground for 130 frames, serving as an active platform climb
            if (this.armCycleTimer > 130) {
                this.armState = 'raising';
                this.armCycleTimer = 0;
            }
        } else if (this.armState === 'raising') {
            this.armAngle += 1.8;
            if (this.armAngle >= 55) {
                this.armAngle = 55;
                this.armState = 'up';
                this.armCycleTimer = 0;
            }
        }

        // 6. Platform Alignment Setup
        this.updatePlatformPositions();

        // 7. Slam Crushing Damage logic
        if (this.armState === 'slamming' && player && !player.invincibleTimer) {
            const pad = 10;
            const slamX = this.dir === 1 ? this.x + 160 : this.x - 70;
            const slamW = 110;
            const slamY = this.y + 60;
            const slamH = 40;

            if (player.x + pad < slamX + slamW - pad &&
                player.x + player.w - pad > slamX + pad &&
                player.y + pad < slamY + slamH - pad &&
                player.y + player.h - pad > slamY + pad
            ) {
                // Slammed! Since update does not have world direct reference, we can bounce player
                // and deal visual impact damage (or let standard collision triggers catch them next frame).
                player.velY = 15; // Spike them down
                player.invincibleTimer = 40;
                audioManager.playSFX(SoundType.CRASH);
            }
        }
    }

    private updatePlatformPositions() {
        // Sync Cabin platform exactly with cabin roof
        this.cabinPlatform.x = this.x + 35;
        this.cabinPlatform.y = this.y + 10;
        this.cabinPlatform.w = 90;
        this.cabinPlatform.h = 10;

        // Sync arm platform ONLY when arm is fully lowered (serving as structural ramp or girder)
        if (this.armState === 'down') {
            this.armPlatform.w = 110;
            this.armPlatform.h = 10;
            this.armPlatform.y = this.y + 110;
            if (this.dir === 1) {
                this.armPlatform.x = this.x + 160;
            } else {
                this.armPlatform.x = this.x - 70;
            }
        } else {
            // Remove colliding arm platform out of reach
            this.armPlatform.x = -5000;
            this.armPlatform.w = 0;
            this.armPlatform.h = 0;
        }
    }

    private addSmoke(x: number, y: number, vx: number, vy: number) {
        this.smokeParticles.push({
            x,
            y,
            vx,
            vy,
            size: 8 + Math.random() * 8,
            alpha: 1.0,
            maxLife: 30 + Math.random() * 20,
            life: 0
        });
    }

    activate() {
        this.isActive = true;
        this.arenaExit.lock();
        this.walls.forEach(w => w.activate());
        audioManager.playMusic(SoundType.THEME_BOSS_EXCAVATOR as any || SoundType.THEME_BOSS);
    }

    recover() {
        this.isStunned = false;
        this.hasHat = true; // Flash siren bulb returns
        this.stunTimer = 0;
        this.speed = (this.difficulty === Difficulty.HARD || this.difficulty === Difficulty.HARDCORE) 
            ? 4.5 + (this.maxHealth - this.health) * 0.8 
            : 3.2 + (this.maxHealth - this.health) * 0.6;
        this.armState = 'raising';
        audioManager.playSFX(SoundType.BOSS_STUN);
    }

    takeHit() {
        if (this.isStunned) {
            // CRITICAL ENGINE HIT - REDUCE HEALTH
            this.health--;
            
            // Big smoke blast!
            for (let i = 0; i < 15; i++) {
                this.addSmoke(
                    this.x + 80 + (Math.random() - 0.5) * 60,
                    this.y + 40 + (Math.random() - 0.5) * 40,
                    (Math.random() - 0.5) * 6,
                    -1 - Math.random() * 5
                );
            }

            if (this.health <= 0) {
                this.die();
            } else {
                this.recover();
            }
        } else if (this.hasHat) {
            // OFFENSIVE HIT: KNOCK OFF SAFETY LIGHT & STALL ENGINE
            this.hasHat = false;
            this.isStunned = true;
            this.stunTimer = (this.difficulty === Difficulty.HARD || this.difficulty === Difficulty.HARDCORE) ? 220 : 360; 
            
            // Pop some smoke!
            for (let i = 0; i < 8; i++) {
                this.addSmoke(this.x + 80, this.y + 10, (Math.random() - 0.5) * 4, -4);
            }

            audioManager.playSFX(SoundType.BOSS_HIT);
            setTimeout(() => {
                audioManager.playSFX(SoundType.CRASH);
            }, 300);
        }
    }

    die() {
        this.isActive = false;
        this.markedForDeletion = true;

        // Platforms disappear
        this.cabinPlatform.markedForDeletion = true;
        this.armPlatform.markedForDeletion = true;

        this.arenaExit.unlock();
        this.walls.forEach(w => w.deactivate());
        audioManager.playSFX(SoundType.BOSS_DEATH);
        audioManager.playMusic(SoundType.THEME_CONSTRUCTION as any || SoundType.THEME_POUND);
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.health <= 0) return;

        let x = this.x - camX;
        let y = this.y;
        const time = Date.now() / 1000;

        // Apply shake vibration offsets
        if (this.impactVibe !== 0) {
            x += (Math.random() - 0.5) * this.impactVibe;
            y += (Math.random() - 0.5) * this.impactVibe;
        }

        // Draw smoke particles first
        ctx.save();
        this.smokeParticles.forEach(p => {
            ctx.fillStyle = `rgba(100, 100, 110, ${p.alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.x - camX, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        ctx.save();
        if (this.dir === -1) {
            ctx.translate(x + this.w / 2, y);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.w / 2), -y);
        }

        // --- DRAW HEAVY EXCAVATOR BOSS ---

        // 1. Heavy Caterpillar Crawler Tracks (Bottom base)
        ctx.fillStyle = "#1e272e"; // Rubber tread dark
        ctx.fillRect(x + 10, y + 95, 150, 35);
        ctx.strokeStyle = "#57606f";
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 10, y + 95, 150, 35);

        // Rotating crawler gears wheel visualizer
        ctx.fillStyle = "#2c3e50";
        const wOffset = Math.sin(this.animTimer) * 6;
        for (let gx = 25; gx <= 145; gx += 30) {
            ctx.beginPath();
            ctx.arc(x + gx + (this.speed > 0 ? wOffset : 0), y + 112, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#747d8c";
            ctx.stroke();
        }

        // 2. Swivel Base Mount
        ctx.fillStyle = "#747d8c";
        ctx.fillRect(x + 40, y + 80, 80, 15);

        // 3. Engine Compartment & Driver Cabin Body (Bright Yellow Construction color #ffd32c)
        ctx.fillStyle = "#f1c40f"; // Primary construction yellow
        ctx.fillRect(x + 20, y + 20, 110, 60);

        // Grill / Vent stripes
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x + 25, y + 35, 15, 30);
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(x + 30, y + 35, 2, 30);
        ctx.fillRect(x + 35, y + 35, 2, 30);

        // Cabin frame
        ctx.fillStyle = "#ffd32c";
        ctx.fillRect(x + 75, y + 10, 50, 45); // Elevated cab
        ctx.fillStyle = "#2c3e50"; // Dark Windows
        ctx.fillRect(x + 85, y + 15, 35, 22);

        // Driver with Orange Hard Hat silhouette in cabin!
        ctx.fillStyle = "#e67e22"; // Hard hat
        ctx.fillRect(x + 95, y + 18, 10, 6);
        ctx.fillStyle = "#f1c27d"; // Head
        ctx.beginPath();
        ctx.arc(x + 100, y + 27, 4, 0, Math.PI * 2);
        ctx.fill();

        // Yellow Stripe accent decals
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 70);
        ctx.lineTo(x + 40, y + 80);
        ctx.lineTo(x + 30, y + 80);
        ctx.lineTo(x + 20, y + 75);
        ctx.fill();

        // 4. Strobe Siren Warning Beacon
        if (this.hasHat) {
            // Neon Warning light!
            const slowPulse = Math.sin(Date.now() / 100) > 0;
            ctx.fillStyle = slowPulse ? "#ff3f34" : "#1e272e"; // Glowing red/orange strobe
            ctx.fillRect(x + 93, y + 2, 12, 8);
            
            ctx.fillStyle = "#747d8c"; // Light stand
            ctx.fillRect(x + 97, y + 10, 4, 2);

            if (slowPulse) {
                // Glow radius overlay
                ctx.fillStyle = "rgba(255, 63, 52, 0.25)";
                ctx.beginPath();
                ctx.arc(x + 99, y + 5, 25, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 5. THE MECHANICAL SWIPE ARM (Hydraulic boom + Bucket scoop)
        ctx.save();
        ctx.translate(x + 120, y + 60); // Anchor pivot of mechanical arm
        
        // Tilt depending on armAngle (downwards rotation)
        const radAngle = (this.armAngle * Math.PI) / 180;
        ctx.rotate(-radAngle);

        // Primary boom (first girder)
        ctx.strokeStyle = "#ffd32c"; // Yellow boom
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(70, -25);
        ctx.stroke();

        ctx.strokeStyle = "#485460"; // Internal black hydro piston
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(10, 5);
        ctx.lineTo(55, -12);
        ctx.stroke();

        // Secondary boom dipper (second skeleton arm pivot)
        ctx.translate(70, -25);
        ctx.rotate(radAngle * 0.5); // Counter balance rotation for arcade joint look

        ctx.strokeStyle = "#2c3e50"; // Dark pivot link
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(50, 45);
        ctx.stroke();

        // Heavy Iron Digging Bucket / Shovel
        ctx.translate(50, 45);
        ctx.fillStyle = "#57606f"; // Cast iron steel
        ctx.beginPath();
        ctx.moveTo(-15, -10);
        ctx.lineTo(25, -20);
        ctx.lineTo(35, 10);
        ctx.lineTo(0, 30);
        ctx.lineTo(-20, 15);
        ctx.closePath();
        ctx.fill();

        // Shovel teeth detail
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(25, -12, 10, 4);
        ctx.fillRect(28, -2, 8, 4);
        ctx.fillRect(23, 8, 10, 4);

        ctx.restore(); // Restore arm translation

        // 6. Stun / dizzy sparks drawing when stalled
        if (this.isStunned) {
            ctx.fillStyle = "#ffd32c";
            const dizzyX = x + 85 + Math.sin(time * 12) * 40;
            const dizzyY = y + Math.cos(time * 12) * 10 - 25;
            ctx.fillRect(dizzyX, dizzyY, 8, 8);
            ctx.fillRect(dizzyX + 20, dizzyY + 10, 4, 4);

            // Stun text cue
            ctx.fillStyle = "#ff3f34";
            ctx.font = "bold 13px sans-serif";
            ctx.fillText("STALL ENGINE!", x + 15, y - 40);
        }

        // Draw Health Gauge floating over boss
        const hpBarW = 100;
        const hpBarH = 6;
        const hpX = x + 40;
        const hpY = y - 15;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
        
        ctx.fillStyle = this.isStunned ? "#f1c40f" : "#ff3f34"; // Yield orange if stunned, red if active
        ctx.fillRect(hpX, hpY, hpBarW * (this.health / this.maxHealth), hpBarH);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(hpX, hpY, hpBarW, hpBarH);

        ctx.restore();
    }
}
