import { Entity } from './entities/Entity';
import { Player } from './entities/Player';
import { Platform } from './entities/Platform';
import { Exit } from './entities/Exit';
import { gfxSettings } from './GfxSettings';
import type { LevelData } from './levels/types';
import type { Accessory } from './Shop';

export const HOME_LEVEL = 15;
export const HOME_WIDTH = 1500;
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
    constructor(public quest: Quest, floor: number) {
        super(quest.homeX, floor - 40, 40, 40, '#fff');
        this.sprite = new Player(this.x, this.y);
        this.sprite.accessories.add(quest.accessory);
    }
    update(player: Player) {
        this.nearby = Math.abs(player.x - this.x) < 85 && Math.abs(player.y - this.y) < 55;
        this.sprite.facingRight = player.x > this.x;
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        this.sprite.x = this.x; this.sprite.y = this.y;
        this.sprite.draw(ctx, camX, HOME_LEVEL);
        ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#332e38'; ctx.fillText(this.quest.dog, this.x + 20 - camX, this.y - 25);
        if (this.nearby) { ctx.fillStyle = '#fff3cd'; ctx.fillRect(this.x - 58 - camX, this.y - 66, 156, 25); ctx.fillStyle = '#3d423c'; ctx.fillText('E · Talk / fetch quest', this.x + 20 - camX, this.y - 48); }
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

export function getHome(height: number): LevelData {
    const floor = height - 100;
    return { platforms: [new Platform(0, floor, HOME_WIDTH, 100)], enemies: [], collectibles: [], waters: [],
        props: QUESTS.map(q => new HomeDog(q, floor)), exit: new Exit(HOME_WIDTH + 1000, floor - 80), playerStart: { x: 150, y: floor - 40 } };
}

export function drawHome(ctx: CanvasRenderingContext2D, width: number, height: number, camX: number) {
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
    ctx.restore();
}
