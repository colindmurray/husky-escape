// Runs in an isolated print document, never in the live game.
import { World } from '../engine/World';
import { Renderer } from '../engine/Renderer';
import { audioManager } from '../Audio';
import { gfxSettings } from '../GfxSettings';
import { BossRaccoon } from '../entities/Backyard';
import { HOME_WIDTH, QUESTS } from '../Home';
import { isLevelDraft, validateLevel } from '../LevelBuilder';
import type { Difficulty } from '../../types';
import type { HomeFloor } from '../Home';

type Rect = { x: number; y: number; width: number; height: number };
type CaptureOptions = { level: number; difficulty: Difficulty; graphics: 'classic' | 'enhanced'; height: number; scale: number; seed: number; floor: HomeFloor; quests: boolean; draft?: unknown };
let color: HTMLCanvasElement, worksheet: HTMLCanvasElement, bounds: Rect, scale = 1;

function random(seed: number) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n; return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
function canvas(width: number, height: number) {
    const c = document.createElement('canvas'); c.width = width; c.height = height; return c;
}

function renderLevel(options: CaptureOptions) {
    Math.random = random(options.seed);
    audioManager.setMusic(false); audioManager.setSFX(false); gfxSettings.visualMode = options.graphics;
    const world = new World(1280, options.height, { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() {}, onGameOver() {}, onGameWon() {} });
    world.loadLevel(1, false, options.difficulty);
    world.belongings.homeUnlocked = true; world.homeFloor = options.floor;
    if (options.quests) for (const quest of QUESTS) world.belongings.quests[quest.id] = 'accepted';
    if (options.level === 16) {
        if (!isLevelDraft(options.draft) || validateLevel(options.draft)) throw Error('Supply a valid saved custom layout with --draft file.json for level 16.');
        world.editorDraft = options.draft;
    }
    world.loadLevel(options.level, true, options.difficulty);
    // Show the actual raccoon artwork without requiring a playthrough of the reveal.
    world.enemies.forEach(e => { if (e instanceof BossRaccoon) e.activate(); });
    const entities = [...world.platforms, ...world.props, ...world.enemies, ...world.waters, ...world.collectibles, ...(world.isHome ? [] : [world.exit!]), world.player!];
    const content = entities.filter(e => !(e.w <= 60 && e.h >= options.height * .75)); // Outer containment walls extend beyond the playable ceiling.
    const minY = world.isHome ? 0 : Math.floor(Math.min(0, options.height - Reflect.get(world, 'worldHeight'), ...content.map(e => e.y - 64)));
    const maxX = world.isHome ? HOME_WIDTH : Math.ceil(Math.max(...entities.map(e => e.x + e.w)) + 64);
    bounds = { x: 0, y: minY, width: maxX, height: options.height - minY };
    scale = options.scale;
    if (bounds.width * bounds.height * scale * scale > 80_000_000 || bounds.width * scale > 32000 || bounds.height * scale > 32000) throw Error('This export is too large for one canvas. Reduce --scale or --height.');
    color = canvas(bounds.width * scale, bounds.height * scale);
    worksheet = canvas(color.width, color.height);
    const scene = color.getContext('2d')!, paper = worksheet.getContext('2d')!;
    scene.scale(scale, scale); paper.scale(scale, scale);
    paper.fillStyle = '#fff'; paper.fillRect(0, 0, bounds.width, bounds.height);
    // Reuse the renderer for a panoramic backdrop; foreground stays at authored world coordinates.
    const backdrop = canvas(bounds.width, bounds.height);
    const backgroundOnly = Object.assign(Object.create(world), { width: bounds.width, height: bounds.height, cameraX: 0, cameraY: 0, player: null, platforms: [], props: [], enemies: [], waters: [], collectibles: [], exit: null, companions: [] });
    new Renderer(backdrop).drawGame(backgroundOnly);
    scene.drawImage(backdrop, 0, 0);
    const drawObjects = (ctx: CanvasRenderingContext2D) => {
        ctx.save(); ctx.translate(0, -bounds.y);
        world.props.forEach(p => p.draw(ctx, 0));
        if (!world.isHome) world.platforms.forEach(p => p.draw(ctx, 0, world.currentLevel));
        world.waters.forEach(w => {
            ctx.save(); if (world.isCustom) { ctx.beginPath(); ctx.rect(w.x, w.y - 5, w.w, w.h + 5); ctx.clip(); }
            w.draw(ctx, 0); ctx.restore();
        });
        if (!world.isHome) world.exit?.draw(ctx, 0);
        world.collectibles.forEach(c => c.draw(ctx, 0)); world.enemies.forEach(e => e.draw(ctx, 0));
        world.player?.draw(ctx, 0, world.currentLevel); ctx.restore();
    };
    drawObjects(scene);
    if (world.isHome) { paper.globalAlpha = .22; paper.drawImage(backdrop, 0, 0); paper.globalAlpha = 1; }
    paper.globalAlpha = .64; drawObjects(paper); paper.globalAlpha = 1;
    paper.strokeStyle = '#9aa8b02e'; paper.lineWidth = 1;
    for (let x = 0; x < bounds.width; x += 100) { paper.beginPath(); paper.moveTo(x, 0); paper.lineTo(x, bounds.height); paper.stroke(); }
    for (let y = Math.ceil(bounds.y / 100) * 100; y < options.height; y += 100) { paper.beginPath(); paper.moveTo(0, y - bounds.y); paper.lineTo(bounds.width, y - bounds.y); paper.stroke(); }
    return { bounds, entities: entities.map(e => ({ type: e.constructor.name, x: e.x, y: e.y, width: e.w, height: e.h })), start: { x: world.player!.x, y: world.player!.y }, exit: world.isHome ? null : { x: world.exit!.x, y: world.exit!.y } };
}

export function capture(rect: Rect, kind: 'color' | 'worksheet', tiles: (Rect & { id: string })[] = []) {
    const image = canvas(Math.round(rect.width * scale), Math.round(rect.height * scale));
    const ctx = image.getContext('2d')!;
    ctx.drawImage(kind === 'color' ? color : worksheet, (rect.x - bounds.x) * scale, (rect.y - bounds.y) * scale, rect.width * scale, rect.height * scale, 0, 0, image.width, image.height);
    ctx.scale(scale, scale);
    const fontSize = Math.max(18, rect.width / 95);
    ctx.font = `bold ${fontSize}px Arial`; ctx.lineWidth = Math.max(2, rect.width / 1600);
    for (const tile of tiles) {
        const x = tile.x - rect.x, y = tile.y - rect.y;
        ctx.strokeStyle = '#3c716dcc'; ctx.strokeRect(x + 2, y + 2, tile.width - 4, tile.height - 4);
        ctx.fillStyle = '#fff'; ctx.fillRect(x + 5, y + 5, ctx.measureText(tile.id).width + 16, fontSize + 12);
        ctx.fillStyle = '#294c50'; ctx.fillText(tile.id, x + 13, y + fontSize + 8);
    }
    return image.toDataURL('image/png').split(',')[1];
}

export function prepare(options: CaptureOptions) {
    const originalRandom = Math.random, originalNow = Date.now;
    try { Date.now = () => 1700000000000; return renderLevel(options); }
    finally { Math.random = originalRandom; Date.now = originalNow; }
}

