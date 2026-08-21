
// Enhanced-mode cutscene scenes.
//
// Each cutscene step gets a fully composed, animated stage (replacing the
// classic placeholder art while Enhanced is active). Everything is drawn from
// scratch each frame and mutates no game state. Step numbering matches
// CutsceneManager: the line shown for story index i has step === i + 1.

const TAU = Math.PI * 2;

type Mood = 'happy' | 'sad' | 'determined' | 'scared' | 'alert';
type Pose = 'sit' | 'stand' | 'run' | 'fall' | 'swim' | 'surface' | 'howl';

function h2(a: number, b: number): number {
    const x = Math.sin(a * 127.1 + b * 269.5 + 137.9) * 43758.5453123;
    return x - Math.floor(x);
}

// ---------------------------------------------------------------- //
// Cinematic husky — large-scale, expressive, poseable
// ---------------------------------------------------------------- //

/**
 * Draws Onyx at arbitrary scale. (x, y) is the ground point under his front
 * paws (or body center for swim/fall poses).
 */
export function drawCineHusky(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, scale: number,
    pose: Pose, mood: Mood, t: number, facing: 1 | -1 = 1
) {
    ctx.save();
    ctx.translate(x, y);
    // Cinematic subjects read larger than gameplay sprites
    const cineScale = scale * 1.35;
    ctx.scale(cineScale * facing, cineScale);

    const fur = '#8a99a5';
    const furDark = '#6f7f8a';
    const furLight = '#aebcc6';
    const white = '#f2f5f7';

    const breathe = Math.sin(t * 2.2) * 1.2;
    const runPhase = t * 11;
    const legSwing = pose === 'run' ? Math.sin(runPhase) : 0;
    const bob = pose === 'run' ? Math.abs(Math.sin(runPhase)) * 2.4 : 0;

    // ---- Tail (all ground poses) ----
    if (pose !== 'swim' && pose !== 'fall') {
        const wag = mood === 'happy' ? Math.sin(t * 9) * 8 : Math.sin(t * 2.4) * 3;
        ctx.strokeStyle = furDark;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-16, -16);
        ctx.quadraticCurveTo(-30, -22 + wag * 0.4, -36 - wag * 0.5, -34 + wag * 0.6);
        ctx.stroke();
        ctx.strokeStyle = white;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-33 - wag * 0.4, -29 + wag * 0.5);
        ctx.lineTo(-36 - wag * 0.5, -34 + wag * 0.6);
        ctx.stroke();
    }

    if (pose === 'sit') {
        // Haunch + folded legs
        ctx.fillStyle = fur;
        ctx.beginPath();
        ctx.ellipse(-6, -12 + breathe * 0.3, 16, 14, 0, 0, TAU);
        ctx.fill();
        // Front legs upright
        ctx.strokeStyle = furLight;
        ctx.lineWidth = 6.5;
        for (const lx of [8, 14]) {
            ctx.beginPath();
            ctx.moveTo(lx, -14);
            ctx.lineTo(lx + 1, -1);
            ctx.stroke();
        }
        // Paws
        ctx.fillStyle = furLight;
        ctx.beginPath();
        ctx.ellipse(9.5, 0, 4.4, 2.6, 0, 0, TAU);
        ctx.ellipse(15.5, 0, 4.4, 2.6, 0, 0, TAU);
        ctx.fill();
        // Chest
        ctx.fillStyle = white;
        ctx.beginPath();
        ctx.ellipse(10, -16, 8, 11, -0.12, 0, TAU);
        ctx.fill();
        // Head (raised)
        this_drawHead(ctx, 12, -34, mood, t, breathe);
    } else if (pose === 'stand' || pose === 'howl') {
        // Body
        ctx.fillStyle = fur;
        ctx.beginPath();
        ctx.ellipse(0, -16 + breathe * 0.4, 20, 12.5, 0, 0, TAU);
        ctx.fill();
        // Belly
        ctx.fillStyle = white;
        ctx.beginPath();
        ctx.ellipse(3, -12 + breathe * 0.4, 13, 7.5, 0, 0, TAU);
        ctx.fill();
        // Legs
        ctx.strokeStyle = furLight;
        ctx.lineWidth = 6;
        for (const lx of [-12, -4, 8, 15]) {
            ctx.beginPath();
            ctx.moveTo(lx, -10);
            ctx.lineTo(lx, 0);
            ctx.stroke();
        }
        ctx.fillStyle = furLight;
        for (const lx of [-12, -4, 8, 15]) {
            ctx.beginPath();
            ctx.ellipse(lx, -0.6, 4, 2.4, 0, 0, TAU);
            ctx.fill();
        }
        if (pose === 'howl') {
            // Head tilted up, mouth open to the sky
            this_drawHead(ctx, 14, -34, 'determined', t, breathe, -0.55, true);
        } else {
            this_drawHead(ctx, 16, -32, mood, t, breathe);
        }
    } else if (pose === 'run') {
        // Stretched running body
        ctx.fillStyle = fur;
        ctx.beginPath();
        ctx.ellipse(0, -17 + bob * 0.4, 22, 11.5, -0.06, 0, TAU);
        ctx.fill();
        ctx.fillStyle = white;
        ctx.beginPath();
        ctx.ellipse(4, -13 + bob * 0.4, 14, 6.6, 0, 0, TAU);
        ctx.fill();
        // Legs cycling
        ctx.strokeStyle = furLight;
        ctx.lineWidth = 6;
        for (const [lx, ph] of [[-14, 1], [-6, -1], [10, -1], [18, 1]] as const) {
            const sw = legSwing * ph * 9;
            ctx.beginPath();
            ctx.moveTo(lx, -11);
            ctx.lineTo(lx + sw, 0);
            ctx.stroke();
        }
        // Ears pinned back when scared
        this_drawHead(ctx, 24, -30 + bob * 0.5, mood, t, breathe, 0.08, false, pose === 'run' && mood === 'scared');
    } else if (pose === 'fall') {
        // Tumbling, limbs splayed
        const flail = Math.sin(t * 14) * 0.5;
        ctx.save();
        ctx.rotate(0.35 + flail * 0.12);
        ctx.fillStyle = fur;
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 12, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = furLight;
        ctx.lineWidth = 6;
        for (const [lx, ly] of [[-12, -8], [12, -6], [-10, 9], [14, 8]] as const) {
            ctx.beginPath();
            ctx.moveTo(lx * 0.6, ly * 0.6);
            ctx.lineTo(lx * 1.5, ly * 1.5);
            ctx.stroke();
        }
        this_drawHead(ctx, 20, -14, mood, t, 0);
        ctx.restore();
    } else if (pose === 'swim' || pose === 'surface') {
        // Horizontal swimmer
        ctx.fillStyle = fur;
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 11, -0.08, 0, TAU);
        ctx.fill();
        ctx.fillStyle = white;
        ctx.beginPath();
        ctx.ellipse(4, 4, 14, 5.6, -0.05, 0, TAU);
        ctx.fill();
        // Paddling flippers
        const paddle = Math.sin(t * 7);
        ctx.strokeStyle = furLight;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-14, 2);
        ctx.lineTo(-26 + paddle * 4, 8 + paddle * 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, 4);
        ctx.lineTo(-20 - paddle * 4, 12 - paddle * 3);
        ctx.stroke();
        this_drawHead(ctx, 22, -10, mood, t, 0);
    }

    ctx.restore();
}

