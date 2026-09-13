import { Entity } from './entities/Entity';
import { Player } from './entities/Player';
import { Platform } from './entities/Platform';
import { Exit } from './entities/Exit';
import { gfxSettings } from './GfxSettings';
import type { LevelData } from './levels/types';
import type { Accessory } from './Shop';

export const HOME_LEVEL = 15;
export const HOME_WIDTH = 1500;
export type HomeFloor = 'ground' | 'basement' | 'upstairs';
export const FLOORS: Record<HomeFloor, string> = { ground: 'Ground floor · Quests & shop', basement: 'Basement · Training & building', upstairs: 'Second floor · Companions' };
export const COMPANIONS = [
    { id: 'opal', dog: 'Opal', homeX: 380, accessory: 'collar' as Accessory, greeting: 'A little sparkle makes every journey brighter. Shall we look for your friends’ lost treasures together?' },
    { id: 'ruby', dog: 'Ruby', homeX: 690, accessory: 'coat' as Accessory, greeting: 'Adventure? Count me in! I’ll follow your jumps and stay close, even when the trail gets tricky.' },
    { id: 'samwise', dog: 'Samwise', homeX: 990, accessory: 'hat' as Accessory, greeting: 'There’s always room for one more friend on a long walk. I’ll come with you, Onyx. All the way home.' },
] as const;
export const QUESTS = [
    { id: 'ball', dog: 'Pippin', item: 'red ball', level: 5, x: 3540, rise: 282, homeX: 380, accessory: 'hat' as Accessory, reward: 12, icon: '🔴', hint: 'On the long ledge after the second icy crossing.', request: 'Good dog, Onyx! I lost my red ball in the mountains. Will you find it in level 5?', thanks: 'My ball! Fetch is back on! These bones are for you.' },
    { id: 'shell', dog: 'Pearl', item: 'pink shell', level: 4, x: 1165, rise: 332, homeX: 690, accessory: 'collar' as Accessory, reward: 10, icon: '🐚', hint: 'On the first high sandy ledge, past the umbrella.', request: 'Welcome home, good dog! I left my favorite pink shell at the beach in level 4. Could you bring it back?', thanks: 'Listen… you can hear the sea! Thank you, Onyx. Take these bones.' },
    { id: 'toy', dog: 'Biscuit', item: 'squeaky duck', level: 1, x: 1168, rise: 282, homeX: 990, accessory: 'coat' as Accessory, reward: 8, icon: '🦆', hint: 'On the small raised platform beyond the first gap.', request: 'Good dog! You made it home! My squeaky duck is still in the pound, in level 1. One last rescue?', thanks: 'Squeak! You rescued my best little friend. Here are your bones!' },
] as const;
export type QuestStatus = 'accepted' | 'found' | 'complete';
export type Quest = typeof QUESTS[number];

export class HomeDog extends Entity {
    public nearby = false;
    private sprite: Player;
    public following = false;
    constructor(public quest: { id: string; dog: string; homeX: number; accessory: Accessory }, floor: number) {
        super(quest.homeX, floor - 40, 40, 40, '#fff');
        this.sprite = new Player(this.x, this.y);
        this.sprite.accessories.add(quest.accessory);
    }
    update(player: Player) {
        this.nearby = Math.abs(player.x - this.x) < 85 && Math.abs(player.y - this.y) < 55;
        this.sprite.facingRight = player.x > this.x;
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        this.sprite.x = this.x; this.sprite.y = this.y; this.sprite.velX = this.velX; this.sprite.grounded = this.following ? this.grounded : true;
        this.sprite.draw(ctx, camX, HOME_LEVEL);
        ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 14px sans-serif';
        if (this.following) { ctx.fillStyle = '#263b48df'; ctx.fillRect(this.x - 15 - camX, this.y - 42, 70, 23); }
        ctx.fillStyle = this.following ? '#fff3cc' : '#332e38'; ctx.fillText(this.quest.dog, this.x + 20 - camX, this.y - 25);
        if (this.nearby) { ctx.fillStyle = '#fff3cd'; ctx.fillRect(this.x - 58 - camX, this.y - 66, 156, 25); ctx.fillStyle = '#3d423c'; ctx.fillText(COMPANIONS.some(c => c.id === this.quest.id) ? 'E · Talk / join party' : 'E · Talk / fetch quest', this.x + 20 - camX, this.y - 48); }
        ctx.restore();
    }
}

