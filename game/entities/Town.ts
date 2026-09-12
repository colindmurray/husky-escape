import { Entity } from './Entity';
import { Enemy } from './Enemy';
import { MovingPlatform } from './MovingPlatform';
import type { Player } from './Player';
import { SoundType } from '../../types';
import { audioManager } from '../Audio';
import { gfxSettings } from '../GfxSettings';
import { drawTownPerson, drawTownPlatform, townBox, townColors, townLabel, type TownPlatformKind } from '../engine/TownArt';

const TAU = Math.PI * 2;
const near = (a: Entity, b: Entity, distance: number) => Math.abs(a.x - b.x) < distance && Math.abs(a.y - b.y) < 250;

export class TownPlatform extends MovingPlatform {
    constructor(x: number, y: number, w: number, h: number, public kind: TownPlatformKind, color = '#ad7a53', travel = 0, speed = 0) {
        super(x, y, w, h, x, x + travel, speed);
        this.color = color;
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.x + this.w < camX - 30 || this.x > camX + ctx.canvas.width + 30) return;
        drawTownPlatform(ctx, this.x - camX, this.y, this.w, this.h, this.kind, this.color, performance.now() / 1000);
    }
}

export class CollapsingAwning extends TownPlatform {
    public countdown = 0;
    public collapsed = false;
    private resetFrames = 0;
    constructor(x: number, y: number, w: number, color: string) {
        super(x, y, w, 22, 'awning', color);
    }
    stepOn() {
        if (this.countdown === 0 && !this.collapsed) this.countdown = 55;
    }
    update() {
        if (this.collapsed) {
            if (--this.resetFrames <= 0) this.collapsed = false;
        } else if (this.countdown > 0 && --this.countdown === 0) {
            this.collapsed = true; this.resetFrames = 180;
        }
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.collapsed) return;
        super.draw(ctx, camX);
        if (this.countdown > 0) townLabel(ctx, 'TEARING! JUMP →', this.x - camX + this.w / 2, this.y - 12, '#ffe294');
        else townLabel(ctx, 'FRAYED AWNING', this.x - camX + this.w / 2, this.y - 12, '#ffe294');
        ctx.strokeStyle = '#684536'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(this.x - camX + this.w / 2, this.y); ctx.lineTo(this.x - camX + this.w / 2 - 7, this.y + 12); ctx.lineTo(this.x - camX + this.w / 2 + 5, this.y + 22); ctx.stroke();
    }
}

export class TownPedestrian extends Enemy {
    public yielding = false;
    private frame = 0;
    constructor(x: number, y: number, distance: number, speed = 0.8, public marching = false, color = '#258d91') {
        super(x, y, distance, speed);
        this.w = 38; this.h = 57; this.color = color;
    }
    update(_platforms?: Entity[], player?: Player) {
        this.frame++;
        this.yielding = !!player?.hasBandana && near(this, player, 145);
        if (this.yielding || (!this.marching && (this.frame + this.origX) % 260 < 55)) {
            this.walkAnim += 0.07;
        } else super.update();
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.x < camX - 70 || this.x > camX + ctx.canvas.width + 70) return;
        drawTownPerson(ctx, this.x - camX, this.y, this.color, this.walkAnim, this.yielding);
        if (this.marching) {
            townBox(ctx, this.x - camX + 7, this.y - 6, 25, 6, '#d6aa4e');
            townBox(ctx, this.x - camX + 25, this.y + 27, 16, 17, '#f0d7a1');
        }
        if (this.yielding) townLabel(ctx, 'GOOD DOG!', this.x - camX + 19, this.y - 18);
    }
}