/** Head with mood-driven eyes/brows/mouth; headTilt in radians. */
function this_drawHead(
    ctx: CanvasRenderingContext2D, x: number, y: number,
    mood: Mood, t: number, breathe: number,
    headTilt = 0, mouthOpen = false, earsPinned = false
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(headTilt);

    // Ears
    const earDrop = earsPinned ? 0.55 : 0;
    for (const [ex, tilt] of [[-9, -0.25], [3, 0.18]] as const) {
        ctx.save();
        ctx.translate(ex, -8);
        ctx.rotate(tilt + earDrop * (ex < 0 ? -1 : 1) + Math.sin(t * 1.7 + ex) * 0.03);
        ctx.fillStyle = '#8a99a5';
        ctx.beginPath();
        ctx.moveTo(-4.4, 1);
        ctx.lineTo(0, -10.5);
        ctx.lineTo(4.4, 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d8a8b0';
        ctx.beginPath();
        ctx.moveTo(-2, 0.4);
        ctx.lineTo(0, -7);
        ctx.lineTo(2, 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Skull
    const head = ctx.createRadialGradient(-3, -4, 2, 0, 0, 14);
    head.addColorStop(0, '#b6c2ca');
    head.addColorStop(1, '#8a99a5');
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, TAU);
    ctx.fill();
    // Cap marking
    ctx.fillStyle = '#77878f';
    ctx.beginPath();
    ctx.ellipse(-1, -6.4, 9.4, 5.4, -0.12, Math.PI, TAU);
    ctx.fill();
    // Muzzle
    ctx.fillStyle = '#f2f5f7';
    ctx.beginPath();
    ctx.ellipse(4.4, 4.6, 7, 5.2, 0.08, 0, TAU);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#232a33';
    ctx.beginPath();
    ctx.ellipse(9.4, 2.4, 2.6, 2, 0, 0, TAU);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#3a444e';
    ctx.lineWidth = 1.4;
    if (mouthOpen) {
        ctx.fillStyle = '#43302f';
        ctx.beginPath();
        ctx.ellipse(6, 7.4, 3.6, 3.4, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#e8b0b0';
        ctx.beginPath();
        ctx.ellipse(6, 9.4, 2.2, 1.4, 0, 0, TAU);
        ctx.fill();
    } else if (mood === 'sad') {
        ctx.beginPath();
        ctx.arc(5, 9.4, 3, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
    } else if (mood === 'happy') {
        ctx.beginPath();
        ctx.arc(5, 5.4, 3.4, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        // tongue
        ctx.fillStyle = '#e88a9a';
        ctx.beginPath();
        ctx.ellipse(5, 7.8, 1.6, 2.2, 0, 0, TAU);
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.moveTo(2.4, 7.4);
        ctx.lineTo(8.4, 7.2);
        ctx.stroke();
    }

    // Eyes
    const blink = (t % 4.4) < 0.14;
    if (mood === 'scared') {
        // Wide round eyes
        for (const ex of [-4.4, 5]) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(ex, -2.4, 3.6, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(ex + 0.8, -2.2, 1.7, 0, TAU);
            ctx.fill();
        }
        // Raised inner brows
        ctx.strokeStyle = '#5a6a74';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-7.4, -7.4); ctx.lineTo(-2.4, -9.4);
        ctx.moveTo(2.4, -9.4); ctx.lineTo(7.8, -7.8);
        ctx.stroke();
    } else if (mood === 'sad') {
        for (const ex of [-4.4, 5]) {
            ctx.fillStyle = '#3d9be9';
            ctx.beginPath();
            ctx.ellipse(ex, -2.4, 2.4, 1.9, 0, 0, TAU);
            ctx.fill();
        }
        // Heavy drooping lids
        ctx.fillStyle = '#77878f';
        ctx.fillRect(-7.4, -5.4, 6, 2.4);
        ctx.fillRect(2.4, -5.4, 6, 2.4);
        // Welling tear
        const tear = ((t * 0.9) % 1);
        ctx.fillStyle = `rgba(140,200,255,${0.85 * (1 - tear)})`;
        ctx.beginPath();
        ctx.ellipse(-3.4, 1.4 + tear * 9, 1.5, 2.4, 0, 0, TAU);
        ctx.fill();
    } else if (mood === 'determined' || mood === 'alert') {
        for (const ex of [-4.4, 5]) {
            ctx.fillStyle = '#3d9be9';
            ctx.beginPath();
            ctx.ellipse(ex, -2.6, 2.5, blink ? 0.5 : 2.6, 0, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#17242f';
            ctx.beginPath();
            ctx.arc(ex + 0.7, -2.4, 1.2, 0, TAU);
            ctx.fill();
        }
        // Firm angled brows
        ctx.fillStyle = '#4a5a64';
        ctx.beginPath();
        ctx.moveTo(-8.4, -6.4); ctx.lineTo(-1.4, -4.6); ctx.lineTo(-1.4, -6.6); ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8.4, -6.4); ctx.lineTo(2.4, -4.6); ctx.lineTo(2.4, -6.6); ctx.closePath();
        ctx.fill();
    } else {
        // Happy
        for (const ex of [-4.4, 5]) {
            if (blink) {
                ctx.strokeStyle = '#3a444e';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(ex - 2, -2.4); ctx.lineTo(ex + 2, -2.4);
                ctx.stroke();
            } else {
                ctx.fillStyle = '#3d9be9';
                ctx.beginPath();
                ctx.arc(ex, -2.6, 2.6, 0, TAU);
                ctx.fill();
                ctx.fillStyle = '#17242f';
                ctx.beginPath();
                ctx.arc(ex + 0.7, -2.4, 1.2, 0, TAU);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.beginPath();
                ctx.arc(ex - 0.6, -3.6, 0.9, 0, TAU);
                ctx.fill();
            }
        }
    }

    ctx.restore();
    void breathe;
}

// ---------------------------------------------------------------- //
// Backdrop helpers
// ---------------------------------------------------------------- //

function sky(ctx: CanvasRenderingContext2D, w: number, h: number, stops: Array<[number, string]>) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    for (const [p, c] of stops) g.addColorStop(p, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
}

function stars(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, count = 70) {
    for (let i = 0; i < count; i++) {
        const sxp = (i * 191.7) % w;
        const syp = (i * 89.3) % (h * 0.6);
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.4 + (i % 5) * 0.13) + i));
        ctx.fillStyle = `rgba(225,232,255,${0.6 * tw})`;
        ctx.fillRect(sxp, syp, 2, 2);
    }
}

function moon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    const halo = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 3.4);
    halo.addColorStop(0, 'rgba(235,240,225,0.32)');
    halo.addColorStop(1, 'rgba(235,240,225,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(x - r * 3.5, y - r * 3.5, r * 7, r * 7);
    ctx.fillStyle = '#ece8d4';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(175,172,150,0.5)';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.25, r * 0.18, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.35, y + r * 0.3, r * 0.13, 0, TAU); ctx.fill();
}

