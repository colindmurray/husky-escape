
import { drawGoose } from '../engine/FamilyArt';
import { drawCurledHusky } from '../engine/HuskyArt';
import { drawAccessories, HEADWEAR, type Accessory } from "../Shop";
import { Entity, GRAVITY, FRICTION, JUMP_FORCE } from "./Entity";
import { InputState, SoundType } from "../../types";
import { CollapsingAwning, TownPlatform } from "./Town";
import { Platform } from "./Platform";
import { Umbrella } from "./Umbrella";
import { SkiJump } from "./SkiJump";
import { Shark } from "./Shark";
import { UmbrellaPickup } from "./UmbrellaPickup";
import { Fan } from "./Fan";
import { BoostPad } from "./NeonProps";
import { audioManager } from "../Audio";
import { gfxSettings } from "../GfxSettings";
import { drawHuskyEnhanced } from "../engine/enhanced/EnhancedSprites";

export class Player extends Entity {
    public facingRight = true;
    public bonesCollected = 0;
    public jumpsLeft = 0;
    public jumpKeyHeld = false;
    
    // Level 8 Mechanics
    public invincibleTimer = 0;
    public ridingShark: Shark | null = null;

    // Level 9 Mechanics
    public hasUmbrella = false;
    public isGliding = false;

    // Zone 11: neon dash pads grant a short friction-free sprint
    public dashFrames = 0;

    public accessories = new Set<Accessory>();
    public magnetTimer = 0;
    public spinTimer = 0;
    public isReading = false;
    public readingTime = 0;
    public springTimer = 0;
    public sprintTimer = 0;
    public featherTimer = 0;
    public feastTimer = 0;
    public hasBandana = false;
    public townBumpFrames = 0;

    public standingOnShakingPlatform = false;
    public standingOn: Entity | null = null;
    public launchedFrom: SkiJump | null = null;

    constructor(x: number, y: number) {
        super(x, y, 40, 40, '#ecf0f1');
    }

    update(platforms?: Entity[], input?: InputState, height?: number, currentLevel?: number) {
        if (!platforms || !input || height === undefined || currentLevel === undefined) return;
        
        this.standingOn = null; this.launchedFrom = null;
        const previousBottom = this.y + this.h;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.magnetTimer > 0) this.magnetTimer--;
        for (const key of ['spinTimer', 'springTimer', 'sprintTimer', 'featherTimer', 'feastTimer'] as const) if (this[key] > 0) this[key]--;
        if (this.townBumpFrames > 0) this.townBumpFrames--;

        if (this.isReading) {
            if (currentLevel !== 15 || input.ArrowLeft || input.ArrowRight || input.ArrowUp || input.ArrowDown || input.Space) this.isReading = false;
            else { this.readingTime += 1 / 60; this.velX = this.velY = 0; return; }
        }

        // --- LEVEL 8: UNDERWATER PHYSICS ---
        if (currentLevel === 8) {
            // --- GOLDEN SHARK CONTROL MODE ---
            if (this.ridingShark && this.ridingShark.isGolden) {
                const SHARK_SPEED = 9;
                const ACCEL = 0.8;
                const DRAG = 0.92;

                if (input.ArrowLeft) {
                    this.velX -= ACCEL;
                    this.facingRight = false;
                    this.ridingShark.dir = -1;
                }
                if (input.ArrowRight) {
                    this.velX += ACCEL;
                    this.facingRight = true;
                    this.ridingShark.dir = 1;
                }
                if (input.ArrowUp || input.Space) {
                    this.velY -= ACCEL;
                }
                if (input.ArrowDown) {
                    this.velY += ACCEL;
                }

                this.velX *= DRAG;
                this.velY *= DRAG;
                
                if (this.velX > SHARK_SPEED) this.velX = SHARK_SPEED;
                if (this.velX < -SHARK_SPEED) this.velX = -SHARK_SPEED;
                if (this.velY > SHARK_SPEED) this.velY = SHARK_SPEED;
                if (this.velY < -SHARK_SPEED) this.velY = -SHARK_SPEED;

                this.x += this.velX;
                this.y += this.velY;
                
                this.ridingShark.x = this.x - (this.ridingShark.w / 2) + (this.w / 2);
                this.ridingShark.y = this.y + 20; 
                this.ridingShark.isControlled = true;

                platforms.forEach(platform => {
                    if (platform === this.ridingShark) return;
                    if (platform instanceof Shark) return;
                    
                    const dir = this.colCheck(platform);
                    if (dir) {
                        if (dir === 'l' || dir === 'r') this.velX = 0;
                        if (dir === 't' || dir === 'b') this.velY = 0;
                    }
                });

                return;
            }

            // --- NORMAL UNDERWATER ---
            const WATER_GRAVITY = 0.1;
            const SWIM_FORCE = -4; 
            const MAX_SINK_SPEED = 3;
            this.velY += WATER_GRAVITY;
            if (this.velY > MAX_SINK_SPEED) this.velY = MAX_SINK_SPEED;

            if (input.ArrowUp || input.Space) {
                if (!this.jumpKeyHeld) {
                    this.velY = SWIM_FORCE;
                    this.jumpKeyHeld = true;
                    audioManager.playSFX(SoundType.SWIM);
                }
            } else {
                this.jumpKeyHeld = false;
            }

            let waterAccel = 0.3;
            if (this.ridingShark) waterAccel = 0.45; 
            const WATER_FRICTION = 0.95;

            if (input.ArrowLeft) {
                this.velX -= waterAccel;
                this.facingRight = false;
            }
            if (input.ArrowRight) {
                this.velX += waterAccel;
                this.facingRight = true;
            }

            this.velX *= WATER_FRICTION;
            this.x += this.velX;
            this.y += this.velY;

            let touchedShark: Shark | null = null;
            platforms.forEach(platform => {
                const dir = this.colCheck(platform);
                if (dir) {
                    if (platform instanceof Shark) {
                        if (platform.isGolden) {
                            if (dir === 'b') touchedShark = platform;
                        } else {
                            if (platform.dx) this.x += platform.dx;
                            this.velY = 0;
                            touchedShark = platform;
                        }
                    } else {
                        if (dir === 'l' || dir === 'r') this.velX = 0;
                        if (dir === 't' || dir === 'b') this.velY = 0;
                    }
                }
            });

            if (touchedShark && !this.ridingShark) {
                this.ridingShark = touchedShark;
                audioManager.playSFX(SoundType.LAND);
            } else if (!touchedShark && this.ridingShark) {
                if (this.ridingShark.isGolden) this.ridingShark.isControlled = false;
                this.ridingShark = null;
            } else if (touchedShark) {
                this.ridingShark = touchedShark;
            }
            return;
        }

