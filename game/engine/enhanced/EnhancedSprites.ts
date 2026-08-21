
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