function citySkyline(ctx: CanvasRenderingContext2D, w: number, baseY: number, t: number, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(10,13,22,0.96)';
    for (let i = 0; i < w; i += 58) {
        const bh2 = 60 + h2(i, 5) * 140;
        const bx2 = i + Math.sin(i * 0.013) * 10;
        ctx.fillRect(bx2, baseY - bh2, 44, bh2);
        for (let wy = baseY - bh2 + 9; wy < baseY - 8; wy += 15) {
            for (let wx2 = bx2 + 6; wx2 < bx2 + 39; wx2 += 11) {
                if (h2(Math.floor(wx2), Math.floor(wy)) > 0.66) {
                    const flick = h2(Math.floor(wx2), Math.floor(wy) + Math.floor(t * 0.4)) > 0.08;
                    if (flick) {
                        ctx.fillStyle = `rgba(255,210,120,${0.3 + h2(Math.floor(wx2), Math.floor(wy) + 7) * 0.35})`;
                        ctx.fillRect(wx2, wy, 3.6, 5.4);
                        ctx.fillStyle = 'rgba(10,13,22,0.96)';
                    }
                }
            }
        }
    }
    ctx.restore();
}

function pineSilhouette(ctx: CanvasRenderingContext2D, x: number, baseY: number, tw2: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x - 3, baseY - tw2 * 0.4, 7, tw2 * 0.4);
    for (let tier = 0; tier < 3; tier++) {
        const ty = baseY - tw2 * (0.25 + tier * 0.24);
        const half = 20 + tier * 14;
        ctx.beginPath();
        ctx.moveTo(x - half, ty);
        ctx.lineTo(x, ty - tw2 * 0.34);
        ctx.lineTo(x + half, ty);
        ctx.closePath();
        ctx.fill();
    }
}

function rain(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, count = 90) {
    ctx.strokeStyle = 'rgba(175,205,255,0.4)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < count; i++) {
        const rxp = ((i * 149.3 + t * 620) % (w + 80)) - 40;
        const ryp = ((i * 97.7 + t * 940) % (h + 60)) - 30;
        ctx.beginPath();
        ctx.moveTo(rxp, ryp);
        ctx.lineTo(rxp - 5, ryp + 15);
        ctx.stroke();
    }
}

function glowEyes(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, red = false) {
    const g = 0.4 + 0.35 * Math.sin(t * 2.2 + x);
    ctx.fillStyle = red ? `rgba(255,70,50,${g})` : `rgba(255,220,90,${g})`;
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, TAU);
    ctx.arc(x + 8, y, 2.4, 0, TAU);
    ctx.fill();
}

function catcherSilhouette(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, t: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#10151c';
    // Legs striding
    const stride = Math.sin(t * 6) * 5;
    ctx.fillRect(-12 + stride, -26, 9, 26);
    ctx.fillRect(3 - stride, -26, 9, 26);
    // Body
    ctx.fillRect(-16, -62, 32, 38);
    // Head + cap
    ctx.beginPath();
    ctx.arc(0, -72, 11, 0, TAU);
    ctx.fill();
    ctx.fillRect(-13, -80, 26, 7);
    // Arm + net raised
    ctx.save();
    ctx.translate(10, -54);
    ctx.rotate(-0.7 + Math.sin(t * 6) * 0.15);
    ctx.fillRect(0, -3, 26, 6);
    ctx.strokeStyle = '#1c242e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(34, -2, 16, 0, TAU);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
}

// ---------------------------------------------------------------- //
// Scene compositor
// ---------------------------------------------------------------- //

export function drawEnhancedCutscene(
    ctx: CanvasRenderingContext2D, type: string, step: number,
    w: number, h: number, frame: number
) {
    const t = frame / 60;
    const cx = w / 2;
    // Stage line kept above the subtitle card so subjects stay readable
    const ground = h * 0.72;

    switch (type) {
        case 'intro': this_intro(ctx, step, w, h, cx, ground, t); break;
        case 'pound_escape': this_poundEscape(ctx, step, w, h, cx, ground, t); break;
        case 'chase': this_chase(ctx, step, w, h, cx, ground, t); break;
        case 'underwater_intro': this_underwater(ctx, step, w, h, cx, ground, t); break;
        case 'pier_intro': this_pier(ctx, step, w, h, cx, ground, t); break;
        default:
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, 0, w, h);
    }
}

