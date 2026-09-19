import type { QuestStatus } from './Home';
import { Entity } from './entities/Entity';
import { TownPlatform } from './entities/Town';
import { MovingPlatform } from './entities/MovingPlatform';
import { SkiJump } from './entities/SkiJump';
import { UmbrellaPickup } from './entities/UmbrellaPickup';
import { ConveyorBelt } from './entities/ConveyorBelt';
import { PackagingPress } from './entities/PackagingPress';
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
    book: { name: 'Little storybook', icon: '📖', price: 0, description: 'Maria’s gift: a little leather book satchel, cream pages, and a ribbon bookmark. Read with Maria to unlock it.' },
    spin: { name: 'Spin treat', icon: '🌀', price: 0, description: 'Belle’s gift: 6 seconds of happy twirls that pull nearby bones toward you. Works at home too; hazards still hurt.' },
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
export const SUPPLIES = ['shield', 'magnet', 'time', 'spring', 'sprint', 'feather', 'feast', 'hush', 'leap', 'trailmix', 'spin'] as const;
export type Supply = typeof SUPPLIES[number];
export type Skin = 'cat' | 'fox' | 'goose';
export type Accessory = 'book' | 'hat' | 'crown' | 'coat' | 'collar' | 'scarf' | 'sailor' | 'chef' | 'bow' | Skin;
export const isSkin = (id: ShopGood): id is Skin => id === 'cat' || id === 'fox' || id === 'goose';
export const isSupply = (id: ShopGood): id is Supply => (SUPPLIES as readonly string[]).includes(id);

export const SHOP_COSMETICS: Record<number, Accessory> = { 3: 'goose', 6: 'scarf', 9: 'sailor', 12: 'chef', 15: 'bow' };
export function shopStock(level: number, belongings: Belongings): ShopGood[] {
    if (!Object.hasOwn(SHOP_COSMETICS, level)) return [];
    if (!belongings.shopSupplies[level]) {
        const supplies = SUPPLIES.filter(id => id !== 'spin');
        for (let i = supplies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [supplies[i], supplies[j]] = [supplies[j], supplies[i]];
        }
        belongings.shopSupplies[level] = supplies.slice(0, 3);
    }
    return [SHOP_COSMETICS[level], ...belongings.shopSupplies[level], 'hat', 'crown', 'cat', 'fox', 'coat', 'collar'];
}
export const HEADWEAR: Accessory[] = ['hat', 'crown', 'sailor', 'chef', 'bow'];

