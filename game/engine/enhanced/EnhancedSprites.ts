
// Enhanced gameplay sprites (Enhanced visual mode only).
// Every classic sprite routine stays intact in its entity class; these are
// richer alternates selected at draw-time purely by presentation mode.
// Nothing here mutates game state — all functions only paint.

import { hash2 } from "./Rng";

const TAU = Math.PI * 2;

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

/** Soft ambient-occlusion shadow puddle under a platform edge. */
export function drawEdgeShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const g = ctx.createLinearGradient(0, y + h, 0, y + h + 14);
    g.addColorStop(0, 'rgba(0,0,0,0.28)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y + h, w, 14);
}

/**
 * Material-aware platform rendering per level theme. Adds beveled tops,
 * texture grain and edge shading while preserving each zone's identity.
 */
export function drawPlatformEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, level: number
) {
    const seedBase = Math.floor(x * 0.13);

    // Shared: darken underside so platforms feel solid
    const under = ctx.createLinearGradient(0, y + h * 0.35, 0, y + h);
    switch (level) {
        case 1:
        case 2: {
            // Pound: riveted steel panels
            const body = ctx.createLinearGradient(0, y, 0, y + h);
            body.addColorStop(0, '#7b8794');
            body.addColorStop(0.18, '#5d6a76');
            body.addColorStop(1, '#39434e');
            ctx.fillStyle = body;
            ctx.fillRect(x, y, w, h);
            // Panel seams
            ctx.strokeStyle = 'rgba(20,26,32,0.55)';
            ctx.lineWidth = 2;
            for (let px = 40; px < w; px += 80) {
                ctx.beginPath();
                ctx.moveTo(x + px, y + 4);
                ctx.lineTo(x + px, y + h);
                ctx.stroke();
            }
            // Rivets
            ctx.fillStyle = 'rgba(190,200,210,0.5)';
            for (let rx = 10; rx < w; rx += 26) {
                ctx.beginPath(); ctx.arc(x + rx, y + 8, 1.8, 0, TAU); ctx.fill();
                ctx.beginPath(); ctx.arc(x + rx, y + h - 6, 1.8, 0, TAU); ctx.fill();
            }
            // Worn top highlight
            ctx.fillStyle = 'rgba(220,230,240,0.25)';
            ctx.fillRect(x, y, w, 3);
            break;
        }
        case 3: {
            // Forest: gnarled dark wood with mossy fringe
            const body = ctx.createLinearGradient(0, y, 0, y + h);
            body.addColorStop(0, '#4a3526');
            body.addColorStop(0.25, '#3a2a1e');
            body.addColorStop(1, '#241a12');
            ctx.fillStyle = body;
            ctx.fillRect(x, y, w, h);
            // Wood grain
            ctx.strokeStyle = 'rgba(20,12,6,0.4)';
            ctx.lineWidth = 1.6;
            for (let gy = y + 10; gy < y + h; gy += 9) {
                ctx.beginPath();
                ctx.moveTo(x + 3, gy);
                ctx.bezierCurveTo(x + w * 0.3, gy + 2, x + w * 0.6, gy - 2, x + w - 3, gy + 1);
                ctx.stroke();
            }
            // Moss cap with tufts
            const moss = ctx.createLinearGradient(0, y, 0, y + 16);
            moss.addColorStop(0, '#2f7a52');
            moss.addColorStop(1, '#1b4d3e');
            ctx.fillStyle = moss;
            ctx.fillRect(x, y, w, 14);
            for (let tx2 = 6; tx2 < w; tx2 += 11) {
                const th = 4 + hash2(seedBase + tx2, 3) * 5;
                ctx.beginPath();
                ctx.moveTo(x + tx2 - 3, y + 2);
                ctx.quadraticCurveTo(x + tx2, y - th, x + tx2 + 3, y + 2);
                ctx.fill();
            }
            break;
        }
        case 4: {
            // Beach: sunlit sand with speckle and damp base
            const body = ctx.createLinearGradient(0, y, 0, y + h);
            body.addColorStop(0, '#f7dc8a');
            body.addColorStop(0.5, '#eec95e');
            body.addColorStop(1, '#cf9f3a');
            ctx.fillStyle = body;
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = 'rgba(160,110,40,0.35)';
            for (let i = 0; i < w * h / 260; i++) {
                const sxp = hash2(seedBase + i, 11) * w;
                const syp = y + 4 + hash2(seedBase + i, 23) * (h - 6);
                ctx.fillRect(x + sxp, syp, 2, 1.4);
            }
            ctx.fillStyle = 'rgba(255,250,230,0.45)';
            ctx.fillRect(x, y, w, 3);
            ctx.fillStyle = 'rgba(120,80,30,0.35)';
            ctx.fillRect(x, y + h - 4, w, 4);
            break;
        }
        case 5:
        default: {
            // Mountain / generic: rocky earth with grassy fringe
            const body = ctx.createLinearGradient(0, y, 0, y + h);
            body.addColorStop(0, '#6b5646');
            body.addColorStop(0.3, '#57443A');
            body.addColorStop(1, '#3a2c24');
            ctx.fillStyle = body;
            ctx.fillRect(x, y, w, h);
            // Grass cap
            const grass = ctx.createLinearGradient(0, y - 2, 0, y + 15);
            grass.addColorStop(0, '#54c96e');
            grass.addColorStop(1, '#2fa052');
            ctx.fillStyle = grass;
            ctx.fillRect(x, y, w, 13);
            // Blade tufts
            ctx.strokeStyle = '#3dbb63';
            ctx.lineWidth = 1.6;
            ctx.lineCap = 'round';
            for (let gx2 = 5; gx2 < w; gx2 += 9) {
                const lean = (hash2(seedBase + gx2, 7) - 0.5) * 5;
                ctx.beginPath();
                ctx.moveTo(x + gx2, y + 2);
                ctx.quadraticCurveTo(x + gx2 + lean, y - 4, x + gx2 + lean * 1.6, y - 7);
                ctx.stroke();
            }
            // Rock flecks
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            for (let i = 0; i < w / 22; i++) {
                const fx = hash2(seedBase + i, 31) * w;
                const fy = y + 18 + hash2(seedBase + i, 37) * Math.max(4, h - 22);
                ctx.beginPath(); ctx.arc(x + fx, fy, 1.6 + hash2(i, 41), 0, TAU); ctx.fill();
            }
            break;
        }
        case 6: {
            // Ski: packed snow over ice with sparkle glints
            const body = ctx.createLinearGradient(0, y, 0, y + h);
            body.addColorStop(0, '#ffffff');
            body.addColorStop(0.35, '#eef5fc');
            body.addColorStop(1, '#c9dded');
            ctx.fillStyle = body;
            ctx.fillRect(x, y, w, h);
            // Ice glints
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            for (let i = 0; i < w / 30; i++) {
                const sxp = hash2(seedBase + i, 51) * w;
                const syp = y + 6 + hash2(seedBase + i, 53) * Math.max(4, h - 10);
                const tw = hash2(seedBase + i, 57);
                if (tw > 0.55) { ctx.fillRect(x + sxp, syp, 3, 1.2); }
            }
            // Crisp shaded lip
            ctx.fillStyle = 'rgba(140,175,205,0.5)';
            ctx.fillRect(x, y + h - 3, w, 3);
            ctx.fillStyle = 'rgba(160,195,225,0.65)';
            ctx.fillRect(x, y + 10, w, 2);
            break;
        }
        case 7: {
            // Chase: grassy parkland over dirt road bed
            const body = ctx.createLinearGradient(0, y, 0, y + h);
            body.addColorStop(0, '#6a4f38');
            body.addColorStop(1, '#463324');
            ctx.fillStyle = body;
            ctx.fillRect(x, y, w, h);
            const grass = ctx.createLinearGradient(0, y, 0, y + 16);
            grass.addColorStop(0, '#66c05a');
            grass.addColorStop(1, '#3f9440');
            ctx.fillStyle = grass;
            ctx.fillRect(x, y, w, 13);
            ctx.strokeStyle = '#57b350';
            ctx.lineWidth = 1.6;
            for (let gx2 = 5; gx2 < w; gx2 += 10) {
                const lean = (hash2(seedBase + gx2, 61) - 0.5) * 6;
                ctx.beginPath();
                ctx.moveTo(x + gx2, y + 2);
                ctx.quadraticCurveTo(x + gx2 + lean, y - 4, x + gx2 + lean * 1.5, y - 7);
                ctx.stroke();
            }
            break;
        }
        case 8: {
            // Underwater: barnacled reef rock
            const body = ctx.createLinearGradient(0, y, 0, y + h);
            body.addColorStop(0, '#4e6a72');
            body.addColorStop(0.3, '#3c555e');
            body.addColorStop(1, '#26363d');
            ctx.fillStyle = body;
            ctx.fillRect(x, y, w, h);
            // Algae rim
            ctx.fillStyle = '#2f8f6a';
            ctx.fillRect(x, y, w, 8);
            ctx.fillStyle = 'rgba(70,180,130,0.75)';
            for (let bx = 4; bx < w; bx += 13) {
                ctx.beginPath();
                ctx.arc(x + bx, y + 3 + hash2(seedBase + bx, 67) * 3, 2.4, 0, TAU);
                ctx.fill();
            }
            // Barnacles
            ctx.fillStyle = 'rgba(210,225,225,0.5)';
            for (let i = 0; i < w / 26; i++) {
                const fx = hash2(seedBase + i, 71) * w;
                const fy = y + 14 + hash2(seedBase + i, 73) * Math.max(4, h - 18);
                ctx.beginPath(); ctx.arc(x + fx, fy, 2.2, 0, TAU); ctx.fill();
            }
            break;
        }
        case 9: {
            // Pier: weathered salt-crusted planks
            const body = ctx.createLinearGradient(0, y, 0, y + h);
            body.addColorStop(0, '#7a6046');
            body.addColorStop(0.4, '#644d38');
            body.addColorStop(1, '#463527');
            ctx.fillStyle = body;
            ctx.fillRect(x, y, w, h);
            // Plank gaps + nails
            ctx.strokeStyle = 'rgba(20,12,6,0.5)';
            ctx.lineWidth = 2;
            for (let px = 34; px < w; px += 34) {
                ctx.beginPath();
                ctx.moveTo(x + px, y + 2);
                ctx.lineTo(x + px, y + h);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(200,205,210,0.6)';
            for (let nx = 8; nx < w; nx += 17) {
                ctx.beginPath(); ctx.arc(x + nx, y + 5, 1.4, 0, TAU); ctx.fill();
            }
            // Salt-worn top
            ctx.fillStyle = 'rgba(215,220,225,0.3)';
            ctx.fillRect(x, y, w, 3);
            break;
        }
        case 11: {
            // Neon Metropolis: dark rooftops with neon edge strips
            const body = ctx.createLinearGradient(0, y, 0, y + h);
            body.addColorStop(0, '#3c3448');
            body.addColorStop(0.25, '#2a2436');
            body.addColorStop(1, '#181422');
            ctx.fillStyle = body;
            ctx.fillRect(x, y, w, h);
            // Tar & gravel roof flecks
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            for (let i = 0; i < w / 16; i++) {
                const fx2 = hash2(seedBase + i, 81) * w;
                const fy2 = y + 12 + hash2(seedBase + i, 83) * Math.max(4, h - 16);
                ctx.beginPath(); ctx.arc(x + fx2, fy2, 1.4, 0, TAU); ctx.fill();
            }
            // Neon edge strip: color varies per platform (cyan/magenta/pink)
            const huePick = hash2(seedBase, 87);
            const nc = huePick > 0.66 ? '80,240,220' : (huePick > 0.33 ? '255,70,170' : '170,110,255');
            const flicker = Math.sin(Date.now() / 130 + seedBase) > -0.92 ? 1 : 0.25;
            ctx.fillStyle = `rgba(${nc},${0.85 * flicker})`;
            ctx.fillRect(x, y, w, 4);
            // Under-glow
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const ug = ctx.createLinearGradient(0, y + 4, 0, y + 26);
            ug.addColorStop(0, `rgba(${nc},${0.28 * flicker})`);
            ug.addColorStop(1, `rgba(${nc},0)`);
            ctx.fillStyle = ug;
            ctx.fillRect(x, y + 4, w, 22);
            ctx.restore();
            // Fire-escape railings on narrow platforms
            if (w < 160) {
                ctx.strokeStyle = 'rgba(150,140,165,0.7)';
                ctx.lineWidth = 2;
                for (let rx = x + 8; rx < x + w - 4; rx += Math.max(18, w / 4)) {
                    ctx.beginPath();
                    ctx.moveTo(rx, y - 14);
                    ctx.lineTo(rx, y);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.moveTo(x + 4, y - 13);
                ctx.lineTo(x + w - 4, y - 13);
                ctx.stroke();
            } else {
                // AC units on wide roofs
                for (let ax = x + 30; ax < x + w - 40; ax += 120) {
                    ctx.fillStyle = '#454055';
                    ctx.fillRect(ax, y - 10, 26, 10);
                    ctx.fillStyle = 'rgba(210,200,230,0.35)';
                    ctx.fillRect(ax + 3, y - 13, 20, 3);
                }
            }
            break;
        }
        case 10: {
            // Construction site: steel scaffolding plating
            const body = ctx.createLinearGradient(0, y, 0, y + h);
            body.addColorStop(0, '#8a94a0');
            body.addColorStop(0.2, '#68727e');
            body.addColorStop(1, '#454e58');
            ctx.fillStyle = body;
            ctx.fillRect(x, y, w, h);
            // Cross-brace pattern
            ctx.strokeStyle = 'rgba(30,36,44,0.5)';
            ctx.lineWidth = 2;
            for (let px = 0; px < w; px += 44) {
                ctx.beginPath();
                ctx.moveTo(x + px, y + 3);
                ctx.lineTo(x + px + 44, y + h - 3);
                ctx.moveTo(x + px + 44, y + 3);
                ctx.lineTo(x + px, y + h - 3);
                ctx.stroke();
            }
            // Hazard-striped top edge
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, w, 6);
            ctx.clip();
            ctx.fillStyle = '#e8b23a';
            ctx.fillRect(x, y, w, 6);
            ctx.fillStyle = '#22262c';
            for (let hx2 = -6; hx2 < w; hx2 += 14) {
                ctx.beginPath();
                ctx.moveTo(x + hx2, y);
                ctx.lineTo(x + hx2 + 7, y);
                ctx.lineTo(x + hx2 + 13, y + 6);
                ctx.lineTo(x + hx2 + 6, y + 6);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            break;
        }
    }

    // Universal soft grounding shadow
    drawEdgeShadow(ctx, x, y, w, h);
}

/** Enhanced log platform (MovingPlatform) — bark rings, grain, moss patches. */
export function drawLogEnhanced(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const r = h / 2;
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#7a5a3e');
    grad.addColorStop(0.4, '#5d4037');
    grad.addColorStop(1, '#3a261d');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
    ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    // Bark streaks
    ctx.strokeStyle = 'rgba(30,18,10,0.45)';
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 3; i++) {
        const ly = y + (h * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.6, ly);
        ctx.bezierCurveTo(x + w * 0.3, ly + 2, x + w * 0.7, ly - 2, x + w - r * 0.6, ly);
        ctx.stroke();
    }

    // End rings
    for (const cx2 of [x + r, x + w - r]) {
        ctx.strokeStyle = 'rgba(46,28,16,0.85)';
        ctx.lineWidth = 2;
        for (let ring = r - 3; ring > 2; ring -= 4) {
            ctx.beginPath();
            ctx.arc(cx2, y + r, ring, 0, TAU);
            ctx.stroke();
        }
        ctx.fillStyle = '#8a6a48';
        ctx.beginPath();
        ctx.arc(cx2, y + r, 2, 0, TAU);
        ctx.fill();
    }

    // Moss tufts along top
    ctx.fillStyle = '#4a8a5a';
    for (let mx = r; mx < w - r; mx += 16) {
        ctx.beginPath();
        ctx.ellipse(x + mx, y + 2, 5, 2.4, 0, 0, TAU);
        ctx.fill();
    }

    drawEdgeShadow(ctx, x, y, w, h);
}

/** Enhanced collectible bone — warm ivory with spin shimmer. */
export function drawBoneEnhanced(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
    ctx.save();
    ctx.translate(x + 10, y);
    ctx.rotate(Math.sin(t * 2) * 0.18);

    // Shaft
    const shaft = ctx.createLinearGradient(0, -3, 0, 4);
    shaft.addColorStop(0, '#fffbe8');
    shaft.addColorStop(1, '#e8dcb0');
    ctx.strokeStyle = shaft;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();

    // Knobs
    ctx.fillStyle = '#fdf6da';
    for (const kx of [-8, 8]) {
        ctx.beginPath(); ctx.arc(kx, -2.4, 3.4, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(kx, 2.4, 3.4, 0, TAU); ctx.fill();
    }
    // Shading under knobs
    ctx.fillStyle = 'rgba(180,160,110,0.5)';
    for (const kx of [-8, 8]) {
        ctx.beginPath(); ctx.arc(kx, 3.2, 2.2, 0, TAU); ctx.fill();
    }
    // Glint
    const glint = (Math.sin(t * 3) + 1) / 2;
    if (glint > 0.72) {
        ctx.strokeStyle = `rgba(255,255,255,${(glint - 0.72) * 3})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-2, -4); ctx.lineTo(1, -1);
        ctx.moveTo(0, -5); ctx.lineTo(2.4, -2.6);
        ctx.stroke();
    }
    ctx.restore();
}

/** Enhanced exit — a warm lit doorway home. Locked shows heavy chains. */
export function drawExitEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, locked: boolean, t: number
) {    // Frame
    const frame = ctx.createLinearGradient(x - 5, y, x + w + 5, y + h);
    frame.addColorStop(0, '#8a7a5e');
    frame.addColorStop(0.5, '#6a5c42');
    frame.addColorStop(1, '#4a4030');
    ctx.fillStyle = frame;
    ctx.fillRect(x - 6, y - 6, w + 12, h + 8);

    if (!locked) {
        // Warm light spilling out of the open doorway
        const inner = ctx.createLinearGradient(0, y, 0, y + h);
        inner.addColorStop(0, '#ffe9a8');
        inner.addColorStop(0.5, '#ffc86e');
        inner.addColorStop(1, '#ffab4a');
        ctx.fillStyle = inner;
        ctx.fillRect(x, y, w, h);
        // Light rays pulsing outward
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 5; i++) {
            const a = -Math.PI / 2 + (i - 2) * 0.5 + Math.sin(t * 1.2 + i) * 0.08;
            const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, 90);
            g.addColorStop(0, 'rgba(255,220,150,0.22)');
            g.addColorStop(1, 'rgba(255,220,150,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y + h / 2);
            ctx.arc(x + w / 2, y + h / 2, 90, a - 0.18, a + 0.18);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
        // Door mat
        ctx.fillStyle = '#a33d2f';
        ctx.fillRect(x - 2, y + h - 10, w + 4, 10);
        // Sign post above
        ctx.fillStyle = '#5c4a32';
        ctx.fillRect(x + w / 2 - 3, y - 26, 6, 20);
        ctx.fillStyle = '#2f8f5a';
        ctx.fillRect(x - 4, y - 44, w + 8, 22);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + w / 2 + 2, y - 33);
        ctx.lineTo(x + w / 2 + 10, y - 33);
        ctx.moveTo(x + w / 2 + 7, y - 38);
        ctx.lineTo(x + w / 2 + 13, y - 33);
        ctx.lineTo(x + w / 2 + 7, y - 28);
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('HOME', x + w / 2, y - 30);
    } else {
        // Dark cold doorway
        const inner = ctx.createLinearGradient(0, y, 0, y + h);
        inner.addColorStop(0, '#3a3f45');
        inner.addColorStop(1, '#22262c');
        ctx.fillStyle = inner;
        ctx.fillRect(x, y, w, h);
        // Chains
        ctx.strokeStyle = '#1a1e24';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
        ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
        ctx.stroke();
        // Chain links highlights
        ctx.strokeStyle = 'rgba(150,160,170,0.4)';
        ctx.lineWidth = 1.4;
        for (let i = 1; i < 6; i++) {
            const lx = (x + (w * i) / 6), ly = (y + (h * i) / 6);
            ctx.beginPath(); ctx.arc(lx, ly, 3, 0, TAU); ctx.stroke();
            ctx.beginPath(); ctx.arc(x + w - lx + x, ly, 3, 0, TAU); ctx.stroke();
        }
        // Padlock
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(x + w / 2 - 11, y + h / 2 - 6, 22, 17);
        ctx.strokeStyle = '#c9a227';
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2 - 8, 8, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = '#6a5510';
        ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2 + 3, 2.6, 0, TAU); ctx.fill();
    }
}

export interface HuskyOpts {
    velX: number;
    velY: number;
    grounded: boolean;
    level: number;
    t: number; // seconds
}

/**
 * Fully redrawn husky for Enhanced mode (drawn facing right; the caller flips
 * via transform for left-facing). Adds run cycle, tail wag, ear wiggle, blink,
 * squash & stretch, and level-appropriate gear — same hitbox, zero gameplay
 * impact.
 */
export function drawHuskyEnhanced(ctx: CanvasRenderingContext2D, x: number, y: number, o: HuskyOpts) {
    const { velX, velY, grounded, level, t } = o;
    const speed = Math.abs(velX);
    const moving = grounded && speed > 0.5;
    const runPhase = t * (7 + speed * 1.4);
    const legSwing = moving ? Math.sin(runPhase) : 0;
    const bob = moving ? Math.abs(Math.sin(runPhase)) * 1.8 : 0;

    ctx.save();

    // Squash & stretch anchored at the feet
    const stretch = clamp(-velY * 0.014, -0.06, 0.12);
    ctx.translate(x + 20, y + 40);
    ctx.scale(1 - stretch * 0.45, 1 + stretch);
    ctx.translate(-(x + 20), -(y + 40));
    if (bob > 0) ctx.translate(0, -bob);

    // ---- Tail (behind everything), wagging harder the faster he runs ----
    const wag = Math.sin(t * 9) * clamp(speed * 1.1 + 2, 2, 8);
    ctx.lineCap = 'round';
    const tailGrad = ctx.createLinearGradient(x + 8, y + 24, x - 8, y + 10);
    tailGrad.addColorStop(0, '#8a99a5');
    tailGrad.addColorStop(1, '#b8c4cc');
    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 25);
    ctx.quadraticCurveTo(x - 2, y + 22 + wag * 0.25, x - 8 - wag * 0.35, y + 12 + wag * 0.2);
    ctx.stroke();
    // white tail tip
    ctx.strokeStyle = '#eef3f6';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 5 - wag * 0.28, y + 15 + wag * 0.16);
    ctx.lineTo(x - 8 - wag * 0.35, y + 12 + wag * 0.2);
    ctx.stroke();

    // ---- Back haunch ----
    const body = ctx.createLinearGradient(0, y + 12, 0, y + 38);
    body.addColorStop(0, '#aebcc6');
    body.addColorStop(0.55, '#93a3ad');
    body.addColorStop(1, '#75858f');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(x + 17, y + 26, 15.5, 12.5, 0, 0, TAU);
    ctx.fill();

    // ---- Belly patch ----
    ctx.fillStyle = '#f2f5f7';
    ctx.beginPath();
    ctx.ellipse(x + 21, y + 30, 10, 7, 0, 0, TAU);
    ctx.fill();

    // ---- Legs (four-paw trot) or flippers underwater ----
    if (level === 8) {
        // Orange swim flippers kicking continuously
        const kick = Math.sin(t * 6);
        ctx.fillStyle = '#e67e22';
        for (const [lx, dir] of [[11, -1], [29, 1]] as const) {
            ctx.save();
            ctx.translate(x + lx, y + 36);
            ctx.rotate(kick * 0.35 * dir);
            ctx.beginPath();
            ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.lineTo(dir * 8, 12); ctx.lineTo(dir * 8 - 8, 12);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    } else {
        const drawLeg = (lx: number, phase: number, shade: string) => {
            const sw = grounded ? legSwing * phase * 4 : (velY < 0 ? -2.5 : 2);
            ctx.strokeStyle = shade;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(x + lx, y + 31);
            ctx.lineTo(x + lx + sw, y + 40);
            ctx.stroke();
            // paw
            ctx.fillStyle = shade;
            ctx.beginPath();
            ctx.ellipse(x + lx + sw, y + 39.4, 3, 2.2, 0, 0, TAU);
            ctx.fill();
        };
        // Far legs slightly darker
        drawLeg(9, -1, '#7c8c96');
        drawLeg(31, 1, '#7c8c96');
        drawLeg(13, 1, '#98a8b2');
        drawLeg(27, -1, '#98a8b2');
    }

    // ---- Ski (level 6): drawn under the paws ----
    if (level === 6) {
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(x - 4, y + 38, 48, 3.4);
        ctx.beginPath();
        ctx.moveTo(x + 44, y + 40);
        ctx.quadraticCurveTo(x + 50, y + 37, x + 50, y + 32);
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2.4;
        ctx.stroke();
    }

    // ---- Chest fluff zigzag ----
    ctx.fillStyle = '#f2f5f7';
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 20);
    ctx.lineTo(x + 34, y + 23);
    ctx.lineTo(x + 30.5, y + 25);
    ctx.lineTo(x + 35, y + 28);
    ctx.lineTo(x + 30, y + 30);
    ctx.closePath();
    ctx.fill();

    // ---- Head ----
    const head = ctx.createRadialGradient(x + 28, y + 6, 3, x + 32, y + 11, 13);
    head.addColorStop(0, '#bcc8d0');
    head.addColorStop(1, '#8a99a5');
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(x + 31.5, y + 11, 11.5, 0, TAU);
    ctx.fill();

    // Grey cap marking over top of head
    ctx.fillStyle = '#77878f';
    ctx.beginPath();
    ctx.ellipse(x + 29.5, y + 4.5, 9, 5.5, -0.15, Math.PI, TAU);
    ctx.fill();

    // White face mask / muzzle
    ctx.fillStyle = '#f2f5f7';
    ctx.beginPath();
    ctx.ellipse(x + 36, y + 15, 6.4, 5, 0.1, 0, TAU);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#232a33';
    ctx.beginPath();
    ctx.moveTo(x + 41.5, y + 12.4);
    ctx.quadraticCurveTo(x + 43.4, y + 13.6, x + 41.6, y + 15.2);
    ctx.quadraticCurveTo(x + 39.8, y + 14, x + 41.5, y + 12.4);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#3a444e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 41, y + 15.6);
    ctx.quadraticCurveTo(x + 38.5, y + 17.6, x + 36.4, y + 16.2);
    ctx.stroke();

    // Eye with periodic blink and shine
    const blinkT = t % 4.6;
    const eyeOpen = blinkT > 0.14;
    if (eyeOpen) {
        ctx.fillStyle = '#3d9be9';
        ctx.beginPath();
        ctx.ellipse(x + 34.5, y + 9, 2.5, 2.9, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#17242f';
        ctx.beginPath();
        ctx.arc(x + 35.3, y + 9.2, 1.25, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(x + 34.1, y + 8, 0.85, 0, TAU);
        ctx.fill();
    } else {
        ctx.strokeStyle = '#3a444e';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x + 32.4, y + 9.2);
        ctx.lineTo(x + 36.6, y + 9);
        ctx.stroke();
    }

    // ---- Ears with inner pink and a subtle running wiggle ----
    const earWiggle = moving ? Math.sin(runPhase * 2) * 0.06 : Math.sin(t * 1.6) * 0.02;
    for (const [ex, baseW, tilt] of [[26, 5, -1], [33, 5.5, 0]] as const) {
        ctx.save();
        ctx.translate(x + ex, y + 4);
        ctx.rotate(tilt * 0.18 + earWiggle);
        ctx.fillStyle = '#8a99a5';
        ctx.beginPath();
        ctx.moveTo(-baseW, 1);
        ctx.lineTo(0, -11);
        ctx.lineTo(baseW, 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d8a8b0';
        ctx.beginPath();
        ctx.moveTo(-baseW * 0.45, 0.5);
        ctx.lineTo(0, -7.5);
        ctx.lineTo(baseW * 0.45, 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
}

// ===================== ENEMY SPRITES (Enhanced mode) =====================
// All drawn facing right; entity callers apply their own direction flip.

/** The Pound's dog catcher: burly, uniformed, swinging his catch-net. */
export function drawDogCatcherEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, walkAnim: number
) {
    const legOffset = Math.sin(walkAnim) * 4;
    ctx.save();

    // Feet shadow puddle
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 2, 16, 3.2, 0, 0, TAU);
    ctx.fill();

    // Legs (navy trousers + boots, walking cycle)
    for (const [lx, off] of [[9, legOffset], [17, -legOffset]] as const) {
        ctx.strokeStyle = '#2b3a4d';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + lx + 3, y + 34);
        ctx.lineTo(x + lx + 3 + off, y + 46);
        ctx.stroke();
        // Boot
        ctx.fillStyle = '#1a222c';
        ctx.fillRect(x + lx + off - 1, y + 44, 10, 5);
    }

    // Torso: uniform shirt with shading + belt
    const shirt = ctx.createLinearGradient(0, y + 14, 0, y + 36);
    shirt.addColorStop(0, '#ef6153');
    shirt.addColorStop(0.55, '#e74c3c');
    shirt.addColorStop(1, '#b03226');
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 14, 24, 22, [5, 5, 3, 3]);
    ctx.fill();
    // Belt
    ctx.fillStyle = '#2b3a4d';
    ctx.fillRect(x + 3, y + 31, 24, 4);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x + 12, y + 31.5, 5, 3);
    // Badge with glint
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(x + 8, y + 21, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(x + 7.2, y + 20.2, 1, 0, TAU);
    ctx.fill();

    // Head with jaw stubble shade
    const skin = ctx.createLinearGradient(0, y, 0, y + 16);
    skin.addColorStop(0, '#f4cba0');
    skin.addColorStop(1, '#e0ac74');
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(x + 15, y + 8, 8.6, 0, TAU);
    ctx.fill();
    // Stubble
    ctx.fillStyle = 'rgba(70,60,50,0.28)';
    ctx.beginPath();
    ctx.arc(x + 15, y + 11.6, 6.6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.fill();
    // Angry eye + brow
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x + 17.4, y + 6.4, 2.2, 2.4);
    ctx.strokeStyle = '#3a2e26';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 16.2, y + 4.6); ctx.lineTo(x + 20, y + 6);
    ctx.stroke();
    // Grumpy mouth
    ctx.beginPath();
    ctx.moveTo(x + 18.4, y + 13.2); ctx.lineTo(x + 21.4, y + 12.4);
    ctx.stroke();
    // Ear
    ctx.fillStyle = '#dca86e';
    ctx.beginPath(); ctx.arc(x + 8.4, y + 8.6, 2, 0, TAU); ctx.fill();

    // Cap with brim + emblem
    const cap = ctx.createLinearGradient(0, y - 3, 0, y + 6);
    cap.addColorStop(0, '#3a506b');
    cap.addColorStop(1, '#22344a');
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.arc(x + 15, y + 5.4, 8.8, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x + 14.4, y + 4.6, 13.6, 3.2);
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(x + 15, y + 1.6, 2.2, 0, TAU);
    ctx.fill();

    // Arm + pole + net (swinging as he walks)
    ctx.save();
    ctx.translate(x + 14, y + 19);
    ctx.rotate(Math.sin(walkAnim) * 0.35 + 0.12);
    // Sleeve + hand
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-2, 1); ctx.lineTo(3, 7); ctx.stroke();
    ctx.fillStyle = '#f1c27d';
    ctx.beginPath(); ctx.arc(4, 9, 3.4, 0, TAU); ctx.fill();
    // Pole
    ctx.strokeStyle = '#79554a';
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(2, 8); ctx.lineTo(27, 12); ctx.stroke();
    // Net hoop + mesh
    const nx = 33, ny = 14;
    ctx.strokeStyle = '#dfe6ea';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(nx, ny, 10.5, 0, TAU); ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.7;
    for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(nx + i * 3.2, ny - Math.sqrt(Math.max(0, 100 - i * i * 9)));
        ctx.lineTo(nx + i * 3.2, ny + Math.sqrt(Math.max(0, 100 - i * i * 9)));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(nx - Math.sqrt(Math.max(0, 100 - i * i * 9)), ny + i * 3.2);
        ctx.lineTo(nx + Math.sqrt(Math.max(0, 100 - i * i * 9)), ny + i * 3.2);
        ctx.stroke();
    }
    ctx.restore();
    ctx.restore();

    ctx.restore();
}

/** Mountain wolf: lean, dark-furred, amber-eyed, low stalking trot. */
export function drawWolfEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, animTimer: number
) {
    const trot = Math.sin(animTimer);
    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 2, 22, 3.4, 0, 0, TAU);
    ctx.fill();

    // Tail: bushy, raised slightly with motion
    const tailGrad = ctx.createLinearGradient(x, y + 14, x - 12, y + 6);
    tailGrad.addColorStop(0, '#3d3d42');
    tailGrad.addColorStop(1, '#585860');
    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 16);
    ctx.quadraticCurveTo(x - 8, y + 12 + trot, x - 13, y + 4 + trot * 1.5);
    ctx.stroke();

    // Body: sleek gradient with haunch shading
    const body = ctx.createLinearGradient(0, y + 4, 0, y + 26);
    body.addColorStop(0, '#5c5c66');
    body.addColorStop(0.55, '#47474f');
    body.addColorStop(1, '#33333a');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 15, 18, 10.5, 0, 0, TAU);
    ctx.fill();
    // Fur ruff along back
    ctx.strokeStyle = '#616169';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
        const fx = x + 8 + i * 5;
        ctx.beginPath();
        ctx.moveTo(fx, y + 7);
        ctx.lineTo(fx + 1.5, y + 4 - (i % 2));
        ctx.stroke();
    }
    // Chest fur (lighter)
    ctx.fillStyle = '#8a8a94';
    ctx.beginPath();
    ctx.ellipse(x + 36, y + 18, 5.5, 7, 0.2, 0, TAU);
    ctx.fill();

    // Legs: 4-point stalking gait
    const legDraw = (lx: number, ph: number, col: string) => {
        const sw = trot * ph * 3.4;
        ctx.strokeStyle = col;
        ctx.lineWidth = 4.4;
        ctx.beginPath();
        ctx.moveTo(x + lx, y + 23);
        ctx.lineTo(x + lx + sw, y + 29.6);
        ctx.stroke();
        ctx.fillStyle = '#2c2c32';
        ctx.beginPath();
        ctx.ellipse(x + lx + sw, y + 29.4, 2.6, 1.8, 0, 0, TAU);
        ctx.fill();
    };
    legDraw(9, -1, '#3a3a41');
    legDraw(30, 1, '#3a3a41');
    legDraw(13, 1, '#50505a');
    legDraw(27, -1, '#50505a');

    // Head: angular muzzle
    const head = ctx.createRadialGradient(x + 38, y + 6, 2, x + 41, y + 11, 13);
    head.addColorStop(0, '#63636d');
    head.addColorStop(1, '#43434b');
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(x + 40, y + 11, 11, 0, TAU);
    ctx.fill();
    // Snout
    ctx.fillStyle = '#57575f';
    ctx.beginPath();
    ctx.moveTo(x + 46, y + 9);
    ctx.lineTo(x + 55, y + 13);
    ctx.lineTo(x + 45.5, y + 17.4);
    ctx.closePath();
    ctx.fill();
    // Nose
    ctx.fillStyle = '#17171b';
    ctx.beginPath();
    ctx.arc(x + 54.6, y + 13, 1.9, 0, TAU);
    ctx.fill();
    // Teeth hint
    ctx.fillStyle = '#e8e8ea';
    ctx.beginPath();
    ctx.moveTo(x + 49.4, y + 16.4); ctx.lineTo(x + 51, y + 19); ctx.lineTo(x + 52.4, y + 16.6);
    ctx.closePath(); ctx.fill();

    // Ears: tall, alert
    for (const [ex, ew] of [[35, 4], [43.5, 4.6]] as const) {
        ctx.fillStyle = '#4a4a52';
        ctx.beginPath();
        ctx.moveTo(x + ex - ew, y + 4);
        ctx.lineTo(x + ex, y - 9.5);
        ctx.lineTo(x + ex + ew, y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2c2c32';
        ctx.beginPath();
        ctx.moveTo(x + ex - ew * 0.4, y + 2.6);
        ctx.lineTo(x + ex, y - 6);
        ctx.lineTo(x + ex + ew * 0.4, y + 2.6);
        ctx.closePath();
        ctx.fill();
    }

    // Amber eye with slit pupil + brow ridge
    ctx.fillStyle = '#e8a02c';
    ctx.beginPath();
    ctx.ellipse(x + 43.4, y + 9.4, 2.5, 1.9, -0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#14100a';
    ctx.beginPath();
    ctx.ellipse(x + 44, y + 9.4, 0.9, 1.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2c2c32';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + 40.6, y + 6.2); ctx.lineTo(x + 46.4, y + 7.6);
    ctx.stroke();

    ctx.restore();
}

/** Beach crab: glossy shell on stalk-eyes, snapping claws, scuttling legs. */
export function drawCrabEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, clawAnim: number, dir: number
) {
    ctx.save();
    ctx.fillStyle = 'rgba(120,80,30,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 1.5, 18, 2.8, 0, 0, TAU);
    ctx.fill();

    // Legs (scuttling behind/front)
    ctx.strokeStyle = '#b03226';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    const legPhase = Math.sin(clawAnim * 2) * 2;
    for (const lx of [12, 18, 24, 30]) {
        ctx.beginPath();
        ctx.moveTo(x + lx, y + 20);
        ctx.lineTo(x + lx + (lx < 21 ? -3 : 3) + legPhase * (lx % 2 === 0 ? 1 : -1), y + 25);
        ctx.stroke();
    }

    // Shell: gradient dome with highlights + spots
    const shell = ctx.createLinearGradient(0, y, 0, y + 20);
    shell.addColorStop(0, '#ff7a5c');
    shell.addColorStop(0.45, '#e74c3c');
    shell.addColorStop(1, '#a82f22');
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 14, 15.5, 9.5, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x + 4.5, y + 14, 31, 5.5);
    // Shell sheen
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 8.6, 5.5, 2.4, -0.4, 0, TAU);
    ctx.fill();
    // Spots
    ctx.fillStyle = 'rgba(150,40,25,0.65)';
    ctx.beginPath();
    ctx.arc(x + 24, y + 10, 1.4, 0, TAU);
    ctx.arc(x + 29, y + 13, 1.1, 0, TAU);
    ctx.arc(x + 11, y + 13, 1.1, 0, TAU);
    ctx.fill();

    // Eyestalks + eyes tracking movement direction
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    for (const sx of [15, 25]) {
        ctx.beginPath();
        ctx.moveTo(x + sx, y + 7);
        ctx.lineTo(x + sx + dir * 0.8, y + 2);
        ctx.stroke();
    }
    for (const sx of [15, 25]) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + sx + dir * 0.8, y + 1.4, 3.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#17171b';
        ctx.beginPath();
        ctx.arc(x + sx + dir * 1.4, y + 1.4, 1.5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(x + sx + dir * 1 - 0.6, y + 0.6, 0.6, 0, TAU);
        ctx.fill();
    }

    // Claws: big pincer arms that snap open/closed
    const snap = Math.abs(Math.sin(clawAnim)) * 4;
    const drawClaw = (sideX: number, sideDir: number) => {
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(x + sideX, y + 15);
        ctx.quadraticCurveTo(x + sideX + sideDir * 8, y + 12, x + sideX + sideDir * 12, y + 5 - snap * 0.3);
        ctx.stroke();
        // Pincer (two lobes with gap animating)
        ctx.fillStyle = '#e05545';
        ctx.save();
        ctx.translate(x + sideX + sideDir * 13.5, y + 3 - snap * 0.3);
        ctx.rotate(sideDir * (0.2 + snap * 0.06));
        ctx.beginPath();
        ctx.ellipse(sideDir * 2.4, -1.8, 5, 3.6, sideDir * 0.5, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sideDir * 1.4, 2.6, 4, 3, sideDir * -0.3, 0, TAU);
        ctx.fill();
        ctx.restore();
    };
    drawClaw(9, -1);
    drawClaw(31, 1);

    // Mouth parts
    ctx.strokeStyle = '#8a2418';
    ctx.lineWidth = 1.2;
    for (const mx of [17, 20, 23]) {
        ctx.beginPath();
        ctx.moveTo(x + mx, y + 19.4);
        ctx.lineTo(x + mx, y + 21.4);
        ctx.stroke();
    }

    ctx.restore();
}

/** Porcupine: round body under a full quill fan, waddling feet. */
export function drawPorcupineEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, walkAnim: number
) {
    ctx.save();
    ctx.fillStyle = 'rgba(90,70,40,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 1.5, 22, 3, 0, 0, TAU);
    ctx.fill();

    // Quill fan: layered spines with pale tips
    for (let i = 0; i < 11; i++) {
        const ang = Math.PI + (i / 10) * Math.PI; // fan over the back
        const qx = x + 24 + Math.cos(ang) * 20;
        const qy = y + 20 + Math.sin(ang) * 20;
        const tipX = x + 24 + Math.cos(ang) * 30;
        const tipY = y + 20 + Math.sin(ang) * 30;
        const grad = ctx.createLinearGradient(qx, qy, tipX, tipY);
        grad.addColorStop(0, '#4a3220');
        grad.addColorStop(0.7, '#8a7a5e');
        grad.addColorStop(1, '#e8e0cc');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(qx, qy);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
    }

    // Body
    const body = ctx.createLinearGradient(0, y + 6, 0, y + 30);
    body.addColorStop(0, '#7a5a3e');
    body.addColorStop(0.6, '#5d4037');
    body.addColorStop(1, '#43302a');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x + 22, y + 20, 15, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 22, y + 21.5, 16, 8, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(x + 6, y + 20, 32, 6);

    // Head
    ctx.fillStyle = '#7a5a40';
    ctx.beginPath();
    ctx.arc(x + 41, y + 24, 8.4, 0, TAU);
    ctx.fill();
    // Snout + nose
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.ellipse(x + 47.4, y + 26, 4.4, 3.4, 0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#20161a';
    ctx.beginPath();
    ctx.arc(x + 50.6, y + 25.6, 1.8, 0, TAU);
    ctx.fill();
    // Eye + shine
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(x + 43, y + 21.6, 1.9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x + 42.4, y + 20.9, 0.6, 0, TAU);
    ctx.fill();
    // Little ear
    ctx.fillStyle = '#6a4c38';
    ctx.beginPath();
    ctx.arc(x + 37.4, y + 17, 2.6, 0, TAU);
    ctx.fill();

    // Waddling feet
    const step = Math.sin(walkAnim) * 2.6;
    ctx.fillStyle = '#33241e';
    for (const [fx, off] of [[16, step], [24, -step], [34, step]] as const) {
        ctx.beginPath();
        ctx.ellipse(x + fx + off, y + 28.4, 3, 2.2, 0, 0, TAU);
        ctx.fill();
    }

    ctx.restore();
}

/** Seagull: white gull with shaded wings, spread feathers, angry brow. */
export function drawSeagullEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, flightTimer: number
) {
    const flap = Math.sin(flightTimer * 10);
    ctx.save();

    // Far wing (behind body, darker)
    ctx.strokeStyle = '#b9c2c9';
    ctx.lineWidth = 4.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 6);
    ctx.quadraticCurveTo(x + 8, y - 4 + flap * -8, x + 2, y - 8 + flap * -11);
    ctx.stroke();

    // Body: white with grey wing shading
    const bodyG = ctx.createLinearGradient(0, y + 2, 0, y + 18);
    bodyG.addColorStop(0, '#ffffff');
    bodyG.addColorStop(0.7, '#eceff1');
    bodyG.addColorStop(1, '#cfd6da');
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 10, 14.5, 7.5, -0.08, 0, TAU);
    ctx.fill();
    // Wing fold detail on body
    ctx.strokeStyle = '#b9c2c9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 9);
    ctx.quadraticCurveTo(x + 20, y + 13.4, x + 30, y + 9.4);
    ctx.stroke();
    // Tail feathers
    ctx.fillStyle = '#dfe5e8';
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 9);
    ctx.lineTo(x - 2, y + 6.4);
    ctx.lineTo(x - 1, y + 12.4);
    ctx.closePath();
    ctx.fill();

    // Near wing (flapping, two-segment)
    const wingA = flap * 10;
    ctx.strokeStyle = '#e8edf0';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 6);
    ctx.quadraticCurveTo(x + 28, y - 2 + wingA * -0.8, x + 34, y - 6 + wingA * -1.1);
    ctx.stroke();
    // Feather tips
    ctx.strokeStyle = '#b9c2c9';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x + 34, y - 6 + wingA * -1.1);
    ctx.lineTo(x + 39, y - 7.4 + wingA * -1.2);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 32, y + 6.4, 5.6, 0, TAU);
    ctx.fill();
    // Angry brow
    ctx.strokeStyle = '#5a5a5a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 28.6, y + 2.6); ctx.lineTo(x + 33.6, y + 4.4);
    ctx.stroke();
    // Eye
    ctx.fillStyle = '#f2b01e';
    ctx.beginPath();
    ctx.arc(x + 31.4, y + 5.6, 1.7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#17171b';
    ctx.beginPath();
    ctx.arc(x + 31.8, y + 5.7, 0.85, 0, TAU);
    ctx.fill();
    // Beak: orange with lower mandible
    ctx.fillStyle = '#f1a02c';
    ctx.beginPath();
    ctx.moveTo(x + 36.4, y + 4.6);
    ctx.lineTo(x + 45, y + 7.4);
    ctx.lineTo(x + 36.6, y + 8.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d1801e';
    ctx.beginPath();
    ctx.moveTo(x + 36.6, y + 8.6);
    ctx.lineTo(x + 42.4, y + 8.2);
    ctx.lineTo(x + 36.6, y + 10.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// ===================== BOSS SPRITES (Enhanced mode) ========================

/** Alpha Pound boss: a hulking catcher with a huge net and a mean streak. */
export function drawBossCatcherEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
    animTimer: number, isStunned: boolean
) {
    const legOffset = Math.sin(animTimer) * 8;
    ctx.save();

    // Heavy ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 3, 52, 7, 0, 0, TAU);
    ctx.fill();

    // Legs: thick strides + heavy boots
    for (const [lx, off] of [[24, legOffset], [58, -legOffset]] as const) {
        const trouser = ctx.createLinearGradient(0, y + 95, 0, y + 140);
        trouser.addColorStop(0, '#33455c');
        trouser.addColorStop(1, '#1e2d3f');
        ctx.strokeStyle = trouser;
        ctx.lineWidth = 17;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + lx + 9, y + 98);
        ctx.lineTo(x + lx + 9 + off, y + 138);
        ctx.stroke();
        // Boot
        ctx.fillStyle = '#141b25';
        ctx.beginPath();
        ctx.roundRect(x + lx + off - 2, y + 134, 24, 12, [4, 6, 3, 3]);
        ctx.fill();
        ctx.fillStyle = '#2a3644';
        ctx.fillRect(x + lx + off - 2, y + 138, 24, 2);
    }

    // Torso: broad uniform with shoulder pads + belt
    const shirt = ctx.createLinearGradient(0, y + 34, 0, y + 102);
    shirt.addColorStop(0, '#ef6a5a');
    shirt.addColorStop(0.5, '#d84a38');
    shirt.addColorStop(1, '#9c2e22');
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 36, 84, 68, [10, 10, 5, 5]);
    ctx.fill();
    // Shoulder pads
    ctx.fillStyle = '#2b3a4d';
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 42, 11, 8, -0.2, 0, TAU);
    ctx.ellipse(x + 86, y + 42, 11, 8, 0.2, 0, TAU);
    ctx.fill();
    // Belt + buckle
    ctx.fillStyle = '#222f3e';
    ctx.fillRect(x + 8, y + 88, 84, 9);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x + 41, y + 88.5, 18, 8);
    ctx.fillStyle = '#a8820b';
    ctx.fillRect(x + 46, y + 90.5, 8, 4);

    // Big badge with star + glint
    const bg = ctx.createRadialGradient(x + 48, y + 56, 2, x + 50, y + 58, 13);
    bg.addColorStop(0, '#ffe98a');
    bg.addColorStop(0.75, '#f1c40f');
    bg.addColorStop(1, '#c9970c');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x + 50, y + 58, 12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8a6a08';
    // tiny star
    ctx.save();
    ctx.translate(x + 50, y + 58);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * TAU) / 5;
        ctx.lineTo(Math.cos(a) * 5.4, Math.sin(a) * 5.4);
        const a2 = a + TAU / 10;
        ctx.lineTo(Math.cos(a2) * 2.3, Math.sin(a2) * 2.3);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(x + 45.4, y + 53.4, 2.4, 0, TAU);
    ctx.fill();

    // Head: big jaw, stubble, sneer
    const skinG = ctx.createRadialGradient(x + 44, y + 14, 4, x + 50, y + 24, 34);
    skinG.addColorStop(0, '#f6cf9f');
    skinG.addColorStop(1, '#dfa26a');
    ctx.fillStyle = skinG;
    ctx.beginPath();
    ctx.arc(x + 50, y + 23, 29, 0, TAU);
    ctx.fill();
    // Stubble jaw
    ctx.fillStyle = 'rgba(60,50,40,0.3)';
    ctx.beginPath();
    ctx.arc(x + 50, y + 31, 21, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.fill();
    // Gritted teeth
    ctx.fillStyle = '#f4f4ee';
    ctx.beginPath();
    ctx.roundRect(x + 38, y + 30, 24, 6.4, 2);
    ctx.fill();
    ctx.strokeStyle = '#8a7a66';
    ctx.lineWidth = 1;
    for (let tx2 = 43; tx2 < 62; tx2 += 5) {
        ctx.beginPath();
        ctx.moveTo(x + tx2, y + 30);
        ctx.lineTo(x + tx2, y + 36.4);
        ctx.stroke();
    }

    if (isStunned) {
        // X X eyes + orbiting stars
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        for (const ex of [37, 63]) {
            ctx.beginPath();
            ctx.moveTo(x + ex - 7, y + 12); ctx.lineTo(x + ex + 7, y + 24);
            ctx.moveTo(x + ex + 7, y + 12); ctx.lineTo(x + ex - 7, y + 24);
            ctx.stroke();
        }
        for (let s = 0; s < 3; s++) {
            const sa = animTimer * 3 + (s * TAU) / 3;
            const stx = x + 50 + Math.cos(sa) * 42;
            const sty = y + 16 + Math.sin(sa) * 14;
            ctx.save();
            ctx.translate(stx, sty);
            ctx.rotate(sa);
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = -Math.PI / 2 + (i * TAU) / 5;
                ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
                const a2 = a + TAU / 10;
                ctx.lineTo(Math.cos(a2) * 3, Math.sin(a2) * 3);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    } else {
        // Eyes: whites tracking forward, angry pupils
        for (const ex of [38, 62]) {
            ctx.fillStyle = '#fdfdfd';
            ctx.beginPath();
            ctx.ellipse(x + ex, y + 19, 8.4, 7.4, 0, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#2a2016';
            ctx.beginPath();
            ctx.arc(x + ex + 2.4, y + 20, 3.2, 0, TAU);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.beginPath();
            ctx.arc(x + ex + 1.2, y + 18, 1.1, 0, TAU);
            ctx.fill();
        }
        // Heavy V brows
        ctx.fillStyle = '#2c2118';
        ctx.beginPath();
        ctx.moveTo(x + 27, y + 7); ctx.lineTo(x + 47, y + 15.4); ctx.lineTo(x + 47, y + 9.4); ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 73, y + 7); ctx.lineTo(x + 53, y + 15.4); ctx.lineTo(x + 53, y + 9.4); ctx.closePath();
        ctx.fill();
    }

    // Peaked cap with gold emblem + brim shine
    if (true) {
        const capG = ctx.createLinearGradient(0, y - 52, 0, y - 4);
        capG.addColorStop(0, '#3a506b');
        capG.addColorStop(1, '#20304a');
        ctx.fillStyle = capG;
        ctx.beginPath();
        ctx.roundRect(x + 20, y - 52, 60, 46, [8, 8, 3, 3]);
        ctx.fill();
        // Brim
        ctx.fillStyle = '#16202e';
        ctx.beginPath();
        ctx.roundRect(x + 8, y - 10, 84, 9, [4, 4, 2, 2]);
        ctx.fill();
        // Band + emblem
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(x + 20, y - 16, 60, 5);
        ctx.beginPath();
        ctx.arc(x + 50, y - 28, 6.4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#20304a';
        ctx.beginPath();
        ctx.arc(x + 50, y - 28, 3.4, 0, TAU);
        ctx.fill();
    }

    // Arm + GIANT net on pole (swings with stride)
    ctx.save();
    ctx.translate(x + 82, y + 48);
    ctx.rotate(Math.sin(animTimer * 0.9) * 0.22 + 0.1);
    // Sleeve
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, 2); ctx.lineTo(14, 14);
    ctx.stroke();
    // Hand
    ctx.fillStyle = '#eab072';
    ctx.beginPath();
    ctx.arc(18, 18, 7, 0, TAU);
    ctx.fill();
    // Pole
    ctx.strokeStyle = '#6a4c40';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(12, 14); ctx.lineTo(64, 30);
    ctx.stroke();
    // Net hoop + mesh
    const nx = 80, ny = 36;
    ctx.strokeStyle = '#e6ecf0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(nx, ny, 30, 0, TAU);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    for (let i = -4; i <= 4; i++) {
        const off2 = i * 8;
        const half = Math.sqrt(Math.max(0, 900 - off2 * off2));
        ctx.beginPath();
        ctx.moveTo(nx + off2, ny - half); ctx.lineTo(nx + off2, ny + half);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(nx - half, ny + off2); ctx.lineTo(nx + half, ny + off2);
        ctx.stroke();
    }
    ctx.restore();
    ctx.restore();

    ctx.restore();
}

/** Alpha Wolf boss: a battle-scarred giant with a burning red gaze. */
export function drawBossWolfEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
    animTimer: number, isStunned: boolean, hasHat: boolean
) {
    const trot = Math.sin(animTimer);
    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 3, 55, 8, 0, 0, TAU);
    ctx.fill();

    // Tail: huge, lashing
    const tailG = ctx.createLinearGradient(x, y + 40, x - 30, y + 20);
    tailG.addColorStop(0, '#3a3a42');
    tailG.addColorStop(1, '#5c5c66');
    ctx.strokeStyle = tailG;
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 44);
    ctx.quadraticCurveTo(x - 16, y + 34 + trot * 6, x - 28, y + 16 + trot * 12);
    ctx.stroke();
    // Tail tip highlight
    ctx.strokeStyle = '#77777f';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 26 + trot * 10);
    ctx.lineTo(x - 27, y + 17 + trot * 12);
    ctx.stroke();

    // Hindquarters: raised haunch
    const body = ctx.createLinearGradient(0, y + 16, 0, y + h);
    body.addColorStop(0, '#60606a');
    body.addColorStop(0.5, '#494951');
    body.addColorStop(1, '#303038');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x + 32, y + h - 34, 27, 0, TAU);
    ctx.fill();
    // Torso: deep chest tapering to shoulders, slight back arch
    ctx.beginPath();
    ctx.moveTo(x + 20, y + h - 44);
    ctx.quadraticCurveTo(x + 44, y + 26, x + 74, y + 38);
    ctx.quadraticCurveTo(x + 88, y + 46, x + 88, y + h - 22);
    ctx.lineTo(x + 20, y + h - 22);
    ctx.closePath();
    ctx.fill();
    // Belly light
    ctx.fillStyle = 'rgba(150,150,160,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + 62, y + h - 26, 24, 8, 0, 0, TAU);
    ctx.fill();
    // Scar across flank
    ctx.strokeStyle = 'rgba(190,190,200,0.55)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x + 26, y + 34);
    ctx.lineTo(x + 44, y + 52);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190,190,200,0.4)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 30 + i * 6, y + 39 + i * 3);
        ctx.lineTo(x + 33 + i * 6, y + 44 + i * 3);
        ctx.stroke();
    }
    // Back fur ridge
    ctx.strokeStyle = '#6a6a74';
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
        const fx = x + 14 + i * 9;
        ctx.beginPath();
        ctx.moveTo(fx, y + 22);
        ctx.lineTo(fx + 2, y + 17 - (i % 2) * 2);
        ctx.stroke();
    }

    // Legs: four heavy pillars mid-stride
    const legDraw = (lx: number, ph: number, col: string, lw: number) => {
        const sw = trot * ph * 8;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + lx, y + h - 24);
        ctx.lineTo(x + lx + sw, y + h - 3);
        ctx.stroke();
        ctx.fillStyle = '#202026';
        ctx.beginPath();
        ctx.ellipse(x + lx + sw, y + h - 2, lw * 0.72, 4.4, 0, 0, TAU);
        ctx.fill();
    };
    legDraw(14, -1, '#38383f', 16);
    legDraw(72, 1, '#38383f', 16);
    legDraw(26, 1, '#52525c', 17);
    legDraw(62, -1, '#52525c', 17);

    // Head: huge skull with angular cheeks
    const headG = ctx.createRadialGradient(x + w - 42, y + 24, 4, x + w - 30, y + 34, 42);
    headG.addColorStop(0, '#67676f');
    headG.addColorStop(1, '#43434b');
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.arc(x + w - 30, y + 33, 34, 0, TAU);
    ctx.fill();
    // Cheek fur spikes
    ctx.fillStyle = '#55555e';
    for (const [cx2, cy2] of [[x + w - 58, y + 44], [x + w - 52, y + 54], [x + w - 44, y + 61]] as const) {
        ctx.beginPath();
        ctx.moveTo(cx2 - 5, cy2);
        ctx.lineTo(cx2 - 14, cy2 + 7);
        ctx.lineTo(cx2 - 2, cy2 + 8);
        ctx.closePath();
        ctx.fill();
    }
    // Snout: heavy wedge
    ctx.fillStyle = '#4c4c54';
    ctx.beginPath();
    ctx.moveTo(x + w - 16, y + 20);
    ctx.lineTo(x + w + 16, y + 36);
    ctx.lineTo(x + w - 12, y + 54);
    ctx.closePath();
    ctx.fill();
    // Nose
    ctx.fillStyle = '#131317';
    ctx.beginPath();
    ctx.ellipse(x + w + 12, y + 35, 5.4, 4.4, 0, 0, TAU);
    ctx.fill();
    // Fangs
    ctx.fillStyle = '#eceff1';
    for (const fx of [x + w - 2, x + w + 6]) {
        ctx.beginPath();
        ctx.moveTo(fx, y + 46);
        ctx.lineTo(fx + 3.4, y + 57);
        ctx.lineTo(fx + 6.8, y + 46);
        ctx.closePath();
        ctx.fill();
    }

    // Ears: torn and tall (set wide so the ranger hat sits between them)
    for (const [ex, ew] of [[x + w - 62, 10], [x + w - 4, 11]] as const) {
        ctx.fillStyle = '#4a4a52';
        ctx.beginPath();
        ctx.moveTo(ex - ew, y + 8);
        ctx.lineTo(ex, y - 24);
        ctx.lineTo(ex + ew, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2a2a30';
        ctx.beginPath();
        ctx.moveTo(ex - ew * 0.4, y + 4);
        ctx.lineTo(ex + 1, y - 15);
        ctx.lineTo(ex + ew * 0.4, y + 4);
        ctx.closePath();
        ctx.fill();
    }

    if (isStunned) {
        // X eye
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + w - 42, y + 24); ctx.lineTo(x + w - 26, y + 38);
        ctx.moveTo(x + w - 26, y + 24); ctx.lineTo(x + w - 42, y + 38);
        ctx.stroke();
    } else {
        // Burning red eye with glow + pupil slit
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 180);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const glow = ctx.createRadialGradient(x + w - 32, y + 30, 2, x + w - 32, y + 30, 26);
        glow.addColorStop(0, `rgba(255,60,40,${0.35 + pulse * 0.25})`);
        glow.addColorStop(1, 'rgba(255,60,40,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x + w - 60, y + 4, 56, 54);
        ctx.restore();
        ctx.fillStyle = '#ff3b26';
        ctx.beginPath();
        ctx.ellipse(x + w - 32, y + 29, 7.4, 5.6, -0.1, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#1a0503';
        ctx.beginPath();
        ctx.ellipse(x + w - 30, y + 29, 1.7, 4.2, 0, 0, TAU);
        ctx.fill();
    }

    // Ranger hat (kept from classic design)
    if (hasHat) {
        ctx.fillStyle = '#4a3526';
        ctx.beginPath();
        ctx.ellipse(x + w - 33, y + 4, 34, 10, 0, 0, TAU);
        ctx.fill();
        const topG = ctx.createLinearGradient(0, y - 30, 0, y + 4);
        topG.addColorStop(0, '#6a4c34');
        topG.addColorStop(1, '#4a3526');
        ctx.fillStyle = topG;
        ctx.beginPath();
        ctx.roundRect(x + w - 52, y - 28, 38, 30, [6, 6, 2, 2]);
        ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(x + w - 52, y - 8, 38, 6);
    }

    ctx.restore();
}

// ===================== HAZARD & MISC SPRITES (Enhanced mode) ==================

/** Rolling doom: packed-snow sphere with crystalline texture and speed streaks. */
export function drawSnowballEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number, dir: number
) {
    ctx.save();
    ctx.translate(x, y);

    // Motion streaks trailing behind (screen-aligned)
    const streak = ctx.createLinearGradient(-dir * r * 1.1, 0, -dir * r * 2.3, 0);
    streak.addColorStop(0, 'rgba(255,255,255,0.35)');
    streak.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = streak;
    for (const oy of [-r * 0.5, 0, r * 0.45]) {
        ctx.beginPath();
        ctx.roundRect(-dir * r * 1.05, oy - 2.4, r * 1.25, 4.8, 3);
        ctx.fill();
    }

    // Ball body
    const body = ctx.createRadialGradient(-r * 0.32, -r * 0.34, r * 0.15, 0, 0, r);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(0.62, '#eef4f9');
    body.addColorStop(0.88, '#cfdfe9');
    body.addColorStop(1, '#a8bfce');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();

    // Rotating packed-snow lumps + ice glints (fixed to ball rotation)
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(175,198,214,0.6)';
    for (const [lx, ly, lr] of [[r*0.42, r*0.18, r*0.22], [-r*0.3, r*0.44, r*0.17], [-r*0.4, -r*0.34, r*0.2], [r*0.12, -r*0.52, r*0.14]] as const) {
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, TAU);
        ctx.fill();
    }
    // Crystalline sparkle chips
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU;
        const rr = r * (0.55 + ((i * 37) % 40) / 100);
        const sxp = Math.cos(a) * rr;
        const syp = Math.sin(a) * rr;
        ctx.fillRect(sxp - 1.6, syp - 0.7, 3.2, 1.4);
    }
    ctx.restore();

    // Rim shading + ground kiss
    ctx.strokeStyle = 'rgba(140,170,190,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r - 1.4, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.92, r * 0.72, r * 0.16, 0, 0, TAU);
    ctx.fill();

    ctx.restore();
}

/** Deadly water: depth gradient, living wave crests, foam and caustic light. */
export function drawWaterEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
    waveOffset: number, t: number
) {
    const depth = h + 50;

    // Body gradient
    const grad = ctx.createLinearGradient(0, y, 0, y + depth);
    grad.addColorStop(0, 'rgba(64,164,224,0.78)');
    grad.addColorStop(0.4, 'rgba(38,120,190,0.85)');
    grad.addColorStop(1, 'rgba(16,60,110,0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, depth);

    // Sunken light shafts
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) {
        const shx = x + ((i + 0.5) * w) / 3 + Math.sin(t * 0.6 + i * 2) * 24;
        const g = ctx.createLinearGradient(shx, y, shx + 30, y + depth * 0.7);
        g.addColorStop(0, 'rgba(180,230,255,0.10)');
        g.addColorStop(1, 'rgba(180,230,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(shx - 16, y);
        ctx.lineTo(shx + 16, y);
        ctx.lineTo(shx + 66, y + depth * 0.7);
        ctx.lineTo(shx + 12, y + depth * 0.7);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Two-layer animated crest
    for (const [amp, alpha, speed] of [[5, 0.75, 1], [3.2, 0.5, -0.7]] as const) {
        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        for (let i = 0; i <= w; i += 16) {
            const wy = Math.sin(waveOffset * speed + i * 0.09) * amp + Math.sin(waveOffset * speed * 1.7 + i * 0.031) * amp * 0.4;
            ctx.lineTo(x + i, y + wy);
        }
        ctx.lineTo(x + w, y + 12);
        ctx.closePath();
        ctx.fillStyle = `rgba(235,248,255,${alpha})`;
        ctx.fill();
    }
    // Foam flecks riding the crest
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < w / 46; i++) {
        const fx = x + ((i * 53 + Math.floor(t * 30)) % w);
        const fy = y + Math.sin(waveOffset + fx * 0.09) * 5 - 2;
        ctx.beginPath();
        ctx.arc(fx, fy, 1.6 + ((i * 13) % 3) * 0.6, 0, TAU);
        ctx.fill();
    }
}

/**
 * Animated title-screen backdrop (Enhanced mode only): Onyx on a hilltop,
* gazing at the far-off city lights he must cross to reach home.
 */
export function drawMenuBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    // Night-to-dawn sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0b1026');
    sky.addColorStop(0.5, '#1c2340');
    sky.addColorStop(0.8, '#3a3050');
    sky.addColorStop(1, '#594052');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Stars with twinkle
    for (let i = 0; i < 90; i++) {
        const sxp = ((i * 173.3 + t * 3) % (w + 20)) - 10;
        const syp = (i * 97.7) % (h * 0.55);
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.4 + (i % 5) * 0.14) + i));
        ctx.fillStyle = `rgba(220,228,255,${0.65 * tw})`;
        ctx.fillRect(sxp, syp, 1.8, 1.8);
    }

    // Moon
    const mx = w * 0.78, my = h * 0.2;
    const halo = ctx.createRadialGradient(mx, my, 12, mx, my, 130);
    halo.addColorStop(0, 'rgba(235,240,225,0.35)');
    halo.addColorStop(1, 'rgba(235,240,225,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(mx - 140, my - 140, 280, 280);
    ctx.fillStyle = '#ece8d4';
    ctx.beginPath();
    ctx.arc(mx, my, 38, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(175,172,150,0.5)';
    ctx.beginPath(); ctx.arc(mx - 11, my - 9, 7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 13, my + 12, 5, 0, TAU); ctx.fill();

    // Drifting clouds
    ctx.fillStyle = 'rgba(18,24,44,0.55)';
    for (let i = 0; i < 6; i++) {
        const cxp = ((i * 420 - t * 12) % (w + 500)) - 250;
        const cyp = h * 0.32 + ((i * 67) % Math.floor(h * 0.2));
        ctx.beginPath();
        ctx.ellipse(cxp, cyp, 150, 26, 0, 0, TAU);
        ctx.ellipse(cxp + 110, cyp + 12, 110, 20, 0, 0, TAU);
        ctx.fill();
    }

    // Far city skyline with lit windows (his goal)
    const skylineBase = h * 0.78;
    ctx.fillStyle = 'rgba(10,13,22,0.96)';
    for (let i = 0; i < w; i += 64) {
        const bh2 = 70 + hash2(i, 5) * 150;
        const bx2 = i + Math.sin(i * 0.01) * 14;
        ctx.fillRect(bx2, skylineBase - bh2, 48, bh2);
        for (let wy = skylineBase - bh2 + 10; wy < skylineBase - 10; wy += 17) {
            for (let wx2 = bx2 + 7; wx2 < bx2 + 42; wx2 += 12) {
                if (hash2(Math.floor(wx2), Math.floor(wy)) > 0.68) {
                    const flick = hash2(Math.floor(wx2), Math.floor(wy) + Math.floor(t * 0.4)) > 0.08;
                    if (flick) {
                        ctx.fillStyle = `rgba(255,210,120,${0.3 + hash2(Math.floor(wx2), Math.floor(wy) + 7) * 0.35})`;
                        ctx.fillRect(wx2, wy, 4, 6);
                        ctx.fillStyle = 'rgba(10,13,22,0.96)';
                    }
                }
            }
        }
    }

    // Rolling hills between city and foreground hill
    ctx.fillStyle = 'rgba(16,22,30,0.9)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let px = 0; px <= w; px += 30) {
        ctx.lineTo(px, h * 0.84 + Math.sin(px * 0.004 + 2) * 26);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Foreground hill
    ctx.fillStyle = '#0a0d14';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.quadraticCurveTo(w * 0.28, h * 0.68, w * 0.62, h * 0.86);
    ctx.quadraticCurveTo(w * 0.82, h * 0.95, w, h * 0.93);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // A few blades of grass on the hill crest
    ctx.strokeStyle = '#16241c';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 40; i++) {
        const gx = (i / 40) * w;
        const gy = h * 0.68 + (gx / (w * 0.62)) * (h * 0.86 - h * 0.68) - 2;
        if (gx > w * 0.62) break;
        const lean = Math.sin(t * 1.4 + i) * 2;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.quadraticCurveTo(gx + lean, gy - 6, gx + lean * 1.8, gy - 10);
        ctx.stroke();
    }

    // Onyx silhouette sitting on the hilltop, tail curled, gazing at the city
    const ox = w * 0.27, oy = h * 0.78;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = '#05070c';
    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 15, 0.06, 0, TAU);
    ctx.fill();
    // Head raised toward skyline
    ctx.beginPath();
    ctx.arc(27, -14, 11, 0, TAU);
    ctx.fill();
    // Snout
    ctx.beginPath();
    ctx.moveTo(34, -17); ctx.lineTo(43, -13); ctx.lineTo(33, -9);
    ctx.closePath(); ctx.fill();
    // Ears
    ctx.beginPath();
    ctx.moveTo(21, -22); ctx.lineTo(23.5, -32); ctx.lineTo(28, -22); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(29, -23); ctx.lineTo(33, -31); ctx.lineTo(36, -20); ctx.closePath(); ctx.fill();
    // Front legs
    ctx.fillRect(16, 6, 5, 14);
    ctx.fillRect(24, 6, 5, 14);
    // Curled tail with slow wag
    ctx.strokeStyle = '#05070c';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-22, -2);
    ctx.quadraticCurveTo(-34, -6 + Math.sin(t * 2.2) * 4, -30, -16 + Math.sin(t * 2.2) * 5);
    ctx.stroke();
    // Eye catch-light
    ctx.fillStyle = 'rgba(120,180,255,0.9)';
    ctx.beginPath();
    ctx.arc(30, -16, 1.6, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Fireflies drifting above the grass
    for (let i = 0; i < 8; i++) {
        const fx = (i * 197 + t * 14) % w;
        const fy = h * 0.78 + Math.sin(t * 0.9 + i * 2.2) * 22 + (i % 3) * 12;
        const glow = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.7 + i));
        const g = ctx.createRadialGradient(fx, fy, 0.5, fx, fy, 7);
        g.addColorStop(0, `rgba(200,255,140,${0.8 * glow})`);
        g.addColorStop(1, 'rgba(200,255,140,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fx, fy, 7, 0, TAU);
        ctx.fill();
    }

    // Gentle vignette so UI text pops
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(2,4,10,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
}

/**
 * Additive polish for the construction crew (drawn over their classic art in
 * Enhanced mode): grounding shadow, helmet specular glint, hi-vis sheen.
 */
export function drawWorkerPolish(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, hatColor: string
) {
    ctx.save();
    // Grounding shadow
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 2, 15, 3, 0, 0, TAU);
    ctx.fill();
    // Helmet glint arc
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 7, 8.4, -Math.PI * 0.82, -Math.PI * 0.5);
    ctx.stroke();
    // Hi-vis vest sheen (diagonal light band)
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 36);
    ctx.lineTo(x + 14, y + 15);
    ctx.lineTo(x + 19, y + 15);
    ctx.lineTo(x + 13, y + 36);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Hat rim shade for depth
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 7, 9.4, Math.PI * 0.15, Math.PI * 0.5);
    ctx.stroke();
    void hatColor;
    ctx.restore();
}

/**
 * Additive polish for the excavator boss: track grounding shadow, body
 * specular sheen, and dust kicked up behind the treads while it moves.
 */
export function drawExcavatorPolish(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
    movingDir: number, time: number
) {
    ctx.save();

    // Heavy grounding shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 85, y + 133, 85, 8, 0, 0, TAU);
    ctx.fill();

    // Specular sheen across the yellow body panels
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + 26, y + 20);
    ctx.lineTo(x + 44, y + 20);
    ctx.lineTo(x + 30, y + 80);
    ctx.lineTo(x + 20, y + 80);
    ctx.closePath();
    ctx.fill();
    // Cab window reflection streak
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(x + 90, y + 15);
    ctx.lineTo(x + 98, y + 15);
    ctx.lineTo(x + 88, y + 37);
    ctx.lineTo(x + 82, y + 37);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Dust kicked up behind the treads
    if (movingDir !== 0) {
        for (let i = 0; i < 4; i++) {
            const dx = x + 10 - movingDir * (14 + i * 13 + Math.sin(time * 9 + i * 2) * 5);
            const dy = y + 126 - i * 3.4;
            const dr = 4 + i * 2.2;
            ctx.fillStyle = `rgba(120,105,90,${0.22 - i * 0.04})`;
            ctx.beginPath();
            ctx.arc(dx, dy, dr, 0, TAU);
            ctx.fill();
        }
    }

    ctx.restore();
}

// ===================== SMALL MACHINES & GATES ===============================

/** Arena gate: massive riveted iron shutter with hazard base and warning lamp. */
export function drawBossWallEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number
) {
    const body = ctx.createLinearGradient(x, 0, x + w, 0);
    body.addColorStop(0, '#39434f');
    body.addColorStop(0.5, '#4a5561');
    body.addColorStop(1, '#2c3540');
    ctx.fillStyle = body;
    ctx.fillRect(x, y, w, h);

    // Shutter slats
    ctx.fillStyle = 'rgba(16,22,30,0.75)';
    for (let sy = y + 8; sy < y + h - 6; sy += 26) {
        ctx.fillRect(x + 4, sy, w - 8, 9);
        // slat highlight
        ctx.fillStyle = 'rgba(160,172,184,0.28)';
        ctx.fillRect(x + 4, sy - 2, w - 8, 2);
        ctx.fillStyle = 'rgba(16,22,30,0.75)';
    }
    // Vertical guide rails
    ctx.fillStyle = '#202832';
    ctx.fillRect(x, y, 7, h);
    ctx.fillRect(x + w - 7, y, 7, h);
    // Rivets along rails
    ctx.fillStyle = 'rgba(180,190,200,0.5)';
    for (let ry = y + 12; ry < y + h - 8; ry += 24) {
        ctx.beginPath();
        ctx.arc(x + 3.5, ry, 1.7, 0, TAU);
        ctx.arc(x + w - 3.5, ry, 1.7, 0, TAU);
        ctx.fill();
    }
    // Hazard base stripe
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y + h - 10, w, 10);
    ctx.clip();
    ctx.fillStyle = '#c9970c';
    ctx.fillRect(x, y + h - 10, w, 10);
    ctx.fillStyle = '#1b222c';
    for (let hx = -8; hx < w; hx += 18) {
        ctx.beginPath();
        ctx.moveTo(x + hx, y + h);
        ctx.lineTo(x + hx + 9, y + h);
        ctx.lineTo(x + hx + 15, y + h - 10);
        ctx.lineTo(x + hx + 6, y + h - 10);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Warning beacon at top center
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 220);
    ctx.fillStyle = `rgba(255,70,55,${0.45 + pulse * 0.45})`;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 10, 4.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(255,70,55,${0.14 * pulse})`;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 10, 11, 0, TAU);
    ctx.fill();
}

/** Boost ramp: icy-slick surface, chevron arrows, boost shimmer. */
export function drawSkiJumpEnhanced(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number
) {
    // Ramp body
    const body = ctx.createLinearGradient(x, y, x + w, y + h);
    body.addColorStop(0, '#e05545');
    body.addColorStop(0.55, '#d84a38');
    body.addColorStop(1, '#a82f22');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    // Frost sheen along the slope face
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    // Chevron arrows flowing up the ramp
    const phase = (t * 60) % 46;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    for (let i = 0; i < Math.floor(w / 46); i++) {
        const d = i * 46 + phase;
        if (d > w - 20) continue;
        const axp = x + d;
        const ayp = y + h * (1 - d / w);
        const s = 8;
        ctx.beginPath();
        ctx.moveTo(axp - s, ayp + s * 0.4);
        ctx.lineTo(axp + s * 0.4, ayp - s * 0.2);
        ctx.stroke();
    }
    // Launch sparkle at the tip
    const sp = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.fillStyle = `rgba(255,255,255,${0.25 + sp * 0.3})`;
    ctx.beginPath();
    ctx.arc(x + w - 3, y + 2, 4 + sp * 2, 0, TAU);
    ctx.fill();
}

/** Paw button panel: glowing bezel, status light, pressed animation handled by classic art beneath. */
export function drawControlPanelPolish(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, pressed: boolean, t: number
) {
    ctx.save();
    const pulse = 0.5 + 0.5 * Math.sin(t * (pressed ? 2 : 5));
    const col = pressed ? '120,255,170' : '255,110,90';
    // Status glow halo
    const g = ctx.createRadialGradient(x + w / 2, y + 5, 2, x + w / 2, y + 5, 22);
    g.addColorStop(0, `rgba(${col},${0.3 * (pressed ? 1 : pulse)})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x + w / 2 - 24, y - 18, 48, 44);
    // Bezel shine
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 4);
    ctx.lineTo(x + 2, y + 13);
    ctx.stroke();
    ctx.restore();
}

// ===================== ZONE 11: NEON METROPOLIS ============================

/** Industrial fan: dark housing, spinning blade cluster, cyan neon ring, rising air streaks. */
export function drawFanNeon(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
    t: number, power: number
) {
    ctx.save();

    // Housing with gradient + bolts
    const body = ctx.createLinearGradient(0, y, 0, y + h);
    body.addColorStop(0, '#3a4356');
    body.addColorStop(0.5, '#282f3d');
    body.addColorStop(1, '#171c26');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 7);
    ctx.fill();
    ctx.strokeStyle = '#0e1219';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Neon ring around the intake (brightness follows power)
    const ringCol = power > 0.4 ? '80,240,220' : '255,110,90';
    const pulse = 0.55 + 0.45 * Math.sin(t * 6);
    ctx.strokeStyle = `rgba(${ringCol},${0.5 * power + 0.15 * pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 4, w - 10, h - 8, 5);
    ctx.stroke();

    // Blades
    const spin = t * (power * 17 + 0.6);
    const cx2 = x + w / 2;
    const cy2 = y + h / 2;
    ctx.save();
    ctx.translate(cx2, cy2);
    ctx.rotate(spin);
    for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        const bladeG = ctx.createLinearGradient(0, -16, 0, 2);
        bladeG.addColorStop(0, '#9fb0bd');
        bladeG.addColorStop(1, '#5a6875');
        ctx.fillStyle = bladeG;
        ctx.beginPath();
        ctx.ellipse(0, -9.5, 4.6, 10, 0, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
    // Hub
    ctx.fillStyle = '#aebcc6';
    ctx.beginPath();
    ctx.arc(cx2, cy2, 4.4, 0, TAU);
    ctx.fill();
    // Grill
    ctx.strokeStyle = 'rgba(14,18,25,0.85)';
    ctx.lineWidth = 1.8;
    for (let gx = x + 14; gx < x + w - 8; gx += 15) {
        ctx.beginPath();
        ctx.moveTo(gx, y + 4);
        ctx.lineTo(gx, y + h - 4);
        ctx.stroke();
    }
    // Status LED
    if (power < 0.99) {
        const on = power > 0.4;
        ctx.fillStyle = on ? 'rgba(90,255,150,0.95)' : 'rgba(255,90,70,0.95)';
        ctx.beginPath();
        ctx.arc(x + w - 10, y + h / 2, 3, 0, TAU);
        ctx.fill();
    }

    // Rising air streaks above the fan when blowing
    if (power > 0.1) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 6; i++) {
            const prog = ((t * (0.9 + (i % 3) * 0.22) * power) + (i * 0.167)) % 1;
            const sxp = cx2 + Math.sin(i * 2.4 + t * 3) * (w * 0.32);
            const syp = y - 12 - prog * 120;
            const alpha = Math.sin(prog * Math.PI) * 0.3 * power;
            ctx.fillStyle = `rgba(160,240,230,${alpha})`;
            ctx.fillRect(sxp - 1.4, syp - 8, 2.8, 13);
        }
        ctx.restore();
    }

    ctx.restore();
}

/** Security drone: gunmetal body, rotor blur, red scan cone, alert state. */
export function drawSecurityDroneNeon(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
    t: number, alert: boolean, dir: number
) {
    ctx.save();

    const midX = x + w / 2;

    // Scan cone beneath (sweeps slightly; flares on alert)
    const sweep = Math.sin(t * 1.6) * 14;
    const coneAlpha = alert ? 0.3 + 0.14 * Math.sin(t * 22) : 0.14 + 0.05 * Math.sin(t * 2.2);
    const col = alert ? '255,80,60' : '255,60,50';
    const cone = ctx.createLinearGradient(midX, y + h, midX, y + h + 96);
    cone.addColorStop(0, `rgba(${col},${coneAlpha})`);
    cone.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(midX - 7, y + h - 4);
    ctx.lineTo(midX + 7, y + h - 4);
    ctx.lineTo(midX + sweep + 34, y + h + 96);
    ctx.lineTo(midX + sweep - 34, y + h + 96);
    ctx.closePath();
    ctx.fill();

    // Rotor blur above
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#9fb0bd';
    ctx.lineWidth = 2;
    const blur = Math.abs(Math.sin(t * 40)) * 20 + 8;
    ctx.beginPath();
    ctx.moveTo(midX - blur, y - 5);
    ctx.lineTo(midX + blur, y - 5);
    ctx.stroke();
    ctx.restore();
    // Mast
    ctx.fillStyle = '#39424f';
    ctx.fillRect(midX - 2.4, y - 7, 4.8, 8);

    // Body: gunmetal gradient with panel line + warning chevrons
    const body = ctx.createLinearGradient(0, y, 0, y + h);
    body.addColorStop(0, '#66727f');
    body.addColorStop(0.5, '#48525f');
    body.addColorStop(1, '#2b333d');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h - 8, [10, 10, 7, 7]);
    ctx.fill();
    ctx.strokeStyle = '#141a22';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Panel seam
    ctx.strokeStyle = 'rgba(20,26,34,0.7)';
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 12);
    ctx.lineTo(x + w - 8, y + 12);
    ctx.stroke();
    // Side hazard stripes
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 3, y + h - 16, 9, 6);
    ctx.rect(x + w - 12, y + h - 16, 9, 6);
    ctx.clip();
    ctx.fillStyle = '#c9970c';
    ctx.fillRect(x + 3, y + h - 16, w - 6, 6);
    ctx.fillStyle = '#1b222c';
    for (let hx = x; hx < x + w; hx += 6) {
        ctx.beginPath();
        ctx.moveTo(hx, y + h - 10);
        ctx.lineTo(hx + 3, y + h - 16);
        ctx.lineTo(hx + 6, y + h - 16);
        ctx.lineTo(hx + 3, y + h - 10);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Sensor eye lens tracking travel direction
    const ex = midX + dir * 6;
    ctx.fillStyle = '#10161d';
    ctx.beginPath();
    ctx.arc(ex, y + 11, 6.6, 0, TAU);
    ctx.fill();
    const eyePulse = 0.6 + 0.4 * Math.sin(t * (alert ? 18 : 3));
    ctx.fillStyle = `rgba(${col},${eyePulse})`;
    ctx.beginPath();
    ctx.arc(ex + dir * 1.2, y + 11, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(ex - 1.4, y + 9.4, 1, 0, TAU);
    ctx.fill();

    // Belly light bar
    ctx.fillStyle = `rgba(${col},${alert ? 0.95 : 0.55 + 0.35 * Math.sin(t * 4)})`;
    ctx.fillRect(x + 8, y + h - 13, w - 16, 2.6);

    // Antenna tip light
    ctx.fillStyle = alert ? `rgba(${col},0.95)` : 'rgba(140,220,255,0.8)';
    ctx.beginPath();
    ctx.arc(midX, y - 9.4, 2.2, 0, TAU);
    ctx.fill();
    if (alert) {
        ctx.strokeStyle = `rgba(${col},0.5)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(midX, y - 9.4, 5 + Math.sin(t * 14) * 2.4, 0, TAU);
        ctx.stroke();
    }

    // Alert "!" marker
    if (alert) {
        ctx.fillStyle = '#ff5040';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', midX, y - 16 + Math.sin(t * 10) * 2);
    }

    ctx.restore();
}