// ---- INTRO: captured → resolved to escape ----
function this_intro(ctx: CanvasRenderingContext2D, step: number, w: number, h: number, cx: number, ground: number, t: number) {
    if (step === 1) {
        // Cozy home interior, spotlight on Onyx
        sky(ctx, w, h, [[0, '#2b2019'], [1, '#4a3423']]);
        // Window with moonlight
        ctx.fillStyle = '#0d1424';
        ctx.fillRect(w * 0.68, h * 0.18, 190, 240);
        ctx.strokeStyle = '#5a4326';
        ctx.lineWidth = 12;
        ctx.strokeRect(w * 0.68, h * 0.18, 190, 240);
        ctx.beginPath();
        ctx.moveTo(w * 0.68 + 95, h * 0.18);
        ctx.lineTo(w * 0.68 + 95, h * 0.18 + 240);
        ctx.stroke();
        moon(ctx, w * 0.68 + 95, h * 0.18 + 80, 26);
        // Spotlight pool
        const spot = ctx.createRadialGradient(cx, ground - 40, 20, cx, ground - 40, 320);
        spot.addColorStop(0, 'rgba(255,225,160,0.22)');
        spot.addColorStop(1, 'rgba(255,225,160,0)');
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, w, h);
        // Food bowl
        ctx.fillStyle = '#8a3b2a';
        ctx.beginPath();
        ctx.ellipse(cx + 150, ground - 4, 26, 8, 0, 0, TAU);
        ctx.fill();
        drawCineHusky(ctx, cx - 40, ground, 2.6, 'sit', 'happy', t);
    } else if (step === 2) {
        // Joyful dash through the dusk yard
        sky(ctx, w, h, [[0, '#1a2340'], [0.6, '#4a3a52'], [1, '#7a4a44']]);
        stars(ctx, w, h, t, 40);
        moon(ctx, w * 0.82, h * 0.2, 30);
        // Fence rushing past
        ctx.fillStyle = '#241a14';
        for (let i = 0; i < w; i += 90) {
            const fx = ((i - t * 380) % (w + 90)) + (i - t * 380 < 0 ? w + 90 : 0);
            ctx.fillRect(fx, ground - 120, 16, 130);
        }
        ctx.fillStyle = '#1a120d';
        ctx.fillRect(0, ground - 128, w, 12);
        // Grass strip
        ctx.fillStyle = '#15251c';
        ctx.fillRect(0, ground, w, h - ground);
        // Dust kicked behind
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = `rgba(180,160,130,${0.25 - i * 0.04})`;
            ctx.beginPath();
            ctx.arc(cx - 90 - i * 26, ground - 8 - i * 5, 8 + i * 3, 0, TAU);
            ctx.fill();
        }
        drawCineHusky(ctx, cx, ground, 2.6, 'run', 'happy', t);
    } else if (step === 3) {
        // The net comes down — cold flash
        const flash = Math.max(0, Math.sin(t * 2.4)) * 0.16;
        sky(ctx, w, h, [[0, '#10141f'], [1, '#232b3a']]);
        ctx.fillStyle = `rgba(255,80,60,${flash})`;
        ctx.fillRect(0, 0, w, h);
        // Searchlight cone
        ctx.save();
        ctx.translate(cx + 260, -40);
        ctx.rotate(0.5 + Math.sin(t * 1.4) * 0.08);
        const beam = ctx.createLinearGradient(0, 0, 0, h);
        beam.addColorStop(0, 'rgba(255,250,210,0.4)');
        beam.addColorStop(1, 'rgba(255,250,210,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(-30, 0); ctx.lineTo(30, 0);
        ctx.lineTo(190, h); ctx.lineTo(-190, h);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        // Falling net over Onyx
        const netY = Math.min(1, t * 0.9) * 130 - 40;
        ctx.save();
        ctx.translate(cx, ground - 60 + netY);
        ctx.strokeStyle = 'rgba(230,236,240,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 90, 0, TAU);
        ctx.stroke();
        ctx.lineWidth = 1;
        for (let i = -4; i <= 4; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 20, -Math.sqrt(Math.max(0, 8100 - i * i * 400)));
            ctx.lineTo(i * 20, Math.sqrt(Math.max(0, 8100 - i * i * 400)));
            ctx.stroke();
        }
        ctx.restore();
        drawCineHusky(ctx, cx, ground, 2.6, 'stand', 'scared', t);
        catcherSilhouette(ctx, cx + 300, ground, 1.7, t);
    } else if (step === 4) {
        // Cage interior, moonlight bars, tears
        sky(ctx, w, h, [[0, '#0a0e18'], [1, '#161d2c']]);
        // Window high up
        ctx.fillStyle = '#0d1424';
        ctx.fillRect(w * 0.72, h * 0.14, 150, 110);
        moon(ctx, w * 0.72 + 75, h * 0.14 + 40, 20);
        // Moonlight shaft
        const shaft = ctx.createLinearGradient(w * 0.72, h * 0.14, w * 0.4, h);
        shaft.addColorStop(0, 'rgba(200,215,245,0.14)');
        shaft.addColorStop(1, 'rgba(200,215,245,0)');
        ctx.fillStyle = shaft;
        ctx.beginPath();
        ctx.moveTo(w * 0.72, h * 0.14);
        ctx.lineTo(w * 0.72 + 150, h * 0.14);
        ctx.lineTo(w * 0.5, h);
        ctx.lineTo(w * 0.2, h);
        ctx.closePath();
        ctx.fill();
        // Cage bars
        ctx.fillStyle = '#05070c';
        for (let i = 0; i < w; i += 110) {
            ctx.fillRect(i + 20, 0, 18, h);
        }
        // Straw floor
        ctx.fillStyle = '#241c12';
        ctx.fillRect(0, ground, w, h - ground);
        drawCineHusky(ctx, cx, ground, 2.6, 'sit', 'sad', t);
    } else {
        // Resolve: close-up, spotlight, determined
        sky(ctx, w, h, [[0, '#0c1120'], [1, '#1d2740']]);
        const spot = ctx.createRadialGradient(cx, h * 0.55, 30, cx, h * 0.55, 360);
        spot.addColorStop(0, 'rgba(255,235,180,0.2)');
        spot.addColorStop(1, 'rgba(255,235,180,0)');
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, w, h);
        drawCineHusky(ctx, cx, h * 0.86, 4.2, 'stand', 'determined', t);
    }
}

