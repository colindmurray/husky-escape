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
        ? [[420, 90, 120], [730, 165, 105], [1040, 95, 110], [1270, 145, 100], [1460, 175, 95], [1670, 235, 90], [1900, 165, 100], [2160, 100, 140], [2410, 155, 90], [2630, 215, 90], [2860, 150, 90], [3060, 80, 120]]
        : [[420, 70, 160], [790, 130, 155], [1140, 75, 150], [1520, 115, 170], [1870, 175, 160], [2210, 105, 175], [2530, 155, 170], [2870, 80, 150]];
    for (const [i, [x, rise, width]] of fences.entries()) {
        const moving = hard && (i === 5 || i === 9);
        const fence = new TownPlatform(x, floor - rise, width, rise, 'fence', '#bd966c', moving ? 65 : 0, moving ? .8 : 0);
        fence.floorY = floor; platforms.push(fence);
    }
    // Landing shelves at both charge endpoints leave room to dodge and counterattack.
    for (const x of [3460, 3920, 4470]) { const fence = new TownPlatform(x, floor - 85, hard ? 90 : 135, 85, 'fence'); fence.floorY = floor; platforms.push(fence); }
    const walls = [new BackyardGate(3400, floor + 10, 620), new BackyardGate(4570, floor + 10, 620)]; platforms.push(...walls);
    const exit = new Exit(4780, floor - 80); exit.lock();
    const enemies: LevelData['enemies'] = [];
    for (const [i, x] of (hard ? [640, 985, 1210, 2340, 3210] : [660, 1320, 1750, 2420, 3020]).entries()) {
        enemies.push(new TownTimedHazard(x, floor, hard ? 260 : 320, hard ? 105 : 85, i * 83, hard ? 215 : 160, 'hydrant'));
    }
    for (const [x, patrol] of (hard ? [[310, 80], [865, 95], [1170, 70], [2260, 75], [3250, 65]] : [[880, 120], [1660, 120], [2310, 130], [2790, 120]])) enemies.push(new Raccoon(x, floor, patrol, hard));
    if (hard) for (const [x, rise, patrol] of [[1920, 165, 10], [2890, 150, 20]]) enemies.push(new Raccoon(x, floor - rise, patrol, true));
    enemies.push(new BossRaccoon(floor, exit, walls, difficulty));
    const props = [new BackyardProp(190, floor, 'flowers'), new BackyardProp(1010, floor, 'bin'), new BackyardProp(2330, floor, 'flowers'), new BackyardProp(3340, floor, 'bin'), new BackyardProp(4690, floor, 'home')];
    const collectibles = [new Collectible(260, floor - 65), ...fences.map(([x, rise, width]) => new Collectible(x + width / 2 - 10, floor - rise - 45)), new Collectible(3300, floor - 60), new Collectible(4660, floor - 65)];
    return { platforms, enemies, props, collectibles, waters: hard ? [new Water(1400, floor + 8, 710, 130), new Water(2400, floor + 8, 720, 130)] : [], exit, playerStart: { x: 80, y: floor - 40 }, worldHeight: Math.max(height, 650) };
}