export class TownCyclist extends Entity {
    public phase: 'waiting' | 'warning' | 'riding' = 'waiting';
    private timer = 0;
    constructor(public minX: number, public maxX: number, y: number, public speed: number, public warningFrames: number, public direction: -1 | 1 = -1) {
        super(direction === -1 ? maxX : minX, y, 76, 62, '#d96252');
    }
    get dangerous() { return this.phase === 'riding'; }
    update(_platforms?: Entity[], player?: Player) {
        if (!player) return;
        if (this.phase === 'waiting') {
            if (this.timer > 0) { this.timer--; return; }
            // Never spawn a new rider on top of someone waiting at the delivery door.
            const inLane = player.x > this.minX - 120 && player.x < this.maxX + 120;
            const ahead = this.direction === -1 ? player.x < this.maxX - 160 : player.x > this.minX + 160;
            if (inLane && ahead) {
                this.phase = 'warning'; this.timer = this.warningFrames;
                audioManager.playSFX(SoundType.BIKE_BELL);
            }
        } else if (this.phase === 'warning') {
            if (--this.timer <= 0) this.phase = 'riding';
        } else {
            this.x += this.speed * this.direction;
            if (this.x < this.minX - this.w || this.x > this.maxX + this.w) {
                this.x = this.direction === -1 ? this.maxX : this.minX;
                this.phase = 'waiting'; this.timer = 150;
            }
        }
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        if (this.phase === 'warning') {
            townLabel(ctx, this.direction === -1 ? 'RING RING!  ◀ BIKE' : 'RING RING!  BIKE ▶', Math.max(105, Math.min(ctx.canvas.width - 105, x)), this.y - 38, '#ffe294');
        }
        if (x < -100 || x > ctx.canvas.width + 100) return;
        ctx.save();
        if (this.direction === 1) { ctx.translate(x * 2 + this.w, 0); ctx.scale(-1, 1); }
        if (this.phase === 'waiting') ctx.globalAlpha = 0.55;
        const rich = gfxSettings.visualMode === 'enhanced';
        ctx.strokeStyle = '#2f444e'; ctx.lineWidth = rich ? 4 : 3;
        for (const wx of [15, 61]) {
            ctx.beginPath(); ctx.arc(x + wx, this.y + 48, 14, 0, TAU); ctx.stroke();
            if (rich) {
                const angle = this.x / 14;
                ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + wx - Math.cos(angle) * 12, this.y + 48 - Math.sin(angle) * 12); ctx.lineTo(x + wx + Math.cos(angle) * 12, this.y + 48 + Math.sin(angle) * 12); ctx.stroke(); ctx.lineWidth = 4;
            }
        }
        ctx.strokeStyle = '#ce6a4f'; ctx.beginPath(); ctx.moveTo(x + 15, this.y + 48); ctx.lineTo(x + 29, this.y + 23); ctx.lineTo(x + 45, this.y + 48); ctx.closePath(); ctx.lineTo(x + 61, this.y + 48); ctx.lineTo(x + 51, this.y + 20); ctx.stroke();
        townBox(ctx, x + 27, this.y + 4, 23, 20, '#258d91');
        ctx.fillStyle = '#d9a980'; ctx.beginPath(); ctx.arc(x + 31, this.y, 10, 0, TAU); ctx.fill();
        townBox(ctx, x + 20, this.y - 9, 24, 7, '#edb64a');
        townBox(ctx, x + 53, this.y + 12, 22, 16, '#c89764');
        ctx.restore();
    }
}

export class RollingApple extends Entity {
    private frame: number;
    public active = false;
    constructor(public startX: number, public endX: number, public floorY: number, private speed: number, private period: number, delay: number) {
        super(startX, floorY - 28, 28, 28, '#ce5844'); this.frame = -delay;
    }
    update() {
        this.frame++;
        const phase = ((this.frame % this.period) + this.period) % this.period;
        this.active = this.frame >= 0 && phase >= 60 && (phase - 60) * this.speed < this.startX - this.endX;
        this.x = this.startX - Math.max(0, phase - 60) * this.speed;
        this.y = this.floorY - this.h - Math.abs(Math.sin((phase - 60) / 15)) * 22;
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const phase = ((this.frame % this.period) + this.period) % this.period;
        if (this.frame >= 0 && phase < 60 && this.startX > camX && this.startX < camX + ctx.canvas.width) {
            townLabel(ctx, 'LOOSE APPLES! ◀', this.startX - camX, this.floorY - 85, '#ffe294');
        }
        if (!this.active || this.x < camX - 40 || this.x > camX + ctx.canvas.width + 40) return;
        ctx.save(); ctx.translate(this.x - camX + 14, this.y + 14); ctx.rotate(-this.x / 22);
        ctx.fillStyle = this.color;
        if (gfxSettings.visualMode === 'enhanced') {
            const g = ctx.createRadialGradient(-5, -6, 1, 0, 0, 16); g.addColorStop(0, '#ffc09a'); g.addColorStop(0.5, '#db654d'); g.addColorStop(1, '#983c3f'); ctx.fillStyle = g;
        }
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5f7744'; ctx.beginPath(); ctx.ellipse(4, -12, 7, 3, -0.5, 0, TAU); ctx.fill(); ctx.restore();
    }
}

