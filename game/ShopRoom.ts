import { Player } from './entities/Player';
import { Platform } from './entities/Platform';
import { inputManager } from './Input';
import { gfxSettings } from './GfxSettings';
import { SHOP_COSMETICS, SHOP_GOODS, type Accessory, type Supply } from './Shop';
import type { SoundType } from '../types';

const ROOM_WIDTH = 1100, FLOOR = 540;
const THEMES: Record<number, { wall: string; wood: string; trim: string; sky: string; name: string }> = {
    3: { wall: '#253e37', wood: '#593e2f', trim: '#99b482', sky: '#183b46', name: 'CANOPY HIDEAWAY' },
    6: { wall: '#57423f', wood: '#885d43', trim: '#e6c092', sky: '#91afc4', name: 'SNOWDRIFT CHALET' },
    9: { wall: '#263f50', wood: '#a16d48', trim: '#e2cc99', sky: '#567e90', name: 'LIGHTHOUSE TRADING POST' },
    12: { wall: '#89634f', wood: '#774534', trim: '#efcca0', sky: '#dfac7f', name: 'THE BAKER’S RAFTERS' },
    15: { wall: '#6b8172', wood: '#886446', trim: '#f1d9aa', sky: '#aecabd', name: 'JUNIPER’S HOME SHOP' },
};

export class ShopRoom {
    public player = new Player(220, FLOOR - 40);
    public cameraX = 0;
    public scale = 1;
    public offsetX = 0;
    public frame = 0;
    private ground = new Platform(0, FLOOR, ROOM_WIDTH, 120);
    private juniper = new Player(0, 0);
    private mannequin = new Player(0, 0);

    constructor(public level: number, equipped: Set<Accessory>, public supplies: Supply[], public returnMusic: SoundType | null) {
        this.player.accessories = equipped;
        this.player.grounded = true;
        this.player.jumpsLeft = 2;
        this.juniper.accessories = new Set(['hat', 'collar']);
        this.juniper.grounded = true;
        this.juniper.facingRight = false;
        this.mannequin.accessories.add(SHOP_COSMETICS[level]);
        this.mannequin.grounded = true;
    }

    public resize(width: number, height: number) {
        this.scale = Math.min(height / 640, 1.6);
        const viewWidth = width / this.scale;
        this.offsetX = Math.max(0, (width - ROOM_WIDTH * this.scale) / 2);
        this.cameraX = Math.max(0, Math.min(ROOM_WIDTH - viewWidth, this.player.x + 20 - viewWidth / 2));
    }

    public update(width: number, height: number) {
        this.player.update([this.ground], inputManager.keys, 640, 15);
        this.player.x = Math.max(24, Math.min(ROOM_WIDTH - 64, this.player.x));
        this.juniper.facingRight = this.player.x + 20 > 790;
        this.frame++;
        this.resize(width, height);
    }

    public get interaction() {
        if (!this.player.grounded) return undefined;
        const center = this.player.x + 20;
        const target = Math.abs(center - 108) < 72 ? { id: 'leave', label: 'Leave shop', x: 108, y: 346 }
            : Math.abs(center - 790) < 110 ? { id: 'counter', label: 'Talk to Juniper', x: 790, y: 325 } : undefined;
        return target && { ...target, x: (target.x - this.cameraX) * this.scale + this.offsetX, y: target.y * this.scale };
    }