// ---- POUND ESCAPE: breakout → the road ahead ----
function this_poundEscape(ctx: CanvasRenderingContext2D, step: number, w: number, h: number, cx: number, ground: number, t: number) {
    if (step === 1) {
        // Bursting out of the broken gate, confetti night
        sky(ctx, w, h, [[0, '#141b30'], [1, '#33263a']]);
        stars(ctx, w, h, t, 50);
        // Pound wall behind with broken gate
        ctx.fillStyle = '#1c2431';
        ctx.fillRect(0, 0, w * 0.34, ground);
        ctx.fillStyle = '#151c27';
        ctx.fillRect(w * 0.34, ground - 190, 130, 190); // gate frame
        ctx.strokeStyle = '#2c3644';
        ctx.lineWidth = 6;
        ctx.strokeRect(w * 0.34, ground - 190, 130, 190);
        // Hanging broken chain
        ctx.strokeStyle = '#3a4452';
        ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.ellipse(w * 0.34 + 65 + Math.sin(t * 2 + i) * 4, ground - 170 + i * 22, 8, 12, 0, 0, TAU);
            ctx.stroke();
        }
        // Confetti
        for (let i = 0; i < 40; i++) {
            const pxp = (i * 97.3 + t * 60) % w;
            const pyp = (i * 61.7 + t * 140) % (ground - 40);
            const colors = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'];
            ctx.save();
            ctx.translate(pxp, pyp);
            ctx.rotate(t * 3 + i);
            ctx.fillStyle = colors[i % 4];
            ctx.fillRect(-4, -2.4, 8, 4.8);
            ctx.restore();
        }
        // Leaping husky (mid-hop bob)
        const hop = Math.abs(Math.sin(t * 4)) * 26;
        drawCineHusky(ctx, cx + 60, ground - hop, 2.6, 'run', 'happy', t);
    } else if (step === 2) {
        // On a hill, pound small behind
        sky(ctx, w, h, [[0, '#101830'], [1, '#2c2438']]);
        stars(ctx, w, h, t, 60);
        moon(ctx, w * 0.8, h * 0.18, 32);
        // Distant pound building
        ctx.fillStyle = '#181f2b';
        ctx.fillRect(w * 0.08, ground - 130, 220, 130);
        ctx.fillRect(w * 0.08 + 60, ground - 170, 100, 40);
        // tiny barred windows
        ctx.fillStyle = '#0b0f16';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(w * 0.08 + 24 + i * 48, ground - 100, 26, 30);
        }
        // Rolling hills
        ctx.fillStyle = '#0d1420';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.quadraticCurveTo(w * 0.4, ground - 60, w, ground + 20);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        drawCineHusky(ctx, cx, ground - 10, 2.2, 'stand', 'alert', t, -1);
    } else if (step === 3) {
        // Forest edge looming
        sky(ctx, w, h, [[0, '#05060f'], [1, '#101527']]);
        moon(ctx, w * 0.24, h * 0.2, 26);
        // Wall of pines on the right closing in
        for (let i = 0; i < 7; i++) {
            pineSilhouette(ctx, w * 0.55 + i * 130, ground + 30, 300 + h2(i, 3) * 160, i % 2 ? '#0a0d18' : '#0d1120');
        }
        // Ground fog
        for (let i = 0; i < 4; i++) {
            const fxp = ((t * (16 + i * 8) + i * 420) % (w + 500)) - 250;
            const fg = ctx.createRadialGradient(fxp, ground - 10, 10, fxp, ground - 10, 260);
            fg.addColorStop(0, 'rgba(110,125,165,0.09)');
            fg.addColorStop(1, 'rgba(110,125,165,0)');
            ctx.fillStyle = fg;
            ctx.fillRect(fxp - 260, ground - 140, 520, 280);
        }
        glowEyes(ctx, w * 0.72, ground - 120, t);
        glowEyes(ctx, w * 0.86, ground - 90, t, true);
        drawCineHusky(ctx, cx - 120, ground, 2.2, 'stand', 'alert', t);
    } else if (step === 4) {
        // Walking the dark forest path, determined
        sky(ctx, w, h, [[0, '#04050e'], [1, '#0e1324']]);
        moon(ctx, w * 0.3, h * 0.16, 24);
        // Path perspective
        ctx.fillStyle = '#0a0d16';
        ctx.beginPath();
        ctx.moveTo(w * 0.42, ground);
        ctx.lineTo(w * 0.58, ground);
        ctx.lineTo(w * 0.72, h);
        ctx.lineTo(w * 0.28, h);
        ctx.closePath();
        ctx.fill();
        // Trees flanking the path
        for (let i = 0; i < 5; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const tx2 = cx + side * (140 + i * 120);
            pineSilhouette(ctx, tx2, ground + 40, 340 + h2(i, 9) * 140, '#070a13');
        }
        for (let i = 0; i < 6; i++) {
            glowEyes(ctx, w * (0.12 + 0.14 * i), ground - 100 - h2(i, 4) * 80, t, i % 3 === 0);
        }
        drawCineHusky(ctx, cx, ground, 2.4, 'run', 'determined', t);
    } else {
        // Vista: forest gives way to distant glittering city — howl
        sky(ctx, w, h, [[0, '#0b1026'], [0.55, '#232a48'], [1, '#43354a']]);
        stars(ctx, w, h, t, 70);
        moon(ctx, w * 0.78, h * 0.16, 30);
        citySkyline(ctx, w, ground - 10, t, 1);
        // Forest silhouette left
        for (let i = 0; i < 4; i++) {
            pineSilhouette(ctx, w * 0.06 + i * 90, ground + 20, 260 + h2(i, 6) * 120, '#0a0d16');
        }
        // Hill
        ctx.fillStyle = '#0a0d14';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.quadraticCurveTo(w * 0.3, ground - 40, w * 0.7, ground + 30);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        drawCineHusky(ctx, cx - 40, ground - 20, 2.6, 'howl', 'determined', t);
        // Music-note-like sparkles rising from the howl
        for (let i = 0; i < 5; i++) {
            const sy2 = ground - 90 - ((t * 40 + i * 30) % 90);
            ctx.fillStyle = `rgba(220,235,255,${0.5 * (1 - ((t * 40 + i * 30) % 90) / 90)})`;
            ctx.beginPath();
            ctx.arc(cx - 60 + i * 14, sy2, 2.4, 0, TAU);
            ctx.fill();
        }
    }
}

