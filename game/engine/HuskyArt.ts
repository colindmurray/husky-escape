import type { HuskyOpts } from './enhanced/EnhancedSprites';

const TAU = Math.PI * 2;
type Coat = 'onyx' | 'ruby' | 'cat' | 'fox';
const colors = (coat: Coat) => coat === 'ruby' ? ['#fffdf4', '#d4ddd9', '#fffdf4'] : coat === 'cat' ? ['#313540', '#171c26', '#f6eee1'] : coat === 'fox' ? ['#bc6938', '#87432c', '#fff0d3'] : ['#737575', '#343b40', '#f5f0e3'];
function oval(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}

function face(ctx: CanvasRenderingContext2D, coat: Coat, resting: boolean, t: number, rich: boolean) {
    const [fur, dark, white] = colors(coat), ruby = coat === 'ruby';
    const shade = ctx.createRadialGradient(-5, -10, 2, 0, 2, 25);
    shade.addColorStop(0, ruby ? '#fffef9' : '#96948a'); shade.addColorStop(1, fur);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const side of [-1, 1]) {
        ctx.save(); ctx.scale(side, 1);
        ctx.fillStyle = rich ? shade : fur; ctx.beginPath(); ctx.moveTo(7, -15); ctx.quadraticCurveTo(12, -26, 19, -31); ctx.quadraticCurveTo(22, -17, 17, -6); ctx.fill();
        ctx.fillStyle = '#bfa99c'; ctx.beginPath(); ctx.moveTo(12, -15); ctx.lineTo(18, -26); ctx.lineTo(18, -11); ctx.fill();
        ctx.strokeStyle = white; ctx.lineWidth = 1.3;
        for (let i = 0; i < (rich ? 4 : 1); i++) { ctx.beginPath(); ctx.moveTo(12 + i, -12); ctx.lineTo(16 + i * .5, -18 - i); ctx.stroke(); }
        ctx.restore();
    }
    ctx.fillStyle = rich ? shade : fur; ctx.beginPath(); ctx.moveTo(0, -22);
    ctx.bezierCurveTo(-14, -24, -21, -12, -21, 0); ctx.lineTo(-24, 7); ctx.lineTo(-20, 6); ctx.lineTo(-21, 11); ctx.lineTo(-17, 10);
    ctx.quadraticCurveTo(-14, 23, 0, 23); ctx.quadraticCurveTo(15, 22, 18, 11); ctx.lineTo(22, 10); ctx.lineTo(20, 6); ctx.lineTo(24, 7);
    ctx.bezierCurveTo(20, -9, 17, -23, 0, -22); ctx.fill();
    // The two pale brow lobes meet beneath Onyx's dark forehead blaze.
    for (const side of [-1, 1]) {
        ctx.save(); ctx.scale(side, 1); ctx.fillStyle = white; ctx.beginPath(); ctx.moveTo(0, 5);
        ctx.bezierCurveTo(3, -1, 2, -13, 8, -15); ctx.quadraticCurveTo(12, -15, 14, -7);
        ctx.quadraticCurveTo(20, -5, 20, 5); ctx.lineTo(22, 9); ctx.lineTo(18, 8); ctx.quadraticCurveTo(16, 19, 0, 20); ctx.fill();
        if (rich) { ctx.strokeStyle = ruby ? '#b8c6c050' : '#ab9b8260'; ctx.lineWidth = .65; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(13 + i, 4 + i * .8); ctx.quadraticCurveTo(15 + i, 8 + i * .8, 12 + i, 11 + i); ctx.stroke(); } }
        ctx.restore();
    }
    const blink = resting || t % 5 < .12;
    for (const side of [-1, 1]) {
        const ex = side * 8.5;
        if (blink) { ctx.strokeStyle = '#535b59'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ex - 3, 1); ctx.quadraticCurveTo(ex, 3, ex + 3, 1); ctx.stroke(); }
        else {
            oval(ctx, ex, 1, 3.1, 2.8, '#3c3b36'); oval(ctx, ex + .3, 1, 2, 2.2, coat === 'cat' ? '#a9bd75' : '#87735a');
            oval(ctx, ex + .5, 1.2, 1.35, 1.9, '#171e22'); oval(ctx, ex - .5, -.1, .85, .85, '#fffef7');
        }
    }
    const muzzle = ctx.createLinearGradient(0, 5, 0, 20); muzzle.addColorStop(0, '#fffdf3'); muzzle.addColorStop(1, '#dadcd4');
    oval(ctx, 0, 12, 9, 7.5, rich ? muzzle : white);
    ctx.fillStyle = ruby ? '#765853' : coat === 'cat' ? '#c58d93' : '#282d30'; ctx.beginPath(); ctx.moveTo(-5, 10); ctx.quadraticCurveTo(0, 7.5, 5, 10); ctx.quadraticCurveTo(4, 14, 0, 14.5); ctx.quadraticCurveTo(-4, 14, -5, 10); ctx.fill();
    oval(ctx, -.6, 10.2, 2.3, .9, ruby ? '#b28b80' : '#846c65');
    ctx.strokeStyle = '#70655f'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(0, 14.5); ctx.lineTo(0, 16); ctx.moveTo(-5, 16); ctx.quadraticCurveTo(0, 18, 5, 16); ctx.stroke();
    if ((resting && ruby) || (!resting && t % 7 > 2)) {
        // Attached to the mouth, above the tail's upper edge.
        ctx.fillStyle = '#df8f9f'; ctx.beginPath(); ctx.moveTo(-1.8, 17); ctx.lineTo(1.8, 17); ctx.quadraticCurveTo(2.8, 21.5, 0, 21.5); ctx.quadraticCurveTo(-2.5, 21, -1.8, 17); ctx.fill();
        ctx.strokeStyle = '#b66d81'; ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, 20); ctx.stroke();
    }
    if (rich) {
        ctx.strokeStyle = ruby ? '#d6dbd280' : '#c9c0a970'; ctx.lineWidth = .65;
        for (const side of [-1, 1]) for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(side * (4 + i * 1.8), -19 + i * 1.2); ctx.quadraticCurveTo(side * (7 + i * 1.6), -15 + i * 1.3, side * (8 + i * 1.5), -12 + i * 1.4); ctx.stroke(); }
        for (const side of [-1, 1]) { ctx.strokeStyle = '#777a7240'; ctx.lineWidth = .45; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(side * 6, 13 + i * 2); ctx.lineTo(side * 14, 12 + i * 3); ctx.stroke(); } }
    }
}

