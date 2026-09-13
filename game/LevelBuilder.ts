import { Platform } from './entities/Platform';
import { Raccoon } from './entities/Backyard';
import { Collectible } from './entities/Collectible';
import { Exit } from './entities/Exit';
import { Water } from './entities/Water';
import type { LevelData } from './levels/types';

export const CUSTOM_LEVEL = 16;
export const GRID_COLS = 32, GRID_ROWS = 10, TILE_SIZE = 64;
export const TILES = { '.': { name: 'Erase', icon: '·' }, '#': { name: 'Platform', icon: '▰' }, '~': { name: 'Water', icon: '≈' }, R: { name: 'Raccoon', icon: '🦝' }, B: { name: 'Bone', icon: '🦴' }, S: { name: 'Start', icon: '🐾' }, E: { name: 'Exit', icon: '🚪' } } as const;
export type Tile = keyof typeof TILES;
export type LevelDraft = { version: 1; name: string; cells: Tile[] };
const STORAGE_KEY = 'husky-escape:custom-level-v1';

export function starterLevel(): LevelDraft {
    const cells: Tile[] = Array(GRID_COLS * GRID_ROWS).fill('.');
    for (let x = 0; x < GRID_COLS; x++) cells[9 * GRID_COLS + x] = '#';
    cells[8 * GRID_COLS + 1] = 'S'; cells[8 * GRID_COLS + 30] = 'E';
    for (let x = 7; x <= 10; x++) cells[7 * GRID_COLS + x] = '#';
    for (let x = 14; x <= 16; x++) cells[6 * GRID_COLS + x] = '#';
    cells[6 * GRID_COLS + 8] = 'B'; cells[5 * GRID_COLS + 15] = 'B';
    for (let x = 19; x <= 21; x++) cells[9 * GRID_COLS + x] = '~';
    cells[8 * GRID_COLS + 25] = 'R';
    return { version: 1, name: 'My backyard adventure', cells };
}

export function isLevelDraft(value: unknown): value is LevelDraft {
    if (!value || typeof value !== 'object') return false;
    const d = value as LevelDraft;
    return d.version === 1 && typeof d.name === 'string' && d.name.length <= 60 && Array.isArray(d.cells) && d.cells.length === GRID_COLS * GRID_ROWS && d.cells.every(t => typeof t === 'string' && Object.hasOwn(TILES, t));
}

export function loadDraft(): LevelDraft {
    try { const d: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (isLevelDraft(d)) return d; } catch {}
    return starterLevel();
}

export function saveDraft(draft: LevelDraft): boolean {
    if (!isLevelDraft(draft)) return false;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); return true; } catch { return false; }
}

export function validateLevel(draft: LevelDraft): string | null {
    if (!isLevelDraft(draft)) return 'This layout could not be read. Choose the starter layout to begin again.';
    for (const tile of ['S', 'E'] as const) {
        if (draft.cells.filter(t => t === tile).length !== 1) return `Place one ${TILES[tile].name.toLowerCase()} tile.`;
        const at = draft.cells.indexOf(tile);
        if (draft.cells[at + GRID_COLS] !== '#') return `Put a platform directly below the ${TILES[tile].name.toLowerCase()}.`;
    }
    if (draft.cells.some((t, i) => t === 'R' && draft.cells[i + GRID_COLS] !== '#')) return 'Give each raccoon a platform to stand on.';
    return null;
}

export function buildCustomLevel(draft: LevelDraft, height: number): LevelData {
    const error = validateLevel(draft); if (error) throw new Error(error);
    const platforms: Platform[] = [], enemies: Raccoon[] = [], collectibles: Collectible[] = [], waters: Water[] = [];
    const top = height - 100 - (GRID_ROWS - 1) * TILE_SIZE;
    let playerStart = { x: 0, y: 0 }, exit = new Exit(0, 0);
    draft.cells.forEach((tile, i) => {
        const x = i % GRID_COLS * TILE_SIZE, y = top + Math.floor(i / GRID_COLS) * TILE_SIZE;
        if (tile === '#') platforms.push(new Platform(x, y, TILE_SIZE, TILE_SIZE, '#7eaa86'));
        else if (tile === '~') waters.push(new Water(x, y, TILE_SIZE, TILE_SIZE));
        else if (tile === 'R') enemies.push(new Raccoon(x + 6, y + TILE_SIZE, 4, true));
        else if (tile === 'B') collectibles.push(new Collectible(x + 20, y + 22));
        else if (tile === 'S') playerStart = { x: x + 12, y: y + TILE_SIZE - 40 };
        else if (tile === 'E') { exit = new Exit(x + 8, y + 8); exit.w = 48; exit.h = 56; }
    });
    platforms.push(new Platform(-40, top - 100, 40, height - top + 400), new Platform(GRID_COLS * TILE_SIZE, top - 100, 40, height - top + 400));
    return { platforms, enemies, collectibles, waters, exit, playerStart, worldHeight: Math.max(height, GRID_ROWS * TILE_SIZE + 100) };
}