// ---- CHASE: mountain sprint ----
function this_chase(ctx: CanvasRenderingContext2D, step: number, w: number, h: number, cx: number, ground: number, t: number) {
    if (step === 1) {
        // Skiing down the bright slope
        sky(ctx, w, h, [[0, '#3f7fd4'], [1, '#cfe7f8']]);
        moon(ctx, w * 0.85, h * 0.16, 0.0001 + 26);
        // Slope
        ctx.fillStyle = '#f4f9fd';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.3);
        ctx.lineTo(w, h * 0.62);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        // Pine clusters
        for (let i = 0; i < 5; i++) {
            pineSilhouette(ctx, w * (0.1 + i * 0.2), h * (0.42 + i * 0.1), 120, '#1e3d30');
        }
        // Snow spray
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.7 - i * 0.07})`;
            ctx.beginPath();
            ctx.arc(cx - 70 - i * 22, ground - 6 - i * 4, 7 + i * 2.4, 0, TAU);
            ctx.fill();
        }
        drawCineHusky(ctx, cx, ground, 2.4, 'run', 'happy', t);
    } else if (step === 2) {
        // Sudden stop — alert
        sky(ctx, w, h, [[0, '#3f7fd4'], [1, '#cfe7f8']]);
        ctx.fillStyle = '#f4f9fd';
        ctx.fillRect(0, h * 0.55, w, h * 0.45);
        for (let i = 0; i < 4; i++) {
            pineSilhouette(ctx, w * (0.15 + i * 0.24), h * 0.62, 130, '#1e3d30');
        }
        // Skid snow pile
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(cx - 40, ground, 60, 10, 0, 0, TAU);
        ctx.fill();
        drawCineHusky(ctx, cx, ground, 2.6, 'stand', 'alert', t);
        // "!" pulse
        const pop = Math.abs(Math.sin(t * 5)) * 12;
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', cx + 90, ground - 130 - pop);
    } else if (step === 3) {
        // Headlights in the dark — the pound van
        sky(ctx, w, h, [[0, '#0d1120'], [1, '#251d2e']]);
        // Van behind, headlights glaring
        ctx.fillStyle = '#141a24';
        ctx.fillRect(cx + 120, ground - 150, 260, 150);
        ctx.fillRect(cx + 150, ground - 190, 140, 44);
        ctx.fillStyle = '#0a0e15';
        ctx.fillRect(cx + 165, ground - 182, 46, 30);
        ctx.fillRect(cx + 225, ground - 182, 46, 30);
        // Headlight beams
        for (const ly of [ground - 110, ground - 80]) {
            const beam = ctx.createLinearGradient(cx + 120, ly, cx - 320, ly + 40);
            beam.addColorStop(0, 'rgba(255,245,190,0.55)');
            beam.addColorStop(1, 'rgba(255,245,190,0)');
            ctx.fillStyle = beam;
            ctx.beginPath();
            ctx.moveTo(cx + 120, ly - 12);
            ctx.lineTo(cx - 320, ly - 60);
            ctx.lineTo(cx - 320, ly + 90);
            ctx.lineTo(cx + 120, ly + 14);
            ctx.closePath();
            ctx.fill();
        }
        // Red alarm wash
        ctx.fillStyle = `rgba(255,50,40,${0.1 + 0.08 * Math.sin(t * 6)})`;
        ctx.fillRect(0, 0, w, h);
        drawCineHusky(ctx, cx - 160, ground, 2.4, 'stand', 'scared', t, -1);
    } else if (step === 4) {
        // Silhouettes closing in through the dark
        sky(ctx, w, h, [[0, '#0a0d18'], [1, '#1c1626']]);
        // Ground
        ctx.fillStyle = '#0c0f16';
        ctx.fillRect(0, ground, w, h - ground);
        // Chasing pack
        catcherSilhouette(ctx, cx + 260, ground, 1.5, t * 1.4);
        for (let i = 0; i < 3; i++) {
            const dx = cx + 180 + i * 90 + Math.sin(t * 8 + i * 2) * 8;
            const dogScale = 0.9 + h2(i, 2) * 0.3;
            ctx.save();
            ctx.translate(dx, ground - 6);
            ctx.scale(-dogScale, dogScale);
            ctx.fillStyle = '#0e131b';
            ctx.beginPath();
            ctx.ellipse(0, -18, 26, 12, 0, 0, TAU);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-26, -28, 9, 0, TAU);
            ctx.fill();
            // legs blur
            ctx.strokeStyle = '#0e131b';
            ctx.lineWidth = 5;
            for (const lx of [-14, -4, 10, 18]) {
                const sw = Math.sin(t * 16 + i) * 8;
                ctx.beginPath();
                ctx.moveTo(lx, -10); ctx.lineTo(lx + sw, 0);
                ctx.stroke();
            }
            ctx.restore();
        }
        // Dust cloud behind the pack
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = `rgba(90,95,110,${0.16 - i * 0.02})`;
            ctx.beginPath();
            ctx.arc(cx + 320 + i * 40, ground - 10 - i * 6, 22 + i * 7, 0, TAU);
            ctx.fill();
        }
        drawCineHusky(ctx, cx - 120, ground, 2.4, 'run', 'scared', t);
    } else {
        // Full sprint, speed lines, panicked glance
        sky(ctx, w, h, [[0, '#141a2c'], [1, '#2a2030']]);
        ctx.fillStyle = '#0d1017';
        ctx.fillRect(0, ground, w, h - ground);
        // Speed lines
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 14; i++) {
            const ly = h * 0.2 + h2(i, 3) * h * 0.6;
            const lx = ((i * 173 + t * 900) % (w + 300)) - 150;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx - 160, ly);
            ctx.stroke();
        }
        drawCineHusky(ctx, cx, ground, 3, 'run', 'scared', t);
        // Sweat droplets
        for (let i = 0; i < 4; i++) {
            const sxp = cx - 50 - ((t * 260 + i * 60) % 130);
            ctx.fillStyle = 'rgba(160,215,255,0.8)';
            ctx.beginPath();
            ctx.ellipse(sxp, ground - 120 - i * 14, 3.4, 5, -0.4, 0, TAU);
            ctx.fill();
        }
    }
}

// ---- UNDERWATER INTRO: cliff → gear up ----
function this_underwater(ctx: CanvasRenderingContext2D, step: number, w: number, h: number, cx: number, ground: number, t: number) {
    if (step === 1) {
        // Cliff edge at dusk, panting with relief
        sky(ctx, w, h, [[0, '#2a2140'], [0.6, '#5a3c4a'], [1, '#8a5a48']]);
        stars(ctx, w, h, t, 30);
        // Ocean far below
        ctx.fillStyle = '#1c3a52';
        ctx.fillRect(0, h * 0.86, w, h * 0.14);
        // Cliff on the left
        ctx.fillStyle = '#1a1410';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h * 0.4);
        ctx.lineTo(w * 0.3, h * 0.42);
        ctx.lineTo(w * 0.34, ground + 30);
        ctx.lineTo(w * 0.2, h);
        ctx.closePath();
        ctx.fill();
        // Pebble teetering off the edge
        const pebbleT = (t * 0.5) % 1;
        ctx.fillStyle = '#3a3228';
        ctx.beginPath();
        ctx.arc(w * 0.335, ground - 10 + pebbleT * pebbleT * 260, 5, 0, TAU);
        ctx.fill();
        drawCineHusky(ctx, w * 0.24, ground, 2.4, 'stand', 'happy', t);
    } else if (step === 2) {
        // Mid-fall over the water
        sky(ctx, w, h, [[0, '#3a2c4e'], [0.6, '#7a4a48'], [1, '#b06a4a']]);
        // Ocean below
        ctx.fillStyle = '#20405c';
        ctx.fillRect(0, h * 0.8, w, h * 0.2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            for (let px = 0; px <= w; px += 24) {
                const wy = h * 0.82 + i * 18 + Math.sin(px * 0.02 + t * 2 + i) * 3;
                px === 0 ? ctx.moveTo(px, wy) : ctx.lineTo(px, wy);
            }
            ctx.stroke();
        }
        // Wind rush lines
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2.4;
        for (let i = 0; i < 10; i++) {
            const lx = h2(i, 7) * w;
            const ly = ((i * 97 + t * 700) % (h * 0.8));
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx, ly + 46);
            ctx.stroke();
        }
        drawCineHusky(ctx, cx, h * 0.42, 3, 'fall', 'scared', t);
    } else if (step === 3) {
        // Underwater: quiet blue world
        sky(ctx, w, h, [[0, '#1e6fae'], [1, '#072a46']]);
        // God rays
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 5; i++) {
            const rxp = (i * 0.22 + 0.08) * w + Math.sin(t * 0.5 + i) * 40;
            const g = ctx.createLinearGradient(rxp, 0, rxp + 60, h);
            g.addColorStop(0, 'rgba(180,230,255,0.14)');
            g.addColorStop(1, 'rgba(180,230,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(rxp - 26, 0);
            ctx.lineTo(rxp + 26, 0);
            ctx.lineTo(rxp + 130, h);
            ctx.lineTo(rxp - 60, h);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
        // Kelp
        ctx.strokeStyle = 'rgba(8,42,44,0.85)';
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
            const kx = w * (0.08 + i * 0.17);
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(kx, h + 10);
            for (let s = 1; s <= 6; s++) {
                ctx.lineTo(kx + Math.sin(t * 1.1 + i + s * 0.7) * 16 * (s / 6), h - (h * 0.3 * s) / 6);
            }
            ctx.stroke();
        }
        // Bubbles
        for (let i = 0; i < 16; i++) {
            const bx2 = (i * 137.3) % w;
            const by2 = h - ((t * 60 + i * 90) % (h * 1.1));
            ctx.strokeStyle = 'rgba(210,240,255,0.5)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(bx2, by2, 2 + (i % 4), 0, TAU);
            ctx.stroke();
        }
        drawCineHusky(ctx, cx, h * 0.6, 2.6, 'swim', 'sad', t);
    } else if (step === 4) {
        // Snorkel gear reveal
        sky(ctx, w, h, [[0, '#1e6fae'], [1, '#0a3050']]);
        // Light rays softer
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const g = ctx.createLinearGradient(cx, 0, cx, h);
        g.addColorStop(0, 'rgba(180,230,255,0.16)');
        g.addColorStop(1, 'rgba(180,230,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - 160, 0, 320, h);
        ctx.restore();
        drawCineHusky(ctx, cx, h * 0.62, 3.4, 'swim', 'happy', t);
        // Snorkel + mask drawn over the head area
        const hx = cx + 3.4 * 22, hy = h * 0.62 - 3.4 * 10;
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(hx + 8, hy - 26);
        ctx.lineTo(hx + 14, hy - 44);
        ctx.stroke();
        ctx.fillStyle = 'rgba(80,200,255,0.5)';
        ctx.beginPath();
        ctx.roundRect(hx - 16, hy - 12, 30, 14, 6);
        ctx.fill();
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        // Sparkle on the mask
        const sp = (Math.sin(t * 4) + 1) / 2;
        if (sp > 0.7) {
            ctx.strokeStyle = `rgba(255,255,255,${(sp - 0.7) * 3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hx - 6, hy - 10);
            ctx.lineTo(hx - 1, hy - 5);
            ctx.stroke();
        }
    } else {
        // Swimming with purpose
        sky(ctx, w, h, [[0, '#1a63a0'], [1, '#082a44']]);
        // Speed bubbles trailing
        for (let i = 0; i < 12; i++) {
            const bx2 = cx - 80 - ((t * 200 + i * 55) % 240);
            const by2 = h * 0.62 + Math.sin(t * 3 + i) * 26 - 10;
            ctx.strokeStyle = 'rgba(210,240,255,0.55)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(bx2, by2, 2.4 + (i % 3), 0, TAU);
            ctx.stroke();
        }
        // Fish darting away
        for (let i = 0; i < 4; i++) {
            const fx = cx + 180 + i * 70 + Math.sin(t * 2 + i) * 20;
            const fy = h * (0.3 + 0.12 * i) + Math.sin(t * 3 + i * 1.4) * 14;
            ctx.fillStyle = 'rgba(240,200,120,0.85)';
            ctx.beginPath();
            ctx.ellipse(fx, fy, 9, 4, 0.2, 0, TAU);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(fx + 8, fy);
            ctx.lineTo(fx + 16, fy - 5);
            ctx.lineTo(fx + 16, fy + 5);
            ctx.closePath();
            ctx.fill();
        }
        drawCineHusky(ctx, cx, h * 0.6, 2.8, 'swim', 'determined', t);
    }
}