export function drawCurledHusky(ctx: CanvasRenderingContext2D, coat: Coat, x: number, y: number, t: number, classic = false) {
    const rich = !classic, [fur, dark, white] = colors(coat), ruby = coat === 'ruby';
    ctx.save(); ctx.translate(x + 20, y + 26); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    oval(ctx, 0, 15, 33, 3, '#3c3b3f24');
    const breath = 1 + Math.sin(t * 1.8) * .012; ctx.translate(0, 15); ctx.scale(breath, breath); ctx.translate(0, -15);
    const body = ctx.createRadialGradient(-13, -20, 2, -8, -2, 34); body.addColorStop(0, ruby ? '#fffef5' : '#aaa597'); body.addColorStop(.5, fur); body.addColorStop(1, dark);
    ctx.fillStyle = rich ? body : fur; ctx.beginPath(); ctx.moveTo(-31, 6); ctx.bezierCurveTo(-38, -19, -20, -28, -4, -25); ctx.bezierCurveTo(12, -33, 30, -23, 31, -8); ctx.bezierCurveTo(31, 10, 8, 20, -12, 17); ctx.quadraticCurveTo(-29, 17, -31, 6); ctx.fill();
    oval(ctx, 4, 1, 13, 13, ruby ? '#d3dcd7' : '#484f50'); oval(ctx, -15, 0, 16, 15, rich ? body : fur);
    if (ruby) {
        ctx.strokeStyle = '#b74f49'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-3, -25); ctx.quadraticCurveTo(5, -18, 8, -9); ctx.moveTo(12, -24); ctx.quadraticCurveTo(10, -18, 16, -12); ctx.stroke();
        ctx.strokeStyle = '#ce6e60'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-3, -25); ctx.lineTo(12, -24); ctx.stroke();
        ctx.fillStyle = '#4d5453'; ctx.fillRect(-1, -24, 5, 4); ctx.strokeStyle = '#bbbcae'; ctx.lineWidth = .6; ctx.strokeRect(0, -23, 3, 2);
    }
    // The tail is painted before the entire face, so it cannot cut across the mouth.
    const plume = ctx.createLinearGradient(0, 5, 0, 19); plume.addColorStop(0, white); plume.addColorStop(1, ruby ? '#ccd5cd' : '#bfc3b8');
    ctx.fillStyle = rich ? plume : white; ctx.beginPath(); ctx.moveTo(-30, 3); ctx.bezierCurveTo(-33, 18, -12, 21, 5, 16); ctx.quadraticCurveTo(23, 18, 29, 7); ctx.quadraticCurveTo(20, 12, 11, 11); ctx.bezierCurveTo(-5, 13, -17, 14, -30, 3); ctx.fill();
    if (rich) {
        ctx.strokeStyle = ruby ? '#bec9bf70' : '#d8ceba65'; ctx.lineWidth = .6;
        for (const [fx, fy, dx, dy] of [[-29,-9,3,-4],[-23,-17,4,-3],[-15,-21,4,-1],[-29,-1,4,-2],[-23,5,4,1],[-16,9,4,1],[-18,-10,4,-2],[-9,-14,3,-1],[-23,12,5,2],[-17,15,5,0],[-8,16,5,-1],[2,14,5,-1],[13,14,4,-1]]) { ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + dx * .4, fy + dy, fx + dx, fy + dy); ctx.stroke(); }
    }
    ctx.save(); ctx.translate(17, -5); ctx.scale(.68, .68); face(ctx, coat, true, t, rich); ctx.restore();
    ctx.restore();
}