export class QuestPickup extends Entity {
    constructor(public quest: Quest, height: number) { super(quest.x, height - quest.rise, 28, 28, '#f46269'); }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.markedForDeletion) return;
        const x = this.x - camX, y = this.y + Math.sin(performance.now() / 250) * 3;
        ctx.save(); ctx.translate(x, y);
        if (gfxSettings.visualMode === 'enhanced') { ctx.shadowColor = '#ffe4a0'; ctx.shadowBlur = 18; }
        ctx.strokeStyle = '#fff5ce'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(14, 14, 23, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
        if (this.quest.id === 'ball') {
            ctx.fillStyle = '#e84c59'; ctx.beginPath(); ctx.arc(14, 14, 13, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ffafb1'; ctx.beginPath(); ctx.arc(7, 14, 12, -1.2, 1.2); ctx.stroke();
            ctx.fillStyle = '#fff4de'; ctx.beginPath(); ctx.arc(10, 8, 3, 0, Math.PI * 2); ctx.fill();
        } else if (this.quest.id === 'shell') {
            ctx.fillStyle = '#f2a4c2'; ctx.beginPath(); ctx.arc(14, 13, 14, Math.PI, 0); ctx.lineTo(19, 27); ctx.lineTo(9, 27); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#bd617f'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(14, 26); ctx.lineTo(3 + i * 5.5, 7 - Math.sin(i / 4 * Math.PI) * 5); ctx.stroke(); }
        } else {
            ctx.fillStyle = '#ffdb63'; ctx.beginPath(); ctx.ellipse(13, 20, 13, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(20, 8, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#e88642'; ctx.fillRect(24, 9, 8, 4); ctx.fillStyle = '#353349'; ctx.fillRect(20, 5, 3, 3);
        }
        ctx.restore();
    }
}

export function getHome(height: number, room: HomeFloor = 'ground'): LevelData {
    const floor = height - 100;
    return { platforms: [new Platform(0, floor, HOME_WIDTH, 100)], enemies: [], collectibles: [], waters: [],
        props: (room === 'ground' ? QUESTS : room === 'upstairs' ? COMPANIONS : []).map(q => new HomeDog(q, floor)), exit: new Exit(HOME_WIDTH + 1000, floor - 80), playerStart: { x: 150, y: floor - 40 } };
}

export function drawHome(ctx: CanvasRenderingContext2D, width: number, height: number, camX: number, room: HomeFloor = 'ground') {
    if (room !== 'ground') { drawOtherFloor(ctx, width, height, camX, room); return; }
    const rich = gfxSettings.visualMode === 'enhanced', floor = height - 100;
    ctx.save();
    ctx.fillStyle = '#e4ceb1'; ctx.fillRect(0, 0, width, height);
    if (rich) { const light = ctx.createLinearGradient(0, 0, 0, floor); light.addColorStop(0, '#fff1d4'); light.addColorStop(1, '#ba987b'); ctx.fillStyle = light; ctx.fillRect(0, 0, width, floor); }
    ctx.translate(-camX, 0);
    ctx.fillStyle = '#819788'; ctx.fillRect(0, floor - 65, HOME_WIDTH, 65);
    ctx.strokeStyle = '#647c70'; ctx.lineWidth = 2;
    for (let x = 0; x < HOME_WIDTH; x += 40) ctx.strokeRect(x, floor - 59, 32, 53);
    ctx.fillStyle = '#9b6c4f'; ctx.fillRect(0, floor, HOME_WIDTH, 100);
    ctx.strokeStyle = '#765640';
    for (let y = floor + 5; y < height; y += 23) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(HOME_WIDTH, y); ctx.stroke(); for (let x = (y % 2) * 65; x < HOME_WIDTH; x += 140) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 23); ctx.stroke(); } }
    // The furniture sits behind the walking lane, so conversations never block travel.
    for (const x of [450, 850]) {
        const y = floor - 275;
        ctx.fillStyle = '#866245'; ctx.fillRect(x - 9, y - 9, 150, 152);
        ctx.fillStyle = '#a1cdd2'; ctx.fillRect(x, y, 132, 134);
        ctx.fillStyle = '#708d64'; ctx.beginPath(); ctx.ellipse(x + 65, y + 126, 78, 46, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#f8e9c9'; ctx.fillRect(x + 63, y, 6, 134); ctx.fillRect(x, y + 62, 132, 6);
        ctx.fillStyle = '#bc7580'; ctx.fillRect(x - 22, y - 10, 26, 150); ctx.fillRect(x + 128, y - 10, 26, 150);
        if (rich) { ctx.fillStyle = '#ffe5a11c'; ctx.beginPath(); ctx.moveTo(x, y + 134); ctx.lineTo(x + 132, y + 134); ctx.lineTo(x + 235, floor); ctx.lineTo(x - 35, floor); ctx.fill(); }
    }
    ctx.fillStyle = '#487d75'; ctx.beginPath(); ctx.roundRect(520, floor - 92, 300, 87, 19); ctx.fill();
    ctx.fillStyle = '#65968a'; ctx.beginPath(); ctx.roundRect(540, floor - 73, 120, 63, 13); ctx.roundRect(667, floor - 73, 130, 63, 13); ctx.fill();
    ctx.fillStyle = '#edc486'; ctx.beginPath(); ctx.roundRect(558, floor - 71, 46, 38, 8); ctx.fill();
    for (const q of QUESTS) {
        ctx.fillStyle = q.id === 'ball' ? '#6f9fa0' : q.id === 'shell' ? '#c2869b' : '#c79d60';
        ctx.beginPath(); ctx.ellipse(q.homeX + 20, floor - 1, 73, 17, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff0c7'; ctx.stroke();
    }
    ctx.fillStyle = '#86644d'; ctx.beginPath(); ctx.roundRect(65, floor - 195, 98, 195, [46, 46, 0, 0]); ctx.fill();
    ctx.fillStyle = '#b69667'; ctx.fillRect(75, floor - 100, 78, 87); ctx.fillStyle = '#edc779'; ctx.beginPath(); ctx.arc(146, floor - 91, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f8e5b9'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ALL LEVELS', 114, floor - 117);
    ctx.fillStyle = '#564535'; ctx.font = 'bold 21px Georgia'; ctx.fillText('HOME, SWEET HOME', 735, Math.max(140, floor - 320));
    ctx.font = 'bold 15px sans-serif'; ctx.fillText('JUNIPER’S SHOP →', 1300, floor - 100);
    drawStairs(ctx, floor);
    ctx.restore();
}

function drawStairs(ctx: CanvasRenderingContext2D, floor: number) {
    ctx.save(); ctx.fillStyle = '#71586d';
    for (let i = 0; i < 5; i++) ctx.fillRect(1070 + i * 22, floor - (i + 1) * 20, 24, (i + 1) * 20);
    ctx.strokeStyle = '#e4cf9f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1070, floor - 37); ctx.lineTo(1185, floor - 140); ctx.stroke();
    ctx.fillStyle = '#fff0cb'; ctx.fillRect(1055, floor - 178, 150, 29); ctx.fillStyle = '#423b49'; ctx.textAlign = 'center'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('E · Change floor', 1130, floor - 158); ctx.restore();
}

function drawOtherFloor(ctx: CanvasRenderingContext2D, width: number, height: number, camX: number, room: HomeFloor) {
    const floor = height - 100, basement = room === 'basement', rich = gfxSettings.visualMode === 'enhanced';
    ctx.save(); ctx.fillStyle = basement ? '#4c5964' : '#d7d1e8'; ctx.fillRect(0, 0, width, height);
    if (rich) { const light = ctx.createLinearGradient(0, 0, 0, floor); light.addColorStop(0, basement ? '#24343f' : '#f6eafa'); light.addColorStop(1, basement ? '#708483' : '#9d9cbe'); ctx.fillStyle = light; ctx.fillRect(0, 0, width, floor); }
    ctx.translate(-camX, 0); ctx.fillStyle = basement ? '#384b49' : '#95718d'; ctx.fillRect(0, floor, Math.max(HOME_WIDTH, width), 100);
    ctx.strokeStyle = basement ? '#91b1a755' : '#e1bbcb'; ctx.lineWidth = 2;
    for (let x = 0; x < HOME_WIDTH; x += 80) ctx.strokeRect(x, floor + 5, 80, 90);
    ctx.textAlign = 'center'; ctx.font = 'bold 27px Georgia'; ctx.fillStyle = basement ? '#ffedb9' : '#514764';
    ctx.fillText(basement ? 'THE TRAINING DEN' : 'THE COMPANION LOFT', 720, Math.max(170, floor - 310));
    if (basement) {
        ctx.strokeStyle = '#b0b5a04d'; for (let y = floor - 280; y < floor; y += 40) for (let x = (y % 80) * 2; x < HOME_WIDTH; x += 100) ctx.strokeRect(x, y, 100, 40);
        ctx.fillStyle = '#253c35'; ctx.fillRect(330, floor - 230, 245, 150); ctx.strokeStyle = '#c79b5b'; ctx.lineWidth = 8; ctx.strokeRect(330, floor - 230, 245, 150);
        ctx.fillStyle = '#cce3ba'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('HARDCORE PRACTICE', 452, floor - 190); ctx.font = '15px sans-serif'; ctx.fillText('Jump · Dodge · Try again', 452, floor - 151); ctx.fillText('E · Choose a level', 452, floor - 112);
        ctx.fillStyle = '#c49968'; ctx.fillRect(750, floor - 75, 215, 17); ctx.fillRect(765, floor - 58, 17, 58); ctx.fillRect(933, floor - 58, 17, 58);
        ctx.fillStyle = '#40799b'; ctx.fillRect(766, floor - 163, 179, 85); ctx.strokeStyle = '#aed6e0'; ctx.lineWidth = 1;
        for (let x = 770; x < 945; x += 18) for (let y = floor - 159; y < floor - 79; y += 18) ctx.strokeRect(x, y, 18, 18);
        ctx.fillStyle = '#f2cd75'; ctx.fillRect(790, floor - 117, 36, 18); ctx.fillRect(862, floor - 135, 36, 18);
        ctx.fillStyle = '#fff1cb'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('E · Build your own level', 855, floor - 183);
        ctx.fillStyle = '#c78068'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(160 + i * 50, floor); ctx.lineTo(178 + i * 50, floor - 38); ctx.lineTo(196 + i * 50, floor); ctx.fill(); ctx.fillStyle = '#f4dfb8'; ctx.fillRect(172 + i * 50, floor - 19, 12, 5); ctx.fillStyle = '#c78068'; ctx.fillRect(157 + i * 50, floor - 5, 42, 5); }
    } else {
        ctx.fillStyle = '#565b86'; ctx.beginPath(); ctx.arc(720, floor - 215, 72, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#f4dba6'; ctx.lineWidth = 7; ctx.stroke();
        ctx.fillStyle = '#f9dfb0'; for (const [x, y] of [[680, -245], [740, -256], [755, -211]]) { ctx.beginPath(); ctx.arc(x, floor + y, 4, 0, Math.PI * 2); ctx.fill(); }
        for (const [i, dog] of COMPANIONS.entries()) {
            ctx.fillStyle = ['#6faba6', '#b65f77', '#b59867'][i]; ctx.beginPath(); ctx.ellipse(dog.homeX + 20, floor, 85, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffe6c3'; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = '#8b6a64'; ctx.fillRect(dog.homeX - 51, floor - 165, 142, 80); ctx.fillStyle = '#eadabe'; ctx.fillRect(dog.homeX - 44, floor - 158, 128, 66); ctx.fillStyle = '#665872'; ctx.font = 'bold 18px Georgia'; ctx.fillText(dog.dog, dog.homeX + 20, floor - 129); ctx.font = '13px sans-serif'; ctx.fillText('Adventure buddy', dog.homeX + 20, floor - 108);
        }
    }
    drawStairs(ctx, floor); ctx.restore();
}