        // --- STANDARD PHYSICS (Levels 1-7, 9) ---
        if (input.ArrowUp || input.Space) {
            if (!this.jumpKeyHeld && this.jumpsLeft > 0) {
                this.velY = JUMP_FORCE * (this.springTimer > 0 ? 1.2 : 1);
                this.jumpsLeft--;
                this.grounded = false;
                this.jumpKeyHeld = true;
                audioManager.playSFX(SoundType.JUMP);
            }
        } else {
            this.jumpKeyHeld = false;
        }

        if (input.ArrowLeft) {
            this.velX -= this.sprintTimer > 0 ? 1 : 0.7;
            this.facingRight = false;
        }
        if (input.ArrowRight) {
            this.velX += this.sprintTimer > 0 ? 1 : 0.7;
            this.facingRight = true;
        }

        // --- LEVEL 9: GLIDING & WIND ---
        this.isGliding = false;
        if (currentLevel === 9) {
            const wind = (Math.sin(Date.now() / 1500) * 0.1) - 0.15;
            if (!this.grounded) {
                this.velX += wind;
            }

            if (this.hasUmbrella && (input.ArrowUp || input.Space) && this.velY > 0) {
                 this.isGliding = true;
                 this.velY = 1.5;
            } else {
                 this.velY += GRAVITY;
            }
        } else {
            this.velY += GRAVITY;
        }
        
        if (this.featherTimer > 0 && (input.ArrowUp || input.Space) && this.velY > 1.5) this.velY = 1.5;

        if (currentLevel === 6 && this.grounded) {
            if (this.velX < 8) {
                this.velX += 0.4;
                if (this.velX > 8) this.velX = 8;
            }
        }

        if (currentLevel === 6) {
            if (this.grounded) this.velX *= 0.98;
            else this.velX *= 0.995;
        } else if (this.dashFrames > 0) {
            // Neon dash: hold speed for the burst window (all levels' friction skipped)
            this.dashFrames--;
        } else if (this.standingOnShakingPlatform) {
            this.velX *= 0.978; // slippery sliding!
            // Dynamic jitter slide vibration factor
            this.velX += (Math.random() - 0.5) * 0.85;
        } else {
            this.velX *= FRICTION; 
        }

        this.x += this.velX;
        this.y += this.velY;
        this.grounded = false;
        this.standingOnShakingPlatform = false;

