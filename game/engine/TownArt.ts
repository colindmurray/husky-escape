import { gfxSettings } from '../GfxSettings';

const TAU = Math.PI * 2;
export const townColors = ['#d96252', '#258d91', '#e4af46', '#8272ab'];

export function townBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color;
    if (gfxSettings.visualMode === 'enhanced') {
        ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(5, h / 2)); ctx.fill();
    } else ctx.fillRect(x, y, w, h);
}

export function townLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = '#fff6dc') {
    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    const w = Math.min(ctx.canvas.width - 20, ctx.measureText(text).width + 20);
    townBox(ctx, x - w / 2, y - 18, w, 26, '#243d49');
    ctx.fillStyle = color; ctx.fillText(text, x, y, w - 20);
    ctx.restore();
}

export function drawTownPerson(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, stride: number, wave = false, facing = 1) {
    const rich = gfxSettings.visualMode === 'enhanced';
    const style = Math.max(0, townColors.indexOf(color));
    const skin = ['#dca47c', '#97674e', '#ecc7a0', '#bd8d6d'][style];
    ctx.save(); ctx.translate(x + 19, y); ctx.scale(facing, 1); ctx.translate(-19, 0);
    if (rich) {
        ctx.fillStyle = '#20343f35'; ctx.beginPath(); ctx.ellipse(19, 57, 21, 4, 0, 0, TAU); ctx.fill();
    }
    const leg = wave ? 0 : Math.sin(stride) * 5;
    ctx.lineCap = rich ? 'round' : 'square'; ctx.lineJoin = 'round';
    for (const [hip, foot, shade] of [[13, 11 + leg, '#344753'], [24, 26 - leg, '#263c49']] as const) {
        ctx.strokeStyle = shade; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(hip, 35); ctx.lineTo(hip + (foot - hip) * 0.4, 46); ctx.lineTo(foot, 53); ctx.stroke();
        townBox(ctx, foot - 3, 51, 11, 5, '#202e37');
        if (rich) { ctx.fillStyle = '#ccd7cf'; ctx.fillRect(foot - 3, 55, 11, 1); }
    }
    townBox(ctx, 6, 18, 25, 22, color);
    if (rich) {
        const cloth = ctx.createLinearGradient(6, 0, 32, 0);
        cloth.addColorStop(0, '#ffffff45'); cloth.addColorStop(0.45, '#ffffff00'); cloth.addColorStop(1, '#17333b55');
        ctx.fillStyle = cloth; ctx.beginPath(); ctx.roundRect(6, 18, 25, 22, 5); ctx.fill();
        ctx.strokeStyle = '#ffffff50'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, 23); ctx.lineTo(10, 35); ctx.stroke();
        ctx.fillStyle = '#f3deba'; ctx.fillRect(24, 27, 4, 1);
    }
    townBox(ctx, 15, 13, 8, 8, skin);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(19, 9, 9, 11, -0.07, 0, TAU); ctx.fill();
    ctx.fillStyle = ['#49342c', '#292c2f', '#725443', '#4c3b36'][style];
    ctx.beginPath(); ctx.arc(18, 6, 10, Math.PI * 0.95, TAU); ctx.lineTo(25, 8); ctx.lineTo(16, 2); ctx.lineTo(9, 9); ctx.fill();
    ctx.fillStyle = '#263b43'; ctx.fillRect(23, 8, 2, 3);
    ctx.strokeStyle = '#794d43'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(24, 12, 3, 0.1, Math.PI * 0.8); ctx.stroke();
    if (style === 2) {
        townBox(ctx, 7, -1, 26, 4, '#ddbe80'); townBox(ctx, 12, -9, 16, 9, '#ebd49c');
    } else if (style === 3) {
        ctx.strokeStyle = '#f5dd9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, 20); ctx.lineTo(25, 21); ctx.lineTo(25, 31); ctx.stroke();
    }
    ctx.strokeStyle = skin; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(29, 23);
    ctx.lineTo(34, wave ? 17 : 30); ctx.lineTo(34 + (wave ? Math.sin(stride * 2) * 3 : leg * 0.4), wave ? 7 : 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, 24); ctx.lineTo(4, 34); ctx.stroke();
    townBox(ctx, -2, 33, 12, 14, style % 2 ? '#bda784' : '#c2be85');
    ctx.strokeStyle = '#755c40'; ctx.lineWidth = 1; ctx.strokeRect(1, 29, 6, 6);
    if (rich) { ctx.fillStyle = '#f7dfb160'; ctx.fillRect(0, 36, 2, 8); }
    ctx.restore();
}

