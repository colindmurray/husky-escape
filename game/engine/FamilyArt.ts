import { gfxSettings } from '../GfxSettings';

const TAU = Math.PI * 2;
function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string | CanvasGradient) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}
function furShade(ctx: CanvasRenderingContext2D, light: string, dark: string) {
    const gradient = ctx.createLinearGradient(0, 4, 0, 38); gradient.addColorStop(0, light); gradient.addColorStop(.55, light); gradient.addColorStop(1, dark); return gradient;
}
export function drawGoose(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, moving: boolean) {
    const rich = gfxSettings.visualMode === 'enhanced', step = moving ? Math.sin(t * 14) * 5 : 0;
    ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
    ellipse(ctx, 17, 41, 23, 3, '#273b3820');
    ctx.strokeStyle = '#d68132'; ctx.lineWidth = 2.5;
    for (const [leg, swing] of [[12, step], [24, -step]]) {
        ctx.beginPath(); ctx.moveTo(leg, 29); ctx.lineTo(leg + swing, 37); ctx.stroke();
        ctx.fillStyle = '#e8933c'; ctx.beginPath(); ctx.moveTo(leg + swing - 2, 36); ctx.lineTo(leg + swing + 8, 40); ctx.lineTo(leg + swing - 3, 40); ctx.closePath(); ctx.fill();
    }
    ctx.translate(0, moving ? -Math.abs(step) * .2 : -Math.sin(t * 2) * .3);
    const feathers = rich ? furShade(ctx, '#fffdf4', '#c9d7d4') : '#fffdf4';
    ellipse(ctx, 15, 24, 18, 11, feathers);
    ctx.fillStyle = '#f8f9ec'; ctx.beginPath(); ctx.moveTo(2, 20); ctx.lineTo(-9, 14); ctx.lineTo(-5, 23); ctx.lineTo(-1, 27); ctx.fill();
    ctx.strokeStyle = '#fdfcf2'; ctx.lineWidth = 8.5; ctx.beginPath(); ctx.moveTo(27, 25); ctx.bezierCurveTo(35, 20, 24, 5, 32, 3); ctx.stroke();
    if (rich) { ctx.strokeStyle = '#c5d6d280'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(29, 23); ctx.bezierCurveTo(33, 17, 28, 8, 31, 5); ctx.stroke(); }
    ellipse(ctx, 34, 3, 8, 6, '#fffdf4');
    ctx.fillStyle = '#ed892c'; ctx.beginPath(); ctx.moveTo(40, 1); ctx.lineTo(51, 6); ctx.lineTo(40, 7); ctx.fill();
    ctx.strokeStyle = '#c36c25'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(41, 5); ctx.lineTo(49, 6); ctx.stroke();
    ellipse(ctx, 37, 1, 1.5, 1.6, '#202a2d'); ellipse(ctx, 37.4, .5, .45, .45, '#fff');
    ctx.strokeStyle = '#b5c6c3'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(3, 20); ctx.bezierCurveTo(18, 12, 31, 28, 9, 30); ctx.stroke();
    if (rich) for (let i = 0; i < 5; i++) { ctx.strokeStyle = i % 2 ? '#fbfff7' : '#c4d1cd'; ctx.beginPath(); ctx.moveTo(9 + i * 3, 23); ctx.quadraticCurveTo(15 + i * 2, 27, 7 + i * 3, 29); ctx.stroke(); }
    ctx.restore();
}