export class TownJet extends Entity {
    public frame: number;
    constructor(x: number, public floorY: number, private period: number, public activeFrames: number, offset: number) {
        super(x, floorY - 92, 34, 92, '#64cfe1'); this.frame = offset;
    }
    get phase() { return this.frame % this.period; }
    get warning() { return this.phase < 55; }
    get dangerous() { return this.phase >= 55 && this.phase < 55 + this.activeFrames; }
    update(_platforms?: Entity[], player?: Player) {
        this.frame++;
        if ((this.phase === 1 || this.phase === 55) && player && near(this, player, 450)) audioManager.playSFX(SoundType.WATER_JET);
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        if (x < -80 || x > ctx.canvas.width + 80) return;
        townBox(ctx, x - 5, this.floorY - 8, 44, 8, '#456d6d');
        if (this.warning) townLabel(ctx, 'PSST…', x + 17, this.floorY - 35, '#ffe294');
        if (!this.dangerous) return;
        ctx.save();
        ctx.fillStyle = '#58c6dfaa'; ctx.fillRect(x, this.y, this.w, this.h);
        ctx.strokeStyle = '#e4ffff'; ctx.lineWidth = gfxSettings.visualMode === 'enhanced' ? 3 : 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.moveTo(x + 8 + i * 5, this.floorY); ctx.quadraticCurveTo(x + 5 + i * 8, this.y - 20, x + 2 + i * 9, this.y + 8); ctx.stroke();
        }
        if (gfxSettings.visualMode === 'enhanced') {
            ctx.fillStyle = '#e6ffffaa';
            for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(x - 8 + i * 7, this.y + ((this.frame * 3 + i * 17) % this.h), 2, 0, TAU); ctx.fill(); }
        }
        ctx.restore();
    }
}

export class YardDog extends Entity {
    public phase: 'rest' | 'warning' | 'charge' | 'return' = 'rest';
    private timer = 0;
    private targetX: number;
    constructor(public minX: number, public maxX: number, y: number, private speed: number, private warningFrames: number) {
        super(maxX, y, 52, 36, '#95643f'); this.targetX = maxX;
    }
    get dangerous() { return this.phase === 'charge'; }
    update(_platforms?: Entity[], player?: Player) {
        if (!player) return;
        if (this.phase === 'rest') {
            if (this.timer > 0) { this.timer--; return; }
            if (player.x > this.minX - 60 && player.x < this.maxX + 80 && near(this, player, 330)) {
                this.phase = 'warning'; this.timer = this.warningFrames;
                this.targetX = Math.max(this.minX, Math.min(this.maxX, player.x));
                audioManager.playSFX(SoundType.DOG_BARK);
            }
        } else if (this.phase === 'warning') {
            if (--this.timer <= 0) this.phase = 'charge';
        } else if (this.phase === 'charge') {
            this.x += Math.sign(this.targetX - this.x) * Math.min(this.speed, Math.abs(this.targetX - this.x));
            if (Math.abs(this.targetX - this.x) < 1) this.phase = 'return';
        } else {
            this.x = Math.min(this.maxX, this.x + 1.2);
            if (this.x >= this.maxX) { this.phase = 'rest'; this.timer = 120; }
        }
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        if (x < -100 || x > ctx.canvas.width + 100) return;
        ctx.save();
        const rich = gfxSettings.visualMode === 'enhanced';
        townBox(ctx, this.minX - camX, this.y + 36, this.maxX - this.minX + this.w, 4, '#dca958');
        const stride = this.phase === 'charge' || this.phase === 'return' ? Math.sin(this.x / 9) * 4 : 0;
        townBox(ctx, x + 13, this.y + 7, 36, 23, this.color);
        townBox(ctx, x + 12 + stride, this.y + 25, 7, 11, '#614632');
        townBox(ctx, x + 39 - stride, this.y + 25, 7, 11, '#614632');
        ctx.fillStyle = rich ? '#b4875f' : '#95643f'; ctx.beginPath(); ctx.arc(x + 12, this.y + 12, 12, 0, TAU); ctx.fill();
        ctx.fillStyle = '#523b2f'; ctx.beginPath(); ctx.moveTo(x + 7, this.y + 5); ctx.lineTo(x + 16, this.y - 5); ctx.lineTo(x + 20, this.y + 13); ctx.fill();
        ctx.fillStyle = '#243d49'; ctx.fillRect(x, this.y + 13, 5, 5); ctx.fillRect(x + 8, this.y + 8, 3, 3);
        townBox(ctx, x + 21, this.y + 8, 5, 20, '#e4af46');
        if (this.phase === 'warning') townLabel(ctx, 'WOOF!  ◀', x + 20, this.y - 22, '#ffe294');
        ctx.restore();
    }
}

