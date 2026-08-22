
// Post-processing & lighting polish for Enhanced mode.
// Applies per-level color grading, a soft vignette, and an additive "glow pass"
// over gameplay-relevant objects (bones, exit, boss weak points). All purely
// cosmetic — drawn after the world, mutating nothing.

import { World } from "../World";

interface Grade {
    top?: [number, number, number, number];      // rgba tint at top
    bottom?: [number, number, number, number];   // rgba tint at bottom
    mode?: GlobalCompositeOperation;
    alpha?: number;
}

const GRADES: Record<number, Grade> = {
    1: { top: [40, 70, 140, 0.10], bottom: [10, 20, 50, 0.16], mode: 'multiply', alpha: 1 },
    2: { top: [60, 60, 130, 0.08], bottom: [120, 70, 80, 0.12], mode: 'multiply', alpha: 1 },
    3: { top: [20, 25, 70, 0.14], bottom: [30, 45, 60, 0.18], mode: 'multiply', alpha: 1 },
    4: { top: [255, 240, 180, 0.06], bottom: [255, 200, 120, 0.07], mode: 'screen', alpha: 1 },
    5: { top: [180, 210, 255, 0.08], bottom: [255, 255, 255, 0.05], mode: 'screen', alpha: 1 },
    6: { top: [190, 220, 255, 0.09], bottom: [255, 255, 255, 0.06], mode: 'screen', alpha: 1 },
    7: { top: [160, 220, 255, 0.07], bottom: [255, 250, 200, 0.05], mode: 'screen', alpha: 1 },
    8: { top: [90, 200, 255, 0.10], bottom: [10, 40, 90, 0.22], mode: 'multiply', alpha: 1 },
    9: { top: [15, 25, 60, 0.18], bottom: [5, 10, 25, 0.2], mode: 'multiply', alpha: 1 },
    10: { top: [40, 30, 90, 0.12], bottom: [255, 140, 60, 0.10], mode: 'screen', alpha: 1 },
    11: { top: [60, 20, 110, 0.16], bottom: [180, 60, 220, 0.08], mode: 'screen', alpha: 1 },
};

export class PostFX {
    private vignetteCache: { key: string; canvas: HTMLCanvasElement } | null = null;

    public apply(ctx: CanvasRenderingContext2D, world: World) {
        const { width: w, height: h, currentLevel: level } = world;
        this.applyGrade(ctx, w, h, level);
        this.applyVignette(ctx, w, h, level === 3 || level === 9 ? 0.55 : 0.32);
    }

    private applyGrade(ctx: CanvasRenderingContext2D, w: number, h: number, level: number) {
        const g = GRADES[level];
        if (!g) return;

        if (g.top) {
            const grad = ctx.createLinearGradient(0, 0, 0, h * (g.bottom ? 0.6 : 1));
            grad.addColorStop(0, `rgba(${g.top[0]},${g.top[1]},${g.top[2]},${g.top[3]})`);
            grad.addColorStop(1, `rgba(${g.top[0]},${g.top[1]},${g.top[2]},0)`);
            ctx.globalCompositeOperation = g.mode || 'source-over';
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }
        if (g.bottom) {
            const grad = ctx.createLinearGradient(0, h * 0.5, 0, h);
            grad.addColorStop(0, `rgba(${g.bottom[0]},${g.bottom[1]},${g.bottom[2]},0)`);
            grad.addColorStop(1, `rgba(${g.bottom[0]},${g.bottom[1]},${g.bottom[2]},${g.bottom[3]})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    /** Cached radial vignette so we don't rebuild the gradient every frame. */
    public applyVignettePublic(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) {
        this.applyVignette(ctx, w, h, strength);
    }

    private applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) {
        const key = `${w}x${h}:${strength}`;
        if (!this.vignetteCache || this.vignetteCache.key !== key) {
            const c = document.createElement('canvas');
            c.width = Math.max(2, Math.floor(w / 2));
            c.height = Math.max(2, Math.floor(h / 2));
            const cctx = c.getContext('2d')!;
            const grad = cctx.createRadialGradient(
                c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.42,
                c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.72
            );
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, `rgba(4,6,14,${strength})`);
            cctx.fillStyle = grad;
            cctx.fillRect(0, 0, c.width, c.height);
            this.vignetteCache = { key, canvas: c };
        }
        ctx.drawImage(this.vignetteCache.canvas, 0, 0, w, h);
    }

    /**
     * Additive glow halos over objects that matter gameplay-wise so they read
     * clearly against the richer backgrounds.
     */
    public drawGlows(ctx: CanvasRenderingContext2D, world: World) {
        const camX = world.cameraX;
        const t = performance.now() / 1000;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Bones: warm pulsing halo
        for (const bone of world.collectibles) {
            if (bone.markedForDeletion) continue;
            const x = bone.x - camX + bone.w / 2;
            const y = bone.y + bone.floatY + bone.h / 2;
            const pulse = 0.5 + 0.5 * Math.sin(t * 3 + bone.x * 0.01);
            const r = 16 + pulse * 4;
            const g = ctx.createRadialGradient(x, y, 2, x, y, r);
            g.addColorStop(0, 'rgba(255,235,170,0.34)');
            g.addColorStop(1, 'rgba(255,235,170,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Exit door: green beacon glow
        if (world.exit && !world.exit.locked) {
            const ex = world.exit.x - camX + world.exit.w / 2;
            const ey = world.exit.y + world.exit.h / 2;
            const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
            const g = ctx.createRadialGradient(ex, ey, 8, ex, ey, 60 + pulse * 10);
            g.addColorStop(0, 'rgba(80,255,150,0.28)');
            g.addColorStop(1, 'rgba(80,255,150,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(ex, ey, 70, 0, Math.PI * 2);
            ctx.fill();
            // Rising light motes above unlocked exit
            for (let i = 0; i < 4; i++) {
                const my = ey + 30 - (((t * 26) + i * 23) % 70);
                const ma = 0.35 * (1 - ((t * 26 + i * 23) % 70) / 70);
                ctx.fillStyle = `rgba(140,255,180,${ma})`;
                ctx.beginPath();
                ctx.arc(ex - 14 + i * 9, my, 1.6, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Player soft rim light (helps the husky pop on dark levels)
        if (world.player) {
            const p = world.player;
            const px = p.x - camX + p.w / 2;
            const py = p.y + p.h / 2;
            const g = ctx.createRadialGradient(px, py, 6, px, py, 44);
            g.addColorStop(0, 'rgba(200,225,255,0.13)');
            g.addColorStop(1, 'rgba(200,225,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(px, py, 46, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
