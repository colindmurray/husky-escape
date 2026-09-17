import type { QuestStatus } from './Home';
import { Entity } from './entities/Entity';
import { TownPlatform } from './entities/Town';
import type { Player } from './entities/Player';
import type { LevelData } from './levels/types';
import { gfxSettings } from './GfxSettings';
import { audioManager } from './Audio';
import { Difficulty, SoundType } from '../types';

export const SHOP_GOODS = {
    shield: { name: 'Star treat', icon: '✦', price: 6, description: '5 seconds safe from enemies. Falls, water and the parade band still end the run.' },
    magnet: { name: 'Bone magnet', icon: '🧲', price: 8, description: 'Nearby bones fly to you for 10 seconds.' },
    time: { name: 'Time biscuit', icon: '◷', price: 6, description: 'Adds 30 seconds to the level clock.' },
    spring: { name: 'Spring biscuit', icon: '🌱', price: 8, description: 'Higher land jumps for 12 seconds. Your double jump still works.' },
    sprint: { name: 'Zoomie snack', icon: '💨', price: 8, description: 'Run faster on land for 12 seconds. Take care near ledges!' },
    feather: { name: 'Feather wafer', icon: '🪶', price: 8, description: 'On land, hold jump to float gently down for 12 seconds.' },
    feast: { name: 'Bakery bonus', icon: '🥨', price: 10, description: 'Each bone you collect is worth two for 15 seconds.' },
    hush: { name: 'Quiet-time cookie', icon: '💤', price: 10, description: 'Enemies and their projectiles pause for 5 seconds. They still hurt on contact.' },
    leap: { name: 'Sky biscuit', icon: '☁', price: 8, description: 'An instant upward bounce on land, even in midair, with two fresh jumps.' },
    trailmix: { name: 'Trail mix', icon: '🥜', price: 12, description: 'Higher jumps and faster running together for 15 seconds on land.' },
    goose: { name: 'Mischievous goose', icon: '🪿', price: 16, description: 'White feathers, a long neck, orange feet, and absolutely no manners.' },
    scarf: { name: 'Snowday scarf', icon: '🧣', price: 10, description: 'A golden scarf with a fluttering tail. Only at Snowdrift.' },
    sailor: { name: 'Sailor cap', icon: '⚓', price: 10, description: 'A crisp white cap with a blue ribbon. Only at the Lighthouse.' },
    chef: { name: 'Chef’s toque', icon: '👨‍🍳', price: 10, description: 'A tall, fluffy baker’s hat. Only in the Rafters.' },
    bow: { name: 'Welcome-home bow', icon: '🎀', price: 10, description: 'A coral bow for your homecoming. Only at Juniper’s home shop.' },
    hat: { name: 'Trail cap', icon: '🧢', price: 10, description: 'A little teal cap for a big adventure.' },
    crown: { name: 'Little crown', icon: '👑', price: 12, description: 'Three golden points and a tiny rose jewel. Fit for Queen Onyx.' },
    cat: { name: 'Tuxedo cat', icon: '🐈‍⬛', price: 16, description: 'White socks, green eyes and whiskers. Same brave Onyx underneath.' },
    fox: { name: 'Red fox', icon: '🦊', price: 16, description: 'Russet fur, dark paws and a big cream-tipped brush.' },
    coat: { name: 'Berry sweater', icon: '🧥', price: 12, description: 'A cozy knit with a cream zigzag.' },
    collar: { name: 'Moonstone collar', icon: '💎', price: 8, description: 'A violet collar with a shining pendant.' },
} as const;
export type ShopGood = keyof typeof SHOP_GOODS;
export const SUPPLIES = ['shield', 'magnet', 'time', 'spring', 'sprint', 'feather', 'feast', 'hush', 'leap', 'trailmix'] as const;
export type Supply = typeof SUPPLIES[number];
export type Skin = 'cat' | 'fox' | 'goose';
export type Accessory = 'hat' | 'crown' | 'coat' | 'collar' | 'scarf' | 'sailor' | 'chef' | 'bow' | Skin;
export const isSkin = (id: ShopGood): id is Skin => id === 'cat' || id === 'fox' || id === 'goose';
export const isSupply = (id: ShopGood): id is Supply => (SUPPLIES as readonly string[]).includes(id);