export class Belongings {
    public homeUnlocked = false;
    public houseIntroSeen = false;
    public familyGifts: ('maria' | 'belle')[] = [];
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

type EntranceChallenge =
    | { kind: 'canopy'; logs: MovingPlatform[] }
    | { kind: 'ski'; ramp: SkiJump }
    | { kind: 'glide'; launch: TownPlatform; rings: { x: number; y: number }[] }
    | { kind: 'bakery'; belt: ConveyorBelt; presses: PackagingPress[] }
    | { kind: 'home' };

export class SecretDoghouse extends Entity {
    public unlocked = false;
    public nearby = false;
    public progress = 0;
    private rideDistance = 0;
    private airborneRoute = false;
    constructor(x: number, y: number, public title: string, public challenge: EntranceChallenge) {
        super(x, y, 88, 66, '#ae7950');
    }
    public get hint() {
        switch (this.challenge.kind) {
            case 'canopy': return 'Ride both marked logs, then land here';
            case 'ski': return 'Take the flagged ski jump and land here';
            case 'glide': return 'Glide through both wind rings, then land here';
            case 'bakery': return 'Follow the belt beneath both presses';
            case 'home': return 'Help Samwise with the kitchen biscuits';
        }
    }
    update(player?: Player) {
        if (!player) return;
        this.nearby = Math.abs(player.x + player.w / 2 - this.x - this.w / 2) < 70 && Math.abs(player.y + player.h - this.y - this.h) < 28 && player.grounded;
        if (this.unlocked) return;
        const route = this.challenge, previous = this.progress;
        if (route.kind === 'canopy') {
            const log = route.logs[this.progress];
            this.rideDistance = log && player.standingOn === log ? this.rideDistance + Math.abs(log.dx) : 0;
            if (this.rideDistance >= 48) { this.progress++; this.rideDistance = 0; }
            this.unlocked = this.nearby && this.progress === route.logs.length;
        } else if (route.kind === 'ski') {
            if (player.launchedFrom === route.ramp) this.airborneRoute = true;
            if (player.grounded) {
                this.unlocked = this.nearby && this.airborneRoute;
                this.airborneRoute = false;
            }
        } else if (route.kind === 'glide') {
            if (player.standingOn === route.launch) { this.airborneRoute = true; this.progress = 0; }
            else if (player.grounded) {
                this.unlocked = this.nearby && this.airborneRoute && this.progress === route.rings.length;
                this.airborneRoute = false;
                if (!this.unlocked) this.progress = 0;
            }
            const ring = route.rings[this.progress];
            if (this.airborneRoute && player.isGliding && ring && Math.abs(player.x + 20 - ring.x) < 44 && Math.abs(player.y + 20 - ring.y) < 65) this.progress++;
        } else if (route.kind === 'bakery') {
            const press = route.presses[this.progress];
            if (press && player.standingOn === route.belt && Math.abs(player.x + 20 - press.x - press.w / 2) < 26 && !press.isLethal()) this.progress++;
            this.unlocked = this.nearby && this.progress === route.presses.length;
        }
        if (this.unlocked || this.progress > previous) audioManager.playSFX(this.unlocked ? SoundType.WIN_SHORT : SoundType.COLLECT);
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const rich = gfxSettings.visualMode === 'enhanced', x = this.x - camX, y = this.y;
        ctx.save();
        const route = this.challenge;
        const marker = (px: number, py: number, done: boolean, symbol = 'paw', stem = 20) => {
            ctx.fillStyle = '#8a6745'; ctx.fillRect(px - 2, py + 9, 4, stem);
            ctx.fillStyle = done || this.unlocked ? '#f6d484' : '#b5c7bd';
            ctx.strokeStyle = '#344d4b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            if (symbol === 'paw') drawPaw(ctx, px, py, '#53624d');
            else { ctx.fillStyle = '#3e5753'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(symbol, px, py + 6); }
        };
        if (route.kind === 'canopy') route.logs.forEach((log, i) => marker(log.x + log.w / 2 - camX, log.y - 28, this.progress > i));
        if (route.kind === 'ski') marker(route.ramp.x - 40 - camX, route.ramp.y - 40, this.airborneRoute, '↗', 71);
        if (route.kind === 'glide') {
            marker(route.launch.x + 30 - camX, route.launch.y - 28, this.airborneRoute, '☂');
            route.rings.forEach((ring, i) => {
                ctx.strokeStyle = this.progress > i || this.unlocked ? '#f6d484' : '#b5e3eb'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.ellipse(ring.x - camX, ring.y, 29, 49, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#d4eff222'; ctx.fill();
                ctx.fillStyle = '#e9faff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('→', ring.x - camX, ring.y + 8);
            });
        }
        if (route.kind === 'bakery') route.presses.forEach((press, i) => marker(press.x + press.w / 2 - camX, route.belt.y - 222, this.progress > i));
        if (x > -150 && x < ctx.canvas.width + 150) {
            ctx.fillStyle = '#9d6a48'; ctx.fillRect(x, y + 20, 88, 46);
            if (rich) { const wood = ctx.createLinearGradient(x, 0, x + 88, 0); wood.addColorStop(0, '#e5b57860'); wood.addColorStop(1, '#4b383560'); ctx.fillStyle = wood; ctx.fillRect(x, y + 20, 88, 46); }
            ctx.strokeStyle = '#704d38'; ctx.lineWidth = 1;
            for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x, y + 28 + k * 10); ctx.lineTo(x + 88, y + 28 + k * 10); ctx.stroke(); }
            ctx.fillStyle = '#3d7e72'; ctx.beginPath(); ctx.moveTo(x - 8, y + 23); ctx.lineTo(x + 44, y - 7); ctx.lineTo(x + 96, y + 23); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#cbd4a1'; ctx.lineWidth = 4; ctx.stroke();
            ctx.fillStyle = this.unlocked ? '#efce89' : '#322e32'; ctx.beginPath(); ctx.roundRect(x + 28, y + 31, 34, 35, [16, 16, 0, 0]); ctx.fill();
            drawPaw(ctx, x + 44, y + 12, this.unlocked ? '#f6d484' : '#a6b6a1');
            if (!this.unlocked) { ctx.strokeStyle = '#bea779'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 30, y + 42); ctx.lineTo(x + 60, y + 57); ctx.stroke(); }
            if (this.nearby && route.kind !== 'home') { ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff2c8'; ctx.strokeStyle = '#283f41'; ctx.lineWidth = 3; const text = this.unlocked ? 'E · Enter doghouse' : this.hint; ctx.strokeText(text, x + 44, y - 20); ctx.fillText(text, x + 44, y - 20); }
        }
        ctx.restore();
    }
}

