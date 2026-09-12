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
    public floorY?: number;
    public boarded = false;
    constructor(x: number, y: number, w: number, h: number, public kind: TownPlatformKind, color = '#ad7a53', travel = 0, speed = 0) {
        super(x, y, w, h, x, x + travel, speed);
        this.color = color;
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.x + this.w < camX - 30 || this.x > camX + ctx.canvas.width + 30) return;
        drawTownPlatform(ctx, this.x - camX, this.y, this.w, this.h, this.kind, this.color, performance.now() / 1000, this.floorY, this.boarded);
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
        const x = this.x - camX;
        if (x + this.w < -40 || x > ctx.canvas.width + 40) return;
        ctx.save();
        if (this.collapsed) {
            ctx.fillStyle = '#6c5744'; ctx.fillRect(x + 5, this.y + this.h, 7, (this.floorY ?? this.y + 130) - this.y - this.h);
            ctx.fillRect(x + this.w - 12, this.y + this.h, 7, (this.floorY ?? this.y + 130) - this.y - this.h);
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.moveTo(x + 8, this.y + 25); ctx.lineTo(x + 36, this.y + 83); ctx.lineTo(x + 16, this.y + 112); ctx.closePath(); ctx.fill();
            townLabel(ctx, 'REPAIRING…', x + this.w / 2, this.y - 12);
        } else {
            super.draw(ctx, camX);
            const wear = this.countdown ? 1 - this.countdown / 55 : 0;
            ctx.strokeStyle = '#603f30'; ctx.lineWidth = 2 + wear * 2;
            for (let i = 0; i < 3; i++) {
                const cx = x + this.w * (0.25 + i * 0.25);
                ctx.beginPath(); ctx.moveTo(cx, this.y + 4); ctx.lineTo(cx - 5, this.y + 10); ctx.lineTo(cx + 4, this.y + this.h + wear * 9); ctx.stroke();
            }
            townLabel(ctx, this.countdown ? 'TEARING! JUMP →' : 'FRAYED AWNING', x + this.w / 2, this.y - 12, '#ffe294');
            if (this.countdown) { ctx.fillStyle = '#f5d68c'; ctx.fillRect(x, this.y - 5, this.w * (1 - wear), 3); }
        }
        ctx.restore();
    }

}