export const SHOP_COSMETICS: Record<number, Accessory> = { 3: 'goose', 6: 'scarf', 9: 'sailor', 12: 'chef', 15: 'bow' };
export function shopStock(level: number, belongings: Belongings): ShopGood[] {
    if (!Object.hasOwn(SHOP_COSMETICS, level)) return [];
    if (!belongings.shopSupplies[level]) {
        const supplies = [...SUPPLIES];
        for (let i = supplies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [supplies[i], supplies[j]] = [supplies[j], supplies[i]];
        }
        belongings.shopSupplies[level] = supplies.slice(0, 3);
    }
    return [SHOP_COSMETICS[level], ...belongings.shopSupplies[level], 'hat', 'crown', 'cat', 'fox', 'coat', 'collar'];
}
const HEADWEAR: Accessory[] = ['hat', 'crown', 'sailor', 'chef', 'bow'];

export class Belongings {
    public homeUnlocked = false;
    public houseIntroSeen = false;
    public companions = new Set<string>();
    public quests: Record<string, QuestStatus> = {};
    public slots: (Supply | null)[] = [null, null, null];
    public owned = new Set<Accessory>();
    public equipped = new Set<Accessory>();
    public collectedBones = new Set<string>();
    public unlockedShops = new Set<number>();
    public shopSupplies: Record<number, Supply[]> = {};

    public toggleAccessory(id: Accessory) {
        if (this.equipped.delete(id)) return;
        if (isSkin(id)) { this.equipped.delete('cat'); this.equipped.delete('fox'); this.equipped.delete('goose'); }
        if (HEADWEAR.includes(id)) HEADWEAR.forEach(hat => this.equipped.delete(hat));
        this.equipped.add(id);
    }
}

export class SecretDoghouse extends Entity {
    public seals = [false, false, false];
    public unlocked = false;
    public nearby = false;
    constructor(x: number, y: number, public trail: { x: number; y: number }[], public title: string) {
        super(x, y, 88, 66, '#ae7950');
    }
    update(player?: Player) {
        if (!player) return;
        this.trail.forEach((seal, i) => {
            if (!this.seals[i] && player.x < seal.x + 22 && player.x + player.w > seal.x - 4 && player.y < seal.y + 22 && player.y + player.h > seal.y - 4) {
                this.seals[i] = true; audioManager.playSFX(SoundType.COLLECT);
            }
        });
        this.unlocked ||= this.seals.every(Boolean);
        this.nearby = Math.abs(player.x + player.w / 2 - this.x - this.w / 2) < 70 && Math.abs(player.y + player.h - this.y - this.h) < 28 && player.grounded;
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const rich = gfxSettings.visualMode === 'enhanced', x = this.x - camX, y = this.y;
        ctx.save();
        this.trail.forEach((seal, i) => {
            if (this.seals[i] || this.unlocked) return;
            const px = seal.x - camX + 10, py = seal.y + 10;
            ctx.fillStyle = '#f1c973'; ctx.strokeStyle = '#fff0b7'; ctx.lineWidth = 2;
            if (rich) { ctx.shadowColor = '#f1ce84'; ctx.shadowBlur = 12; }
            ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
            drawPaw(ctx, px, py, '#805442');
        });
        if (x > -150 && x < ctx.canvas.width + 150) {
            ctx.fillStyle = '#9d6a48'; ctx.fillRect(x, y + 20, 88, 46);
            if (rich) { const wood = ctx.createLinearGradient(x, 0, x + 88, 0); wood.addColorStop(0, '#e5b57860'); wood.addColorStop(1, '#4b383560'); ctx.fillStyle = wood; ctx.fillRect(x, y + 20, 88, 46); }
            ctx.strokeStyle = '#704d38'; ctx.lineWidth = 1;
            for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x, y + 28 + k * 10); ctx.lineTo(x + 88, y + 28 + k * 10); ctx.stroke(); }
            ctx.fillStyle = '#3d7e72'; ctx.beginPath(); ctx.moveTo(x - 8, y + 23); ctx.lineTo(x + 44, y - 7); ctx.lineTo(x + 96, y + 23); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#cbd4a1'; ctx.lineWidth = 4; ctx.stroke();
            ctx.fillStyle = this.unlocked ? '#efce89' : '#322e32'; ctx.beginPath(); ctx.roundRect(x + 28, y + 31, 34, 35, [16, 16, 0, 0]); ctx.fill();
            for (let i = 0; i < 3; i++) { ctx.fillStyle = this.seals[i] || this.unlocked ? '#f6d484' : '#5e5745'; ctx.beginPath(); ctx.arc(x + 29 + i * 15, y + 20, 4, 0, Math.PI * 2); ctx.fill(); }
            if (!this.unlocked) { ctx.strokeStyle = '#bea779'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 30, y + 42); ctx.lineTo(x + 60, y + 57); ctx.stroke(); }
            if (this.nearby && this.trail.length) { ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff2c8'; ctx.strokeStyle = '#283f41'; ctx.lineWidth = 3; const text = this.unlocked ? 'E · Enter doghouse' : 'Find the 3 paw seals'; ctx.strokeText(text, x + 44, y - 20); ctx.fillText(text, x + 44, y - 20); }
        }
        ctx.restore();
    }
}