    public draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const theme = THEMES[this.level], rich = gfxSettings.visualMode === 'enhanced', t = this.frame / 60;
        const rect = (x: number, y: number, w: number, h: number, color: string, radius: number | number[] = 0) => {
            ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
        };
        const ellipse = (x: number, y: number, rx: number, ry: number, color: string) => {
            ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
        };
        const line = (x: number, y: number, ex: number, ey: number, color: string, weight = 2) => {
            ctx.strokeStyle = color; ctx.lineWidth = weight; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        };
        const label = (text: string, x: number, y: number, size: number, color: string) => {
            ctx.font = `bold ${size}px Georgia`; ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.fillText(text, x, y);
        };
        ctx.save();
        ctx.fillStyle = '#201d21'; ctx.fillRect(0, 0, width, height);
        ctx.translate(this.offsetX - this.cameraX * this.scale, 0); ctx.scale(this.scale, this.scale);
        rect(0, 0, ROOM_WIDTH, 640, theme.wall);
        if (rich) {
            const light = ctx.createRadialGradient(670, 230, 25, 550, 300, 670);
            light.addColorStop(0, '#ffd79832'); light.addColorStop(1, '#070f2066');
            ctx.fillStyle = light; ctx.fillRect(0, 0, ROOM_WIDTH, FLOOR);
        }
        // Timber frame, wainscoting, and a plank floor shared by Juniper's branches.
        for (let x = 8; x < ROOM_WIDTH; x += 74) {
            line(x, 110, x, FLOOR, '#edce9820', 1);
            rect(x, 410, 67, 126, theme.wood, 2);
            rect(x + 6, 419, 55, 102, '#14222c22', 2);
        }
        rect(0, 403, ROOM_WIDTH, 9, theme.trim); rect(0, 531, ROOM_WIDTH, 14, theme.wood);
        rect(0, FLOOR, ROOM_WIDTH, 100, theme.wood);
        for (let y = FLOOR + 4; y < 640; y += 22) {
            line(0, y, ROOM_WIDTH, y, '#291e2370', 2);
            for (let x = (y % 3) * 47; x < ROOM_WIDTH; x += 154) line(x, y, x, y + 22, '#291e2350', 1);
        }
        rect(18, 26, 28, FLOOR - 26, theme.wood); rect(1054, 26, 28, FLOOR - 26, theme.wood);
        rect(0, 29, ROOM_WIDTH, 32, theme.wood); rect(0, 61, ROOM_WIDTH, 5, theme.trim);
        for (let x = 28; x < ROOM_WIDTH; x += 140) ellipse(x, 44, 3, 3, theme.trim);
        // Door back to the very same trail.
        rect(47, 358, 122, 186, theme.trim, [60, 60, 0, 0]);
        rect(55, 366, 106, 178, '#283a3d', [52, 52, 0, 0]);
        rect(62, 373, 92, 167, theme.wood, [45, 45, 0, 0]);
        for (let x = 77; x < 152; x += 18) line(x, 401, x, 536, '#211d2845', 2);
        ellipse(107, 410, 25, 25, theme.trim); ellipse(107, 410, 20, 20, theme.sky);
        line(88, 410, 126, 410, theme.trim, 3); line(107, 389, 107, 432, theme.trim, 3);
        ellipse(140, 477, 4, 4, '#f5cf7b');
        ellipse(113, 550, 78, 11, '#272a2940');
        // A physical shop sign; the rest of the room uses nearby E prompts.
        line(610, 64, 610, 91, '#c7a56d'); line(906, 64, 906, 91, '#c7a56d');
        rect(584, 87, 350, 70, theme.trim, 10); rect(590, 93, 338, 58, theme.wood, 7);
        label('THE HIDDEN PAW', 760, 120, 22, '#fff0c7'); label(theme.name, 760, 139, 10, theme.trim);
        // Window view changes with the place the doghouse was entered from.
        ctx.save();
        ctx.beginPath(); if (this.level === 9) ctx.arc(361, 245, 85, 0, Math.PI * 2); else ctx.roundRect(262, 152, 202, 191, 12);
        ctx.clip(); rect(256, 149, 216, 200, theme.sky);
        if (this.level === 3) {
            ellipse(414, 189, 23, 23, '#dfddb4');
            for (let i = 0; i < 7; i++) {
                rect(260 + i * 36, 175 - (i % 3) * 25, 12, 175, '#16352e');
                ellipse(264 + i * 36, 192 - (i % 3) * 25, 41, 63, '#265847');
            }
            for (let i = 0; i < 12; i++) ellipse(271 + (i * 37) % 181, 220 + Math.sin(t + i) * 35, 1.6, 1.6, '#f7d78f');
        } else if (this.level === 6) {
            ctx.fillStyle = '#e5eff2'; ctx.beginPath(); ctx.moveTo(251, 318); ctx.lineTo(315, 191); ctx.lineTo(370, 294); ctx.lineTo(420, 177); ctx.lineTo(481, 342); ctx.fill();
            for (let i = 0; i < 25; i++) ellipse(263 + (i * 73) % 200, 151 + (i * 37 + t * 18) % 193, 2, 2, '#fff');
        } else if (this.level === 9) {
            rect(270, 257, 190, 90, '#355b70');
            for (let i = 0; i < 5; i++) line(270 + Math.sin(t + i) * 10, 266 + i * 16, 462, 266 + i * 16, '#abc8c47a');
            rect(388, 199, 14, 60, '#ecdcc0'); rect(385, 193, 20, 8, '#e3b76d');
            ctx.fillStyle = '#fff4ba44'; ctx.beginPath(); ctx.moveTo(395, 194); ctx.lineTo(280, 157 + Math.sin(t) * 35); ctx.lineTo(280, 205 + Math.sin(t) * 35); ctx.fill();
        } else if (this.level === 12) {
            for (let i = 0; i < 4; i++) { rect(260 + i * 54, 235, 50, 115, '#71554c'); rect(275 + i * 54, 253, 18, 30, '#ffcf77'); }
            ctx.fillStyle = '#604c49'; ctx.beginPath(); ctx.moveTo(251, 239); ctx.lineTo(360, 192); ctx.lineTo(478, 239); ctx.fill();
        } else {
            ellipse(417, 185, 23, 23, '#fff0b2'); ellipse(304, 337, 111, 65, '#668b69'); ellipse(439, 339, 106, 46, '#8ba075');
            for (let x = 265; x < 468; x += 25) rect(x, 293, 9, 54, '#ede0b7', [4, 4, 0, 0]);
            rect(260, 307, 211, 7, '#ede0b7');
        }
        ctx.restore();
        ctx.strokeStyle = theme.trim; ctx.lineWidth = 9; ctx.beginPath();
        if (this.level === 9) ctx.arc(361, 245, 87, 0, Math.PI * 2); else ctx.roundRect(260, 150, 206, 195, 12);
        ctx.stroke();
        if (this.level !== 9) { line(363, 155, 363, 345, theme.trim, 5); line(266, 245, 460, 245, theme.trim, 5); rect(249, 344, 229, 12, theme.trim, 3); }
        // Branch fixtures: leafy treehouse, hearth, nautical ropes, oven, or a cozy dresser.
        if (this.level === 3) {
            for (const x of [197, 499, 1008]) {
                ctx.strokeStyle = '#739969'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 64); ctx.bezierCurveTo(x - 50, 140, x + 25, 230, x - 10, 312); ctx.stroke();
                for (let i = 0; i < 8; i++) ellipse(x - 14 + Math.sin(i) * 17, 87 + i * 26, 15, 6, i % 2 ? '#62805a' : '#88a270');
            }
            for (let i = 0; i < 4; i++) { rect(190 + i * 17, 511 - i % 2 * 12, 5, 28, '#dbc9a1'); ellipse(193 + i * 17, 510 - i % 2 * 12, 11, 6, '#c68066'); }
        } else if (this.level === 6 || this.level === 12) {
            const bakery = this.level === 12;
            rect(229, 385, 254, 153, bakery ? '#9f6550' : '#8a8580', 8);
            for (let y = 392; y < 537; y += 25) { line(230, y, 482, y, '#322b3548'); for (let x = 239 + y % 3 * 20; x < 478; x += 66) line(x, y, x, y + 25, '#322b3548'); }
            rect(288, 420, 139, 118, '#392c32', [62, 62, 0, 0]); rect(218, 375, 277, 16, theme.trim, 3);
            for (let i = 0; i < 6; i++) ellipse(313 + i * 17, 511, 12, 15 + Math.sin(t * 5 + i) * 5, i % 2 ? '#eeba63' : '#d6844b');
            if (bakery) { rect(285, 470, 145, 10, '#b4a39a'); for (let i = 0; i < 3; i++) ellipse(310 + i * 43, 459, 18, 9, '#e9b269'); }
            else { rect(447, 434, 31, 64, '#bc5960', [0, 0, 12, 0]); rect(438, 428, 44, 11, '#efe4cc'); }
        } else if (this.level === 9) {
            ellipse(344, 467, 61, 61, '#d2b887'); ellipse(344, 467, 38, 38, theme.wall);
            for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(344, 467); ctx.rotate(i * Math.PI / 2); rect(-15, -61, 30, 23, '#bb6760', 3); ctx.restore(); }
            line(467, 65, 467, 438, '#bfa477', 5);
            for (let i = 0; i < 5; i++) { ctx.strokeStyle = '#bfa477'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(472 + i * 3, 499 - i * 5, 35, 11, 0, 0, Math.PI * 2); ctx.stroke(); }
        } else {
            rect(258, 396, 211, 138, theme.wood, 5); rect(248, 387, 231, 13, theme.trim, 4);
            for (let i = 0; i < 3; i++) { rect(268, 409 + i * 39, 190, 31, '#b38c64', 2); ellipse(362, 424 + i * 39, 3, 3, '#f3d098'); }
            rect(275, 361, 39, 24, '#c7816c', [0, 0, 7, 7]);
            for (let i = 0; i < 5; i++) { line(294, 365, 276 + i * 9, 329 - i % 2 * 9, '#536e51'); ellipse(276 + i * 9, 329 - i % 2 * 9, 8, 5, '#aabb87'); }
            rect(388, 349, 49, 37, '#edcf98', 3); rect(393, 354, 39, 27, '#698e85'); label('♥', 413, 375, 20, '#f5d4b2');
        }
        // Featured local outfit under a glass bell, with its price on a little ticket.
        rect(497, 472, 113, 66, theme.wood, 4); rect(487, 463, 132, 13, theme.trim, 4);
        ctx.save(); ctx.translate(511, 397); ctx.scale(1.65, 1.65); this.mannequin.draw(ctx, 0, 15); ctx.restore();
        ctx.strokeStyle = '#e7f7ed70'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(493, 383, 119, 79, [49, 49, 0, 0]); ctx.stroke();
        line(506, 407, 516, 393, '#fff8dc80', 3);
        rect(530, 482, 52, 26, '#f8e4b6', 3); label(String(SHOP_GOODS[SHOP_COSMETICS[this.level]].price) + ' 🍖', 556, 500, 12, '#634a3b');
        // Bottles and wrapped stock behind the counter.
        for (let row = 0; row < 2; row++) {
            rect(653, 226 + row * 71, 340, 11, theme.trim, 2);
            for (let i = 0; i < 8; i++) {
                const x = 667 + i * 41, y = 188 + row * 71;
                rect(x, y, 25, 36, ['#b78372', '#acbb8c', '#d3ad73', '#84aeb0'][(i + row) % 4], [7, 7, 3, 3]);
                rect(x + 4, y - 5, 17, 7, '#d1bb8e', 2); rect(x + 5, y + 11, 15, 12, '#f4dfb7', 2);
                ellipse(x + 12, y + 17, 3, 3, '#806752');
            }
        }
        // Juniper stands behind the counter; Onyx walks in front of it.
        ctx.save(); ctx.translate(741, 338 + Math.sin(t * 2) * 1.5); ctx.scale(2.4, 2.4);
        this.juniper.draw(ctx, 0, 15); ctx.restore();
        ellipse(809, 546, 210, 10, '#19262b38');
        rect(632, 431, 374, 108, theme.wood, 5); rect(620, 421, 397, 18, theme.trim, 5);
        for (let i = 0; i < 3; i++) { rect(645 + i * 118, 449, 107, 71, '#ead09b35', 3); rect(651 + i * 118, 455, 95, 59, '#392e3020', 3); }
        rect(748, 450, 129, 31, theme.trim, 4); label('JUNIPER', 812, 471, 15, theme.wood);
        for (let i = 0; i < this.supplies.length; i++) {
            const x = 645 + i * 45;
            rect(x, 400, 35, 21, '#c6a076', 4); label(SHOP_GOODS[this.supplies[i]].icon, x + 17, 417, 19, '#fff0d0');
        }
        rect(934, 400, 29, 21, '#c1a16a', 5); ellipse(948, 399, 17, 5, '#efd79c'); ellipse(948, 391, 4, 4, '#efd79c');
        if (this.level === 12) for (let i = 0; i < 9; i++) rect(628 + i * 42, 435, 22, 13, '#efd9b8');
        // Warm hanging lamps and a woven runner give the foreground some depth.
        for (const x of [200, 550, 1005]) {
            line(x, 64, x, 120, '#b7a07b', 2);
            rect(x - 14, 120, 28, 37, '#f8dda0', 7); rect(x - 17, 115, 34, 7, theme.wood, 3);
            if (rich) { const glow = ctx.createRadialGradient(x, 140, 5, x, 140, 85); glow.addColorStop(0, '#ffe7a036'); glow.addColorStop(1, '#ffe7a000'); ctx.fillStyle = glow; ctx.fillRect(x - 85, 55, 170, 170); }
        }
        ellipse(735, 551, 226, 19, theme.trim); ellipse(735, 551, 215, 15, this.level === 9 ? '#678e96' : '#ad7566');
        for (let x = 537; x < 937; x += 22) line(x, 548, x + 7, 554, '#f5d5a880', 2);
        ellipse(this.player.x + 20, FLOOR + 3, 26, 4, '#19262b38'); this.player.draw(ctx, 0, 15);
        ctx.restore();
    }
}
