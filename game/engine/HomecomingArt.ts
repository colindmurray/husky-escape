import { gfxSettings } from '../GfxSettings';
import { drawFamilyPerson } from './FamilyArt';
import { drawOnyxEnhanced } from './HuskyArt';

// One ground plane keeps the porch, doorstep and actors together at every viewport size.
export function drawHomecoming(ctx: CanvasRenderingContext2D, width: number, height: number, step: number, frame: number) {
    const rich = gfxSettings.visualMode === 'enhanced', t = frame / 60;
    const portrait = width < height * .85;
    const scale = Math.min(width / (portrait ? 540 : 960), height * .64 / 480, 1.8);
    const ground = height * (portrait ? .56 : .64);
    const opening = step < 2 ? 0 : step === 2 ? Math.min(1, frame / 45) : 1;
    const ease = opening * opening * (3 - 2 * opening);
    const box = (x: number, y: number, w: number, h: number, color: string | CanvasGradient, radius = 0) => {
        ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
    };
    const oval = (x: number, y: number, rx: number, ry: number, color: string | CanvasGradient) => {
        ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    };
    const line = (x: number, y: number, ex: number, ey: number, color: string, weight = 1) => {
        ctx.strokeStyle = color; ctx.lineWidth = weight; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    };
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#253c58'); sky.addColorStop(.6, '#b5aa9a'); sky.addColorStop(1, '#d8bca0');
    ctx.save(); ctx.fillStyle = rich ? sky : '#7e96a9'; ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2 - (portrait ? 590 : 480) * scale, ground - 420 * scale); ctx.scale(scale, scale);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    oval(120, 87, 22, 22, '#f3e7c3');
    // Garden silhouettes beyond a continuous lawn, well below the roofline.
    for (let i = -10; i < 22; i++) {
        const x = i * 95;
        box(x, 255, 12, 250, '#405352');
        oval(x, 251 + Math.sin(i * 5) * 24, 62, 90, i % 2 ? '#536a61' : '#4a615b');
    }
    box(-2400, 420, 5800, 1800, '#4f6958');
    const lawn = ctx.createLinearGradient(0, 430, 0, 720); lawn.addColorStop(0, '#728066'); lawn.addColorStop(1, '#354f47');
    if (rich) box(-2400, 430, 5800, 1800, lawn);
    // The path runs down from the actual bottom step, rather than floating over a background.
    ctx.fillStyle = '#b2a18b'; ctx.beginPath(); ctx.moveTo(492, 454); ctx.lineTo(774, 454); ctx.lineTo(1050, 1500); ctx.lineTo(290, 1500); ctx.closePath(); ctx.fill();
    if (rich) for (let y = 477; y < 900; y += 42) {
        line(493 - (y - 454) * .19, y, 774 + (y - 454) * .26, y, '#857d7155', 2);
        line(625, y, 627, y + 40, '#857d7138');
    }
    // Chimney, clapboard walls, stone foundation, and a complete pitched roof.
    box(737, 63, 51, 94, '#936c5b'); box(731, 60, 63, 10, '#bd9479');
    if (rich) for (let y = 79; y < 150; y += 16) { line(738, y, 787, y, '#d3ad8b66'); line(750 + (y % 32 ? 0 : 18), y, 750 + (y % 32 ? 0 : 18), y + 15, '#d3ad8b66'); }
    box(190, 153, 680, 273, '#b8c3b4'); box(190, 418, 680, 33, '#8b8c80');
    if (rich) for (let y = 175; y < 420; y += 18) {
        line(192, y, 868, y, '#829c9866'); line(192, y + 2, 868, y + 2, '#ecedd75c');
    }
    ctx.fillStyle = '#3e4a53'; ctx.beginPath(); ctx.moveTo(145, 166); ctx.lineTo(521, 29); ctx.lineTo(915, 166); ctx.closePath(); ctx.fill();
    if (rich) {
        ctx.save(); ctx.clip();
        for (let y = 50; y < 160; y += 13) {
            line(160, y, 904, y, '#87909550', 2);
            for (let x = 160 + (y % 26 ? 16 : 0); x < 905; x += 38) line(x, y, x - 4, y + 12, '#26384065');
        }
        ctx.restore();
    }
    line(145, 166, 521, 29, '#ede3c8', 9); line(521, 29, 915, 166, '#ede3c8', 9);
    box(181, 163, 698, 12, '#e5dfca'); box(190, 175, 680, 12, '#43595138');
    for (const x of [202, 847]) box(x, 175, 12, 243, '#f0e7d0');
    // Warm windows, curtains and a little row of books inside.
    for (const x of [275, 765]) {
        const w = x === 275 ? 150 : 60;
        box(x - 7, 224, w + 14, 126, '#f3e9cf', 3); box(x, 231, w, 110, '#d5a26a');
        const glow = ctx.createLinearGradient(0, 231, 0, 341); glow.addColorStop(0, '#ffe6a6'); glow.addColorStop(1, '#c79365');
        if (rich) box(x, 231, w, 110, glow);
        ctx.fillStyle = '#eee1bc'; ctx.beginPath(); ctx.moveTo(x, 231); ctx.lineTo(x + 24, 231); ctx.quadraticCurveTo(x + 21, 290, x, 316); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + w, 231); ctx.lineTo(x + w - 24, 231); ctx.quadraticCurveTo(x + w - 20, 290, x + w, 316); ctx.fill();
        if (rich && w > 80) for (let i = 0; i < 6; i++) box(x + 33 + i * 10, 321 - i % 3 * 4, 7, 20 + i % 3 * 4, ['#777c65', '#986e5b', '#697c84'][i % 3]);
        line(x + w / 2, 231, x + w / 2, 341, '#eee2c4', 5); line(x, 282, x + w, 282, '#eee2c4', 5);
        box(x - 11, 349, w + 22, 8, '#e3d2af', 2);
    }
    // Porch floor and two shallow risers make contact with the lawn and path.
    oval(607, 447, 271, 14, '#263b3a35');
    box(397, 414, 388, 10, '#d2b993', 2); box(397, 424, 388, 13, '#9e866d');
    box(424, 435, 352, 9, '#c4ae8c', 2); box(424, 444, 352, 9, '#95846d');
    box(446, 451, 342, 7, '#c8b696', 2);
    if (rich) for (let x = 410; x < 782; x += 36) line(x, 415, x - 4, 424, '#8777666b');
    // Doorway's interior floor shares the porch's height.
    box(546, 192, 189, 229, '#f3e4c4', 4); box(557, 201, 168, 216, '#6d554b');
    box(559, 203, 164, 183, '#d5b785'); box(559, 386, 164, 31, '#a98a65');
    box(564, 242, 31, 45, '#856b54', 2); box(569, 247, 21, 35, '#eedaba');
    if (rich && opening > 0) {
        const light = ctx.createLinearGradient(0, 396, 0, 494); light.addColorStop(0, `rgba(255,223,152,${.3 * ease})`); light.addColorStop(1, 'rgba(255,223,152,0)');
        ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(559, 395); ctx.lineTo(724, 395); ctx.lineTo(834, 497); ctx.lineTo(412, 497); ctx.closePath(); ctx.fill();
    }
    if (step >= 2) {
        ctx.save(); ctx.beginPath(); ctx.rect(558, 202, 167, 218); ctx.clip();
        const reaction = step >= 5 ? 'welcoming' : step === 4 ? 'baffled' : 'surprised';
        const recoil = step === 2 ? Math.sin(Math.min(1, t / .8) * Math.PI) * 5 : 0;
        drawFamilyPerson(ctx, 'mom', 683, 422 - recoil * .5, t, reaction);
        drawFamilyPerson(ctx, 'dad', 604, 422 - recoil, t, reaction);
        ctx.restore();
    }
    // The door swings inward; its diminishing panel reveals the parents behind it.
    ctx.save(); ctx.translate(725, 201); ctx.transform(1 - ease * .93, ease * .08, 0, 1, 0, 0);
    box(-168, 0, 168, 216, '#5d7373');
    if (rich) { const paint = ctx.createLinearGradient(-168, 0, 0, 216); paint.addColorStop(0, '#718c87'); paint.addColorStop(1, '#435e61'); box(-168, 0, 168, 216, paint); }
    for (const y of [18, 111]) {
        box(-150, y, 132, 79, '#355257', 3); box(-147, y + 3, 126, 73, '#82948a', 2); box(-144, y + 6, 120, 67, '#607b77', 2);
    }
    oval(-145, 106, 5, 5, '#e2b46b'); oval(-146, 104, 2, 1.5, '#ffdfa0');
    if (step === 1 && frame < 72) for (let i = 0; i < 3; i++) line(-159 + i * 4, 170, -159 + i * 4, 182, '#c9c9a77a');
    ctx.restore();
    box(542, 192, 7, 224, '#fcf1d4'); box(733, 192, 7, 224, '#b3b2a0');
    // Lanterns, pots and the doormat anchor the entrance at dog height.
    for (const x of [509, 754]) {
        line(x, 235, x, 251, '#3b494a', 3); box(x - 8, 249, 16, 26, '#394d50', 3); box(x - 5, 253, 10, 17, '#ffe5a0', 2);
        if (rich) { const halo = ctx.createRadialGradient(x, 261, 2, x, 261, 49); halo.addColorStop(0, '#ffd68448'); halo.addColorStop(1, '#ffd68400'); oval(x, 261, 49, 49, halo); }
    }
    for (const x of [365, 810]) {
        box(x - 21, 391, 42, 39, '#a87359', 5); box(x - 25, 389, 50, 9, '#c19470', 3);
        for (let i = 0; i < 7; i++) { const px = x + Math.sin(i * 2.4) * 22, py = 372 + Math.cos(i * 3) * 16; line(x, 393, px, py, '#56725b', 3); oval(px, py, 9, 5, i % 2 ? '#819577' : '#627f67'); if (i % 3 === 0) oval(px, py - 5, 4, 4, '#deaa9c'); }
    }
    box(555, 411, 165, 6, '#8d6c52', 2);
    const walk = step >= 5 ? Math.min(1, frame / 145) : 0;
    const dogX = 472 + walk * 112;
    oval(dogX + 33, 417, 51, 6, '#32423c38');
    ctx.save(); ctx.translate(dogX, 336); ctx.scale(2, 2);
    const pose = step === 1 ? (frame < 72 ? 'scratch' : 'howl') : undefined;
    drawOnyxEnhanced(ctx, 0, 0, { velX: walk > 0 && walk < 1 ? 2 : 0, velY: 0, grounded: true, level: 14, t, classic: !rich, pose });
    ctx.restore();
    if (step === 1 && frame >= 72 && frame < 216) {
        const pulse = (frame - 72) % 38 / 38;
        ctx.globalAlpha = (1 - pulse) * .65;
        ctx.strokeStyle = '#f8e5bf'; ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(559, 332, 10 + i * 9 + pulse * 14, -1.35, -.4); ctx.stroke(); }
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}
