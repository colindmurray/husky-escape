import { gfxSettings } from '../GfxSettings';

const TAU = Math.PI * 2;
export function drawGoose(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, moving: boolean) {
    ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
    const step = moving ? Math.sin(t * 14) * 5 : 0;
    ctx.strokeStyle = '#ed892c'; ctx.lineWidth = 3;
    for (const [leg, swing] of [[12, step], [24, -step]]) {
        ctx.beginPath(); ctx.moveTo(leg, 29); ctx.lineTo(leg + swing, 38); ctx.lineTo(leg + swing + 6, 39); ctx.stroke();
    }
    ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.ellipse(15, 24, 18, 11, -.15, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, 20); ctx.lineTo(-9, 15); ctx.lineTo(-2, 28); ctx.fill();
    ctx.strokeStyle = '#fffdf4'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(27, 25); ctx.bezierCurveTo(35, 20, 24, 5, 32, 3); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(34, 3, 8, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ed892c'; ctx.beginPath(); ctx.moveTo(40, 1); ctx.lineTo(51, 6); ctx.lineTo(40, 7); ctx.fill();
    ctx.fillStyle = '#202a2d'; ctx.beginPath(); ctx.arc(37, 1, 1.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#d8dfdb'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(13, 23, 11, 6, -.2, 0, Math.PI); ctx.stroke();
    ctx.restore();
}

export function drawFamilyDog(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, facing: boolean, moving: boolean, t: number, following = false, worried = false) {
    const opal = id === 'opal', ruby = id === 'ruby';
    const sploot = ruby && !moving && !following && t % 12 > 6;
    ctx.save(); ctx.translate(x + 20, y + 40); ctx.scale(facing ? 1 : -1, 1);
    if (opal) ctx.scale(1.3, 1.2);
    ctx.translate(-20, -40);
    if (sploot) { ctx.translate(0, 13); ctx.scale(1.12, .67); }
    const fur = opal ? '#fff6de' : ruby ? '#fffefa' : '#c99b70';
    const shade = opal ? '#e5d9bd' : ruby ? '#dce6e9' : '#a87a53';
    const ellipse = (cx: number, cy: number, rx: number, ry: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fill(); };
    ctx.lineCap = 'round'; ctx.strokeStyle = fur; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(6, 25); ctx.quadraticCurveTo(-12, ruby ? 4 : 16, -5, ruby ? 14 : 10 + Math.sin(t * 4) * 3); ctx.stroke();
    ellipse(17, 25, opal ? 19 : 16, 12, fur);
    for (const [leg, phase] of [[8, 1], [28, -1]]) {
        const swing = moving ? Math.sin(t * 12) * 4 * phase : 0;
        ctx.strokeStyle = fur; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(leg, 29); ctx.lineTo(sploot ? leg + phase * -10 : leg + swing, 39); ctx.stroke();
    }
    ellipse(31, 11, 12, 12, fur);
    if (ruby) {
        ctx.fillStyle = fur; ctx.beginPath(); ctx.moveTo(20, 6); ctx.lineTo(21, -8); ctx.lineTo(29, 1); ctx.moveTo(32, 0); ctx.lineTo(40, -7); ctx.lineTo(41, 9); ctx.fill();
        ctx.fillStyle = '#eabbb9'; ctx.beginPath(); ctx.moveTo(23, 2); ctx.lineTo(23, -3); ctx.lineTo(27, 2); ctx.fill();
    } else { ellipse(23, 14, 6, opal ? 12 : 9, shade); }
    ellipse(39, 16, 8, 5, fur); ellipse(45, 14, 2.5, 2, '#323331');
    if (!opal && !ruby) {
        ctx.strokeStyle = shade; ctx.lineWidth = 1.4;
        for (const [cx, cy] of [[5, 22], [12, 18], [20, 21], [28, 24], [14, 28], [6, 29], [24, 3], [31, 2], [37, 7], [29, 13], [22, 12]]) { ctx.beginPath(); ctx.arc(cx, cy, 3, .2, 5); ctx.stroke(); }
    }
    ellipse(36, 9, 2, 2.5, ruby ? '#64b5d0' : '#332d29');
    ctx.strokeStyle = opal ? '#998c77' : '#59453a'; ctx.lineWidth = 1.5;
    if (opal || worried) { ctx.beginPath(); ctx.moveTo(33, worried ? 5 : 4); ctx.lineTo(39, worried ? 2 : 7); ctx.stroke(); }
    if (ruby) { ellipse(41, 21, 2.5, 4, '#ee91a1'); }
    ctx.strokeStyle = opal ? '#39bab7' : ruby ? '#db494f' : '#779354'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(25, 21); ctx.lineTo(38, 23); ctx.stroke();
    if (gfxSettings.visualMode === 'enhanced') { ctx.strokeStyle = '#ffffff99'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(16, 23, 13, 8, 0, Math.PI, TAU); ctx.stroke(); }
    ctx.restore();
}