export function drawOnyxEnhanced(ctx: CanvasRenderingContext2D, x: number, y: number, o: HuskyOpts) {
    const speed = Math.abs(o.velX), moving = o.grounded && speed > .5, phase = o.t * (7 + speed * 1.4);
    const stretch = Math.max(-.06, Math.min(.12, -o.velY * .014)), step = moving ? Math.sin(phase) : 0;
    ctx.save(); ctx.translate(x + 20, y + 40); ctx.scale(1 - stretch * .45, 1 + stretch); ctx.translate(-20, -40);
    if (moving) ctx.translate(0, -Math.abs(step) * 1.2);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const wag = Math.sin(o.t * (moving ? 8 : 2)) * (moving ? 2 : .8);
    const tail = ctx.createLinearGradient(-12, 9, 8, 30); tail.addColorStop(0, '#fff9e9'); tail.addColorStop(.5, '#d4cfbd'); tail.addColorStop(1, '#747777');
    ctx.fillStyle = tail; ctx.beginPath(); ctx.moveTo(8, 30); ctx.bezierCurveTo(-6, 32, -18, 20, -9, 9 + wag); ctx.quadraticCurveTo(1, 0 + wag, 7, 13 + wag); ctx.quadraticCurveTo(0, 8 + wag, -2, 14 + wag); ctx.quadraticCurveTo(-5, 22, 10, 23); ctx.fill();
    const leg = (lx: number, direction: number, far: boolean) => {
        const swing = o.grounded ? step * direction * 4 : o.velY < 0 ? -2.5 : 2;
        ctx.strokeStyle = far ? '#92978e' : '#e4dfce'; ctx.lineWidth = far ? 4 : 5;
        ctx.beginPath(); ctx.moveTo(lx, 27); ctx.quadraticCurveTo(lx - 2, 33, lx + swing, 38); ctx.stroke();
        oval(ctx, lx + swing + 1, 39, 3.7, 2, far ? '#aeb4a7' : '#fff6e5');
        if (!far) { ctx.strokeStyle = '#b5b1a1'; ctx.lineWidth = .55; for (const dx of [0, 2]) { ctx.beginPath(); ctx.moveTo(lx + swing + dx, 38.3); ctx.lineTo(lx + swing + dx, 40); ctx.stroke(); } }
    };
    if (o.level !== 8) { leg(9, -1, true); leg(28, 1, true); }
    const saddle = ctx.createLinearGradient(0, 11, 0, 36); saddle.addColorStop(0, '#aaa493'); saddle.addColorStop(.28, '#535b60'); saddle.addColorStop(.6, '#777a77'); saddle.addColorStop(1, '#d7ccaf');
    oval(ctx, 16, 25, 17, 12, saddle);
    ctx.fillStyle = '#ede6d4'; ctx.beginPath(); ctx.moveTo(2, 28); ctx.quadraticCurveTo(17, 35, 30, 25); ctx.quadraticCurveTo(34, 36, 19, 36); ctx.lineTo(16, 38); ctx.lineTo(14, 35); ctx.quadraticCurveTo(4, 35, 2, 28); ctx.fill();
    if (o.level !== 8) { leg(12, 1, false); leg(27, -1, false); }
    else {
        for (const [lx, dir] of [[11, -1], [28, 1]]) { ctx.save(); ctx.translate(lx, 36); ctx.rotate(Math.sin(o.t * 6) * .35 * dir); ctx.fillStyle = '#e89d48'; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(dir * 8, 12); ctx.lineTo(dir * 8 - 8, 12); ctx.closePath(); ctx.fill(); ctx.restore(); }
    }
    const ruff = ctx.createLinearGradient(16, 15, 33, 32); ruff.addColorStop(0, '#6c7374'); ruff.addColorStop(.5, '#c2bdab'); ruff.addColorStop(1, '#fff4dd');
    ctx.fillStyle = ruff; ctx.beginPath(); ctx.moveTo(21, 9); ctx.quadraticCurveTo(12, 21, 20, 31); ctx.lineTo(22, 29); ctx.lineTo(24, 35); ctx.lineTo(27, 32); ctx.lineTo(30, 35); ctx.quadraticCurveTo(36, 25, 34, 15); ctx.fill();
    ctx.strokeStyle = '#e1d7bd85'; ctx.lineWidth = .65;
    for (const [fx, fy, dx, dy] of [[4,17,4,1],[9,15,4,2],[14,15,4,2],[3,22,5,3],[8,24,5,3],[15,24,4,3],[5,28,4,3],[19,19,2,6],[21,23,2,6],[25,24,1,6],[29,24,-1,6],[-9,13,2,4],[-9,20,3,4]]) { ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + dx, fy + dy * .4, fx + dx, fy + dy); ctx.stroke(); }
    if (o.level === 6) { ctx.fillStyle = '#c0392b'; ctx.fillRect(-4, 39, 49, 3); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(44, 40); ctx.quadraticCurveTo(49, 39, 50, 33); ctx.stroke(); }
    ctx.save(); ctx.translate(32, 11); ctx.rotate(moving ? Math.sin(phase * 2) * .025 : 0); ctx.scale(.57, .57); face(ctx, 'onyx', false, o.t, true); ctx.restore();
    if (o.level === 8) { ctx.strokeStyle = '#63b8c9'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.roundRect(24.5, 8.5, 15, 6, 2); ctx.stroke(); ctx.fillStyle = '#b9e9e936'; ctx.fill(); }
    ctx.restore();
}
