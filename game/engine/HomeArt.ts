import { HOME_WIDTH, ROOM_DOORS, houseChapter, type HomeFloor, type QuestProgress } from '../Home';
import { gfxSettings } from '../GfxSettings';
import { drawFamilyDog, drawGoose } from './FamilyArt';

const TAU = Math.PI * 2;
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, radius: number | number[] = 0) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}
function oval(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = '#514839', size = 13) {
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.font = `600 ${size}px Georgia`; ctx.fillText(text, x, y);
}
function plant(ctx: CanvasRenderingContext2D, x: number, floor: number, scale = 1) {
    ctx.save(); ctx.translate(x, floor); ctx.scale(scale, scale);
    oval(ctx, 0, -1, 32, 7, '#302a3025');
    ctx.strokeStyle = '#4a6952'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -21); ctx.quadraticCurveTo(12, -65, -1, -113); ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(4, -43 - i * 14); ctx.rotate(i % 2 ? -.7 : .7); oval(ctx, i % 2 ? -13 : 13, -5, 20, 8, i % 2 ? '#688b63' : '#819c71'); ctx.restore(); }
    ctx.fillStyle = '#bf8367'; ctx.beginPath(); ctx.moveTo(-23, -35); ctx.lineTo(23, -35); ctx.lineTo(18, 0); ctx.lineTo(-18, 0); ctx.fill();
    box(ctx, -25, -39, 50, 8, '#d49a7b', 3); box(ctx, -14, -27, 3, 21, '#e7b69755', 2); ctx.restore();
}
function rug(ctx: CanvasRenderingContext2D, x: number, floor: number, width: number, color: string) {
    oval(ctx, x, floor + 10, width / 2 + 7, 29, '#392b3620');
    oval(ctx, x, floor + 5, width / 2, 25, color);
    ctx.strokeStyle = '#f6dec38a'; ctx.lineWidth = 2;
    for (const inset of [9, 17]) { ctx.beginPath(); ctx.ellipse(x, floor + 5, width / 2 - inset, 25 - inset / 3, 0, 0, TAU); ctx.stroke(); }
    for (let dx = -width / 2 + 30; dx < width / 2 - 20; dx += 24) { ctx.beginPath(); ctx.moveTo(x + dx - 6, floor + 5); ctx.lineTo(x + dx, floor); ctx.lineTo(x + dx + 6, floor + 5); ctx.stroke(); }
}
function cushion(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string) {
    box(ctx, x, y, w, 32, color, 10); ctx.strokeStyle = '#fff1d787'; ctx.lineWidth = 1; ctx.strokeRect(x + 7, y + 7, w - 14, 18);
    oval(ctx, x + w / 2, y + 16, 2, 2, '#f7e6c9');
}
function windowArt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sun: boolean) {
    box(ctx, x - 10, y - 9, w + 20, h + 22, '#6d7064', 5);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const sky = ctx.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#a3cbd0'); sky.addColorStop(1, '#edf0cd');
    ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
    if (sun) oval(ctx, x + w * .75, y + h * .25, 19, 19, '#fff4c1');
    for (let i = 0; i < 4; i++) oval(ctx, x + i * w / 3, y + h - 20, w / 3, 22, i % 2 ? '#81987a' : '#6d8a79');
    box(ctx, x, y + h - 13, w, 13, '#a5b387');
    ctx.restore();
    box(ctx, x + w / 2 - 3, y, 6, h, '#f6e7cc'); box(ctx, x, y + h / 2, w, 5, '#f6e7cc');
    box(ctx, x - 17, y + h + 5, w + 34, 10, '#e9d6b7', 3);
    ctx.strokeStyle = '#fff8e780'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 15, y + 14); ctx.lineTo(x + 38, y + 42); ctx.moveTo(x + 29, y + 14); ctx.lineTo(x + 52, y + 42); ctx.stroke();
}
function sunbeam(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, floor: number, t: number, rainbow: boolean) {
    const glow = ctx.createLinearGradient(x, y, x + 150, floor + 10);
    glow.addColorStop(0, '#fff3bb08'); glow.addColorStop(.6, '#ffeac13b'); glow.addColorStop(1, '#fff4c985');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w + 185, floor + 18); ctx.lineTo(x + 40, floor + 18); ctx.closePath(); ctx.fill();
    oval(ctx, x + w / 2 + 110, floor + 7, w * .8, 21, '#ffedb75c');
    ctx.strokeStyle = '#e7ce9040'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2 + 110, floor + 16); ctx.stroke();
    for (let i = 0; i < 22; i++) {
        const f = (i * .137 + t * .014) % 1;
        oval(ctx, x + 25 + (i * 31 % Math.max(30, w - 20)) + f * 100 + Math.sin(t + i) * 7, y + (floor - y) * f, i % 3 === 0 ? 1.8 : 1, 1.4, i % 2 ? '#fff9df99' : '#eecf9470');
    }
    if (rainbow) for (const [i, color] of ['#f4a29d66', '#efc67766', '#dfe59366', '#8bc9a766', '#7fb9d366', '#b5a2d866'].entries()) {
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + w * .8, y - 5); ctx.lineTo(x + 80 + i * 22, floor + 10); ctx.lineTo(x + 105 + i * 22, floor + 10); ctx.fill();
    }
}
function bookshelf(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
    box(ctx, x, y, width, 185, '#785f4c', 4); box(ctx, x + 9, y + 8, width - 18, 166, '#443e37');
    const colors = ['#c38270', '#73989a', '#b6a276', '#9090ad', '#849572'];
    for (let row = 0; row < 3; row++) {
        for (let i = 0; i < Math.floor((width - 30) / 17); i++) { const h = 28 + (i * 13 + row * 7) % 16; box(ctx, x + 16 + i * 17, y + 53 + row * 54 - h, 13, h, colors[(i + row) % 5], 1); box(ctx, x + 19 + i * 17, y + 46 + row * 54, 7, 2, '#eee0ba80'); }
        box(ctx, x + 7, y + 54 + row * 54, width - 14, 7, '#ae8c66');
    }
}
function lamp(ctx: CanvasRenderingContext2D, x: number, floor: number) {
    ctx.strokeStyle = '#7e7359'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, floor - 130); ctx.lineTo(x, floor - 5); ctx.stroke();
    oval(ctx, x, floor - 3, 31, 6, '#837359');
    const halo = ctx.createRadialGradient(x, floor - 125, 10, x, floor - 125, 80); halo.addColorStop(0, '#ffdd8b50'); halo.addColorStop(1, '#ffdd8b00'); ctx.fillStyle = halo; ctx.fillRect(x - 80, floor - 205, 160, 160);
    ctx.fillStyle = '#edcc8d'; ctx.beginPath(); ctx.moveTo(x - 40, floor - 121); ctx.lineTo(x + 40, floor - 121); ctx.lineTo(x + 26, floor - 174); ctx.lineTo(x - 26, floor - 174); ctx.fill();
    for (let i = -20; i <= 20; i += 10) { ctx.strokeStyle = '#b3986550'; ctx.beginPath(); ctx.moveTo(x + i, floor - 170); ctx.lineTo(x + i * 1.5, floor - 126); ctx.stroke(); }
}

