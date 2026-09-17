import { Entity } from './Entity';
import { Enemy } from './Enemy';
import { Platform } from './Platform';
import type { Player } from './Player';
import type { Exit } from './Exit';
import { BossWall } from './BossWall';
import { drawTownPlatform } from '../engine/TownArt';
import { drawRaccoon, drawTopHat, drawTrashCan } from '../engine/BackyardArt';
import { gfxSettings } from '../GfxSettings';
import { audioManager } from '../Audio';
import { Difficulty, SoundType } from '../../types';

export class BackyardGate extends BossWall {
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        drawTownPlatform(ctx, this.x - camX, this.y, this.w, this.h, 'fence', '#bd966c', 0);
    }
}

export class BackyardGround extends Platform {
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        if (x + this.w < 0 || x > ctx.canvas.width) return;
        ctx.fillStyle = '#69503e'; ctx.fillRect(x, this.y, this.w, this.h);
        ctx.fillStyle = '#547d4d'; ctx.fillRect(x, this.y, this.w, 14);
        ctx.fillStyle = '#98b866'; ctx.fillRect(x, this.y, this.w, 4);
        if (gfxSettings.visualMode === 'enhanced') for (let k = Math.max(0, Math.floor(-x / 24) * 24); k < Math.min(this.w, ctx.canvas.width - x); k += 24) {
            ctx.strokeStyle = '#7eaa59'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + k, this.y + 3); ctx.lineTo(x + k + 3, this.y - 5); ctx.lineTo(x + k + 6, this.y + 3); ctx.stroke();
            ctx.fillStyle = '#bc997650'; ctx.fillRect(x + k + 8, this.y + 27 + k % 37, 5, 3);
        }
    }
}

export class BackyardProp extends Entity {
    constructor(x: number, y: number, public kind: 'bin' | 'flowers' | 'home') { super(x, y, 80, 80, '#708a65'); }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        if (x < -220 || x > ctx.canvas.width + 60) return;
        if (this.kind === 'bin') { drawTrashCan(ctx, x, this.y - 70, 50, 70); return; }
        ctx.save();
        if (this.kind === 'home') {
            ctx.fillStyle = '#e6bf8f'; ctx.fillRect(x, this.y - 170, 170, 170);
            ctx.fillStyle = '#715267'; ctx.beginPath(); ctx.moveTo(x - 15, this.y - 170); ctx.lineTo(x + 85, this.y - 235); ctx.lineTo(x + 185, this.y - 170); ctx.fill();
            ctx.fillStyle = '#765748'; ctx.fillRect(x + 55, this.y - 95, 60, 95); ctx.fillStyle = '#ffe6a4'; ctx.fillRect(x + 66, this.y - 82, 38, 48);
            ctx.fillStyle = '#f8e2b5'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('HOME', x + 85, this.y - 122);
        } else {
            ctx.fillStyle = '#ad7657'; ctx.fillRect(x, this.y - 20, 76, 20);
            for (let k = 9; k < 76; k += 18) { ctx.strokeStyle = '#427152'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + k, this.y - 18); ctx.lineTo(x + k, this.y - 45 - k % 11); ctx.stroke(); ctx.fillStyle = k % 3 ? '#e4b0bf' : '#f5d488'; ctx.beginPath(); ctx.arc(x + k, this.y - 45 - k % 11, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#a87843'; ctx.beginPath(); ctx.arc(x + k, this.y - 45 - k % 11, 2, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.restore();
    }
}

export class Raccoon extends Enemy {
    public warningFrames = 0;
    private cooldown = 110;
    private floorY: number;
    constructor(x: number, floor: number, patrol: number, public hard: boolean) {
        super(x, floor - 38, patrol, hard ? 2.15 : 1.6); this.w = 52; this.h = 38; this.floorY = floor;
    }
    update(_platforms?: Entity[], player?: Player) {
        if (this.markedForDeletion) return;
        this.walkAnim += .14;
        if (this.warningFrames > 0) {
            if (--this.warningFrames === 0) { this.velY = -5.8; audioManager.playSFX(SoundType.RACCOON_CHATTER); }
            return;
        }
        this.x += this.speed * this.dir;
        if (this.x < this.origX - this.patrolDist || this.x > this.origX + this.patrolDist) { this.x = Math.max(this.origX - this.patrolDist, Math.min(this.origX + this.patrolDist, this.x)); this.dir *= -1; }
        this.velY += .3; this.y = Math.min(this.floorY - this.h, this.y + this.velY);
        if (this.y === this.floorY - this.h) this.velY = 0;
        if (this.cooldown > 0) this.cooldown--;
        if (this.hard && this.cooldown === 0 && player && Math.abs(player.x - this.x) < 170 && Math.abs(player.y - this.y) < 100 && this.velY === 0) {
            this.dir = player.x < this.x ? -1 : 1; this.warningFrames = 35; this.cooldown = 180;
        }
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.markedForDeletion || this.x + this.w < camX - 50 || this.x > camX + ctx.canvas.width + 50) return;
        drawRaccoon(ctx, this.x - camX, this.y, this.w, this.h, this.walkAnim, this.dir);
        if (this.warningFrames) { ctx.save(); ctx.fillStyle = '#ffcc75'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('!', this.x - camX + 20, this.y - 12); ctx.restore(); }
    }
}