export function drawTownBackground(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, rich: boolean, t: number, cameraY = 0) {
    ctx.save();
    const ground = h - 100 - cameraY;
    if (rich) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#76b9ce'); sky.addColorStop(0.6, '#d9e9d5'); sky.addColorStop(1, '#fff0c6');
        ctx.fillStyle = sky;
    } else ctx.fillStyle = '#9dd9ed';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff4bc'; ctx.beginPath(); ctx.arc(w * 0.82, 100, 42, 0, TAU); ctx.fill();
    if (rich) {
        const glow = ctx.createRadialGradient(w * 0.82, 100, 35, w * 0.82, 100, 170);
        glow.addColorStop(0, '#fff2be70'); glow.addColorStop(1, '#fff2be00');
        ctx.fillStyle = glow; ctx.fillRect(w * 0.82 - 180, -80, 360, 360);
        ctx.fillStyle = '#ffffff60';
        for (let i = -1; i < w / 280 + 1; i++) {
            const cx = i * 280 - (camX * 0.07 + t * 3) % 280;
            for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(cx + k * 28, 100 + Math.sin(i * 2) * 25 - k * 6, 35, 14 + k * 3, 0, 0, TAU); ctx.fill(); }
        }
        // Distant hills and clock tower move more slowly than the shopfronts.
        ctx.fillStyle = '#82aaa2';
        for (let i = -1; i < w / 320 + 2; i++) {
            ctx.beginPath(); ctx.ellipse(i * 320 - (camX * 0.1 % 320), ground + 50, 240, 260, 0, 0, TAU); ctx.fill();
        }
        const towerX = 850 - camX * 0.16;
        ctx.fillStyle = '#b39c82'; ctx.fillRect(towerX, ground - 420, 74, 420);
        ctx.fillStyle = '#647c79'; ctx.beginPath(); ctx.moveTo(towerX - 12, ground - 420); ctx.lineTo(towerX + 37, ground - 480); ctx.lineTo(towerX + 86, ground - 420); ctx.fill();
        ctx.fillStyle = '#fff0c9'; ctx.beginPath(); ctx.arc(towerX + 37, ground - 377, 24, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#52636a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(towerX + 37, ground - 394); ctx.lineTo(towerX + 37, ground - 377); ctx.lineTo(towerX + 50, ground - 370); ctx.stroke();
    }
    const names = ['BAKERY', 'FLOWERS', 'BOOKSHOP', 'MARKET', 'CAFE', 'POST'];
    const walls = ['#eac4a1', '#d8dfbd', '#e8b2a1', '#c3d8cd'];
    const start = Math.floor(camX * 0.45 / 240) - 1;
    for (let i = start; i < start + Math.ceil(w / 240) + 3; i++) {
        const n = ((i % 12) + 12) % 12;
        const x = i * 240 - camX * 0.45;
        const roof = ground - 260 - (n % 3) * 32;
        ctx.fillStyle = walls[n % walls.length]; ctx.fillRect(x, roof, 228, ground - roof);
        ctx.fillStyle = rich ? '#8f6f60' : '#a65f42';
        ctx.beginPath(); ctx.moveTo(x - 9, roof); ctx.lineTo(x + 114, roof - 60); ctx.lineTo(x + 237, roof); ctx.fill();
        if (rich) {
            ctx.save(); ctx.clip();
            ctx.strokeStyle = '#665d5740'; ctx.lineWidth = 2;
            for (let ry = roof - 48; ry < roof; ry += 12) {
                ctx.beginPath(); ctx.moveTo(x - 8, ry); ctx.lineTo(x + 236, ry); ctx.stroke();
                for (let rx = x; rx < x + 240; rx += 26) { ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 12); ctx.stroke(); }
            }
            ctx.restore();
            const facade = ctx.createLinearGradient(x, 0, x + 228, 0);
            facade.addColorStop(0, '#ffefcb30'); facade.addColorStop(0.8, '#80614f08'); facade.addColorStop(1, '#44383140');
            ctx.fillStyle = facade; ctx.fillRect(x, roof, 228, ground - roof);
            ctx.fillStyle = '#68554730'; ctx.fillRect(x, roof, 228, 9);
            ctx.fillStyle = '#f9e6be'; ctx.fillRect(x - 4, roof - 3, 236, 4);
        }
        for (let k = 0; k < 3; k++) {
            ctx.fillStyle = '#5f8588'; ctx.fillRect(x + 25 + k * 68, roof + 28, 40, 58);
            if (rich) {
                ctx.strokeStyle = '#fff0d5'; ctx.lineWidth = 4; ctx.strokeRect(x + 25 + k * 68, roof + 28, 40, 58);
                ctx.beginPath(); ctx.moveTo(x + 45 + k * 68, roof + 28); ctx.lineTo(x + 45 + k * 68, roof + 85); ctx.moveTo(x + 26 + k * 68, roof + 57); ctx.lineTo(x + 64 + k * 68, roof + 57); ctx.stroke();
                ctx.fillStyle = '#fff4d650'; ctx.fillRect(x + 28 + k * 68, roof + 30, 12, 52);
                ctx.fillStyle = '#739766'; ctx.fillRect(x + 20 + k * 68, roof + 89, 50, 9);
                for (let flower = 0; flower < 4; flower++) {
                    ctx.fillStyle = flower % 2 ? '#e3928c' : '#eed394';
                    ctx.beginPath(); ctx.arc(x + 25 + k * 68 + flower * 12, roof + 89, 3, 0, TAU); ctx.fill();
                }
            }
        }
        ctx.fillStyle = '#36545b'; ctx.fillRect(x + 24, ground - 116, 180, 106);
        ctx.fillStyle = '#f7e1bb'; ctx.fillRect(x + 108, ground - 108, 4, 100);
        ctx.fillStyle = townColors[n % 4]; ctx.fillRect(x + 13, ground - 150, 202, 28);
        ctx.fillStyle = '#fff5da'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(names[n % names.length], x + 114, ground - 131);
        if (rich) {
            ctx.fillStyle = '#fff2cf35'; ctx.beginPath(); ctx.moveTo(x + 30, ground - 110); ctx.lineTo(x + 88, ground - 110); ctx.lineTo(x + 30, ground - 25); ctx.fill();
            ctx.fillStyle = '#4e655e'; ctx.fillRect(x + 218, roof, 6, ground - roof);
            // Shop lights and a chalkboard sit behind the playable street.
            ctx.fillStyle = '#384f51'; ctx.fillRect(x + 2, ground - 133, 5, 66);
            ctx.fillStyle = '#ffdfa0'; ctx.fillRect(x - 4, ground - 136, 16, 20);
            ctx.strokeStyle = '#536364'; ctx.lineWidth = 2; ctx.strokeRect(x - 4, ground - 136, 16, 20);
            ctx.fillStyle = '#ab8767'; ctx.fillRect(x + 165, ground - 48, 32, 44);
            ctx.fillStyle = '#3d5855'; ctx.fillRect(x + 169, ground - 44, 24, 34);
            ctx.fillStyle = '#f6e8c0'; ctx.font = '7px sans-serif'; ctx.fillText('OPEN', x + 181, ground - 30);
            ctx.fillRect(x + 173, ground - 24, 16, 1); ctx.fillRect(x + 175, ground - 19, 12, 1);
        }
    }
    // Bunting stays above jump routes; its movement is cosmetic only.
    ctx.strokeStyle = '#5b7175'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 165); ctx.quadraticCurveTo(w / 2, 230, w, 165); ctx.stroke();
    for (let x = -(camX * 0.65 % 42); x < w; x += 42) {
        const y = 165 + Math.sin(Math.max(0, x / w) * Math.PI) * 32;
        ctx.fillStyle = townColors[Math.abs(Math.floor((x + camX * 0.65) / 42)) % 4];
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 24, y + 2); ctx.lineTo(x + 12 + (rich ? Math.sin(t * 2 + x) * 3 : 0), y + 28); ctx.fill();
    }
    ctx.restore();
}