function drawPaw(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y + 4, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    for (const [dx, dy] of [[-6, -2], [-2, -5], [3, -5], [7, -1]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.4, 0, Math.PI * 2); ctx.fill(); }
}

export function addSecretShop(data: LevelData, level: number, height: number, difficulty: Difficulty): SecretDoghouse | null {
    const easy = difficulty === Difficulty.EASY;
    const landing = (x: number, rise: number, width: number) => {
        const shelf = new TownPlatform(x, height - rise, width, 18, 'stone');
        shelf.floorY = shelf.y + 32; data.platforms.push(shelf); return shelf;
    };
    let shelf: TownPlatform, title: string, challenge: EntranceChallenge;
    if (level === 3) {
        const logs = [
            new MovingPlatform(2150, height - 470, easy ? 140 : 110, 22, 2150, 2330, easy ? 1 : 1.2),
            new MovingPlatform(2420, height - 580, easy ? 140 : 110, 22, 2380, 2570, easy ? 1 : 1.2),
        ];
        data.platforms.push(...logs); shelf = landing(2700, 690, easy ? 190 : 150);
        title = 'Canopy hideaway'; challenge = { kind: 'canopy', logs };
    } else if (level === 6) {
        landing(3000, 300, 290);
        const ramp = new SkiJump(3200, height - 340, 20); data.platforms.push(ramp);
        shelf = landing(3880, 850, easy ? 230 : 180);
        title = 'Snowdrift hideaway'; challenge = { kind: 'ski', ramp };
    } else if (level === 9) {
        const launch = landing(3220, 650, easy ? 190 : 160);
        data.platforms.push(new UmbrellaPickup(launch.x + 110, launch.y - 35));
        shelf = landing(4000, 390, easy ? 210 : 170);
        title = 'Lighthouse hideaway'; challenge = { kind: 'glide', launch, rings: [{ x: 3570, y: height - 790 }, { x: 3830, y: height - 620 }] };
    } else if (level === 12) {
        landing(20, 230, 120);
        const belt = new ConveyorBelt(190, height - 360, 500, 22, easy ? -0.8 : -1.2);
        const presses = [new PackagingPress(290, belt.y, !easy), new PackagingPress(510, belt.y, !easy)];
        data.platforms.push(belt); data.enemies.push(...presses); shelf = landing(690, 360, 130);
        title = 'Rafter hideaway'; challenge = { kind: 'bakery', belt, presses };
    } else return null;
    const door = new SecretDoghouse(shelf.x + (shelf.w - 88) / 2, shelf.y - 66, title, challenge);
    data.props ??= []; data.props.push(door);
    data.worldHeight = Math.max(data.worldHeight ?? height, height, level === 9 ? 1320 : level === 6 ? 1210 : level === 12 ? 1120 : 1020);
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
    if (equipped.has('book')) {
        ctx.strokeStyle = '#73513c'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x + 12, y + 13); ctx.lineTo(x + 24, y + 28); ctx.stroke();
        ctx.fillStyle = '#4a746c'; ctx.beginPath(); ctx.roundRect(x + 10, y + 23, 19, 15, 2); ctx.fill();
        ctx.fillStyle = '#eee0b7'; ctx.fillRect(x + 13, y + 25, 16, 10);
        ctx.strokeStyle = '#c4ad83'; ctx.lineWidth = .7;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 15, y + 27 + i * 3); ctx.lineTo(x + 27, y + 27 + i * 3); ctx.stroke(); }
        ctx.fillStyle = '#396158'; ctx.fillRect(x + 10, y + 23, 4, 15);
        ctx.fillStyle = '#c56968'; ctx.beginPath(); ctx.moveTo(x + 24, y + 24); ctx.lineTo(x + 27, y + 24); ctx.lineTo(x + 27, y + 41); ctx.lineTo(x + 25.5, y + 39); ctx.lineTo(x + 24, y + 41); ctx.fill();
        if (rich) { ctx.strokeStyle = '#e5c385'; ctx.lineWidth = .7; ctx.strokeRect(x + 11, y + 24, 17, 13); }
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
