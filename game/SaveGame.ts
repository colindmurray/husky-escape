import { Difficulty, GameState } from '../types';
import { Belongings, SHOP_GOODS, SHOP_COSMETICS, isSupply, type Accessory, type Supply } from './Shop';
import { COMPANIONS, FLOORS, QUESTS, type HomeFloor, type QuestStatus } from './Home';
import type { CutsceneType } from './engine/CutsceneManager';

export const SAVE_SLOTS = 4;
export const saveKey = (slot: number) => `husky-escape:save-v1:${slot}`;
export const saveName = (name: string) => Array.from(name.trim()).slice(0, 20).join('');
export type SavedBelongings = {
    homeUnlocked: boolean; houseIntroSeen: boolean; companions: string[]; familyGifts?: ('maria' | 'belle')[];
    quests: Record<string, QuestStatus>; slots: (Supply | null)[];
    owned: Accessory[]; equipped: Accessory[]; collectedBones: string[];
    unlockedShops: number[]; shopSupplies: Record<number, Supply[]>;
};
export interface SaveGame {
    version: 1; name: string; updatedAt: number; difficulty: Difficulty;
    level: number; homeFloor: HomeFloor; bones: number; belongings: SavedBelongings;
    state: GameState; cutscene: CutsceneType; reason?: string;
}
export type SaveSlot = { game: SaveGame | null; error: string | null };

export function packBelongings(b: Belongings): SavedBelongings {
    return { ...b, companions: [...b.companions], owned: [...b.owned], equipped: [...b.equipped],
        collectedBones: [...b.collectedBones], unlockedShops: [...b.unlockedShops],
        familyGifts: [...(b.familyGifts ?? [])], quests: { ...b.quests }, slots: [...b.slots], shopSupplies: structuredClone(b.shopSupplies) };
}
export function unpackBelongings(b: SavedBelongings): Belongings {
    return Object.assign(new Belongings(), {
        homeUnlocked: b.homeUnlocked, houseIntroSeen: b.houseIntroSeen,
        familyGifts: [...(b.familyGifts ?? [])], quests: { ...b.quests }, slots: [...b.slots], shopSupplies: structuredClone(b.shopSupplies),
        companions: new Set(b.companions), owned: new Set(b.owned), equipped: new Set(b.equipped),
        collectedBones: new Set(b.collectedBones), unlockedShops: new Set(b.unlockedShops),
    });
}

// Browser storage is untrusted: reject an incomplete save instead of overwriting it with defaults.
export function parseSave(raw: string): SaveGame {
    const s = JSON.parse(raw), b = s?.belongings;
    const record = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
    const list = (v: unknown, valid: (x: any) => boolean) => Array.isArray(v) && v.length <= 100000 && v.every(valid);
    const supply = (v: unknown) => typeof v === 'string' && Object.hasOwn(SHOP_GOODS, v) && isSupply(v as Supply);
    const cosmetic = (v: unknown) => typeof v === 'string' && Object.hasOwn(SHOP_GOODS, v) && !supply(v);
    const shop = (v: unknown) => typeof v === 'number' && Object.hasOwn(SHOP_COSMETICS, v);
    const cutscenes: CutsceneType[] = ['intro', 'chase', 'underwater_intro', 'pound_escape', 'pier_intro', 'neon_intro', 'bakery_intro', 'town_intro', 'raccoon_intro', 'homecoming', 'house_chase'];
    if (!record(s) || s.version !== 1 || typeof s.name !== 'string' || !s.name || saveName(s.name) !== s.name ||
        !Number.isFinite(s.updatedAt) || !Object.values(Difficulty).includes(s.difficulty) ||
        !Number.isInteger(s.level) || s.level < 1 || s.level > 15 || !Object.hasOwn(FLOORS, s.homeFloor) ||
        !Number.isSafeInteger(s.bones) || s.bones < 0 || !Object.values(GameState).includes(s.state) || s.state === GameState.INTRO ||
        !cutscenes.includes(s.cutscene) || (s.reason !== undefined && (typeof s.reason !== 'string' || s.reason.length > 200)) ||
        !record(b) || typeof b.homeUnlocked !== 'boolean' || typeof b.houseIntroSeen !== 'boolean' ||
        (s.level === 15 && !b.homeUnlocked) || !list(b.companions, id => COMPANIONS.some(d => d.id === id)) ||
        (b.familyGifts !== undefined && !list(b.familyGifts, id => id === 'maria' || id === 'belle')) ||
        !record(b.quests) || !Object.entries(b.quests).every(([id, status]) => QUESTS.some(q => q.id === id) && ['accepted', 'carrying', 'found', 'complete'].includes(status as string)) ||
        !list(b.slots, v => v === null || supply(v)) || b.slots.length !== 3 ||
        !list(b.owned, cosmetic) || !list(b.equipped, v => cosmetic(v) && b.owned.includes(v)) ||
        !list(b.collectedBones, v => typeof v === 'string' && /^(?:[1-9]|1[0-5]):\d{1,5}$/.test(v)) ||
        !list(b.unlockedShops, shop) || !record(b.shopSupplies) ||
        !Object.entries(b.shopSupplies).every(([level, stock]) => shop(Number(level)) && list(stock, supply) && (stock as unknown[]).length === 3 && new Set(stock as unknown[]).size === 3)) {
        throw Error('This save could not be read. It has been kept untouched.');
    }
    return s as SaveGame;
}
export function readSave(slot: number): SaveSlot {
    try {
        const raw = localStorage.getItem(saveKey(slot));
        return { game: raw === null ? null : parseSave(raw), error: null };
    } catch (error) {
        return { game: null, error: error instanceof SyntaxError ? 'This save could not be read. It has been kept untouched.' : error instanceof Error ? error.message : 'Browser storage is unavailable.' };
    }
}
