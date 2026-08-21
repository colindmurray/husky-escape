
// Enhanced per-level parallax backgrounds.
//
// Purely presentational: reads only (width, height, cameraX, currentLevel, time)
// and paints richer multi-layer scenes than the classic flat backgrounds.
// Nothing here mutates world state, so flipping the visual toggle mid-level is
// seamless and gameplay-identical.

import { hash1, hash2, rand2 } from "./Rng";

export class EnhancedBackgrounds {

    public draw(ctx: CanvasRenderingContext2D, width: number, height: number, cameraX: number, level: number) {
        const t = performance.now() / 1000;
        switch (level) {
            case 1:
            case 2: this.drawPound(ctx, width, height, cameraX, level, t); break;
            case 3: this.drawForest(ctx, width, height, cameraX, t); break;
            case 4: this.drawBeach(ctx, width, height, cameraX, t); break;
            case 5: this.drawMountain(ctx, width, height, cameraX, t); break;
            case 6: this.drawSki(ctx, width, height, cameraX, t); break;
            case 7: this.drawChase(ctx, width, height, cameraX, t); break;
            case 8: this.drawUnderwater(ctx, width, height, cameraX, t); break;
            case 9: this.drawPier(ctx, width, height, cameraX, t); break;
            case 10: this.drawConstruction(ctx, width, height, cameraX, t); break;
        }
    }