export function drawFamilyDog(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, facing: boolean, moving: boolean, t: number, following = false, worried = false, activity = '') {
    const opal = id === 'opal', ruby = id === 'ruby', rich = gfxSettings.visualMode === 'enhanced';
    const sleeping = activity === 'sleep' && !following;
    const sploot = ruby && !moving && !following && (sleeping || t % 12 > 6);
    const nervous = worried || activity === 'worried', angry = activity === 'angry';
    ctx.save(); ctx.translate(x + 20, y + 40);
    ellipse(ctx, 0, 1, opal ? 30 : 23, 4, '#29383226');
    ctx.scale(facing ? 1 : -1, 1); if (opal) ctx.scale(1.3, 1.18); ctx.translate(-20, -40);
    if (sploot) { ctx.translate(0, 13); ctx.scale(1.12, .67); }
    if (moving) ctx.translate(0, -Math.abs(Math.sin(t * 12)) * 1.2);
    else if (activity === 'play') ctx.translate(0, -Math.abs(Math.sin(t * 2)) * 6);
    const fur = opal ? '#fff6e2' : ruby ? '#fffefa' : '#d2aa7d';
    const shade = opal ? '#d9cdb4' : ruby ? '#cbd9df' : '#ab7e56';
    const coat = rich ? furShade(ctx, fur, shade) : fur;
    const legSwing = moving ? Math.sin(t * 12) * 4 : 0;
    ctx.lineCap = 'round';
    // Broad retriever feathering, a curled husky tail, and Sam's little corkscrew.
    ctx.strokeStyle = shade; ctx.lineWidth = opal ? 8 : 6; ctx.beginPath(); ctx.moveTo(5, 26);
    ctx.bezierCurveTo(-14, ruby ? 6 : 19, -7, ruby ? 0 : 3, -4, ruby ? 15 : 11 + Math.sin(t * 4) * 3); ctx.stroke();
    ctx.strokeStyle = fur; ctx.lineWidth = opal ? 6 : 4; ctx.stroke();
    if (opal && rich) for (let i = 0; i < 4; i++) { ctx.strokeStyle = '#dfd4bb'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5 + i * 3, 19); ctx.lineTo(-9 + i * 3, 27); ctx.stroke(); }
    for (const [leg, phase] of [[7, -1], [28, 1]]) { ctx.strokeStyle = shade; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(leg, 28); ctx.lineTo(leg + legSwing * phase, 38); ctx.stroke(); }
    ellipse(ctx, 17, 25, opal ? 19 : 16, 12, coat); ellipse(ctx, 24, 28, 10, 8, opal || ruby ? '#fff9e9' : '#d9b790');
    for (const [leg, phase] of [[11, 1], [29, -1]]) {
        const foot = sploot ? leg - phase * 12 : leg + legSwing * phase;
        ctx.strokeStyle = fur; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(leg, 29); ctx.lineTo(foot, 38); ctx.stroke(); ellipse(ctx, foot + 1, 39, 4, 2, fur);
        if (rich) { ctx.strokeStyle = shade; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(foot + 1, 38); ctx.lineTo(foot + 1, 40); ctx.stroke(); }
    }
    ellipse(ctx, 30, 15, opal ? 12 : 11, 13, coat);
    if (ruby) {
        ctx.fillStyle = fur; ctx.beginPath(); ctx.moveTo(20, 7); ctx.lineTo(20, -8); ctx.lineTo(29, 1); ctx.moveTo(32, 0); ctx.lineTo(40, -7); ctx.lineTo(41, 9); ctx.fill();
        ctx.fillStyle = '#e7bab9'; ctx.beginPath(); ctx.moveTo(23, 2); ctx.lineTo(23, -3); ctx.lineTo(27, 3); ctx.moveTo(35, 2); ctx.lineTo(38, -2); ctx.lineTo(38, 5); ctx.fill();
    } else {
        ellipse(ctx, 21, 15, opal ? 6.5 : 7, opal ? 12 : 10, shade);
        if (rich) { ctx.strokeStyle = opal ? '#eee4cd' : '#ceac81'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(18 + i * 2, 10); ctx.quadraticCurveTo(16 + i * 2, 19, 20 + i, 23); ctx.stroke(); } }
    }
    ellipse(ctx, 39, 18, opal ? 9 : 7, 5, opal || ruby ? '#fffaf0' : '#dfbc91'); ellipse(ctx, 45, 16, 2.7, 2.1, '#30332f');
    if (!opal && !ruby) {
        ctx.strokeStyle = shade; ctx.lineWidth = rich ? .9 : 1.2;
        for (const [cx, cy] of [[5, 22], [12, 18], [20, 21], [28, 24], [14, 28], [6, 29], [24, 3], [31, 2], [37, 7], [29, 13], [22, 12], [9, 14], [20, 30], [31, 18], [17, 8]]) { ctx.beginPath(); ctx.arc(cx, cy, 3, .2, 5); ctx.stroke(); if (rich) { ctx.strokeStyle = '#f0d5ac'; ctx.beginPath(); ctx.arc(cx, cy - .7, 2, 3.5, 5.8); ctx.stroke(); ctx.strokeStyle = shade; } }
    }
    if (sleeping) { ctx.strokeStyle = '#6e7378'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(33, 11); ctx.quadraticCurveTo(36, 13, 39, 10); ctx.stroke(); }
    else { ellipse(ctx, 36, 11, nervous ? 2.7 : 2, nervous ? 3.1 : 2.5, ruby ? '#72b7ce' : '#3e3930'); ellipse(ctx, 36.5, 11.2, 1.1, 1.7, '#253536'); ellipse(ctx, 36.5, 10, .7, .7, '#fff9e9'); }
    ctx.strokeStyle = opal ? '#998c77' : '#59453a'; ctx.lineWidth = 1.5;
    if (opal || nervous || angry) { ctx.beginPath(); ctx.moveTo(32, nervous ? 6 : angry ? 5 : 7); ctx.lineTo(39, nervous ? 3 : angry ? 10 : 9); ctx.stroke(); }
    ctx.strokeStyle = '#716252'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(44, 19); ctx.quadraticCurveTo(40, opal ? 19 : 23, 37, 21); ctx.stroke();
    if (ruby && !angry) { ellipse(ctx, 41, 23, 2.4, 3.8, '#e998a8'); ctx.strokeStyle = '#bd6b86'; ctx.beginPath(); ctx.moveTo(41, 22); ctx.lineTo(41, 25); ctx.stroke(); }
    ctx.strokeStyle = opal ? '#36b8b3' : ruby ? '#d64751' : '#799258'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(25, 23); ctx.lineTo(37, 25); ctx.stroke();
    ellipse(ctx, 32, 28, 2, 2.5, '#deb976');
    if (rich && (opal || ruby)) { ctx.strokeStyle = '#fffdfa'; ctx.lineWidth = 1; for (const [cx, cy] of [[6, 20], [13, 16], [20, 17], [26, 28], [27, 31]]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 4, cy + 2); ctx.lineTo(cx + 2, cy + 4); ctx.stroke(); } }
    if (activity === 'snack') { ellipse(ctx, 43, 28 + Math.sin(t * 4), 7, 4, '#cda05f'); for (let i = 0; i < 3; i++) ellipse(ctx, 45 + i * 3, 32 + (t * 8 + i * 3) % 7, .8, .8, '#c39254'); }
    if (activity === 'bake') { ellipse(ctx, 49, 36, 12, 6, '#bd7b69'); ellipse(ctx, 49, 33, 11, 3, '#e3c597'); ctx.strokeStyle = '#9b7d54'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(49, 33); ctx.lineTo(48 + Math.sin(t * 2) * 6, 22); ctx.stroke(); }
    if (activity === 'play') ellipse(ctx, 57 + Math.sin(t * 2) * 5, 35 - Math.abs(Math.sin(t * 2)) * 14, 4, 4, '#e6c777');
    if (activity === 'cuddle') { ellipse(ctx, 36, 36, 11, 6, '#ffefd3'); ellipse(ctx, 45, 31, 5, 5, '#fff6de'); ellipse(ctx, 47, 30, .8, .8, '#483d32'); }
    ctx.restore();
    ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 13px Georgia';
    if (activity === 'hearts') for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#da798b', '#e9a1af', '#c6697e'][i]; ctx.fillText('♥', x + i * 17, y - 12 - ((t * 12 + i * 9) % 27)); }
    if (sleeping) { ctx.fillStyle = '#8d85a4'; ctx.fillText('z', x + 40, y - 11 - Math.sin(t) * 4); ctx.font = '10px Georgia'; ctx.fillText('z', x + 51, y - 22 - Math.sin(t) * 4); }
    if (angry) { ctx.fillStyle = '#b95151'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('!', x + 27, y - 15); }
    ctx.restore();
}