export class TownPedestrian extends Enemy {
    public yielding = false;
    private frame = 0;
    private walking = false;
    constructor(x: number, y: number, distance: number, speed = 0.8, public marching = false, color = '#258d91') {
        super(x, y, distance, speed);
        this.w = 38; this.h = 57; this.color = color;
    }
    update(_platforms?: Entity[], player?: Player) {
        this.frame++;
        this.yielding = !!player?.hasBandana && near(this, player, 145);
        this.walking = !this.yielding && (this.marching || (this.frame + this.origX) % 260 >= 55);
        if (!this.walking) {
            this.walkAnim += 0.07;
        } else super.update();
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.x < camX - 70 || this.x > camX + ctx.canvas.width + 70) return;
        drawTownPerson(ctx, this.x - camX, this.y, this.color, this.walking || this.yielding ? this.walkAnim : 0, this.yielding, this.dir);
        if (this.marching) {
            townBox(ctx, this.x - camX + 7, this.y - 6, 25, 6, '#d6aa4e');
            townBox(ctx, this.x - camX + 25, this.y + 27, 16, 17, '#f0d7a1');
        }
        if (this.yielding) { ctx.fillStyle = '#f6d36d'; ctx.font = '16px sans-serif'; ctx.fillText('♥', this.x - camX + 12, this.y - 10); }
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
        const x = this.x - camX, y = this.y;
        if (this.phase === 'warning') {
            townLabel(ctx, this.direction === -1 ? 'RING RING!  ◀ BIKE' : 'RING RING!  BIKE ▶', Math.max(105, Math.min(ctx.canvas.width - 105, x)), y - 38, '#ffe294');
        }
        if (x < -100 || x > ctx.canvas.width + 100) return;
        const rich = gfxSettings.visualMode === 'enhanced';
        const angle = this.phase === 'riding' ? this.x / 13 : 0;
        ctx.save(); ctx.translate(x + 38, y); ctx.scale(-this.direction, 1); ctx.translate(-38, 0);
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        if (rich) { ctx.fillStyle = '#20353a30'; ctx.beginPath(); ctx.ellipse(38, 63, 41, 4, 0, 0, TAU); ctx.fill(); }
        for (const wx of [15, 61]) {
            ctx.strokeStyle = '#233742'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(wx, 48, 13, 0, TAU); ctx.stroke();
            ctx.strokeStyle = rich ? '#c5d0c1' : '#8cacae'; ctx.lineWidth = 1;
            for (let i = 0; i < (rich ? 6 : 3); i++) {
                const a = angle + i * TAU / (rich ? 6 : 3);
                ctx.beginPath(); ctx.moveTo(wx, 48); ctx.lineTo(wx + Math.cos(a) * 11, 48 + Math.sin(a) * 11); ctx.stroke();
            }
            ctx.fillStyle = '#eee0bd'; ctx.beginPath(); ctx.arc(wx, 48, 2, 0, TAU); ctx.fill();
        }
        ctx.strokeStyle = '#e09354'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(15, 48); ctx.lineTo(24, 27); ctx.lineTo(41, 49); ctx.lineTo(53, 29); ctx.lineTo(24, 27); ctx.moveTo(41, 49); ctx.lineTo(61, 48); ctx.lineTo(53, 21); ctx.stroke();
        ctx.strokeStyle = '#384e55'; ctx.beginPath(); ctx.moveTo(24, 27); ctx.lineTo(20, 19); ctx.lineTo(13, 19); ctx.moveTo(48, 25); ctx.lineTo(58, 25); ctx.stroke();
        ctx.strokeStyle = '#304857'; ctx.lineWidth = 5;
        const footX = 41 + Math.cos(angle) * 8, footY = 46 + Math.sin(angle) * 6;
        ctx.beginPath(); ctx.moveTo(44, 24); ctx.lineTo(28, 33); ctx.lineTo(footX, footY); ctx.stroke();
        ctx.strokeStyle = '#243641'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(footX - 3, footY); ctx.lineTo(footX + 5, footY); ctx.stroke();
        ctx.strokeStyle = '#247c85'; ctx.lineWidth = 11;
        ctx.beginPath(); ctx.moveTo(43, 23); ctx.lineTo(31, 8); ctx.stroke();
        if (rich) { ctx.strokeStyle = '#82c7b8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(40, 19); ctx.lineTo(31, 10); ctx.stroke(); }
        ctx.strokeStyle = '#ddb28b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(32, 12); ctx.lineTo(24, 20); ctx.lineTo(17, 19); ctx.stroke();
        ctx.fillStyle = '#d7a87f'; ctx.beginPath(); ctx.arc(28, 3, 8, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e6b84a'; ctx.beginPath(); ctx.arc(28, 1, 10, Math.PI, TAU); ctx.fill(); ctx.fillRect(16, 0, 20, 3);
        ctx.fillStyle = '#243b48'; ctx.fillRect(22, 4, 2, 2);
        townBox(ctx, 54, 12, 21, 19, '#ae7c53');
        ctx.fillStyle = '#e3bf83'; ctx.fillRect(63, 12, 4, 19); ctx.strokeStyle = '#745239'; ctx.lineWidth = 1; ctx.strokeRect(54, 12, 21, 19);
        ctx.fillStyle = '#f5e9c6'; ctx.fillRect(57, 17, 5, 4);
        ctx.fillStyle = '#fbe08f'; ctx.beginPath(); ctx.arc(13, 19, this.phase === 'warning' ? 4 : 2, 0, TAU); ctx.fill();
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
        ctx.save();
        ctx.fillStyle = '#34463830'; ctx.beginPath(); ctx.ellipse(this.x - camX + 14, this.floorY - 2, 12, 3, 0, 0, TAU); ctx.fill();
        ctx.translate(this.x - camX + 14, this.y + 14); ctx.rotate(-this.x / 22);
        ctx.fillStyle = this.color;
        if (gfxSettings.visualMode === 'enhanced') {
            const g = ctx.createRadialGradient(-5, -6, 1, 0, 0, 16); g.addColorStop(0, '#ffc09a'); g.addColorStop(0.5, '#db654d'); g.addColorStop(1, '#983c3f'); ctx.fillStyle = g;
        }
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.bezierCurveTo(-17, -19, -18, 6, -6, 13); ctx.quadraticCurveTo(0, 10, 6, 13); ctx.bezierCurveTo(18, 6, 17, -19, 0, -10); ctx.fill();
        ctx.strokeStyle = '#734d37'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(-2, -13, 2, -14); ctx.stroke();
        ctx.strokeStyle = '#ffd3a690'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-3, -1, 7, Math.PI, Math.PI * 1.4); ctx.stroke();
        ctx.fillStyle = '#5f7744'; ctx.beginPath(); ctx.ellipse(4, -12, 7, 3, -0.5, 0, TAU); ctx.fill(); ctx.restore();
    }
}

