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

export function drawTownPerson(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, stride: number, wave = false) {
    const rich = gfxSettings.visualMode === 'enhanced';
    ctx.save();
    if (rich) {
        ctx.fillStyle = '#26384425'; ctx.beginPath(); ctx.ellipse(x + 18, y + 57, 21, 5, 0, 0, TAU); ctx.fill();
    }
    const leg = Math.sin(stride) * 6;
    townBox(ctx, x + 7 + leg, y + 36, 8, 19, '#354655');
    townBox(ctx, x + 22 - leg, y + 36, 8, 19, '#354655');
    townBox(ctx, x + 4 + leg, y + 52, 13, 5, '#26323a');
    townBox(ctx, x + 20 - leg, y + 52, 13, 5, '#26323a');
    townBox(ctx, x + 5, y + 17, 27, 24, color);
    ctx.fillStyle = '#dfac86'; ctx.beginPath(); ctx.arc(x + 18, y + 9, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = '#49352d'; ctx.beginPath(); ctx.arc(x + 18, y + 6, 10, Math.PI, TAU); ctx.fill();
    townBox(ctx, x + 30, y + (wave ? 4 + Math.sin(stride) * 3 : 23), 6, 18, '#dfac86');
    if (rich) {
        ctx.fillStyle = '#28343c'; ctx.fillRect(x + 21, y + 8, 2, 2);
        ctx.strokeStyle = '#8f5b50'; ctx.beginPath(); ctx.arc(x + 22, y + 12, 3, 0, Math.PI); ctx.stroke();
        townBox(ctx, x + 8, y + 20, 4, 16, '#ffffff35');
        if (!wave) {
            townBox(ctx, x - 4, y + 30, 12, 16, '#edca85');
            ctx.strokeStyle = '#886747'; ctx.strokeRect(x - 1, y + 25, 6, 7);
        }
    }
    ctx.restore();
}

export function drawTownBackground(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, rich: boolean, t: number, hard = false, cameraY = 0) {
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
    if (hard && ground < h) {
        const x = 5030 - camX;
        ctx.fillStyle = '#283e43'; ctx.fillRect(x, ground, 1270, h - ground);
        ctx.fillStyle = '#162b35'; ctx.fillRect(x, ground + 25, 1270, Math.max(0, h - ground - 25));
        ctx.strokeStyle = '#a79363'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(x, ground + 75); ctx.lineTo(x + 1270, ground + 75); ctx.stroke();
        for (const edge of [x, x + 1270]) {
            ctx.fillStyle = '#eac359'; ctx.fillRect(edge - 10, ground, 20, 40);
            ctx.fillStyle = '#394341'; ctx.fillRect(edge - 10, ground + 10, 20, 8); ctx.fillRect(edge - 10, ground + 28, 20, 8);
        }
    }
    ctx.restore();
}

export type TownPlatformKind = 'pavement' | 'bench' | 'crate' | 'awning' | 'float' | 'fence' | 'stone';

export function drawTownPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, kind: TownPlatformKind, color: string, t: number) {
    const rich = gfxSettings.visualMode === 'enhanced';
    ctx.save();
    if (kind === 'pavement') {
        ctx.fillStyle = '#8d9692'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#e4ddc6'; ctx.fillRect(x, y, w, 10);
        ctx.strokeStyle = rich ? '#b6bcb0' : '#727f7c'; ctx.lineWidth = 1;
        const first = Math.max(0, Math.floor(-x / 60) * 60);
        for (let k = first; k < w && x + k < ctx.canvas.width; k += 60) {
            ctx.strokeRect(x + k, y + 14, 58, 22);
            if (rich) ctx.strokeRect(x + k + 30, y + 40, 58, 22);
        }
    } else if (kind === 'awning') {
        ctx.fillStyle = '#6c5744'; ctx.fillRect(x + 5, y + h, 6, 110); ctx.fillRect(x + w - 11, y + h, 6, 110);
        townBox(ctx, x, y, w, h, color);
        ctx.fillStyle = '#fff0d3';
        for (let k = 0; k < w; k += 32) ctx.fillRect(x + k, y, Math.min(16, w - k), h);
        if (rich) {
            ctx.fillStyle = '#fff8df55'; ctx.fillRect(x, y, w, 4);
            ctx.fillStyle = '#4e353b30'; ctx.fillRect(x, y + h - 5, w, 5);
            townBox(ctx, x + 8, y + 93, w - 16, 22, '#aa7253');
            for (let k = 22; k < w - 16; k += 22) {
                ctx.fillStyle = k % 44 ? '#da7350' : '#dcb94f'; ctx.beginPath(); ctx.arc(x + k, y + 88, 7, 0, TAU); ctx.fill();
            }
        }
    } else if (kind === 'float') {
        townBox(ctx, x, y, w, h, color);
        ctx.fillStyle = '#fff0b2'; ctx.fillRect(x, y, w, 6);
        for (let k = 28; k < w; k += 54) {
            ctx.fillStyle = '#293e49'; ctx.beginPath(); ctx.arc(x + k, y + h + 6, 12, 0, TAU); ctx.fill();
            ctx.fillStyle = '#d9c486'; ctx.beginPath(); ctx.arc(x + k, y + h + 6, 5, 0, TAU); ctx.fill();
            if (rich) {
                ctx.strokeStyle = '#f9eed3'; ctx.beginPath(); ctx.moveTo(x + k, y); ctx.lineTo(x + k + Math.sin(t * 2 + k) * 4, y - 68); ctx.stroke();
                ctx.fillStyle = townColors[(k + 2) % 4]; ctx.beginPath(); ctx.ellipse(x + k + Math.sin(t * 2 + k) * 4, y - 78, 12, 17, 0, 0, TAU); ctx.fill();
            }
        }
        ctx.fillStyle = '#fff0c9'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MARKET DAY', x + w / 2, y + 24);
    } else {
        townBox(ctx, x, y, w, h, kind === 'stone' ? '#b5c9c7' : color);
        ctx.fillStyle = '#fff2cd70'; ctx.fillRect(x, y, w, 4);
        if (kind === 'bench') {
            ctx.fillStyle = '#344e4c'; ctx.fillRect(x + 12, y + h, 8, 26); ctx.fillRect(x + w - 20, y + h, 8, 26);
        }
        if (rich && (kind === 'crate' || kind === 'fence')) {
            ctx.strokeStyle = '#6a4c36'; ctx.lineWidth = 2; ctx.strokeRect(x + 4, y + 5, w - 8, h - 9);
            ctx.beginPath(); ctx.moveTo(x + 4, y + h - 4); ctx.lineTo(x + w - 4, y + 5); ctx.stroke();
        }
    }
    ctx.restore();
}
