import { drawCurledHusky } from './HuskyArt';
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
    if (ruby && activity === 'curl' && !following) {
        drawCurledHusky(ctx, 'ruby', x, y, t, !rich); return;
    }
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

// Feet stay on the room's floor; seated poses share the furniture's low cushion height.
export function drawFamilyPerson(ctx: CanvasRenderingContext2D, id: string, x: number, floor: number, t: number, reaction?: 'surprised' | 'baffled' | 'welcoming') {
    const rich = gfxSettings.visualMode === 'enhanced', maria = id === 'maria', belle = id === 'belle', mom = id === 'mom', dad = id === 'dad';
    const skin = '#ecc7ab', hair = dad ? '#343638' : '#644735';
    const box = (x: number, y: number, w: number, h: number, color: string, radius = 3) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); };
    const line = (x: number, y: number, ex: number, ey: number, color: string, weight = 2) => { ctx.strokeStyle = color; ctx.lineWidth = weight; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke(); };
    ctx.save(); ctx.translate(x, floor); ctx.lineCap = 'round';
    ellipse(ctx, 0, 3, belle ? 35 : 42, 7, '#39363824');
    if (belle) {
        const phase = t * 3.7;
        // Yaw around planted feet rather than tumbling the sprite end over end.
        ctx.translate(Math.sin(phase) * 8, -Math.abs(Math.sin(phase)) * 3);
        ctx.strokeStyle = '#e4b978'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 43, 9, 0, phase, phase + 4); ctx.stroke();
        ctx.scale(Math.cos(phase), 1);
        ellipse(ctx, 0, -110, 26, 29, hair);
        for (const sign of [-1, 1]) {
            ctx.save(); ctx.scale(sign, 1); ctx.translate(Math.sin(phase) * 3, 0);
            ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(15, -132);
            ctx.bezierCurveTo(36, -122, 23, -107, 29, -95);
            ctx.bezierCurveTo(43, -81, 22, -77, 33, -64);
            ctx.quadraticCurveTo(39, -54, 26, -48);
            ctx.bezierCurveTo(30, -65, 14, -63, 18, -79);
            ctx.quadraticCurveTo(11, -107, 15, -132); ctx.fill();
            ctx.strokeStyle = rich ? '#987357' : '#79583f'; ctx.lineWidth = rich ? 1.5 : 1;
            ctx.beginPath(); ctx.moveTo(23, -120); ctx.bezierCurveTo(18, -99, 38, -88, 27, -77); ctx.quadraticCurveTo(21, -67, 30, -57); ctx.stroke();
            ctx.restore();
        }
        line(-10, -35, -17, -7, '#e5b992', 9); line(9, -35, 15, -5, '#e5b992', 9);
        box(-27, -9, 23, 9, '#8b536b', 5); box(8, -8, 23, 9, '#8b536b', 5);
        ctx.fillStyle = '#c67e86'; ctx.beginPath(); ctx.moveTo(-16, -85); ctx.quadraticCurveTo(-22, -48, -40, -29); ctx.quadraticCurveTo(0, -16, 41, -32); ctx.quadraticCurveTo(18, -56, 15, -85); ctx.fill();
        for (const dx of [-20, -3, 15]) { ctx.strokeStyle = '#edb4a2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dx / 2, -64); ctx.quadraticCurveTo(dx, -41, dx * 1.4, -29); ctx.stroke(); }
        line(-13, -81, -39, -68 + Math.sin(phase) * 5, skin, 9); line(13, -81, 43, -89 + Math.sin(phase) * 5, skin, 9);
        ellipse(ctx, -42, -67 + Math.sin(phase) * 5, 6, 5, skin); ellipse(ctx, 46, -88 + Math.sin(phase) * 5, 6, 5, skin);
        ellipse(ctx, 0, -107, 21, 24, skin);
        ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(-22, -107); ctx.quadraticCurveTo(-28, -133, -7, -135); ctx.quadraticCurveTo(17, -141, 23, -116); ctx.quadraticCurveTo(4, -119, -7, -130); ctx.quadraticCurveTo(-8, -115, -22, -107); ctx.fill();
        for (const ex of [-8, 8]) { ellipse(ctx, ex, -107, 2, 2.8, '#586b70'); ellipse(ctx, ex - .5, -108, .6, .8, '#fff'); }
        ellipse(ctx, -14, -99, 4, 2, '#da9b913b'); ellipse(ctx, 14, -99, 4, 2, '#da9b913b');
        ctx.strokeStyle = '#9f6155'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -102, 7, .2, Math.PI - .2); ctx.stroke();
        if (rich) { line(-7, -82, -13, -54, '#e4a89d', 2); ctx.strokeStyle = '#967153'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, -133); ctx.quadraticCurveTo(9, -135, 19, -120); ctx.stroke(); }
        ctx.restore(); return;
    }
    const bodyY = reaction ? (dad ? -142 : -132) : mom ? -119 : dad ? -126 : -111, headY = bodyY - 31;
    const top = maria ? '#708b99' : mom ? '#9a798e' : '#657d79';
    if (reaction) {
        line(-14, -66, -17, -14, '#677181', 16); line(14, -66, 18, -14, '#677181', 16);
        box(-33, -15, 25, 13, '#766252', 6); box(9, -15, 25, 13, '#766252', 6);
    } else {
        // Slippers, bent trouser legs and a relaxed seated torso.
        line(-16, -50, -30, -17, maria ? '#b1a0b8' : '#677181', 16);
        line(15, -50, 26, -16, maria ? '#b1a0b8' : '#677181', 16);
        box(-43, -19, 30, 13, maria ? '#e1c3b0' : '#766252', 6); box(16, -18, 30, 13, maria ? '#e1c3b0' : '#766252', 6);
    }
    box(-27, bodyY, 54, -bodyY - 49, top, 15);
    if (rich) { line(-22, bodyY + 20, -22, -57, '#ffffff25', 3); line(23, bodyY + 19, 23, -57, '#25384730', 3); }
    if (maria) {
        ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(-25, headY + 3);
        ctx.bezierCurveTo(-34, headY - 36, 30, headY - 39, 27, headY + 1);
        ctx.quadraticCurveTo(26, headY + 32, 34, headY + 43);
        ctx.quadraticCurveTo(21, headY + 51, 12, headY + 38);
        ctx.lineTo(-12, headY + 37); ctx.quadraticCurveTo(-19, headY + 49, -31, headY + 43);
        ctx.quadraticCurveTo(-25, headY + 24, -25, headY + 3); ctx.fill();
        if (rich) for (const sign of [-1, 1]) { ctx.strokeStyle = '#89664c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sign * 23, headY); ctx.quadraticCurveTo(sign * 20, headY + 29, sign * 27, headY + 40); ctx.stroke(); }
    }
    else if (mom) { ellipse(ctx, 0, headY, 26, 29, hair); box(-26, headY, 15, 53, hair, 7); box(13, headY, 15, 52, hair, 7); }
    else { ellipse(ctx, 0, headY - 4, 25, 26, hair); }
    box(-6, bodyY - 5, 12, 13, skin, 4);
    ellipse(ctx, 0, headY + 3, 21, 25, skin);
    ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(-22, headY); ctx.quadraticCurveTo(-16, headY - 30, 4, headY - 23); ctx.quadraticCurveTo(17, headY - 22, 22, headY - 8); ctx.quadraticCurveTo(10, headY - 14, 2, headY - 15); ctx.quadraticCurveTo(-10, headY - 3, -22, headY); ctx.fill();
    for (const ex of [-8, 8]) {
        if (reaction) {
            ellipse(ctx, ex, headY + 6, 4, 4.8, '#fff9ee');
            ellipse(ctx, ex + (reaction === 'baffled' && dad ? 1.5 : -1.5), headY + 8, 1.9, 2.7, '#554839');
            line(ex - 4, headY - 3, ex + 3, headY - (reaction === 'baffled' ? 4 : 6), hair, 1.6);
        } else { ellipse(ctx, ex, headY + 6, 1.7, 2.4, maria ? '#586b70' : '#554839'); ellipse(ctx, ex + .4, headY + 5, .55, .7, '#fff'); }
    }
    line(0, headY + 10, -1, headY + 14, '#cc9c7f', 1);
    if (reaction && reaction !== 'welcoming') ellipse(ctx, 0, headY + 19, 3.5, reaction === 'surprised' ? 5 : 3, '#855b53');
    else {
        ctx.strokeStyle = '#a56e61'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-5, headY + 18); ctx.quadraticCurveTo(1, headY + 22, 6, headY + 17); ctx.stroke();
    }
    if (dad) {
        for (const sign of [-1, 1]) {
            ctx.strokeStyle = '#929596'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(sign * 21, headY - 12); ctx.quadraticCurveTo(sign * 24, headY - 5, sign * 22, headY + 3); ctx.stroke();
        }
        if (rich) { ctx.strokeStyle = '#777b7c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-10, headY - 21); ctx.quadraticCurveTo(3, headY - 27, 12, headY - 20); ctx.stroke(); }
    }
    if (reaction) {
        const shoulder = bodyY + 18;
        line(-24, shoulder, -36, shoulder + 28, top, 13);
        const handOnHead = reaction === 'baffled' && dad, handOnMouth = reaction === 'surprised' && mom;
        const rightElbow = handOnHead ? [45, shoulder - 30] : handOnMouth ? [35, shoulder - 23] : [36, shoulder + 26];
        line(24, shoulder, rightElbow[0], rightElbow[1], top, 13);
        const leftHand = reaction === 'welcoming' ? [-52, -70] : [-46, -94];
        const rightHand = handOnHead ? [23, headY - 10] : handOnMouth ? [10, headY + 22] : [49, -100];
        line(-36, shoulder + 28, leftHand[0], leftHand[1], skin, 9);
        line(rightElbow[0], rightElbow[1], rightHand[0], rightHand[1], skin, 9);
        for (const [hx, hy] of [leftHand, rightHand]) {
            ellipse(ctx, hx, hy, 6, 7, skin);
            if (rich) for (let i = 0; i < 3; i++) line(hx - 3 + i * 2, hy - 5, hx - 3 + i * 2, hy, '#c49176', .6);
        }
    } else if (maria) {
        line(-20, -93, -34, -64, top, 13); line(20, -93, 30, -62, top, 13);
        const turn = (t % 8) > 6.5 ? Math.sin((t % 8 - 6.5) / 1.5 * Math.PI) : 0;
        ctx.fillStyle = '#496f65'; ctx.beginPath(); ctx.moveTo(-35, -70); ctx.lineTo(-2, -65); ctx.lineTo(34, -73); ctx.lineTo(31, -43); ctx.lineTo(0, -38); ctx.lineTo(-33, -43); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f7ead0'; ctx.beginPath(); ctx.moveTo(-31, -69); ctx.quadraticCurveTo(-13, -73, -1, -63); ctx.quadraticCurveTo(16, -76, 30, -72); ctx.lineTo(28, -46); ctx.quadraticCurveTo(12, -50, 0, -41); ctx.quadraticCurveTo(-15, -49, -29, -45); ctx.fill();
        line(0, -62, 0, -42, '#a8916b', 1); line(8, -44, 7, -30, '#bd7374', 3);
        for (let i = 0; i < 4; i++) { line(-26, -64 + i * 4, -6, -60 + i * 4, '#b1a184', .8); line(6, -62 + i * 4, 25, -67 + i * 4, '#b1a184', .8); }
        if (turn) { ctx.fillStyle = '#fff5de'; ctx.beginPath(); ctx.moveTo(0, -63); ctx.quadraticCurveTo(32 - turn * 60, -89, 28 - turn * 54, -70); ctx.lineTo(26 - turn * 49, -46); ctx.lineTo(0, -41); ctx.fill(); }
        ellipse(ctx, -32, -54, 6, 5, skin); ellipse(ctx, 31, -53, 6, 5, skin);
    } else if (mom) {
        line(-22, -101, -34, -79, top, 13); line(22, -101, 33, -79, top, 13);
        box(-43, -78, 86, 6, '#af805d'); box(-37, -110, 74, 34, '#acb7b2', 4);
        box(-31, -105, 62, 23, '#d9e1d8', 2);
        for (let i = 0; i < 4; i++) line(-26, -101 + i * 5, 5 + (i % 2) * 19, -101 + i * 5, '#8a9995', 1);
        ellipse(ctx, -25, -77 + Math.sin(t * 4), 6, 4, skin); ellipse(ctx, 25, -77 + Math.cos(t * 4), 6, 4, skin);
        ctx.fillStyle = '#88758e'; ctx.font = '16px Georgia'; ctx.fillText('♪', 43 + Math.sin(t) * 3, headY - (t * 13 % 40));
    } else {
        line(-21, -107, -32, -67, top, 13); line(21, -107, 32, -65, top, 13);
        box(-28, -78, 55, 38, '#b5a176', 2); box(-23, -83, 48, 36, '#f0e5cd', 1);
        for (let i = 0; i < 5; i++) line(-17, -76 + i * 5, 16 - i % 2 * 10, -76 + i * 5, '#b5aa93', .8);
        ellipse(ctx, -30, -57, 6, 5, skin); ellipse(ctx, 30, -55, 6, 5, skin);
    }
    ctx.restore();
}