    // ------------------------------------------------------------------ //
    // LEVELS 1–2: THE POUND — cold kennel interior / yard at night
    // ------------------------------------------------------------------ //
    private drawPound(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, level: number, t: number) {
        // Cold night gradient
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        if (level === 1) {
            sky.addColorStop(0, "#0b1220");
            sky.addColorStop(0.55, "#152238");
            sky.addColorStop(1, "#0d1626");
        } else {
            // Level 2: late dusk with a hint of sunset on the horizon
            sky.addColorStop(0, "#0b1024");
            sky.addColorStop(0.5, "#232b47");
            sky.addColorStop(0.85, "#4a3a52");
            sky.addColorStop(1, "#5c4050");
        }
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Stars (level 2 sees the sky through the yard)
        if (level === 2) {
            for (let i = 0; i < 60; i++) {
                const sx = (i * 197.3 - camX * 0.02) % (w + 40) - 20;
                const sy = hash1(i) * h * 0.4;
                const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.5 + hash1(i + 99)) + i));
                const px = ((sx % (w + 40)) + (w + 40)) % (w + 40) - 20;
                ctx.fillStyle = `rgba(220,230,255,${0.55 * tw})`;
                ctx.fillRect(px, sy, 2, 2);
            }
            // Moon
            const moonX = w - 140 - ((camX * 0.02) % (w * 2));
            const mg = ctx.createRadialGradient(moonX, 110, 10, moonX, 110, 90);
            mg.addColorStop(0, "rgba(240,240,220,0.9)");
            mg.addColorStop(0.25, "rgba(240,240,220,0.28)");
            mg.addColorStop(1, "rgba(240,240,220,0)");
            ctx.fillStyle = mg;
            ctx.fillRect(moonX - 100, 10, 200, 200);
            ctx.fillStyle = "#e8e6d3";
            ctx.beginPath();
            ctx.arc(moonX, 110, 34, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(180,178,160,0.5)";
            ctx.beginPath(); ctx.arc(moonX - 10, 100, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(moonX + 12, 122, 4, 0, Math.PI * 2); ctx.fill();
        }

        // Distant chain-link fence silhouette (level 2 yard)
        if (level === 2) {
            ctx.save();
            ctx.strokeStyle = "rgba(20,26,40,0.9)";
            ctx.lineWidth = 3;
            const period = 160;
            for (let i = 0; i < w + camX * 0.25; i += period) {
                const x = (((i - camX * 0.25) % (w + period)) + (w + period)) % (w + period) - period / 2;
                ctx.beginPath();
                ctx.moveTo(x, h * 0.62);
                ctx.lineTo(x, h - 60);
                ctx.stroke();
            }
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(20,26,40,0.45)";
            for (let y = h * 0.62; y < h - 60; y += 14) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 7); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y - 7); ctx.stroke();
            }
            ctx.restore();
        }

        // Floodlight pools sweeping the ground (both levels)
        for (let i = 0; i < 6; i++) {
            const lx = (((i * 700 - camX * 0.55) % (w + 800)) + (w + 800)) % (w + 800) - 400;
            const flicker = 0.75 + 0.25 * Math.sin(t * 13 + i * 7) * (hash1(i) > 0.7 ? 1 : 0.08);
            const g = ctx.createRadialGradient(lx, h - 70, 10, lx, h - 70, 260);
            g.addColorStop(0, `rgba(255,244,190,${0.16 * flicker})`);
            g.addColorStop(1, "rgba(255,244,190,0)");
            ctx.fillStyle = g;
            ctx.fillRect(lx - 260, h - 330, 520, 330);
            // Lamp post
            ctx.fillStyle = "rgba(10,15,26,0.95)";
            ctx.fillRect(lx - 4, h - 320, 8, 250);
            ctx.fillStyle = `rgba(255,244,200,${0.85 * flicker})`;
            ctx.beginPath();
            ctx.ellipse(lx, h - 322, 12, 7, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Kennel bars in foreground shadow (level 1 interior feel)
        if (level === 1) {
            ctx.save();
            ctx.fillStyle = "rgba(6,10,18,0.55)";
            const barPeriod = 130;
            for (let i = 0; i < w + camX * 0.8; i += barPeriod) {
                const x = (((i - camX * 0.8) % (w + barPeriod)) + (w + barPeriod)) % (w + barPeriod) - barPeriod / 2;
                ctx.fillRect(x, 0, 18, h);
            }
            ctx.restore();
        }
    }

    // ------------------------------------------------------------------ //
    // LEVEL 3: SPOOKY FOREST — layered misty pines, moon, fireflies
    // ------------------------------------------------------------------ //
    private drawForest(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, t: number) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#04040f");
        sky.addColorStop(0.6, "#101226");
        sky.addColorStop(1, "#182036");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Big low moon with halo
        const mx = w * 0.72 - ((camX * 0.04) % (w * 1.5));
        const halo = ctx.createRadialGradient(mx, h * 0.24, 20, mx, h * 0.24, 170);
        halo.addColorStop(0, "rgba(210,225,255,0.32)");
        halo.addColorStop(1, "rgba(210,225,255,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(mx - 180, h * 0.24 - 180, 360, 360);
        ctx.fillStyle = "#d8def0";
        ctx.beginPath();
        ctx.arc(mx, h * 0.24, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(150,160,185,0.45)";
        ctx.beginPath(); ctx.arc(mx - 14, h * 0.24 - 10, 9, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(mx + 16, h * 0.24 + 12, 6, 0, Math.PI * 2); ctx.fill();

        // Three parallax layers of pine silhouettes
        const layers = [
            { parallax: 0.12, base: 0.86, color: "rgba(16,20,38,0.85)", step: 210, hMin: 300, hMax: 430 },
            { parallax: 0.3, base: 0.94, color: "rgba(10,12,26,0.92)", step: 260, hMin: 340, hMax: 500 },
            { parallax: 0.55, base: 1.02, color: "#05060f", step: 330, hMin: 380, hMax: 560 },
        ];
        for (const L of layers) {
            ctx.fillStyle = L.color;
            for (let i = 0; i < w + camX * L.parallax; i += L.step) {
                let x = (i - camX * L.parallax) % (w + 400);
                if (x < -200) x += w + 400;
                const seed = Math.floor((i + camX * 0) / L.step) + L.parallax * 1000;
                const th = rand2(seed, L.parallax * 77, L.hMin, L.hMax);
                const topY = h * L.base - th;
                // Trunk
                ctx.fillRect(x + L.step * 0.44, topY + th * 0.5, 14, th * 0.55);
                // Jagged canopy tiers
                for (let tier = 0; tier < 4; tier++) {
                    const ty = topY + (th * 0.55) * (tier / 4);
                    const halfW = 30 + tier * 22 + rand2(seed, tier, -8, 8);
                    const tipY = ty - th * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(x + L.step * 0.5 - halfW, ty);
                    ctx.lineTo(x + L.step * 0.5, tipY);
                    ctx.lineTo(x + L.step * 0.5 + halfW, ty);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        // Drifting fog banks
        for (let i = 0; i < 5; i++) {
            const fx = ((t * (14 + i * 9) + i * 500 - camX * 0.35) % (w + 700)) - 350;
            const fy = h - 70 - i * 36;
            const fg = ctx.createRadialGradient(fx, fy, 10, fx, fy, 320);
            fg.addColorStop(0, `rgba(120,135,175,${0.05 + 0.02 * (i % 2)})`);
            fg.addColorStop(1, "rgba(120,135,175,0)");
            ctx.fillStyle = fg;
            ctx.fillRect(fx - 330, fy - 120, 660, 240);
        }

        // Glowing eyes deep between the trees (rare blink)
        for (let i = 0; i < 12; i++) {
            const ex = (((i * 397 - camX * 0.3) % (w + 300)) + (w + 300)) % (w + 300) - 150;
            const ey = h * 0.45 + hash1(i + 31) * h * 0.3;
            const blink = Math.sin(t * 1.4 + i * 2.7) > 0.96;
            if (blink) continue;
            const glow = 0.35 + 0.25 * Math.sin(t * 2 + i * 1.9);
            const red = i % 4 === 0;
            ctx.fillStyle = red ? `rgba(255,60,50,${glow})` : `rgba(255,220,80,${glow})`;
            ctx.beginPath();
            ctx.arc(ex, ey, 2.4, 0, Math.PI * 2);
            ctx.arc(ex + 9, ey, 2.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ------------------------------------------------------------------ //
    // LEVEL 4: BEACH — sunny sky, sparkling ocean, distant island
    // ------------------------------------------------------------------ //
    private drawBeach(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, t: number) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#3fa7e0");
        sky.addColorStop(0.55, "#8fd3f0");
        sky.addColorStop(0.78, "#cdeef7");
        sky.addColorStop(1, "#ffe9b8");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Sun with heat haze
        const sx = w - 160 - ((camX * 0.02) % (w * 2));
        const sg = ctx.createRadialGradient(sx, 120, 20, sx, 120, 130);
        sg.addColorStop(0, "rgba(255,250,220,1)");
        sg.addColorStop(0.2, "rgba(255,235,170,0.75)");
        sg.addColorStop(1, "rgba(255,235,170,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(sx - 140, -20, 280, 280);

        // Puffy cumulus clouds, two depths
        for (const dep of [{ p: 0.06, s: 1, a: 0.9 }, { p: 0.12, s: 1.5, a: 0.98 }]) {
            ctx.fillStyle = `rgba(255,255,255,${dep.a})`;
            for (let i = 0; i < w + camX * dep.p; i += 420) {
                let x = (i - camX * dep.p - t * 6 * dep.s) % (w + 600);
                if (x < -300) x += w + 600;
                const y = 70 + hash1(i + dep.p * 999) * h * 0.22;
                const cs = dep.s * (0.8 + hash1(i + 5) * 0.5);
                ctx.beginPath();
                ctx.arc(x, y, 26 * cs, 0, Math.PI * 2);
                ctx.arc(x + 34 * cs, y - 12 * cs, 34 * cs, 0, Math.PI * 2);
                ctx.arc(x + 74 * cs, y, 26 * cs, 0, Math.PI * 2);
                ctx.arc(x + 37 * cs, y + 10 * cs, 30 * cs, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Distant island silhouette on the horizon
        const horizon = h - 130;
        ctx.fillStyle = "rgba(90,140,150,0.5)";
        const ix = ((-camX * 0.05) % (w + 900)) - 200;
        ctx.beginPath();
        ctx.moveTo(ix, horizon);
        ctx.quadraticCurveTo(ix + 120, horizon - 90, ix + 300, horizon);
        ctx.closePath();
        ctx.fill();

        // Ocean band with animated wave stripes + sparkles
        const og = ctx.createLinearGradient(0, horizon, 0, h);
        og.addColorStop(0, "#2f8fb8");
        og.addColorStop(0.5, "#2a7ba6");
        og.addColorStop(1, "#1d5f86");
        ctx.fillStyle = og;
        ctx.fillRect(0, horizon, w, h - horizon);

        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 2;
        for (let r = 0; r < 7; r++) {
            const wy = horizon + 12 + r * ((h - horizon) / 7);
            const phase = t * (1.1 + r * 0.28) + r * 2.2;
            ctx.beginPath();
            for (let x = 0; x <= w; x += 24) {
                const wob = Math.sin(phase + x * 0.02 + r) * (2 + r * 0.8);
                if (x === 0) ctx.moveTo(x, wy + wob);
                else ctx.lineTo(x, wy + wob);
            }
            ctx.stroke();
        }
        // Sparkles
        for (let i = 0; i < 26; i++) {
            const px = (((i * 173 - camX * 0.3) % (w + 60)) + (w + 60)) % (w + 60) - 30;
            const py = horizon + 8 + hash1(i + 61) * (h - horizon - 20);
            const tw = Math.sin(t * 3 + i * 2.4);
            if (tw > 0.55) {
                ctx.fillStyle = `rgba(255,255,255,${(tw - 0.55) * 1.6})`;
                ctx.fillRect(px, py, 3, 1.4);
            }
        }
    }

    // ------------------------------------------------------------------ //
    // LEVEL 5: MOUNTAIN — alpine gradients, snow peaks above cloud sea
    // ------------------------------------------------------------------ //
    private drawMountain(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, t: number) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#274b8f");
        sky.addColorStop(0.45, "#5f8fd0");
        sky.addColorStop(0.8, "#aacdee");
        sky.addColorStop(1, "#dceaf8");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Far range (bluish haze)
        this.drawPeakRange(ctx, w, h, camX, 0.08, h * 0.42, 480, 640, "rgba(126,158,204,0.75)", "rgba(232,240,252,0.9)", 900);
        // Mid range
        this.drawPeakRange(ctx, w, h, camX, 0.18, h * 0.58, 420, 560, "#6d88ad", "#eef4fb", 760);
        // Near rocky ridge
        this.drawPeakRange(ctx, w, h, camX, 0.34, h * 0.78, 360, 480, "#4c5e78", "#f4f8fd", 620);

        // Cloud sea drifting below the near ridge
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        for (let i = 0; i < w + camX * 0.25; i += 260) {
            let x = (i - camX * 0.25 - t * 10) % (w + 520);
            if (x < -260) x += w + 520;
            const y = h * 0.86 + hash1(i + 17) * 40;
            ctx.beginPath();
            ctx.ellipse(x, y, 150, 26, 0, 0, Math.PI * 2);
            ctx.ellipse(x + 110, y + 12, 120, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // Soft white fade into playfield floor
        const fade = ctx.createLinearGradient(0, h * 0.9, 0, h);
        fade.addColorStop(0, "rgba(240,247,255,0)");
        fade.addColorStop(1, "rgba(240,247,255,0.85)");
        ctx.fillStyle = fade;
        ctx.fillRect(0, h * 0.9, w, h * 0.1);
    }

    private drawPeakRange(
        ctx: CanvasRenderingContext2D, w: number, h: number, camX: number,
        parallax: number, baseY: number, hMin: number, hMax: number,
        rockColor: string, snowColor: string, period: number
    ) {
        for (let i = 0; i < w + camX * parallax; i += period) {
            let x = (i - camX * parallax) % (w + period * 2);
            if (x < -period) x += w + period * 2;
            const seed = Math.floor(i / period) + Math.round(parallax * 100);
            const ph = rand2(seed, 3, hMin, hMax);
            const peakX = x + period * 0.5;

            ctx.fillStyle = rockColor;
            ctx.beginPath();
            ctx.moveTo(x - period * 0.2, baseY);
            ctx.lineTo(peakX - ph * 0.18, baseY - ph * 0.72);
            ctx.lineTo(peakX, baseY - ph);
            ctx.lineTo(peakX + ph * 0.22, baseY - ph * 0.66);
            ctx.lineTo(x + period * 1.2, baseY);
            ctx.closePath();
            ctx.fill();

            // Snow cap
            ctx.fillStyle = snowColor;
            ctx.beginPath();
            ctx.moveTo(peakX, baseY - ph);
            ctx.lineTo(peakX - ph * 0.13, baseY - ph * 0.68);
            ctx.lineTo(peakX - ph * 0.05, baseY - ph * 0.62);
            ctx.lineTo(peakX + ph * 0.04, baseY - ph * 0.7);
            ctx.lineTo(peakX + ph * 0.15, baseY - ph * 0.64);
            ctx.closePath();
            ctx.fill();
        }
    }

    // ------------------------------------------------------------------ //
    // LEVEL 6: SKI SLOPE — crisp bright winter, sun, distant pines
    // ------------------------------------------------------------------ //
    private drawSki(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, t: number) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#3f7fd4");
        sky.addColorStop(0.6, "#9cc8ee");
        sky.addColorStop(1, "#e8f4fd");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Bright sun
        const sx = w - 200 - ((camX * 0.03) % (w * 2));
        const sg = ctx.createRadialGradient(sx, 110, 15, sx, 110, 110);
        sg.addColorStop(0, "rgba(255,255,245,1)");
        sg.addColorStop(0.25, "rgba(255,250,215,0.7)");
        sg.addColorStop(1, "rgba(255,250,215,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(sx - 120, -10, 240, 240);

        // Far peaks
        this.drawPeakRange(ctx, w, h, camX, 0.07, h * 0.5, 380, 500, "rgba(148,172,205,0.8)", "rgba(255,255,255,0.95)", 850);

        // Pine lines flanking the slope
        for (const dep of [
            { p: 0.2, base: 0.8, col: "rgba(38,74,58,0.85)", sc: 0.8, step: 150 },
            { p: 0.4, base: 0.95, col: "#1e3d30", sc: 1.25, step: 210 },
        ]) {
            ctx.fillStyle = dep.col;
            for (let i = 0; i < w + camX * dep.p; i += dep.step) {
                let x = (i - camX * dep.p) % (w + dep.step * 2);
                if (x < -dep.step) x += w + dep.step * 2;
                const seed = Math.floor(i / dep.step) + dep.p * 500;
                const th = (60 + hash1(seed) * 60) * dep.sc;
                const by = h * dep.base;
                ctx.beginPath();
                ctx.moveTo(x, by);
                ctx.lineTo(x + 11 * dep.sc, by - th);
                ctx.lineTo(x + 22 * dep.sc, by);
                ctx.closePath();
                ctx.fill();
                ctx.fillRect(x + 9 * dep.sc, by - 2, 4 * dep.sc, 8);
            }
        }

        // Slope shading: big soft diagonal highlight across the snow field
        const sh = ctx.createLinearGradient(0, h * 0.55, w, h);
        sh.addColorStop(0, "rgba(255,255,255,0.5)");
        sh.addColorStop(0.5, "rgba(214,233,250,0.18)");
        sh.addColorStop(1, "rgba(160,190,225,0.3)");
        ctx.fillStyle = sh;
        ctx.fillRect(0, h * 0.55, w, h * 0.45);
    }

    // ------------------------------------------------------------------ //
    // LEVEL 7: THE CHASE — sunny plains with strong speed energy
    // ------------------------------------------------------------------ //
    private drawChase(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, t: number) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#2e9be6");
        sky.addColorStop(0.7, "#8ed0f5");
        sky.addColorStop(1, "#d8f0fa");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Blazing sun
        const sx = w - 140 - ((camX * 0.01) % (w * 2));
        const sg = ctx.createRadialGradient(sx, 100, 20, sx, 100, 140);
        sg.addColorStop(0, "rgba(255,255,230,1)");
        sg.addColorStop(0.22, "rgba(255,245,180,0.8)");
        sg.addColorStop(1, "rgba(255,245,180,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(sx - 150, -40, 300, 300);

        // Streaking clouds (fast horizontal smear conveys speed)
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        for (let i = 0; i < w + camX * 0.5; i += 340) {
            let x = (i - camX * 0.5) % (w + 680);
            if (x < -340) x += w + 680;
            const y = 60 + hash1(i + 71) * h * 0.3;
            ctx.beginPath();
            ctx.ellipse(x, y, 90, 14, 0, 0, Math.PI * 2);
            ctx.ellipse(x + 70, y + 6, 70, 11, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rolling hills, two layers
        ctx.fillStyle = "rgba(96,164,88,0.8)";
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 30) {
            const wx = x + camX * 0.15;
            ctx.lineTo(x, h * 0.72 + Math.sin(wx * 0.004) * 46 + Math.sin(wx * 0.0013) * 60);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#5da24f";
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 30) {
            const wx = x + camX * 0.35;
            ctx.lineTo(x, h * 0.84 + Math.sin(wx * 0.006 + 2) * 30 + Math.sin(wx * 0.002) * 40);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Road/track stripe along the bottom
        ctx.fillStyle = "#8d9aa5";
        ctx.fillRect(0, h - 54, w, 54);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        const dashW = 70;
        const off = (camX * 1.0) % (dashW * 2);
        for (let x = -off; x < w; x += dashW * 2) {
            ctx.fillRect(x, h - 30, dashW, 6);
        }
    }

    // ------------------------------------------------------------------ //
    // LEVEL 8: UNDERWATER — depth gradient, god rays, kelp, caustics
    // ------------------------------------------------------------------ //
    private drawUnderwater(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, t: number) {
        const sea = ctx.createLinearGradient(0, 0, 0, h);
        sea.addColorStop(0, "#1e6fae");
        sea.addColorStop(0.45, "#15568c");
        sea.addColorStop(1, "#072a46");
        ctx.fillStyle = sea;
        ctx.fillRect(0, 0, w, h);

        // Animated god rays from the surface
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (let i = 0; i < 7; i++) {
            const rayX = (((i * 260 - camX * 0.1) % (w + 500)) + (w + 500)) % (w + 500) - 250;
            const sway = Math.sin(t * 0.5 + i * 1.7) * 60;
            const alpha = 0.05 + 0.035 * Math.sin(t * 0.8 + i * 2.3);
            const g = ctx.createLinearGradient(rayX, 0, rayX + sway, h);
            g.addColorStop(0, `rgba(180,230,255,${alpha + 0.06})`);
            g.addColorStop(1, "rgba(180,230,255,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(rayX - 30, -10);
            ctx.lineTo(rayX + 30, -10);
            ctx.lineTo(rayX + sway + 130, h);
            ctx.lineTo(rayX + sway - 60, h);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Water surface shimmer at the very top
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = "rgba(220,245,255,0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 18) {
            const wx = x + camX * 0.2;
            const y = 6 + Math.sin(wx * 0.03 + t * 2.2) * 4 + Math.sin(wx * 0.011 - t) * 3;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // Kelp forest silhouettes swaying (two depths)
        for (const dep of [
            { p: 0.15, col: "rgba(10,50,52,0.55)", sc: 1, amp: 14 },
            { p: 0.35, col: "rgba(6,38,40,0.8)", sc: 1.5, amp: 22 },
        ]) {
            ctx.strokeStyle = dep.col;
            ctx.lineCap = "round";
            for (let i = 0; i < w + camX * dep.p; i += 170 * dep.sc) {
                let x = (i - camX * dep.p) % (w + 340);
                if (x < -170) x += w + 340;
                const seed = Math.floor(i / (170 * dep.sc)) + dep.p * 300;
                const kh = (h * 0.35) * (0.7 + hash1(seed) * 0.6);
                const segs = 8;
                ctx.lineWidth = 7 * dep.sc;
                ctx.beginPath();
                ctx.moveTo(x, h + 10);
                for (let sIdx = 1; sIdx <= segs; sIdx++) {
                    const fy = h + 10 - (kh * sIdx) / segs;
                    const bend = Math.sin(t * 1.1 + seed + sIdx * 0.7) * dep.amp * (sIdx / segs);
                    ctx.lineTo(x + bend, fy);
                }
                ctx.stroke();
                // Leaf blades
                ctx.lineWidth = 3 * dep.sc;
                for (let sIdx = 2; sIdx < segs; sIdx += 2) {
                    const fy = h + 10 - (kh * sIdx) / segs;
                    const bend = Math.sin(t * 1.1 + seed + sIdx * 0.7) * dep.amp * (sIdx / segs);
                    const dir = sIdx % 4 === 0 ? 1 : -1;
                    ctx.beginPath();
                    ctx.moveTo(x + bend, fy);
                    ctx.quadraticCurveTo(x + bend + dir * 22 * dep.sc, fy - 8, x + bend + dir * 34 * dep.sc, fy - 2);
                    ctx.stroke();
                }
            }
        }

        // Seabed silhouette
        ctx.fillStyle = "rgba(4,24,38,0.9)";
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 40) {
            const wx = x + camX * 0.4;
            ctx.lineTo(x, h - 26 - Math.sin(wx * 0.008) * 14 - hash2(Math.floor(wx / 40), 9) * 10);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
    }

    // ------------------------------------------------------------------ //
    // LEVEL 9: STORMY PIER — churning sea, skyline, lighthouse, lightning
    // ------------------------------------------------------------------ //
    private drawPier(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, t: number) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#0a0f1c");
        sky.addColorStop(0.55, "#1c2735");
        sky.addColorStop(0.8, "#2c3a49");
        sky.addColorStop(1, "#141d29");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Churning storm clouds (two dark layers scrolling)
        for (const cl of [{ p: 0.05, a: 0.5, sc: 2.2, sp: 8 }, { p: 0.1, a: 0.75, sc: 1.4, sp: 16 }]) {
            ctx.fillStyle = `rgba(8,12,22,${cl.a})`;
            for (let i = 0; i < w + camX * cl.p; i += 200 * cl.sc) {
                let x = (i - camX * cl.p - t * cl.sp) % (w + 400 * cl.sc);
                if (x < -200 * cl.sc) x += w + 400 * cl.sc;
                const y = 30 + hash1(i + cl.p * 77) * h * 0.3;
                ctx.beginPath();
                ctx.ellipse(x, y, 130 * cl.sc, 40 * cl.sc, 0, 0, Math.PI * 2);
                ctx.ellipse(x + 100 * cl.sc, y + 16 * cl.sc, 100 * cl.sc, 32 * cl.sc, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Lightning flash (irregular but deterministic-ish timing)
        const flashCycle = (t * 0.4 + Math.sin(t * 0.13) * 0.2) % 1;
        if (flashCycle > 0.93) {
            const strength = (flashCycle - 0.93) / 0.07;
            ctx.fillStyle = `rgba(200,220,255,${0.35 * Math.sin(strength * Math.PI)})`;
            ctx.fillRect(0, 0, w, h);
        }

        // City skyline (deterministic windows — no more flicker)
        const skylineBase = h - 110;
        ctx.fillStyle = "rgba(10,14,20,0.95)";
        for (let i = 0; i < w + camX * 0.1; i += 56) {
            let x = (i - camX * 0.1) % (w + 120);
            if (x < -60) x += w + 120;
            const seed = Math.floor(i / 56);
            const bh = 60 + hash1(seed + 5) * 130;
            ctx.fillRect(x, skylineBase - bh, 44, bh);
            // Windows
            for (let wy = skylineBase - bh + 10; wy < skylineBase - 8; wy += 16) {
                for (let wx = x + 6; wx < x + 40; wx += 12) {
                    const lit = hash2(Math.floor(wx), Math.floor(wy)) > 0.72;
                    const flick = lit && hash2(Math.floor(wx), Math.floor(wy) + Math.floor(t * 0.5)) > 0.06;
                    if (lit && flick) {
                        ctx.fillStyle = `rgba(255,214,120,${0.35 + hash2(Math.floor(wx), Math.floor(wy) + 3) * 0.4})`;
                        ctx.fillRect(wx, wy, 4, 6);
                        ctx.fillStyle = "rgba(10,14,20,0.95)";
                    }
                }
            }
        }

        // Rough sea with rolling waves
        const seaBase = h - 105;
        const sg = ctx.createLinearGradient(0, seaBase, 0, h);
        sg.addColorStop(0, "#16303f");
        sg.addColorStop(1, "#0a1a26");
        ctx.fillStyle = sg;
        ctx.fillRect(0, seaBase, w, h - seaBase);

        ctx.strokeStyle = "rgba(160,200,230,0.28)";
        ctx.lineWidth = 2.5;
        for (let r = 0; r < 5; r++) {
            const wy = seaBase + 10 + r * ((h - seaBase) / 5);
            const speed = 2 + r;
            ctx.beginPath();
            for (let x = 0; x <= w; x += 20) {
                const wx = x + camX * 0.5;
                const y = wy + Math.sin(wx * 0.015 + t * speed + r * 2) * (4 + r * 2.4);
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        // Foam crests
        for (let i = 0; i < 14; i++) {
            const fx = (((i * 211 + t * 60 - camX * 0.5) % (w + 80)) + (w + 80)) % (w + 80) - 40;
            const fy = seaBase + 14 + hash1(i + 41) * (h - seaBase - 30);
            ctx.fillStyle = "rgba(220,235,250,0.25)";
            ctx.beginPath();
            ctx.ellipse(fx, fy, 16, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Lighthouse with rotating beam
        const lx = 4600 - camX;
        const ly = seaBase - 4;
        if (lx > -300 && lx < w + 300) {
            // Tower
            ctx.fillStyle = "#20262e";
            ctx.beginPath();
            ctx.moveTo(lx - 26, ly);
            ctx.lineTo(lx - 14, ly - 170);
            ctx.lineTo(lx + 14, ly - 170);
            ctx.lineTo(lx + 26, ly);
            ctx.closePath();
            ctx.fill();
            // Red bands
            ctx.fillStyle = "rgba(160,40,40,0.85)";
            for (const [y0, y1] of [[ly - 40, ly - 62], [ly - 96, ly - 118]] as const) {
                ctx.beginPath();
                const wB0 = 26 - (ly - y0) * (12 / 156);
                const wB1 = 26 - (ly - y1) * (12 / 156);
                ctx.moveTo(lx - wB0, y0);
                ctx.lineTo(lx + wB0, y0);
                ctx.lineTo(lx + wB1, y1);
                ctx.lineTo(lx - wB1, y1);
                ctx.closePath();
                ctx.fill();
            }
            // Lamp room + beam
            const angle = Math.sin(t * 0.8) * 1.5 - 1.5;
            ctx.save();
            ctx.translate(lx, ly - 176);
            ctx.rotate(angle);
            const beam = ctx.createLinearGradient(0, 0, -1100, 120);
            beam.addColorStop(0, "rgba(255,250,200,0.4)");
            beam.addColorStop(1, "rgba(255,250,200,0)");
            ctx.fillStyle = beam;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-2100, -330);
            ctx.lineTo(-2100, 330);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = "rgba(255,244,180,0.95)";
            ctx.beginPath();
            ctx.arc(lx, ly - 178, 9 + Math.sin(t * 6) * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ------------------------------------------------------------------ //
    // LEVEL 10: TWILIGHT CONSTRUCTION SITE — ember sky, cranes, city
    // ------------------------------------------------------------------ //
    private drawConstruction(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, t: number) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#121527");
        sky.addColorStop(0.4, "#33203a");
        sky.addColorStop(0.72, "#7a3a24");
        sky.addColorStop(0.92, "#c4632b");
        sky.addColorStop(1, "#e8933f");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Setting sun disc on the horizon glow
        const sunX = w * 0.62 - ((camX * 0.03) % (w * 2));
        const sg = ctx.createRadialGradient(sunX, h * 0.86, 10, sunX, h * 0.86, 220);
        sg.addColorStop(0, "rgba(255,190,110,0.9)");
        sg.addColorStop(0.3, "rgba(255,150,80,0.4)");
        sg.addColorStop(1, "rgba(255,150,80,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(sunX - 230, h * 0.86 - 230, 460, 460);
        ctx.fillStyle = "rgba(255,214,150,0.95)";
        ctx.beginPath();
        ctx.arc(sunX, h * 0.86, 42, 0, Math.PI * 2);
        ctx.fill();

        // Early stars up top
        for (let i = 0; i < 40; i++) {
            const sx2 = (((i * 167 - camX * 0.02) % (w + 40)) + (w + 40)) % (w + 40) - 20;
            const sy2 = hash1(i + 3) * h * 0.3;
            const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.7 + i));
            ctx.fillStyle = `rgba(230,235,255,${0.5 * tw})`;
            ctx.fillRect(sx2, sy2, 1.6, 1.6);
        }

        // Skeletal skyscraper layer
        ctx.fillStyle = "rgba(16,18,30,0.92)";
        for (let i = 0; i < w + camX * 0.1; i += 190) {
            let x = (i - camX * 0.1) % (w + 380);
            if (x < -190) x += w + 380;
            const seed = Math.floor(i / 190);
            const bh = 260 + hash1(seed + 13) * 190;
            const bw = 80 + hash1(seed + 29) * 40;
            ctx.fillRect(x, h - bh, bw, bh);
            // Grid skeleton lines
            ctx.strokeStyle = "rgba(40,44,64,0.9)";
            ctx.lineWidth = 2;
            for (let gy = h - bh + 22; gy < h; gy += 26) {
                ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + bw, gy); ctx.stroke();
            }
            // A few warm windows
            for (let wy = h - bh + 30; wy < h - 30; wy += 34) {
                for (let wx = x + 10; wx < x + bw - 12; wx += 22) {
                    if (hash2(Math.floor(wx), Math.floor(wy)) > 0.8) {
                        ctx.fillStyle = "rgba(255,190,90,0.5)";
                        ctx.fillRect(wx, wy, 7, 9);
                        ctx.fillStyle = "rgba(16,18,30,0.92)";
                    }
                }
            }
        }

        // Tower cranes sweeping slowly
        ctx.strokeStyle = "#0b0e16";
        for (let i = 0; i < w + camX * 0.18; i += 430) {
            let x = (i - camX * 0.18) % (w + 860);
            if (x < -430) x += w + 860;
            const seed = Math.floor(i / 430);
            const pivotY = h - 240 - hash1(seed + 51) * 90;

            // Mast lattice
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x, h);
            ctx.lineTo(x + 16, pivotY);
            ctx.lineTo(x + 32, h);
            ctx.stroke();
            ctx.lineWidth = 1.4;
            for (let ty = pivotY; ty < h; ty += 34) {
                ctx.beginPath();
                ctx.moveTo(x, ty);
                ctx.lineTo(x + 32, ty + 18);
                ctx.moveTo(x + 32, ty);
                ctx.lineTo(x, ty + 18);
                ctx.stroke();
            }
            // Jib sweeping
            const swing = Math.sin(t * 0.3 + seed * 2) * 0.22;
            ctx.save();
            ctx.translate(x + 16, pivotY);
            ctx.rotate(swing);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-100, 0);
            ctx.lineTo(210, 0);
            ctx.stroke();
            ctx.fillStyle = "#0b0e16";
            ctx.fillRect(-84, -12, 24, 16);
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = "rgba(0,0,0,0.7)";
            const hookLen = 60 + Math.sin(t * 0.8 + seed) * 22;
            ctx.beginPath();
            ctx.moveTo(150, 0);
            ctx.lineTo(150, hookLen);
            ctx.stroke();
            ctx.fillStyle = "#0b0e16";
            ctx.fillRect(144, hookLen, 12, 9);
            // Blinking aviation warning light on tip
            const blink = (Math.sin(t * 2.4 + seed) > 0.4);
            if (blink) {
                ctx.fillStyle = "rgba(255,60,60,0.9)";
                ctx.beginPath();
                ctx.arc(210, -4, 3.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "rgba(255,60,60,0.25)";
                ctx.beginPath();
                ctx.arc(210, -4, 8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            ctx.strokeStyle = "#0b0e16";
        }

        // Ground works: dark earth strip + amber hazard lights
        const gg = ctx.createLinearGradient(0, h - 90, 0, h);
        gg.addColorStop(0, "#241a14");
        gg.addColorStop(1, "#120c09");
        ctx.fillStyle = gg;
        ctx.fillRect(0, h - 90, w, 90);
        for (let i = 0; i < w + camX * 0.6; i += 240) {
            const x = (((i - camX * 0.6) % (w + 240)) + (w + 240)) % (w + 240) - 120;
            const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i);
            ctx.fillStyle = `rgba(255,170,40,${0.25 + 0.35 * pulse})`;
            ctx.beginPath();
            ctx.arc(x, h - 70, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
