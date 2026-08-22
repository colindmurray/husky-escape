
import { Entity, GRAVITY, FRICTION, JUMP_FORCE } from "./Entity";
import { InputState, SoundType } from "../../types";
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

    public standingOnShakingPlatform = false;

    constructor(x: number, y: number) {
        super(x, y, 40, 40, '#ecf0f1');
    }

    update(platforms?: Entity[], input?: InputState, height?: number, currentLevel?: number) {
        if (!platforms || !input || height === undefined || currentLevel === undefined) return;
        
        if (this.invincibleTimer > 0) this.invincibleTimer--;

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
                this.velY = JUMP_FORCE;
                this.jumpsLeft--;
                this.grounded = false;
                this.jumpKeyHeld = true;
                audioManager.playSFX(SoundType.JUMP);
            }
        } else {
            this.jumpKeyHeld = false;
        }

        if (input.ArrowLeft) {
            this.velX -= 0.7;
            this.facingRight = false;
        }
        if (input.ArrowRight) {
            this.velX += 0.7;
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
                this.velY = -14; 
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
        
        ctx.save();
        if (!this.facingRight) {
            ctx.translate(x + this.w / 2, y);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.w / 2), -y);
        }

        // Enhanced mode: fully redrawn animated husky (purely visual)
        if (gfxSettings.visualMode === 'enhanced') {
            if (this.hasUmbrella && this.facingRight) this.drawHeldUmbrella(ctx, x, y);
            drawHuskyEnhanced(ctx, x, y, {
                velX: this.velX,
                velY: this.velY,
                grounded: this.grounded,
                level: currentLevel,
                t: Date.now() / 1000,
            });
            if (this.hasUmbrella && !this.facingRight) this.drawHeldUmbrella(ctx, x, y);
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

        ctx.restore();
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
