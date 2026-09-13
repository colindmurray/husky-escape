import { gfxSettings } from '../GfxSettings';

const TAU = Math.PI * 2;

export function drawTopHat(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
    ctx.fillStyle = '#252438'; ctx.strokeStyle = '#d5c6af'; ctx.lineWidth = 1;
    ctx.fillRect(x + w * .16, y - w * .72, w * .68, w * .72);
    ctx.strokeRect(x + w * .16, y - w * .72, w * .68, w * .72);
    ctx.fillStyle = '#ae5975'; ctx.fillRect(x + w * .16, y - w * .2, w * .68, w * .15);
    ctx.fillStyle = '#242334'; ctx.beginPath(); ctx.ellipse(x + w / 2, y, w * .6, w * .12, 0, 0, TAU); ctx.fill();
    if (gfxSettings.visualMode === 'enhanced') { ctx.fillStyle = '#ffffff25'; ctx.fillRect(x + w * .23, y - w * .63, w * .1, w * .4); }
}

export function drawRaccoon(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, dir = 1, hat = false, dizzy = false) {
    const rich = gfxSettings.visualMode === 'enhanced';
    ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(dir, 1); ctx.translate(-w / 2, 0);
    // Ringed tail, cream ear rims and the black eye mask identify every raccoon.
    ctx.save(); ctx.translate(w * .12, h * .65); ctx.rotate(-.35 + Math.sin(t * 3) * .12);
    ctx.fillStyle = '#9a9391'; ctx.beginPath(); ctx.ellipse(-w * .12, 0, w * .33, h * .16, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#353541';
    for (let i = 0; i < 4; i++) ctx.fillRect(-w * .43 + i * w * .14, -h * .2, w * .065, h * .4);
    ctx.restore(); ctx.restore();
    ctx.fillStyle = '#888892';
    if (rich) { const fur = ctx.createLinearGradient(0, h * .2, 0, h); fur.addColorStop(0, '#b9b4b1'); fur.addColorStop(.55, '#85868d'); fur.addColorStop(1, '#535969'); ctx.fillStyle = fur; }
    ctx.beginPath(); ctx.ellipse(w * .44, h * .59, w * .37, h * .34, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d5cfc3'; ctx.beginPath(); ctx.ellipse(w * .57, h * .65, w * .17, h * .23, -.15, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#343440'; ctx.lineWidth = w * .105; ctx.lineCap = 'round';
    const stride = dizzy ? 0 : Math.sin(t * 9) * w * .055;
    for (const [lx, swing] of [[w * .24, stride], [w * .68, -stride]]) { ctx.beginPath(); ctx.moveTo(lx, h * .78); ctx.lineTo(lx + swing, h * .94); ctx.stroke(); }
    for (const ex of [.5, .82]) {
        ctx.fillStyle = '#ddd6c9'; ctx.beginPath(); ctx.arc(w * ex, h * .12, w * .115, 0, TAU); ctx.fill();
        ctx.fillStyle = '#464552'; ctx.beginPath(); ctx.arc(w * ex, h * .12, w * .073, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = rich ? '#b0aba7' : '#a3a09d'; ctx.beginPath(); ctx.ellipse(w * .67, h * .31, w * .29, h * .255, -.08, 0, TAU); ctx.fill();
    ctx.fillStyle = '#eee2cf'; ctx.beginPath(); ctx.ellipse(w * .77, h * .42, w * .19, h * .12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#30313d'; ctx.beginPath(); ctx.ellipse(w * .67, h * .285, w * .26, h * .10, -.08, 0, TAU); ctx.fill();
    for (const ex of [.55, .8]) {
        ctx.fillStyle = '#f8d17a'; ctx.beginPath(); ctx.ellipse(w * ex, h * .28, w * .041, h * .041, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#252636'; ctx.fillRect(w * ex, h * .25, w * .016, h * .06);
        ctx.strokeStyle = '#282834'; ctx.lineWidth = Math.max(1, w * .025); ctx.beginPath(); ctx.moveTo(w * (ex - .05), h * .19); ctx.lineTo(w * (ex + .055), h * .235); ctx.stroke();
    }
    ctx.fillStyle = '#272833'; ctx.beginPath(); ctx.ellipse(w * .87, h * .395, w * .054, h * .037, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#514947'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w * .83, h * .45); ctx.lineTo(w * .73, h * .47); ctx.stroke();
    if (hat) drawTopHat(ctx, w * .47, h * .045, w * .41);
    if (dizzy) { ctx.fillStyle = '#ffdc7a'; ctx.font = `bold ${w * .19}px sans-serif`; ctx.fillText('★', w * .3, -h * .12 + Math.sin(t * 7) * 3); ctx.fillText('★', w * .8, -h * .04 - Math.sin(t * 7) * 3); }
    ctx.restore();
}

export function drawTrashCan(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lid = true) {
    ctx.save(); ctx.fillStyle = '#727f82';
    if (gfxSettings.visualMode === 'enhanced') { const tin = ctx.createLinearGradient(x, 0, x + w, 0); tin.addColorStop(0, '#465a63'); tin.addColorStop(.3, '#a9b9b7'); tin.addColorStop(.7, '#7a8f93'); tin.addColorStop(1, '#40545d'); ctx.fillStyle = tin; }
    ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x + w, y + 8); ctx.lineTo(x + w * .9, y + h); ctx.lineTo(x + w * .1, y + h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d4dace85'; ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x + w * i / 6, y + 16); ctx.lineTo(x + w * i / 6, y + h - 10); ctx.stroke(); }
    ctx.strokeStyle = '#364953'; ctx.lineWidth = 4; ctx.strokeRect(x - 5, y + h * .25, 8, h * .2); ctx.strokeRect(x + w - 3, y + h * .25, 8, h * .2);
    if (lid) { ctx.fillStyle = '#b1beb8'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 7, w * .57, 8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#536771'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeRect(x + w * .38, y - 6, w * .24, 8); }
    ctx.restore();
}

export function drawBackyardBackground(ctx: CanvasRenderingContext2D, width: number, height: number, camX: number, camY: number, t: number) {
    const rich = gfxSettings.visualMode === 'enhanced', floor = height - 100 - camY;
    ctx.save(); ctx.fillStyle = '#8499b3';
    if (rich) { const sky = ctx.createLinearGradient(0, 0, 0, height); sky.addColorStop(0, '#424968'); sky.addColorStop(.6, '#adadbc'); sky.addColorStop(1, '#f1cbb0'); ctx.fillStyle = sky; }
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f9e5b5'; ctx.beginPath(); ctx.arc(width * .8, height * .19 - camY * .12, 27, 0, TAU); ctx.fill();
    for (let i = Math.floor(camX * .18 / 320) - 1; i < (camX * .18 + width) / 320 + 1; i++) {
        const x = i * 320 - camX * .18, y = floor - 230;
        ctx.fillStyle = i % 2 ? '#727487' : '#82828d'; ctx.fillRect(x, y, 240, 220);
        ctx.fillStyle = '#525d73'; ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x + 120, y - 92); ctx.lineTo(x + 258, y); ctx.closePath(); ctx.fill();
        for (const wx of [30, 155]) { ctx.fillStyle = '#eed49d'; ctx.fillRect(x + wx, y + 35, 45, 60); ctx.fillStyle = '#6f6d76'; ctx.fillRect(x + wx + 20, y + 35, 4, 60); ctx.fillRect(x + wx, y + 62, 45, 4); }
    }
    ctx.fillStyle = '#426c64';
    for (let i = Math.floor(camX * .4 / 95) - 1; i < (camX * .4 + width) / 95 + 1; i++) { ctx.beginPath(); ctx.ellipse(i * 95 - camX * .4, floor - 80, 78, 95 + Math.sin(i * 4) * 15, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#b49d81'; ctx.fillRect(0, floor - 70, width, 12); ctx.fillRect(0, floor - 30, width, 9);
    for (let i = Math.floor(camX * .65 / 34) - 1; i < (camX * .65 + width) / 34 + 1; i++) {
        const x = i * 34 - camX * .65;
        ctx.fillStyle = i % 2 ? '#c1ab8b' : '#b39b7e'; ctx.beginPath(); ctx.moveTo(x, floor); ctx.lineTo(x, floor - 100); ctx.lineTo(x + 12, floor - 114); ctx.lineTo(x + 24, floor - 100); ctx.lineTo(x + 24, floor); ctx.fill();
    }
    if (rich) for (let i = 0; i < 16; i++) { ctx.fillStyle = `rgba(255,233,159,${.3 + Math.sin(t * 2 + i) * .2})`; ctx.beginPath(); ctx.arc((i * 117 - camX * .5 + Math.sin(t + i) * 12) % (width + 50), floor - 130 - (i % 4) * 43, 2, 0, TAU); ctx.fill(); }
    ctx.restore();
}

export function drawRaccoonIntro(ctx: CanvasRenderingContext2D, width: number, height: number, step: number, frame: number) {
    drawBackyardBackground(ctx, width, height, 3900, 0, frame / 60);
    ctx.save(); const scale = Math.min(width / 820, height / 650, 1.35); ctx.translate(width / 2, height * .62); ctx.scale(scale, scale);
    ctx.fillStyle = '#41644d'; ctx.fillRect(-500, 90, 1000, 120);
    const shake = step === 1 ? Math.sin(frame * .5) * 5 : 0;
    if (step >= 2) {
        const progress = step > 2 ? 1 : Math.min(1, frame / 80);
        const jump = Math.sin(progress * Math.PI) * 180;
        drawRaccoon(ctx, 120 - progress * 210, -45 - jump, 145, 135, frame / 60, -1, true);
        ctx.save(); ctx.translate(200 + progress * 115, -60 - Math.sin(progress * Math.PI) * 190); ctx.rotate(progress * 9); ctx.fillStyle = '#b9c6bc'; ctx.strokeStyle = '#506973'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 70, 12, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeRect(-13, -15, 26, 10); ctx.restore();
    }
    drawTrashCan(ctx, 150 + shake, -30, 110, 120, step === 1);
    ctx.fillStyle = '#fff1cf'; ctx.textAlign = 'center'; ctx.font = 'bold 27px Georgia'; ctx.fillText(step === 1 ? 'Something is rattling…' : 'BARON VON BINS', 0, -300);
    ctx.restore();
}