        platforms.forEach(platform => {
            if (platform instanceof CollapsingAwning && platform.collapsed) return;
            // Town shelves support from above; Onyx can jump up through cloth and bench tops.
            if (platform instanceof TownPlatform && ['awning', 'bench', 'stone', 'float'].includes(platform.kind)
                && (this.velY < 0 || previousBottom > platform.y + 2)) return;
            // Zone 11: industrial fans lift Onyx through their air column
            if (platform instanceof Fan) {
                platform.applyLift(this);
                return;
            }

            if (platform instanceof UmbrellaPickup) {
                if (this.colCheck(platform)) {
                    this.hasUmbrella = true;
                    platform.markedForDeletion = true;
                    audioManager.playSFX(SoundType.COLLECT);
                }
                return; 
            }

            const dir = this.colCheck(platform);

            // Zone 11: neon dash pads fling Onyx across wide streets
            if (platform instanceof BoostPad && dir === 'b') {
                const pad = platform as BoostPad;
                this.velX = pad.padDir * 12;
                this.velY = -6;
                this.grounded = false;
                this.jumpsLeft = 2;
                this.dashFrames = 24;
                audioManager.playSFX(SoundType.BOOST);
                return;
            }

            if (platform instanceof SkiJump && dir) {
                this.launchedFrom = platform;
                this.velY = -platform.launchPower;
                this.velX = 14;  
                this.grounded = false;
                this.jumpsLeft = 1;
                this.y -= 5; 
                audioManager.playSFX(SoundType.BOOST);
                return;
            }

            if (dir === "l" || dir === "r") {
                this.velX = 0;
            } else if (dir === "b") {
                if (platform instanceof Umbrella) {
                    this.velY = -18;
                    this.grounded = false;
                    this.jumpsLeft = 2; 
                    audioManager.playSFX(SoundType.JUMP);
                } 
                else {
                    if (platform instanceof CollapsingAwning) platform.stepOn();
                    if (platform instanceof TownPlatform && platform.kind === 'float' && !platform.boarded) {
                        platform.boarded = true;
                        audioManager.playSFX(SoundType.COLLECT);
                    }
                    this.standingOn = platform;
                    this.grounded = true;
                    this.velY = 0;
                    this.jumpsLeft = 2;
                    
                    if ((platform as any).isShaking) {
                        this.standingOnShakingPlatform = true;
                    }

                    if (platform instanceof Platform) {
                        if (platform.dx) this.x += platform.dx;
                        if (platform.dy) this.y += platform.dy;
                    }
                }
            } else if (dir === "t") {
                this.velY *= -1;
            }
        });
    }

    draw(ctx: CanvasRenderingContext2D, camX: number, currentLevel: number) {
        if (this.invincibleTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) return;

        const x = this.x - camX;
        const y = this.y;

        if (this.isReading) {
            const skin = this.accessories.has('goose') ? 'goose' : this.accessories.has('cat') ? 'cat' : this.accessories.has('fox') ? 'fox' : 'onyx';
            ctx.save(); ctx.translate(x + 20, y + 40); ctx.scale(.85, .85);
            if (skin === 'goose') { ctx.scale(1, .7); drawGoose(ctx, -20, -40, this.readingTime, false); drawAccessories(ctx, -20, -40, this.accessories); }
            else drawCurledHusky(ctx, skin, -20, -40, this.readingTime, gfxSettings.visualMode === 'classic');
            ctx.restore();
            if (skin !== 'goose') {
                const head = new Set<Accessory>(), body = new Set<Accessory>();
                for (const item of this.accessories) (HEADWEAR.includes(item) || item === 'collar' || item === 'scarf' ? head : body).add(item);
                drawAccessories(ctx, x - 9, y - 1, body); drawAccessories(ctx, x + 3, y + 11, head);
            }
            return;
        }
        
        ctx.save();
        if (this.spinTimer > 0) {
            const phase = (360 - this.spinTimer) / 60 * Math.PI * 2;
            ctx.strokeStyle = '#edc975'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.ellipse(x + 20, y + 38, 29, 6, 0, phase, phase + 4.7); ctx.stroke();
            for (let i = 0; i < 3; i++) { const a = phase + i * 2.1; ctx.fillStyle = ['#ebc878', '#78b5ad', '#daa4b9'][i]; ctx.beginPath(); ctx.arc(x + 20 + Math.cos(a) * 29, y + 16 + Math.sin(a) * 14, 2, 0, Math.PI * 2); ctx.fill(); }
            ctx.translate(x + 20, y + 40); ctx.scale(Math.cos(phase), 1); ctx.translate(-x - 20, -y - 40);
        }
        if (!this.facingRight) {
            ctx.translate(x + this.w / 2, y);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.w / 2), -y);
        }

        const skin = this.accessories.has('goose') ? 'goose' : this.accessories.has('cat') ? 'cat' : this.accessories.has('fox') ? 'fox' : undefined;
        if (gfxSettings.visualMode === 'enhanced' || skin) {
            if (this.hasUmbrella && this.facingRight) this.drawHeldUmbrella(ctx, x, y);
            if (skin === 'goose') {
                drawGoose(ctx, x, y, Date.now() / 1000, Math.abs(this.velX) > .5);
                if (currentLevel === 6) { ctx.fillStyle = '#c0392b'; ctx.fillRect(x - 5, y + 39, 52, 3); }
                if (currentLevel === 8) { ctx.strokeStyle = '#4dbbd0'; ctx.lineWidth = 3; ctx.strokeRect(x + 30, y - 2, 12, 8); }
            } else drawHuskyEnhanced(ctx, x, y, {
                velX: this.velX,
                velY: this.velY,
                grounded: this.grounded,
                level: currentLevel,
                t: Date.now() / 1000,
                skin,
                classic: gfxSettings.visualMode === 'classic',
            });
            if (this.hasUmbrella && !this.facingRight) this.drawHeldUmbrella(ctx, x, y);
            drawAccessories(ctx, x, y, this.accessories);
            if (this.hasBandana) this.drawBandana(ctx, x, y);
            ctx.restore();
            return;
        }

        if (this.hasUmbrella && this.facingRight) {
             this.drawHeldUmbrella(ctx, x, y);
        }

        if (currentLevel === 6) {
            ctx.fillStyle = "#c0392b"; 
            ctx.fillRect(x - 5, y + 38, 50, 4);
            ctx.beginPath();
            ctx.moveTo(x + 45, y + 38);
            ctx.quadraticCurveTo(x + 50, y + 35, x + 50, y + 30);
            ctx.stroke();
        }

        ctx.fillStyle = "#95a5a6";
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 25, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 28, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#95a5a6";
        ctx.beginPath();
        ctx.arc(x + 32, y + 10, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.arc(x + 34, y + 12, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#95a5a6";
        ctx.beginPath();
        ctx.moveTo(x + 25, y + 2);
        ctx.lineTo(x + 28, y - 8); 
        ctx.lineTo(x + 32, y + 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 32, y + 2);
        ctx.lineTo(x + 36, y - 8); 
        ctx.lineTo(x + 39, y + 2);
        ctx.fill();

        ctx.fillStyle = "#3498db";
        ctx.beginPath();
        ctx.arc(x + 34, y + 8, 2, 0, Math.PI * 2);
        ctx.fill();

        if (currentLevel !== 8) {
            ctx.fillStyle = "#2c3e50";
            ctx.beginPath();
            ctx.arc(x + 38, y + 11, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 20);
        ctx.quadraticCurveTo(x - 5, y + 10, x + 5, y + 10);
        ctx.quadraticCurveTo(x + 10, y + 15, x + 5, y + 20);
        ctx.fill();

        ctx.fillStyle = "#ecf0f1";
        const legOffset = Math.sin(Date.now() / 100) * (Math.abs(this.velX) > 0.5 ? 5 : 0);
        if (currentLevel === 8) {
             ctx.fillStyle = "#e67e22"; 
             ctx.beginPath(); ctx.moveTo(x + 10 - legOffset, y + 40); ctx.lineTo(x, y + 50); ctx.lineTo(x + 20, y + 50); ctx.fill();
             ctx.beginPath(); ctx.moveTo(x + 30 + legOffset, y + 40); ctx.lineTo(x + 20, y + 50); ctx.lineTo(x + 40, y + 50); ctx.fill();
        } else {
            ctx.fillRect(x + 30 + legOffset, y + 30, 6, 10);
            ctx.fillRect(x + 10 - legOffset, y + 30, 6, 10);
        }

        if (this.hasUmbrella && !this.facingRight) {
             this.drawHeldUmbrella(ctx, x, y);
        }

        drawAccessories(ctx, x, y, this.accessories);
        if (this.hasBandana) this.drawBandana(ctx, x, y);
        ctx.restore();
    }

    private drawBandana(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.fillStyle = "#ffd268";
        ctx.beginPath(); ctx.moveTo(x + 23, y + 18); ctx.lineTo(x + 39, y + 18); ctx.lineTo(x + 28, y + 31); ctx.fill();
        ctx.fillStyle = "#b65c3d"; ctx.fillRect(x + 29, y + 20, 3, 3);
    }

    private drawHeldUmbrella(ctx: CanvasRenderingContext2D, x: number, y: number) {
        const xOff = 35;
        const yOff = this.isGliding ? -20 : 0;
        
        ctx.save();
        ctx.translate(x + xOff, y + 20 + yOff);
        
        if (this.isGliding) {
             ctx.rotate(Math.sin(Date.now()/100) * 0.1);
        } else {
             ctx.rotate(-0.2);
        }

        ctx.fillStyle = "#ecf0f1"; 
        ctx.fillRect(-2, -30, 4, 30);
        
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI, false);
        ctx.strokeStyle = "#ecf0f1";
        ctx.stroke();

        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(0, -30, 25, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.arc(0, -30, 25, Math.PI * 1.2, Math.PI * 1.4);
        ctx.lineTo(0, -30);
        ctx.arc(0, -30, 25, Math.PI * 1.6, Math.PI * 1.8);
        ctx.fill();

        ctx.restore();
    }
}