// ---- PIER INTRO: surfaced → storm ----
function this_pier(ctx: CanvasRenderingContext2D, step: number, w: number, h: number, cx: number, ground: number, t: number) {
    if (step === 1) {
        // Surfacing, gasping, dusk sea
        sky(ctx, w, h, [[0, '#141c30'], [0.6, '#2c3a4e'], [1, '#4a3c48']]);
        stars(ctx, w, h, t, 40);
        // Sea
        ctx.fillStyle = '#16303f';
        ctx.fillRect(0, h * 0.55, w, h * 0.45);
        ctx.strokeStyle = 'rgba(160,200,230,0.3)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            for (let px = 0; px <= w; px += 22) {
                const wy = h * 0.58 + i * 26 + Math.sin(px * 0.014 + t * (1.4 + i * 0.3)) * 5;
                px === 0 ? ctx.moveTo(px, wy) : ctx.lineTo(px, wy);
            }
            ctx.stroke();
        }
        // Onyx head + shoulders above water, splashing
        drawCineHusky(ctx, cx, h * 0.62, 2.8, 'surface', 'alert', t);
        // Splash ring
        ctx.strokeStyle = `rgba(230,245,255,${0.5 * (1 - (t % 1))})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, h * 0.64, 40 + (t % 1) * 70, 10 + (t % 1) * 16, 0, 0, TAU);
        ctx.stroke();
    } else if (step === 2) {
        // City lights discovery
        sky(ctx, w, h, [[0, '#101a30'], [1, '#2c3048']]);
        stars(ctx, w, h, t, 50);
        moon(ctx, w * 0.2, h * 0.18, 26);
        citySkyline(ctx, w * 0.55, h * 0.62, t, 1);
        // Sea in front
        ctx.fillStyle = '#14293a';
        ctx.fillRect(0, h * 0.6, w, h * 0.4);
        // Light reflections shimmering on water
        for (let i = 0; i < 14; i++) {
            const rxp = w * 0.06 + i * 34 + Math.sin(t * 2 + i) * 6;
            const ryp = h * 0.64 + (i % 5) * 20;
            ctx.fillStyle = `rgba(255,214,120,${0.25 + 0.2 * Math.sin(t * 3 + i)})`;
            ctx.fillRect(rxp, ryp, 3, 7);
        }
        // Rock Onyx stands on
        ctx.fillStyle = '#0c1016';
        ctx.beginPath();
        ctx.ellipse(cx - 60, ground + 26, 90, 26, 0, 0, TAU);
        ctx.fill();
        drawCineHusky(ctx, cx - 60, ground + 6, 2.4, 'stand', 'alert', t);
    } else if (step === 3) {
        // Calm warm horizon — hope
        sky(ctx, w, h, [[0, '#1c2440'], [0.55, '#4a3a52'], [1, '#c47a4a']]);
        // Warm sun glow on horizon
        const sg = ctx.createRadialGradient(cx, h * 0.6, 10, cx, h * 0.6, 300);
        sg.addColorStop(0, 'rgba(255,190,110,0.5)');
        sg.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, w, h);
        // Calm sea with golden path
        ctx.fillStyle = '#243448';
        ctx.fillRect(0, h * 0.6, w, h * 0.4);
        const path = ctx.createLinearGradient(0, h * 0.6, 0, h);
        path.addColorStop(0, 'rgba(255,200,130,0.4)');
        path.addColorStop(1, 'rgba(255,200,130,0.05)');
        ctx.fillStyle = path;
        ctx.beginPath();
        ctx.moveTo(cx - 26, h * 0.6);
        ctx.lineTo(cx + 26, h * 0.6);
        ctx.lineTo(cx + 120, h);
        ctx.lineTo(cx - 120, h);
        ctx.closePath();
        ctx.fill();
        drawCineHusky(ctx, cx - 200, h * 0.66, 2.2, 'sit', 'happy', t, -1);
    } else if (step === 4) {
        // Storm gathering
        sky(ctx, w, h, [[0, '#080c16'], [0.6, '#1a2330'], [1, '#232c38']]);
        // Heavy scrolling clouds
        ctx.fillStyle = 'rgba(8,12,22,0.8)';
        for (let i = 0; i < 8; i++) {
            const cxp = ((i * 260 - t * 30) % (w + 500)) - 250;
            const cyp = h * 0.14 + ((i * 53) % Math.floor(h * 0.2));
            ctx.beginPath();
            ctx.ellipse(cxp, cyp, 170, 42, 0, 0, TAU);
            ctx.ellipse(cxp + 120, cyp + 18, 130, 34, 0, 0, TAU);
            ctx.fill();
        }
        // Lightning
        const flash = (t * 0.5) % 1;
        if (flash > 0.86) {
            ctx.fillStyle = `rgba(200,220,255,${0.3 * Math.sin((flash - 0.86) / 0.14 * Math.PI)})`;
            ctx.fillRect(0, 0, w, h);
        }
        // Angry sea
        ctx.fillStyle = '#101d2a';
        ctx.fillRect(0, h * 0.6, w, h * 0.4);
        ctx.strokeStyle = 'rgba(150,185,215,0.35)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            for (let px = 0; px <= w; px += 18) {
                const wy = h * 0.64 + i * 22 + Math.sin(px * 0.02 + t * (2.2 + i * 0.4)) * 7;
                px === 0 ? ctx.moveTo(px, wy) : ctx.lineTo(px, wy);
            }
            ctx.stroke();
        }
        rain(ctx, w, h, t, 70);
        drawCineHusky(ctx, cx - 140, h * 0.7, 2.2, 'stand', 'determined', t, -1);
    } else {
        // The pier walk into the storm
        sky(ctx, w, h, [[0, '#070b14'], [1, '#1a222c']]);
        // Storm clouds
        ctx.fillStyle = 'rgba(8,12,22,0.85)';
        for (let i = 0; i < 7; i++) {
            const cxp = ((i * 300 - t * 24) % (w + 500)) - 250;
            ctx.beginPath();
            ctx.ellipse(cxp, h * 0.16 + (i % 3) * 30, 180, 44, 0, 0, TAU);
            ctx.fill();
        }
        // Pier planks receding
        ctx.fillStyle = '#241a12';
        ctx.beginPath();
        ctx.moveTo(w * 0.3, h);
        ctx.lineTo(w * 0.7, h);
        ctx.lineTo(w * 0.56, ground - 40);
        ctx.lineTo(w * 0.44, ground - 40);
        ctx.closePath();
        ctx.fill();
        // Plank gaps
        ctx.strokeStyle = 'rgba(10,6,4,0.7)';
        ctx.lineWidth = 3;
        let py = h;
        let gap = 60;
        while (py > ground - 40) {
            ctx.beginPath();
            ctx.moveTo(w * 0.3 + (h - py) / (h - ground + 40) * w * 0.12, py);
            ctx.lineTo(w * 0.7 - (h - py) / (h - ground + 40) * w * 0.12, py);
            ctx.stroke();
            py -= gap;
            gap *= 0.82;
        }
        // Railing posts
        ctx.fillStyle = '#1a130d';
        for (const [rxp, ry] of [[w * 0.4, ground - 90], [w * 0.47, ground - 66], [w * 0.53, ground - 66], [w * 0.6, ground - 90]] as const) {
            ctx.fillRect(rxp, ry, 8, 70);
        }
        rain(ctx, w, h, t, 100);
        drawCineHusky(ctx, cx, ground - 36, 2.2, 'run', 'determined', t);
    }
}