export class TownJet extends Entity {
    public frame: number;
    constructor(x: number, public floorY: number, private period: number, public activeFrames: number, offset: number, height = 92) {
        super(x, floorY - height, 34, height, '#64cfe1'); this.frame = offset;
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
        const rich = gfxSettings.visualMode === 'enhanced';
        ctx.save();
        // The recessed grate and pressure dial remain visible between bursts.
        townBox(ctx, x - 6, this.floorY - 8, 46, 8, '#304f5b');
        ctx.strokeStyle = '#a5c1bd'; ctx.lineWidth = 2;
        for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(x + k * 5, this.floorY - 7); ctx.lineTo(x + k * 5, this.floorY - 1); ctx.stroke(); }
        const pressure = this.warning ? this.phase / 55 : this.dangerous ? 1 : 0;
        ctx.fillStyle = '#193d4a'; ctx.beginPath(); ctx.arc(x + 17, this.floorY - 17, 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = this.dangerous ? '#e98560' : this.warning ? '#ffd580' : '#a4dfb1'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x + 17, this.floorY - 17, 6, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0.08, pressure)); ctx.stroke();
        if (this.warning) {
            ctx.save(); ctx.setLineDash([3, 6]); ctx.strokeStyle = '#a66b36b0'; ctx.lineWidth = 1.5;
            ctx.strokeRect(x, this.y, this.w, this.h); ctx.restore();
            townLabel(ctx, 'HISS…', x + 17, this.floorY - 42, '#ffe294');
            ctx.strokeStyle = '#b8edec'; ctx.lineWidth = 1;
            for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + 6 + k * 10, this.floorY - 28); ctx.quadraticCurveTo(x + k * 10 + 14, this.floorY - 32 - pressure * 12, x + 6 + k * 10, this.floorY - 37 - pressure * 12); ctx.stroke(); }
        }
        if (this.dangerous) {
            // Fill the damaging column, with individual streams inside the same bounds.
            const water = ctx.createLinearGradient(x, 0, x + this.w, 0);
            water.addColorStop(0, '#319bcf70'); water.addColorStop(0.5, '#9de9ecdd'); water.addColorStop(1, '#2a9fc988');
            ctx.fillStyle = rich ? water : '#5ac9dfb0'; ctx.fillRect(x, this.y, this.w, this.h);
            for (let k = 0; k < 5; k++) {
                const sx = x + 3 + k * 7;
                ctx.strokeStyle = k % 2 ? '#e2ffffc0' : '#7adfe5'; ctx.lineWidth = rich ? 2.5 : 2;
                ctx.beginPath(); ctx.moveTo(sx, this.floorY - 8);
                ctx.bezierCurveTo(sx + Math.sin(this.frame / 8 + k) * 3, this.y + this.h * 0.65, sx - 2, this.y + this.h * 0.3, sx, this.y + 3); ctx.stroke();
            }
            ctx.fillStyle = '#ddffff';
            for (let k = 0; k < (rich ? 14 : 6); k++) {
                const px = x + 2 + (k * 11 % 30), py = this.y + ((this.frame * 3 + k * 29) % this.h);
                ctx.beginPath(); ctx.ellipse(px, py, 1.5, 3, 0, 0, TAU); ctx.fill();
            }
            ctx.strokeStyle = '#c9f5ef90'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(x + 17, this.floorY - 5, 22, 4, 0, 0, TAU); ctx.stroke();
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
        const x = this.x - camX, y = this.y;
        if (x < -100 || x > ctx.canvas.width + 100) return;
        const rich = gfxSettings.visualMode === 'enhanced';
        ctx.save();
        const charging = this.phase === 'charge', moving = charging || this.phase === 'return';
        const facing = this.phase === 'return' || (charging && this.targetX > this.x) ? -1 : 1;
        townBox(ctx, this.minX - camX, y + 36, this.maxX - this.minX + this.w, 4, charging ? '#e5875a' : '#dab56e');
        for (const end of [this.minX - camX, this.maxX - camX + this.w]) {
            ctx.fillStyle = '#e3cda5'; ctx.fillRect(end, y + 23, 4, 13);
        }
        if (this.phase === 'warning') townLabel(ctx, 'WOOF! GET READY', x + 26, y - 19, '#ffe294');
        ctx.translate(x + 26, y); ctx.scale(facing, 1); ctx.translate(-26, 0);
        if (rich) { ctx.fillStyle = '#233b3a35'; ctx.beginPath(); ctx.ellipse(27, 37, 29, 4, 0, 0, TAU); ctx.fill(); }
        const stride = moving ? Math.sin(this.x / (charging ? 5 : 8)) * 5 : 0;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        // Four jointed legs, shoulder, chest patch, muzzle, and a wagging tail.
        for (const [hip, swing, shade] of [[21, -stride, '#765038'], [41, stride, '#765038'], [16, stride, '#ae794d'], [37, -stride, '#ae794d']] as const) {
            ctx.strokeStyle = shade; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(hip, 22); ctx.lineTo(hip + swing * 0.5, 29); ctx.lineTo(hip + swing - 2, 34); ctx.stroke();
        }
        ctx.strokeStyle = '#b3875c'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(45, 17); ctx.quadraticCurveTo(52, 17, 50, 5 + Math.sin(this.x / 5) * 3); ctx.stroke();
        const fur = ctx.createLinearGradient(0, 7, 0, 29); fur.addColorStop(0, '#c29a70'); fur.addColorStop(1, '#8a583a');
        ctx.fillStyle = rich ? fur : '#ad7a50'; ctx.beginPath(); ctx.ellipse(30, 18, 19, 12, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e5cc9e'; ctx.beginPath(); ctx.ellipse(18, 22, 6, 9, -0.25, 0, TAU); ctx.fill();
        ctx.fillStyle = '#b88b5d'; ctx.beginPath(); ctx.ellipse(13, 12, 11, 12, -0.2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#664633'; ctx.beginPath(); ctx.moveTo(15, 4); ctx.quadraticCurveTo(28, -2, 22, 18); ctx.quadraticCurveTo(16, 16, 15, 4); ctx.fill();
        ctx.fillStyle = '#e0bd8e'; ctx.beginPath(); ctx.ellipse(7, 17, 8, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#253640'; ctx.beginPath(); ctx.arc(2, 15, 3, 0, TAU); ctx.fill(); ctx.fillRect(9, 8, 3, 3);
        ctx.strokeStyle = '#715044'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(3, 20); ctx.lineTo(11, 20); ctx.stroke();
        if (charging || this.phase === 'warning') { ctx.fillStyle = '#dd8d87'; ctx.fillRect(5, 21, 4, 4); }
        ctx.strokeStyle = charging ? '#d36943' : '#3a8790'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, 17); ctx.lineTo(17, 27); ctx.stroke();
        ctx.fillStyle = '#f0d38a'; ctx.beginPath(); ctx.arc(17, 27, 3, 0, TAU); ctx.fill();
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
        ctx.strokeStyle = '#b87936'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + 16, y + 23); ctx.lineTo(x + 29, y + 3); ctx.stroke();
        ctx.fillStyle = '#b65c3d'; ctx.beginPath(); ctx.arc(x + 16, y + 13, 3, 0, TAU); ctx.fill();
        for (const [dx, dy] of [[10, 8], [14, 6], [19, 6], [23, 8]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.8, 0, TAU); ctx.fill(); }
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
            const rich = gfxSettings.visualMode === 'enhanced';
            townBox(ctx, x - 6, y + 26, 442, 12, '#74959b');
            townBox(ctx, x, y, 430, 32, '#a6c5c6');
            townBox(ctx, x + 10, y + 4, 410, 19, '#60b7c8');
            ctx.strokeStyle = '#72989e'; ctx.lineWidth = 1;
            for (let k = 0; k < 12; k++) { ctx.beginPath(); ctx.moveTo(x + k * 37, y + 25); ctx.lineTo(x + k * 37, y + 32); ctx.stroke(); }
            townBox(ctx, x + 180, y - 5, 70, 10, '#819f9f');
            townBox(ctx, x + 199, y - 69, 32, 65, '#b6c5b6');
            ctx.fillStyle = '#dfdfc4'; ctx.fillRect(x + 202, y - 63, 5, 54);
            ctx.fillStyle = '#93b3b2'; ctx.beginPath(); ctx.ellipse(x + 215, y - 72, 54, 13, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = '#dae5ce'; ctx.beginPath(); ctx.ellipse(x + 215, y - 77, 54, 11, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = '#76bec9'; ctx.beginPath(); ctx.ellipse(x + 215, y - 78, 44, 6, 0, 0, TAU); ctx.fill();
            ctx.strokeStyle = '#d6f8eb90'; ctx.lineWidth = rich ? 2 : 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath(); ctx.ellipse(x + 58 + i * 76, y + 13, 20 + Math.sin(this.frame / 20 + i) * 5, 3, 0, 0, TAU); ctx.stroke();
            }
            if (rich) {
                const stone = ctx.createLinearGradient(x + 199, 0, x + 231, 0);
                stone.addColorStop(0, '#ffffff30'); stone.addColorStop(1, '#41696a50');
                ctx.fillStyle = stone; ctx.fillRect(x + 199, y - 63, 32, 58);
            }
        } else if (this.kind === 'cart') {
            ctx.translate(x + 40, y - 8); ctx.rotate(-0.09);
            ctx.strokeStyle = '#87613f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(34, -15); ctx.lineTo(67, -26); ctx.stroke();
            drawTownPlatform(ctx, -40, -31, 80, 25, 'crate', '#ad7a53', 0);
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = i % 2 ? '#d8784c' : '#b54f42'; ctx.beginPath(); ctx.arc(-28 + i * 17, -34, 8, 0, TAU); ctx.fill();
                ctx.strokeStyle = '#59834b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-28 + i * 17, -40); ctx.lineTo(-25 + i * 17, -45); ctx.stroke();
            }
            for (const wheel of [-25, 27]) {
                ctx.fillStyle = '#354953'; ctx.beginPath(); ctx.arc(wheel, 0, 11, 0, TAU); ctx.fill();
                ctx.strokeStyle = '#adbea7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wheel, 0, 7, 0, TAU); ctx.moveTo(wheel - 7, 0); ctx.lineTo(wheel + 7, 0); ctx.moveTo(wheel, -7); ctx.lineTo(wheel, 7); ctx.stroke();
            }
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