export function drawHome(ctx: CanvasRenderingContext2D, width: number, height: number, camX: number, room: HomeFloor = 'ground', progress: QuestProgress = {}, t = 0) {
    const floor = height - 100, rich = gfxSettings.visualMode === 'enhanced', chapter = houseChapter(progress);
    const palette: Record<HomeFloor, [string, string, string]> = {
        ground: ['#f2dfc0', '#bba789', '#63877a'], kitchen: ['#eee8cd', '#afbaaa', '#638e89'], upstairs: ['#e6d9dc', '#b9a5ac', '#8f7788'],
        bedroom: ['#ece0d9', '#baa8a9', '#a086a5'], sunroom: ['#e3e8ce', '#a5b89c', '#709589'], attic: ['#b7a28c', '#806c62', '#927c6a'], basement: ['#93a4a0', '#526764', '#536a63'],
    };
    const [top, bottom, trim] = palette[room];
    ctx.save(); const wall = ctx.createLinearGradient(0, 0, 0, floor); wall.addColorStop(0, top); wall.addColorStop(1, bottom); ctx.fillStyle = rich ? wall : top; ctx.fillRect(0, 0, width, height);
    ctx.translate(-camX, 0);
    // Wallpaper, wainscoting and a continuous floor establish a shared house scale.
    ctx.strokeStyle = '#fff7e91a'; ctx.lineWidth = 1;
    for (let x = 0; x < HOME_WIDTH; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, floor); ctx.stroke(); }
    box(ctx, 0, floor - 84, HOME_WIDTH, 84, trim);
    for (let x = 8; x < HOME_WIDTH; x += 100) { ctx.strokeStyle = '#243d3926'; ctx.strokeRect(x, floor - 69, 83, 59); ctx.strokeStyle = '#fff0d533'; ctx.strokeRect(x + 2, floor - 67, 79, 55); }
    box(ctx, 0, floor - 90, HOME_WIDTH, 8, '#ecdbc0'); box(ctx, 0, floor - 7, HOME_WIDTH, 10, '#79694f');
    const wood = ctx.createLinearGradient(0, floor, 0, height); wood.addColorStop(0, '#ad8762'); wood.addColorStop(1, '#6f564a'); ctx.fillStyle = rich ? wood : '#947253'; ctx.fillRect(0, floor, HOME_WIDTH, 100);
    ctx.strokeStyle = '#4a3a3038';
    for (let y = floor + 12, row = 0; y < height; y += 22, row++) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(HOME_WIDTH, y); ctx.stroke(); for (let x = (row % 2) * 90; x < HOME_WIDTH; x += 180) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 22); ctx.stroke(); ctx.strokeStyle = '#e7bf8520'; ctx.beginPath(); ctx.moveTo(x + 15, y + 8); ctx.lineTo(x + 150, y + 8); ctx.stroke(); ctx.strokeStyle = '#4a3a3038'; } }
    if (room === 'ground') {
        windowArt(ctx, 760, floor - 310, 150, 174, true);
        box(ctx, 355, floor - 165, 350, 133, '#466d66', 22); box(ctx, 345, floor - 98, 370, 81, '#587f70', 18);
        box(ctx, 365, floor - 77, 152, 50, '#709284', 13); box(ctx, 527, floor - 77, 166, 50, '#709284', 13);
        cushion(ctx, 388, floor - 129, 70, '#d5ad78'); cushion(ctx, 594, floor - 117, 64, '#bc8882');
        for (const x of [362, 684]) box(ctx, x, floor - 19, 13, 20, '#65503d');
        rug(ctx, 653, floor, 740, '#ae7970'); lamp(ctx, 965, floor); plant(ctx, 65, floor, 1.1);
        box(ctx, 340, floor - 302, 140, 85, '#886749', 3); box(ctx, 348, floor - 294, 124, 69, '#e7d7b6');
        label(ctx, 'A HOUSE FULL', 410, floor - 266, '#626e5b', 15); label(ctx, 'OF GOOD DOGS', 410, floor - 244, '#626e5b', 15);
        box(ctx, 525, floor - 291, 127, 68, '#9a7659', 3); box(ctx, 532, floor - 284, 113, 54, '#c7c4a5'); label(ctx, 'HOME ♥', 588, floor - 253, '#556d63', 20);
        box(ctx, 67, floor - 183, 95, 183, '#775b46', [40, 40, 0, 0]); box(ctx, 77, floor - 150, 75, 65, '#a5c1b3', 25);
    } else if (room === 'kitchen') {
        windowArt(ctx, 500, floor - 316, 210, 155, true);
        box(ctx, 358, floor - 129, 650, 126, '#8fa899', 5); box(ctx, 344, floor - 145, 676, 18, '#e6d6b6', 4);
        for (let x = 368; x < 995; x += 106) { box(ctx, x, floor - 116, 90, 98, '#9db4a4', 3); ctx.strokeStyle = '#6f8d7f'; ctx.strokeRect(x + 8, floor - 106, 74, 78); box(ctx, x + 67, floor - 105, 15, 4, '#e3c687', 2); }
        box(ctx, 913, floor - 330, 98, 182, '#d4e0cc', 9); ctx.strokeStyle = '#8ea28e'; ctx.strokeRect(920, floor - 322, 84, 75); box(ctx, 924, floor - 235, 5, 38, '#9d9b75', 2);
        box(ctx, 743, floor - 216, 115, 12, '#8c795a');
        for (const [i, color] of ['#bf8e75', '#89a5a2', '#d2b779'].entries()) { box(ctx, 752 + i * 34, floor - 252, 25, 36, color, 5); box(ctx, 752 + i * 34, floor - 255, 25, 5, '#826d52'); }
        oval(ctx, 418, floor - 151, 35, 7, '#6d8b8c'); ctx.strokeStyle = '#8b9f94'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(440, floor - 150); ctx.lineTo(440, floor - 183); ctx.quadraticCurveTo(419, floor - 197, 415, floor - 176); ctx.stroke();
        box(ctx, 530, floor - 72, 330, 14, '#b18054', 5); for (const x of [548, 830]) box(ctx, x, floor - 58, 13, 58, '#805b43');
        oval(ctx, 627, floor - 80, 30, 9, '#f6e1b8'); box(ctx, 611, floor - 90, 31, 9, '#daae67', 4);
        if (progress.lunch === 'complete') { box(ctx, 552, floor - 103, 42, 30, '#63a0a4', 4); box(ctx, 562, floor - 110, 22, 8, '#498b8f', 3); }
        const looksAway = Math.sin(t * .55) > -.2; oval(ctx, 722, floor - 126, 17, 20, '#e4b48c'); box(ctx, 704, floor - 144, 36, 13, '#725641', [10, 10, 0, 0]); box(ctx, 707, floor - 107, 31, 33, '#c37a60', 8); oval(ctx, looksAway ? 732 : 712, floor - 126, 2, 2, '#493a30');
        ctx.strokeStyle = '#3d5265'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(722, floor - 131, 20, Math.PI, 0); ctx.stroke(); box(ctx, 701, floor - 135, 7, 16, '#597385', 3); box(ctx, 736, floor - 135, 7, 16, '#597385', 3);
        oval(ctx, 716, floor - 89, 8, 5, '#e4b48c'); oval(ctx, 738, floor - 89, 8, 5, '#e4b48c'); box(ctx, 716, floor - 97, 22, 12, '#465b6b', 5); box(ctx, 720, floor - 94, 6, 2, '#adc3c8'); box(ctx, 722, floor - 96, 2, 6, '#adc3c8'); oval(ctx, 733, floor - 92, 1.5, 1.5, '#e6bb79');
        box(ctx, 761, floor - 148, 87, 58, '#3a4d58', 5); box(ctx, 766, floor - 143, 77, 47, '#6c9b75', 2); box(ctx, 800, floor - 90, 7, 13, '#4d6266'); box(ctx, 786, floor - 78, 36, 5, '#4d6266', 2);
        ctx.strokeStyle = '#dfedd29c'; ctx.lineWidth = 1; ctx.strokeRect(770, floor - 138, 69, 37); ctx.beginPath(); ctx.arc(804, floor - 120, 9, 0, TAU); ctx.moveTo(804, floor - 138); ctx.lineTo(804, floor - 101); ctx.stroke();
        const car = Math.sin(t * 1.8) * 17; box(ctx, 789 + car, floor - 116, 11, 6, '#e7a362', 2); box(ctx, 811 - car, floor - 130, 11, 6, '#74c2df', 2); oval(ctx, 805 + Math.sin(t) * 8, floor - 121, 3, 3, '#f7ead2');
        rug(ctx, 690, floor, 570, '#9eaa80'); plant(ctx, 95, floor, .8);
        if (chapter === 3) { for (let i = 0; i < 9; i++) oval(ctx, 558 + i * 26, floor - 81, 8, 5, '#d4a469'); }
    } else if (room === 'bedroom') {
        windowArt(ctx, 610, floor - 338, 182, 182, true);
        box(ctx, 344, floor - 165, 195, 165, '#80684f', 8); box(ctx, 355, floor - 125, 174, 107, '#ac9abb', 12); cushion(ctx, 369, floor - 147, 133, '#efe4d2');
        for (let x = 366; x < 520; x += 19) { ctx.strokeStyle = '#ddcde278'; ctx.beginPath(); ctx.moveTo(x, floor - 108); ctx.lineTo(x, floor - 28); ctx.stroke(); }
        box(ctx, 880, floor - 74, 105, 70, '#a38568', 4); box(ctx, 888, floor - 65, 89, 31, '#b99c7c', 4); oval(ctx, 933, floor - 48, 4, 3, '#e1c591'); lamp(ctx, 948, floor - 76);
        rug(ctx, 738, floor, 470, '#a58b9b');
        if (progress.cushion === 'complete') cushion(ctx, 748, floor - 20, 105, '#d29aa4');
        sunbeam(ctx, 610, floor - 155, 182, floor, t, progress.sun === 'complete');
        if (progress.sun === 'complete') { ctx.strokeStyle = '#e5cb85'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(755, floor - 338); ctx.lineTo(755, floor - 244); ctx.stroke(); oval(ctx, 755, floor - 231, 11, 16, '#e1d5edbb'); }
        plant(ctx, 1020, floor, .8);
    } else if (room === 'upstairs') {
        const carpet = ctx.createLinearGradient(0, floor, 0, height); carpet.addColorStop(0, '#f6f1e7'); carpet.addColorStop(1, '#e0dace'); ctx.fillStyle = carpet; ctx.fillRect(0, floor, HOME_WIDTH, 100);
        ctx.lineWidth = 1.4;
        for (const [i, color] of ['#fffdf5', '#cec9be70'].entries()) {
            ctx.strokeStyle = color; ctx.beginPath();
            for (let y = floor + i * 4; y < height; y += 9) for (let x = i * 5; x < HOME_WIDTH; x += 13) { const bend = Math.sin(x * .17 + y) * 5, lift = 4 + (x * 7 + y * 3) % 8; ctx.moveTo(x + bend, y + 7); ctx.quadraticCurveTo(x - bend, y - lift, x + 4 + bend, y - lift / 2); } ctx.stroke();
        }
        windowArt(ctx, 902, floor - 330, 125, 175, false);
        box(ctx, 450, floor - 220, 365, 170, '#a88e78', 20); box(ctx, 463, floor - 207, 339, 89, '#c4ae99', 12);
        for (const x of [492, 572, 652, 732]) oval(ctx, x, floor - 164, 3, 3, '#9e8671');
        box(ctx, 438, floor - 139, 388, 118, '#8f7661', 9); box(ctx, 450, floor - 147, 365, 111, '#f7eedc', 12);
        cushion(ctx, 475, floor - 160, 145, '#fff9ef'); cushion(ctx, 640, floor - 160, 145, '#fff9ef');
        box(ctx, 448, floor - 115, 369, 88, '#88a29c', 7); box(ctx, 448, floor - 116, 369, 23, '#a7beb4', 5);
        for (let x = 461; x < 810; x += 24) { ctx.strokeStyle = '#edf0dc50'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, floor - 85); ctx.lineTo(x + 6, floor - 32); ctx.stroke(); }
        for (const x of [340, 837]) { box(ctx, x, floor - 79, 83, 73, '#af9578', 4); box(ctx, x + 7, floor - 68, 69, 27, '#c5ad8d', 3); oval(ctx, x + 41, floor - 55, 3, 3, '#f1d3a0'); lamp(ctx, x + 41, floor - 80); }
        oval(ctx, 979, floor - 6, 61, 19, '#8e7659'); oval(ctx, 979, floor - 12, 54, 15, '#ead9b6');
        if (progress.lammy === 'complete') { oval(ctx, 1000, floor - 18, 16, 10, '#fff4d7'); oval(ctx, 1013, floor - 29, 8, 8, '#fff4d7'); }
        for (let i = 0; i < 6; i++) { ctx.strokeStyle = '#c2a279'; ctx.beginPath(); ctx.moveTo(928 + i * 19, floor - 12); ctx.lineTo(934 + i * 16, floor + 5); ctx.stroke(); }
        plant(ctx, 100, floor, .95);
    } else if (room === 'sunroom') {
        for (const x of [365, 565, 765, 965]) windowArt(ctx, x, floor - 340, 175, 217, x === 765);
        for (const [x, scale] of [[352, 1], [498, 1.4], [912, .8], [1070, 1.2], [1390, 1]]) plant(ctx, x, floor, scale);
        rug(ctx, 710, floor, 480, '#b9af78');
        box(ctx, 568, floor - 64, 187, 14, '#b59a6e', 7); for (const x of [580, 730]) box(ctx, x, floor - 50, 10, 50, '#8c7551');
        const gx = 980 + Math.sin(t * .65) * 67;
        ctx.save(); ctx.translate(gx + 20, floor); ctx.scale(Math.cos(t * .65) >= 0 ? 1.3 : -1.3, 1.3); drawGoose(ctx, -20, -40, t, true); ctx.restore();
        sunbeam(ctx, 565, floor - 120, 175, floor, t, false);
    } else if (room === 'attic') {
        ctx.strokeStyle = '#655346'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(80, floor - 70); ctx.lineTo(700, Math.max(105, floor - 440)); ctx.lineTo(1430, floor - 70); ctx.stroke();
        windowArt(ctx, 635, floor - 317, 124, 109, true);
        box(ctx, 352, floor - 80, 133, 80, '#9c7654', 4); box(ctx, 350, floor - 84, 137, 12, '#bd996d', 4); box(ctx, 409, floor - 63, 21, 14, '#dbbf7c', 3);
        ctx.fillStyle = '#7e91a3'; ctx.beginPath(); ctx.moveTo(765, floor); ctx.lineTo(890, floor - 180); ctx.lineTo(1052, floor); ctx.fill();
        ctx.fillStyle = '#4e637a'; ctx.beginPath(); ctx.moveTo(827, floor); ctx.lineTo(895, floor - 105); ctx.lineTo(962, floor); ctx.fill();
        for (let i = 0; i < 10; i++) { const x = 800 + i * 22, y = floor - 20 - Math.sin(i / 9 * Math.PI) * 104; label(ctx, '✦', x, y, '#e6d59e', 12); }
        for (let i = 0; i < 13; i++) { const x = 420 + i * 51, y = floor - 230 + Math.sin(i / 12 * Math.PI) * 45; oval(ctx, x, y, 5, 7, i % 2 ? '#efd09a' : '#ddab9c'); }
        rug(ctx, 775, floor, 580, '#a38676'); cushion(ctx, 554, floor - 28, 115, '#b6a076'); plant(ctx, 1370, floor, .7);
    } else {
        bookshelf(ctx, 70, floor - 205, 165);
        box(ctx, 330, floor - 233, 250, 155, '#967650', 5); box(ctx, 340, floor - 223, 230, 134, '#3c5a4d', 3);
        label(ctx, 'TRAINING DEN', 455, floor - 187, '#ecdcaf', 19);
        ctx.strokeStyle = '#d0dfbd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(371, floor - 124); ctx.lineTo(399, floor - 124); ctx.quadraticCurveTo(430, floor - 183, 461, floor - 124); ctx.lineTo(538, floor - 124); ctx.stroke();
        box(ctx, 745, floor - 82, 226, 18, '#c49b69', 4); for (const x of [760, 940]) box(ctx, x, floor - 64, 15, 64, '#876746');
        box(ctx, 766, floor - 176, 179, 88, '#527f92', 2); ctx.strokeStyle = '#add0cf50'; ctx.lineWidth = 1;
        for (let x = 774; x < 940; x += 18) for (let y = floor - 170; y < floor - 94; y += 18) ctx.strokeRect(x, y, 18, 18);
        box(ctx, 790, floor - 125, 36, 18, '#dbc184'); box(ctx, 862, floor - 143, 36, 18, '#dbc184');
        rug(ctx, 674, floor, 720, '#6d8c7c');
    }
    // Stairs and door frames stay in front of the furniture but behind the actors.
    for (let i = 0; i < 5; i++) { box(ctx, 1080 + i * 22, floor - (i + 1) * 20, 25, (i + 1) * 20, i % 2 ? '#8a755e' : '#9b8367'); box(ctx, 1077 + i * 22, floor - (i + 1) * 20, 30, 5, '#d1b58a'); }
    ctx.strokeStyle = '#b9986d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(1077, floor - 51); ctx.lineTo(1190, floor - 151); ctx.stroke();
    for (const door of ROOM_DOORS[room]) {
        box(ctx, door.x - 8, floor - 168, 100, 168, '#78654f', [44, 44, 0, 0]); box(ctx, door.x, floor - 160, 84, 160, '#b29b78', [38, 38, 0, 0]);
        box(ctx, door.x + 10, floor - 145, 64, 58, '#d1cbb0', [29, 29, 2, 2]); ctx.strokeStyle = '#8a775d'; ctx.lineWidth = 2; ctx.strokeRect(door.x + 12, floor - 76, 60, 62);
        oval(ctx, door.x + 67, floor - 77, 5, 5, '#edcc7f');
    }
    if (rich) {
        const shade = ctx.createLinearGradient(0, floor - 25, 0, height); shade.addColorStop(0, '#302a3400'); shade.addColorStop(1, '#302a3430'); ctx.fillStyle = shade; ctx.fillRect(0, floor - 25, HOME_WIDTH, 125);
    }
    ctx.restore();
}

export function drawHouseChase(ctx: CanvasRenderingContext2D, width: number, height: number, step: number, frame: number) {
    const scale = Math.min(width / 850, height / 540, 1.6), t = frame / 60;
    const actorFloor = height * .51 + 40 * scale * 1.5;
    ctx.fillStyle = '#947253'; ctx.fillRect(0, 0, width, height);
    ctx.save(); ctx.translate(0, actorFloor - (height - 100));
    drawHome(ctx, width, height, Math.max(0, (1500 - width) / 2), 'ground', {}, t);
    ctx.restore();
    ctx.save(); ctx.translate(width / 2, height * .51); ctx.scale(scale * 1.5, scale * 1.5);
    const run = step < 4, offset = run ? Math.sin(t * 1.7) * 65 : 0;
    drawFamilyDog(ctx, 'opal', -145 + offset, 0, true, run, t, true, false, 'hearts');
    drawFamilyDog(ctx, 'ruby', -60 + offset, 0, true, run, t, true, false, 'angry');
    drawFamilyDog(ctx, 'samwise', 66 + offset, 0, true, run, t, true, true, 'worried');
    ctx.restore();
}