export type TownPlatformKind = 'pavement' | 'bench' | 'crate' | 'awning' | 'float' | 'fence' | 'barrier' | 'stone';

export function drawTownPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, kind: TownPlatformKind, color: string, t: number, floorY = y + h + 26, boarded = false) {
    const rich = gfxSettings.visualMode === 'enhanced';
    ctx.save();
    if (kind === 'pavement') {
        ctx.fillStyle = '#778481'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#e9ddbc'; ctx.fillRect(x, y, w, 7);
        ctx.fillStyle = '#5d6967'; ctx.fillRect(x, y + 7, w, 4);
        const first = Math.max(0, Math.floor(-x / 60) * 60);
        ctx.strokeStyle = '#a5afa5'; ctx.lineWidth = 1;
        for (let k = first; k < w && x + k < ctx.canvas.width; k += 60) {
            ctx.strokeRect(x + k, y + 14, Math.min(58, w - k), 22);
            if (rich && k + 30 < w) ctx.strokeRect(x + k + 30, y + 40, Math.min(58, w - k - 30), 22);
        }
    } else if (kind === 'awning') {
        const legH = Math.max(20, floorY - y - h);
        ctx.fillStyle = '#64533f'; ctx.fillRect(x + 5, y + h, 7, legH); ctx.fillRect(x + w - 12, y + h, 7, legH);
        townBox(ctx, x, y, w, h, color);
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        ctx.fillStyle = '#fff0d3';
        for (let k = 0; k < w; k += 32) ctx.fillRect(x + k, y, 16, h);
        if (rich) {
            const fold = ctx.createLinearGradient(0, y, 0, y + h);
            fold.addColorStop(0, '#ffffff70'); fold.addColorStop(0.25, '#ffffff00'); fold.addColorStop(1, '#39292755');
            ctx.fillStyle = fold; ctx.fillRect(x, y, w, h);
        }
        ctx.restore();
        for (let k = 0; k < w; k += 16) {
            ctx.fillStyle = k % 32 ? color : '#fff0d3';
            ctx.beginPath(); ctx.moveTo(x + k, y + h - 3); ctx.quadraticCurveTo(x + k + 8, y + h + 10, x + Math.min(w, k + 16), y + h - 3); ctx.fill();
        }
        ctx.fillStyle = '#f7edc8'; ctx.fillRect(x, y, w, 3);
        const counter = floorY - 40;
        townBox(ctx, x + 10, counter, w - 20, 12, '#a86e47');
        for (let k = 22; k < w - 16; k += 25) {
            ctx.fillStyle = k % 50 < 25 ? '#d56d3c' : '#e2b34d';
            ctx.beginPath(); ctx.arc(x + k, counter - 6, 7, 0, TAU); ctx.fill();
            if (rich) { ctx.fillStyle = '#f7d083'; ctx.beginPath(); ctx.arc(x + k - 2, counter - 9, 2, 0, TAU); ctx.fill(); }
        }
    } else if (kind === 'float') {
        // Open chassis leaves a visible route under Easy's elevated parade decks.
        ctx.strokeStyle = '#485d60'; ctx.lineWidth = rich ? 5 : 4;
        const axleY = floorY - 13;
        ctx.beginPath(); ctx.moveTo(x + 24, axleY); ctx.lineTo(x + w - 24, axleY);
        ctx.moveTo(x + 32, y + h); ctx.lineTo(x + 32, axleY); ctx.moveTo(x + w - 32, y + h); ctx.lineTo(x + w - 32, axleY); ctx.stroke();
        townBox(ctx, x, y, w, h, color);
        if (rich) {
            const body = ctx.createLinearGradient(0, y, 0, y + h); body.addColorStop(0, '#ffffff45'); body.addColorStop(1, '#182c4b55'); ctx.fillStyle = body; ctx.fillRect(x + 2, y + 3, w - 4, h - 3);
        }
        for (const k of [30, w - 30]) {
            ctx.fillStyle = '#263a45'; ctx.beginPath(); ctx.arc(x + k, axleY, 13, 0, TAU); ctx.fill();
            ctx.fillStyle = '#d1c6a1'; ctx.beginPath(); ctx.arc(x + k, axleY, 7, 0, TAU); ctx.fill();
            ctx.strokeStyle = '#657071'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + k - Math.cos(t * 2) * 7, axleY - Math.sin(t * 2) * 7); ctx.lineTo(x + k + Math.cos(t * 2) * 7, axleY + Math.sin(t * 2) * 7); ctx.stroke();
        }
        for (let k = 15; k < w; k += 30) {
            ctx.fillStyle = '#fff0c9'; ctx.beginPath(); ctx.moveTo(x + k - 8, y + h); ctx.lineTo(x + k + 8, y + h); ctx.lineTo(x + k, y + h + 11); ctx.fill();
        }
        for (const k of [12, w - 12]) {
            const sway = Math.sin(t * 2 + k) * 4;
            ctx.strokeStyle = '#e9dfc5'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + k, y); ctx.quadraticCurveTo(x + k - sway, y - 36, x + k + sway, y - 62); ctx.stroke();
            ctx.fillStyle = k === 12 ? '#e9b84f' : '#dc756a';
            ctx.beginPath(); ctx.ellipse(x + k + sway, y - 72, 11, 15, 0, 0, TAU); ctx.fill();
            if (rich) { ctx.fillStyle = '#fff4d475'; ctx.beginPath(); ctx.ellipse(x + k + sway - 4, y - 76, 3, 6, 0.4, 0, TAU); ctx.fill(); }
        }
        ctx.fillStyle = boarded ? '#9fe0ac' : '#ffe190'; ctx.fillRect(x, y, w, 5);
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MARKET DAY', x + w / 2, y + 25);
        ctx.fillStyle = boarded ? '#368664' : '#e8b649'; ctx.beginPath(); ctx.arc(x + w / 2, y - 24, 14, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff0bb'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff8df'; ctx.font = 'bold 17px sans-serif'; ctx.fillText(boarded ? '✓' : '★', x + w / 2, y - 18);
    } else if (kind === 'bench') {
        ctx.strokeStyle = '#345250'; ctx.lineWidth = 6;
        for (const k of [16, w - 16]) {
            ctx.beginPath(); ctx.moveTo(x + k, y - 25); ctx.lineTo(x + k, floorY - 3); ctx.lineTo(x + k + 8, floorY - 3); ctx.stroke();
        }
        for (let k = 0; k < 2; k++) townBox(ctx, x + 4, y - 28 + k * 12, w - 8, 9, '#9d6844');
        townBox(ctx, x, y, w, h, '#ad784d');
        ctx.fillStyle = '#f1cf8c'; ctx.fillRect(x, y, w, 3);
        if (rich) { ctx.strokeStyle = '#6c5036'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 5, y + 8); ctx.lineTo(x + w - 5, y + 8); ctx.stroke(); }
    } else if (kind === 'stone') {
        ctx.fillStyle = '#64868b'; ctx.fillRect(x + 8, y + h, w - 16, Math.max(10, floorY - y - h + 7));
        ctx.fillStyle = '#829fa1'; ctx.beginPath(); ctx.roundRect(x, y, w, h, rich ? 7 : 2); ctx.fill();
        ctx.fillStyle = '#d4e1cc'; ctx.fillRect(x + 3, y, w - 6, 5);
        ctx.strokeStyle = '#496f77'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w * 0.6, y + 4); ctx.lineTo(x + w * 0.55, y + 10); ctx.lineTo(x + w * 0.64, y + h); ctx.stroke();
        if (rich) { ctx.fillStyle = '#86a878'; ctx.fillRect(x + 3, y + h - 5, 15, 4); }
    } else if (kind === 'fence') {
        ctx.fillStyle = '#a38459'; ctx.fillRect(x, y + h * 0.35, w, 6); ctx.fillRect(x, y + h * 0.76, w, 6);
        for (let k = 0; k < w; k += 18) {
            ctx.fillStyle = '#dec9a0'; ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k, y + 6); ctx.lineTo(x + k + 6, y); ctx.lineTo(x + k + 12, y + 6); ctx.lineTo(x + k + 12, y + h); ctx.fill();
            if (rich) { ctx.fillStyle = '#fbebc780'; ctx.fillRect(x + k + 2, y + 10, 2, h - 12); }
        }
    } else if (kind === 'barrier') {
        ctx.fillStyle = '#3e4b50'; ctx.fillRect(x + 6, y, 9, h); ctx.fillRect(x + w - 15, y, 9, h);
        for (let row = 0; row < h - 10; row += 28) {
            ctx.save(); ctx.beginPath(); ctx.rect(x, y + row, w, 20); ctx.clip();
            ctx.fillStyle = '#f4d284'; ctx.fillRect(x, y + row, w, 20); ctx.strokeStyle = '#d57548'; ctx.lineWidth = 12;
            for (let k = -25; k < w + 25; k += 26) { ctx.beginPath(); ctx.moveTo(x + k, y + row); ctx.lineTo(x + k + 20, y + row + 20); ctx.stroke(); }
            ctx.restore();
        }
        ctx.fillStyle = '#ffdf80'; ctx.fillRect(x, y, w, 4);
    } else {
        townBox(ctx, x, y, w, h, '#a9754d');
        ctx.strokeStyle = '#6c4b35'; ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
        for (let k = 18; k < h; k += 18) { ctx.beginPath(); ctx.moveTo(x + 3, y + k); ctx.lineTo(x + w - 3, y + k); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(x + 5, y + h - 5); ctx.lineTo(x + w - 5, y + 5); ctx.stroke();
        ctx.fillStyle = '#e6bc7f'; ctx.fillRect(x, y, w, 4);
        for (const k of [7, w - 7]) { ctx.fillStyle = '#534d42'; ctx.fillRect(x + k, y + 7, 2, 2); ctx.fillRect(x + k, y + h - 8, 2, 2); }
        if (rich) { ctx.fillStyle = '#f4daa050'; ctx.fillRect(x + 6, y + 6, w - 12, 3); }
    }
    ctx.restore();
}