export class TrashLid extends Entity {
    public age = 0;
    constructor(x: number, y: number, vx: number, private floor: number) { super(x, y, 28, 18, '#a8b8b7'); this.velX = vx; this.velY = -7; }
    update() { this.age++; this.x += this.velX; this.velY += .24; this.y += this.velY; if (this.y + this.h >= this.floor || this.age > 150) this.markedForDeletion = true; }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.markedForDeletion) return;
        ctx.save(); ctx.translate(this.x - camX + 14, this.y + 9); ctx.rotate(this.age * .14); ctx.fillStyle = this.color; ctx.strokeStyle = '#435e68'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.strokeRect(-4, -4, 8, 5); ctx.restore();
    }
}

export class BossRaccoon extends Enemy {
    public state: 'dormant' | 'windup' | 'charge' | 'stunned' | 'recover' = 'dormant';
    public timer = 0;
    public health: number;
    public maxHealth: number;
    public introPlayed = false;
    public hard: boolean;
    public readonly arenaLeft = 3400;
    public readonly minX = 3540;
    public readonly maxX = 4400;
    constructor(floor: number, private exit: Exit, private walls: BossWall[], difficulty: Difficulty) {
        super(4210, floor - 104, 0, 0); this.w = 112; this.h = 104;
        this.hard = difficulty !== Difficulty.EASY; this.maxHealth = this.hard ? 5 : 4; this.health = this.maxHealth;
    }
    get isActive() { return this.state !== 'dormant' && this.health > 0; }
    get isStunned() { return this.state === 'stunned'; }
    activate() {
        this.introPlayed = true; this.state = 'windup'; this.timer = 0; this.dir = -1;
        this.walls.forEach(w => w.activate()); this.exit.lock(); audioManager.playMusic(SoundType.THEME_BOSS_RACCOON);
    }
    update(_platforms?: Entity[], player?: Player, enemies?: Entity[]) {
        if (!this.isActive || !player) return;
        this.timer++; this.walkAnim += .12;
        if (this.state === 'windup') {
            if (this.timer === 1) {
                // Face into the arena at either end; camping beyond a wall cannot bait instant crashes.
                this.dir = this.x <= this.minX ? 1 : this.x >= this.maxX ? -1 : player.x + player.w / 2 < this.x + this.w / 2 ? -1 : 1;
                audioManager.playSFX(SoundType.RACCOON_CHATTER);
                if (enemies) for (const speed of (this.hard ? [3, 4.8, 6] : [3])) enemies.push(new TrashLid(this.x + this.w / 2, this.y + 12, this.dir * speed, this.y + this.h));
            }
            if (this.timer >= (this.hard ? 55 : 75)) { this.state = 'charge'; this.timer = 0; }
        } else if (this.state === 'charge') {
            this.x += this.dir * (this.hard ? 7.5 : 5.5);
            if (this.x <= this.minX || this.x >= this.maxX) {
                this.x = Math.max(this.minX, Math.min(this.maxX, this.x)); this.state = 'stunned'; this.timer = 0;
                audioManager.playSFX(SoundType.CRASH);
            }
        } else if (this.state === 'stunned' && this.timer >= (this.hard ? 210 : 230)) {
            this.state = 'recover'; this.timer = 0;
        } else if (this.state === 'recover' && this.timer >= (this.hard ? 50 : 65)) { this.state = 'windup'; this.timer = 0; }
    }
    takeHit(enemies: Entity[]) {
        if (!this.isStunned || this.health <= 0) return false;
        this.health--; this.state = 'recover'; this.timer = 0; audioManager.playSFX(SoundType.BOSS_HIT);
        if (this.health === 0) {
            this.markedForDeletion = true; this.exit.unlock(); this.walls.forEach(w => w.deactivate());
            enemies.forEach(e => { if (e instanceof TrashLid) e.markedForDeletion = true; });
            audioManager.playSFX(SoundType.BOSS_DEATH); audioManager.playMusic(SoundType.THEME_BACKYARD);
        }
        return true;
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.markedForDeletion) return;
        const x = this.x - camX;
        if (!this.introPlayed) { drawTrashCan(ctx, x, this.y + 24, 86, 80); return; }
        drawRaccoon(ctx, x, this.y, this.w, this.h, this.walkAnim, this.dir, !this.isStunned, this.isStunned);
        if (this.isStunned) { ctx.save(); ctx.translate(x + this.w + 18, this.y + 95); ctx.rotate(.5); drawTopHat(ctx, 0, 0, 35); ctx.restore(); }
        if (this.state === 'windup') {
            ctx.save(); ctx.strokeStyle = '#f6bd6c'; ctx.fillStyle = '#f6bd6c'; ctx.lineWidth = 3;
            const start = x + this.w / 2, end = start + this.dir * 85, y = this.y + this.h + 2;
            ctx.beginPath(); ctx.moveTo(start, y); ctx.lineTo(end, y); ctx.lineTo(end - this.dir * 12, y - 7); ctx.moveTo(end, y); ctx.lineTo(end - this.dir * 12, y + 7); ctx.stroke();
            ctx.font = 'bold 24px sans-serif'; ctx.fillText('!', x + 45, this.y - 46); ctx.restore();
        }
    }
}