export class BandanaPickup extends Entity {
    constructor(x: number, y: number) { super(x, y, 32, 30, '#eebc4e'); }
    update(player?: Player) {
        if (!player || this.markedForDeletion) return;
        if (player.x < this.x + this.w && player.x + player.w > this.x && player.y < this.y + this.h && player.y + player.h > this.y) {
            player.hasBandana = true;
            this.markedForDeletion = true;
            audioManager.playSFX(SoundType.COLLECT);
        }
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.markedForDeletion) return;
        const x = this.x - camX, y = this.y + Math.sin(performance.now() / 250) * 4;
        ctx.save();
        if (gfxSettings.visualMode === 'enhanced') { ctx.shadowColor = '#fff1a3'; ctx.shadowBlur = 18; }
        ctx.fillStyle = '#ffd268'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 32, y); ctx.lineTo(x + 16, y + 27); ctx.fill();
        ctx.fillStyle = '#b65c3d'; ctx.beginPath(); ctx.arc(x + 16, y + 9, 4, 0, TAU); ctx.fill();
        ctx.restore();
        townLabel(ctx, 'GOOD DOG BANDANA', x + 16, y - 15);
    }
}

export class TownScenery extends Entity {
    private flutter = 0;
    private frame = 0;
    constructor(x: number, y: number, public kind: 'sign' | 'pigeon' | 'neighbor' | 'fountain' | 'cart' | 'garden' | 'gate', public text = '') {
        super(x, y, 100, 60, '#557b67');
    }
    update(player?: Player) {
        this.frame++;
        if (this.kind === 'pigeon' && player && near(this, player, 110)) this.flutter = 100;
        else if (this.flutter > 0) this.flutter--;
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX, y = this.y;
        if (x < -500 || x > ctx.canvas.width + 300) return;
        ctx.save();
        if (this.kind === 'sign') {
            townLabel(ctx, this.text, x, y);
            ctx.fillStyle = '#796451'; ctx.fillRect(x - 3, y + 8, 6, 26);
        } else if (this.kind === 'neighbor') {
            drawTownPerson(ctx, x, y - 57, '#8272ab', this.frame / 15, true);
        } else if (this.kind === 'pigeon') {
            const lift = Math.sin(this.flutter / 100 * Math.PI / 2) * 80;
            ctx.translate(x + lift * 0.7, y - lift);
            ctx.fillStyle = '#758f9c'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = '#567b78'; ctx.beginPath(); ctx.arc(9, -7, 6, 0, TAU); ctx.fill();
            ctx.fillStyle = '#dca05a'; ctx.fillRect(13, -8, 6, 3);
            if (this.flutter > 0) { ctx.strokeStyle = '#506c7d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(-15, -15 + Math.sin(this.frame) * 12); ctx.stroke(); }
        } else if (this.kind === 'fountain') {
            townBox(ctx, x, y, 430, 36, '#a6c5c6');
            townBox(ctx, x + 10, y + 4, 410, 19, '#60b7c8');
            townBox(ctx, x + 190, y - 75, 50, 78, '#becfbc');
            ctx.fillStyle = '#d8e1ca'; ctx.beginPath(); ctx.ellipse(x + 215, y - 74, 54, 12, 0, 0, TAU); ctx.fill();
            if (gfxSettings.visualMode === 'enhanced') {
                ctx.strokeStyle = '#efffffc0'; ctx.lineWidth = 2;
                for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x + 58 + i * 76, y + 13, 20 + Math.sin(this.frame / 20 + i) * 5, 3, 0, 0, TAU); ctx.stroke(); }
            }
        } else if (this.kind === 'cart') {
            drawTownPlatform(ctx, x, y - 35, 80, 25, 'crate', '#ad7a53', 0);
            for (let i = 0; i < 4; i++) { ctx.fillStyle = '#cf604c'; ctx.beginPath(); ctx.arc(x + 12 + i * 17, y - 38, 8, 0, TAU); ctx.fill(); }
            ctx.fillStyle = '#354953'; ctx.beginPath(); ctx.arc(x + 15, y, 11, 0, TAU); ctx.arc(x + 67, y, 11, 0, TAU); ctx.fill();
        } else if (this.kind === 'garden') {
            ctx.fillStyle = '#77a16c'; ctx.fillRect(x, y - 14, 320, 20);
            for (let i = 0; i < 12; i++) {
                ctx.strokeStyle = '#e6d6ad'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + i * 28, y); ctx.lineTo(x + i * 28, y - 58); ctx.stroke();
                ctx.fillStyle = townColors[i % 4]; ctx.beginPath(); ctx.arc(x + i * 28, y - 12, 5, 0, TAU); ctx.fill();
            }
            ctx.strokeStyle = '#e6d6ad'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - 37); ctx.lineTo(x + 320, y - 37); ctx.stroke();
        } else if (this.kind === 'gate') {
            townBox(ctx, x - 10, y - 195, 16, 195, '#f0dfb8'); townBox(ctx, x + 145, y - 195, 16, 195, '#f0dfb8');
            townLabel(ctx, 'HOME SWEET HOME →', x + 75, y - 180);
        }
        ctx.restore();
    }
}
