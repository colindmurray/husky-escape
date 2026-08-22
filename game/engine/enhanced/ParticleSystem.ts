
// Visual particle system for Enhanced mode.
//
// Strictly read-only with respect to the world: every frame we OBSERVE player
// velocity/grounding/bone-count and emit cosmetic particles in response
// (landing dust, jump puffs, collect sparkles, speed lines) plus per-level
// ambience (snow, rain, bubbles, fireflies, sand, embers). None of this can
// affect physics, collisions or timing.

import { World } from "../World";

interface Particle {
    x: number; y: number;          // screen-space position
    vx: number; vy: number;
    life: number; maxLife: number;
    size: number;
    color: string;
    gravity: number;
    drag: number;
    kind: 'dot' | 'streak' | 'spark' | 'bubble' | 'flake' | 'rain' | 'glow';
}

interface EmitterCfg {
    count: number;
    spawn: (w: number, h: number, camX: number) => Particle;
}

const MAX_PARTICLES = 420;

export class ParticleSystem {
    private particles: Particle[] = [];
    private lastGrounded = false;
    private lastVelY = 0;
    private lastBones = 0;
    private lastLevel = -1;

    public updateAndDraw(ctx: CanvasRenderingContext2D, world: World) {
        const { width: w, height: h, cameraX: camX, currentLevel: level } = world;
        const p = world.player;

        if (level !== this.lastLevel) {
            this.particles.length = 0;
            this.lastBones = p ? p.bonesCollected : 0;
            this.lastLevel = level;
        }

        // ---- Gameplay-reactive emission (observation only) ----
        if (p) {
            // Landing dust puff
            if (p.grounded && !this.lastGrounded && Math.abs(this.lastVelY) > 4) {
                const n = Math.min(10, 3 + Math.floor(Math.abs(this.lastVelY)));
                for (let i = 0; i < n; i++) {
                    const dir = i % 2 === 0 ? 1 : -1;
                    this.particles.push({
                        x: p.x - camX + p.w / 2 + dir * (4 + Math.random() * 12),
                        y: p.y + p.h - 2,
                        vx: dir * (0.6 + Math.random() * 1.8),
                        vy: -(0.3 + Math.random() * 0.9),
                        life: 0, maxLife: 26 + Math.random() * 16,
                        size: 2 + Math.random() * 3,
                        color: this.dustColor(level),
                        gravity: 0.02, drag: 0.92,
                        kind: 'dot',
                    });
                }
            }
            // Jump puff
            if (!p.grounded && this.lastGrounded) {
                for (let i = 0; i < 5; i++) {
                    const dir = i % 2 === 0 ? 1 : -1;
                    this.particles.push({
                        x: p.x - camX + p.w / 2 + dir * 6,
                        y: p.y + p.h - 4,
                        vx: dir * (0.4 + Math.random()),
                        vy: 0.2 + Math.random() * 0.5,
                        life: 0, maxLife: 20,
                        size: 1.6 + Math.random() * 2.2,
                        color: this.dustColor(level),
                        gravity: 0.01, drag: 0.93,
                        kind: 'dot',
                    });
                }
            }
            // Bone collect sparkle burst
            if (p.bonesCollected > this.lastBones) {
                for (let g = 0; g < 14; g++) {
                    const ang = (g / 14) * Math.PI * 2;
                    const spd = 1.2 + Math.random() * 1.6;
                    this.particles.push({
                        x: p.x - camX + p.w / 2,
                        y: p.y + p.h / 2,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd - 0.5,
                        life: 0, maxLife: 30 + Math.random() * 18,
                        size: 1.4 + Math.random() * 2,
                        color: '#ffe9a3',
                        gravity: 0.015, drag: 0.95,
                        kind: 'spark',
                    });
                }
                this.lastBones = p.bonesCollected;
            }
            // Speed lines when really moving fast (ski / chase levels)
            if ((level === 6 || level === 7) && Math.abs(p.velX) > 6) {
                this.particles.push({
                    x: p.facingRight ? -20 : w + 20,
                    y: p.y + Math.random() * 60,
                    vx: p.facingRight ? 14 + Math.random() * 8 : -(14 + Math.random() * 8),
                    vy: 0,
                    life: 0, maxLife: 22,
                    size: 1.5,
                    color: 'rgba(255,255,255,0.5)',
                    gravity: 0, drag: 1,
                    kind: 'streak',
                });
            }

            this.lastGrounded = p.grounded;
            this.lastVelY = p.velY;
        }

        // ---- Ambient emitters ----
        switch (level) {
            case 1:
            case 2: this.emitAmbient(w, h, camX, 0.35, (x, y) => this.mote(x, y)); break;
            case 3: this.emitAmbient(w, h, camX, 0.22, (x, y) => this.firefly(x, y)); break;
            case 4: this.emitAmbient(w, h, camX, 0.3, (x, y) => this.sandGrain(x, y)); break;
            case 5:
            case 6: this.emitAmbient(w, h, camX, 0.9, (x, y) => this.snowFlake(x, y)); break;
            case 7: this.emitAmbient(w, h, camX, 0.25, (x, y) => this.petal(x, y)); break;
            case 8: this.emitAmbient(w, h, camX, 0.55, (x, y) => this.bubble(x, y)); break;
            case 9: this.emitAmbient(w, h, camX, 1.6, (x, y) => this.rainDrop(x, y)); break;
            case 10: this.emitAmbient(w, h, camX, 0.4, (x, y) => this.ember(x, y)); break;
            case 11: this.emitAmbient(w, h, camX, 0.5, (x, y) => this.neonMote(x, y)); break;
        }

        // ---- Update & draw ----
        ctx.save();
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const q = this.particles[i];
            q.life++;
            q.vx *= q.drag;
            q.vy *= q.drag;
            q.vy += q.gravity;
            q.x += q.vx;
            q.y += q.vy;

            if (q.life >= q.maxLife || q.x < -60 || q.x > w + 60 || q.y > h + 40) {
                this.particles.splice(i, 1);
                continue;
            }

            const fade = 1 - q.life / q.maxLife;
            switch (q.kind) {
                case 'streak':
                    ctx.strokeStyle = q.color;
                    ctx.globalAlpha = fade * 0.7;
                    ctx.lineWidth = q.size;
                    ctx.beginPath();
                    ctx.moveTo(q.x, q.y);
                    ctx.lineTo(q.x - q.vx * 3, q.y);
                    ctx.stroke();
                    break;
                case 'spark':
                    ctx.globalAlpha = fade;
                    ctx.fillStyle = q.color;
                    ctx.beginPath();
                    ctx.arc(q.x, q.y, q.size * fade, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'bubble': {
                    ctx.globalAlpha = fade * 0.65;
                    ctx.strokeStyle = 'rgba(210,240,255,0.9)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(220,245,255,0.35)';
                    ctx.beginPath();
                    ctx.arc(q.x - q.size * 0.3, q.y - q.size * 0.3, q.size * 0.28, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'rain':
                    ctx.globalAlpha = fade * 0.55;
                    ctx.strokeStyle = 'rgba(170,200,255,0.9)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(q.x, q.y);
                    ctx.lineTo(q.x - 2, q.y + 11);
                    ctx.stroke();
                    break;
                default:
                    ctx.globalAlpha = fade * 0.85;
                    ctx.fillStyle = q.color;
                    ctx.beginPath();
                    ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
                    ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        if (this.particles.length > MAX_PARTICLES) {
            this.particles.splice(0, this.particles.length - MAX_PARTICLES);
        }
    }

    private emitAmbient(w: number, h: number, camX: number, rate: number, make: (x: number, y: number) => Particle) {
        // Fractional accumulation via random threshold keeps counts stable-ish
        let n = Math.floor(rate);
        if (Math.random() < rate - n) n++;
        for (let i = 0; i < n; i++) {
            const q = make(Math.random() * w, -10 + Math.random() * (h + 10));
            // Store world-independent screen coords; ambient particles don't scroll with camera
            // except a slight parallax drift to sell motion.
            q.vx -= 0;
            void camX;
            this.particles.push(q);
        }
    }

    private dustColor(level: number): string {
        switch (level) {
            case 4: return '#e8d29a';
            case 5:
            case 6: return '#ffffff';
            case 3: return '#4a3b2c';
            case 8: return 'rgba(180,220,255,0.8)';
            case 10: return '#6b5646';
            case 11: return '#9a86b8';
            default: return '#9aa4ad';
        }
    }

    // ---- Ambient factories ----
    private mote(x: number, y: number): Particle {
        return {
            x, y, vx: (Math.random() - 0.5) * 0.2, vy: -(0.05 + Math.random() * 0.15),
            life: 0, maxLife: 160 + Math.random() * 120,
            size: 0.8 + Math.random() * 1.2,
            color: 'rgba(255,244,214,0.5)',
            gravity: 0, drag: 1, kind: 'dot',
        };
    }

    private firefly(x: number, y: number): Particle {
        return {
            x, y: y * 0.75 + Math.random() * 10, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.35,
            life: 0, maxLife: 140 + Math.random() * 100,
            size: 1.2 + Math.random(),
            color: 'rgba(190,255,120,0.9)',
            gravity: 0, drag: 0.99, kind: 'glow',
        };
    }

    private sandGrain(x: number, _y: number): Particle {
        return {
            x, y: _y, vx: 1.2 + Math.random() * 1.4, vy: (Math.random() - 0.3) * 0.4,
            life: 0, maxLife: 90 + Math.random() * 60,
            size: 0.8 + Math.random(),
            color: 'rgba(240,222,170,0.55)',
            gravity: 0.002, drag: 0.99, kind: 'dot',
        };
    }

    private snowFlake(x: number, _y: number): Particle {
        return {
            x, y: -10, vx: (Math.random() - 0.5) * 0.6, vy: 0.6 + Math.random() * 1.1,
            life: 0, maxLife: 400,
            size: 1 + Math.random() * 2.1,
            color: 'rgba(255,255,255,0.92)',
            gravity: 0.001, drag: 1, kind: 'flake',
        };
    }

    private petal(x: number, _y: number): Particle {
        return {
            x, y: -10, vx: -0.8 - Math.random() * 0.8, vy: 0.8 + Math.random() * 0.8,
            life: 0, maxLife: 300,
            size: 1.4 + Math.random() * 1.4,
            color: 'rgba(255,220,150,0.7)',
            gravity: 0.002, drag: 0.999, kind: 'flake',
        };
    }

    private bubble(x: number, y: number): Particle {
        return {
            x, y: y + 20, vx: (Math.random() - 0.5) * 0.3, vy: -(0.5 + Math.random() * 0.9),
            life: 0, maxLife: 130 + Math.random() * 90,
            size: 1.4 + Math.random() * 2.6,
            color: '',
            gravity: -0.002, drag: 0.995, kind: 'bubble',
        };
    }

    private rainDrop(x: number, _y: number): Particle {
        return {
            x, y: -12, vx: -1.4, vy: 11 + Math.random() * 4,
            life: 0, maxLife: 90,
            size: 1,
            color: '',
            gravity: 0.12, drag: 1, kind: 'rain',
        };
    }

private neonMote(x: number, y: number): Particle {
        const pink = Math.random() > 0.5;
        return {
            x, y: y * 0.9, vx: (Math.random() - 0.5) * 0.4, vy: -(0.15 + Math.random() * 0.35),
            life: 0, maxLife: 130 + Math.random() * 100,
            size: 1 + Math.random() * 1.6,
            color: pink ? 'rgba(255,110,190,0.75)' : 'rgba(110,240,225,0.75)',
            gravity: -0.001, drag: 0.995, kind: 'glow',
        };
    }

    private ember(x: number, y: number): Particle {
        return {
            x, y: y + 20, vx: (Math.random() - 0.5) * 0.5 - 0.3, vy: -(0.3 + Math.random() * 0.6),
            life: 0, maxLife: 120 + Math.random() * 80,
            size: 1 + Math.random() * 1.4,
            color: Math.random() > 0.4 ? 'rgba(255,150,60,0.85)' : 'rgba(255,210,110,0.8)',
            gravity: -0.001, drag: 0.995, kind: 'glow',
        };
    }
}