function drawPaw(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y + 4, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    for (const [dx, dy] of [[-6, -2], [-2, -5], [3, -5], [7, -1]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.4, 0, Math.PI * 2); ctx.fill(); }
}

export function addSecretShop(data: LevelData, level: number, height: number, difficulty: Difficulty): SecretDoghouse | null {
    // Each trail branches above existing terrain; the exit and main route stay independent.
    const routes: Record<number, { title: string; shelves: [number, number][] }> = {
        3: { title: 'Canopy hideaway', shelves: [[1990, 350], [2160, 430], [2330, 510]] },
        6: { title: 'Snowdrift hideaway', shelves: [[3170, 280], [3340, 370], [3510, 460]] },
        9: { title: 'Lighthouse hideaway', shelves: [[3020, 480], [3200, 560], [3380, 640]] },
        12: { title: 'Rafter hideaway', shelves: [[1030, 575], [1200, 655], [1370, 735]] },
    };
    const route = routes[level]; if (!route) return null;
    const width = difficulty === Difficulty.EASY ? 120 : 85;
    for (const [i, [x, rise]] of route.shelves.entries()) {
        const shelf = new TownPlatform(x, height - rise, i === 2 ? 140 : width, 18, 'stone');
        shelf.floorY = shelf.y + 32; data.platforms.push(shelf);
    }
    const [x, rise] = route.shelves[2];
    const door = new SecretDoghouse(x + 30, height - rise - 66, route.shelves.map(([sx, sy]) => ({ x: sx + 25, y: height - sy - 34 })), route.title);
    data.props ??= []; data.props.push(door);
    data.worldHeight = Math.max(data.worldHeight ?? height, height, rise + 200);
    return door;
}

