import { Collectible, Exit, Water } from '../entities/index';
import { TownPlatform, TownTimedHazard } from '../entities/Town';
import { BackyardGate, BackyardGround, BackyardProp, BossRaccoon, Raccoon } from '../entities/Backyard';
import { Difficulty } from '../../types';
import type { LevelData } from './types';

export function getLevel14(height: number, difficulty: Difficulty): LevelData {
    const hard = difficulty !== Difficulty.EASY, floor = height - 100;
    const platforms: LevelData['platforms'] = [new BackyardGround(-50, -800, 50, height + 800), new BackyardGround(4920, -800, 50, height + 800)];
    const lawns = hard ? [[0, 1400], [2110, 290], [3120, 1800]] : [[0, 4920]];
    for (const [x, width] of lawns) platforms.push(new BackyardGround(x, floor, width, 120));
    // Broad fence tops teach the climb before the flooded Hard route.
    const fences = hard
        ? [[420, 90, 105], [730, 165, 90], [1040, 95, 95], [1270, 145, 85], [1460, 175, 80], [1670, 235, 80], [1900, 165, 90], [2160, 100, 110], [2410, 155, 80], [2630, 215, 80], [2860, 150, 80], [3060, 80, 100]]
        : [[420, 85, 135], [790, 145, 130], [1140, 90, 125], [1520, 130, 140], [1870, 185, 135], [2210, 120, 145], [2530, 170, 140], [2870, 95, 130]];
    for (const [i, [x, rise, width]] of fences.entries()) {
        const moving = hard && (i === 5 || i === 8 || i === 9);
        const fence = new TownPlatform(x, floor - rise, width, rise, 'fence', '#bd966c', moving ? 80 : 0, moving ? 1.05 : 0);
        fence.floorY = floor; platforms.push(fence);
    }
    // Landing shelves at both charge endpoints leave room to dodge and counterattack.
    for (const x of [3460, 3920, 4470]) { const fence = new TownPlatform(x, floor - 85, hard ? 90 : 135, 85, 'fence'); fence.floorY = floor; platforms.push(fence); }
    const walls = [new BackyardGate(3400, floor + 10, 620), new BackyardGate(4570, floor + 10, 620)]; platforms.push(...walls);
    const exit = new Exit(4780, floor - 80); exit.lock();
    const enemies: LevelData['enemies'] = [];
    for (const [i, x] of (hard ? [640, 985, 1210, 2340, 3210] : [660, 1320, 1750, 2420, 3020]).entries()) {
        enemies.push(new TownTimedHazard(x, floor, hard ? 235 : 280, hard ? 125 : 110, i * 83, hard ? 225 : 185, 'hydrant'));
    }
    for (const [x, patrol] of (hard ? [[310, 80], [865, 95], [1170, 70], [2260, 75], [3250, 65]] : [[880, 100], [1240, 65], [1660, 100], [2310, 110], [2790, 100], [3140, 65]])) enemies.push(new Raccoon(x, floor, patrol, hard));
    if (!hard) enemies.push(new Raccoon(1900, floor - 185, 15, false));
    if (hard) for (const [x, rise, patrol] of [[750, 165, 10], [1920, 165, 10], [2875, 150, 10]]) enemies.push(new Raccoon(x, floor - rise, patrol, true));
    enemies.push(new BossRaccoon(floor, exit, walls, difficulty));
    const props = [new BackyardProp(190, floor, 'flowers'), new BackyardProp(1010, floor, 'bin'), new BackyardProp(2330, floor, 'flowers'), new BackyardProp(3340, floor, 'bin'), new BackyardProp(4690, floor, 'home')];
    const collectibles = [new Collectible(260, floor - 65), ...fences.map(([x, rise, width]) => new Collectible(x + width / 2 - 10, floor - rise - 45)), new Collectible(3300, floor - 60), new Collectible(4660, floor - 65)];
    return { platforms, enemies, props, collectibles, waters: hard ? [new Water(1400, floor + 8, 710, 130), new Water(2400, floor + 8, 720, 130)] : [], exit, playerStart: { x: 80, y: floor - 40 }, worldHeight: Math.max(height, 650) };
}