export function drawAccessories(ctx: CanvasRenderingContext2D, x: number, y: number, equipped: ReadonlySet<Accessory>) {
    const rich = gfxSettings.visualMode === 'enhanced';
    if (equipped.has('scarf')) {
        ctx.fillStyle = '#f3b940'; ctx.fillRect(x + 23, y + 18, 15, 5);
        ctx.beginPath(); ctx.moveTo(x + 26, y + 20); ctx.lineTo(x + 8, y + 16); ctx.lineTo(x + 7, y + 22); ctx.lineTo(x + 27, y + 25); ctx.fill();
    }
    if (equipped.has('sailor') || equipped.has('chef')) {
        ctx.fillStyle = '#fff8e8'; ctx.fillRect(x + 22, y - 5, 19, 7);
        if (equipped.has('chef')) { for (const dx of [23, 31, 39]) { ctx.beginPath(); ctx.arc(x + dx, y - 10, 7, 0, Math.PI * 2); ctx.fill(); } }
        else { ctx.beginPath(); ctx.ellipse(x + 31, y - 7, 13, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#315b93'; ctx.fillRect(x + 22, y - 2, 19, 3); }
    }
    if (equipped.has('bow')) {
        ctx.fillStyle = '#e77787'; ctx.beginPath(); ctx.moveTo(x + 31, y - 1); ctx.lineTo(x + 20, y - 9); ctx.lineTo(x + 20, y + 2); ctx.lineTo(x + 42, y - 9); ctx.lineTo(x + 42, y + 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffb5aa'; ctx.beginPath(); ctx.arc(x + 31, y - 2, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (equipped.has('coat')) {
        ctx.fillStyle = '#a95170'; ctx.beginPath(); ctx.ellipse(x + 18, y + 25, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#f7dfb5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 5, y + 24); ctx.lineTo(x + 11, y + 28); ctx.lineTo(x + 17, y + 24); ctx.lineTo(x + 23, y + 28); ctx.lineTo(x + 29, y + 24); ctx.stroke();
        if (rich) { ctx.strokeStyle = '#ce819080'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x + 18, y + 25, 12, 7, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    if (equipped.has('collar')) {
        ctx.strokeStyle = '#8854ae'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 23, y + 18); ctx.lineTo(x + 36, y + 19); ctx.stroke();
        ctx.fillStyle = '#bdeaf0'; ctx.beginPath(); ctx.moveTo(x + 29, y + 19); ctx.lineTo(x + 33, y + 23); ctx.lineTo(x + 29, y + 29); ctx.lineTo(x + 26, y + 23); ctx.fill();
    }
    if (equipped.has('hat')) {
        ctx.fillStyle = '#398d8b'; ctx.beginPath(); ctx.arc(x + 31, y + 1, 11, Math.PI, 0); ctx.fill();
        ctx.fillRect(x + 23, y, 24, 4); ctx.fillStyle = '#edcf86'; ctx.fillRect(x + 28, y - 4, 5, 4);
        if (rich) { ctx.strokeStyle = '#94c9b3'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 31, y + 1, 8, Math.PI, Math.PI * 1.6); ctx.stroke(); }
    }
    if (equipped.has('crown')) {
        ctx.fillStyle = '#efbd44';
        if (rich) { const gold = ctx.createLinearGradient(0, y - 14, 0, y + 1); gold.addColorStop(0, '#fff1a1'); gold.addColorStop(.5, '#f5c84e'); gold.addColorStop(1, '#bf791d'); ctx.fillStyle = gold; }
        ctx.strokeStyle = '#95601d'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 23, y); ctx.lineTo(x + 21, y - 12); ctx.lineTo(x + 27, y - 7); ctx.lineTo(x + 31, y - 16); ctx.lineTo(x + 35, y - 7); ctx.lineTo(x + 41, y - 12); ctx.lineTo(x + 39, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffe59a'; ctx.fillRect(x + 23, y - 3, 16, 3);
        ctx.fillStyle = '#d84f83'; ctx.beginPath(); ctx.moveTo(x + 31, y - 9); ctx.lineTo(x + 34, y - 6); ctx.lineTo(x + 31, y - 3); ctx.lineTo(x + 28, y - 6); ctx.closePath(); ctx.fill();
        if (rich) { ctx.fillStyle = '#fff7dd'; ctx.fillRect(x + 30, y - 8, 1.5, 2); }
    }
}
