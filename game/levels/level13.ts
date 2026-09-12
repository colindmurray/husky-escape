import { Collectible, Exit, Water } from '../entities/index';
import { MarchingBand, CollapsingAwning, BandanaPickup, RollingApple, TownCyclist, TownTimedHazard, TownPedestrian, TownPlatform, TownScenery, YardDog } from '../entities/Town';
import { Difficulty } from '../../types';
import type { LevelData } from './types';

export function getLevel13(height: number, difficulty: Difficulty): LevelData {
    const easy = difficulty === Difficulty.EASY;
    const floor = height - 100;
    const jetHeight = easy ? 155 : 220;
    const platforms = [
        new TownPlatform(-50, 0, 50, height, 'pavement'),
        ...(easy ? [[0, 6940]] : [[0, 2980], [3620, 3320]]).map(([x, w]) => new TownPlatform(x, floor, w, 100, 'pavement')),
        new TownPlatform(6940, 0, 50, height, 'pavement'),
        // Doorsteps introduce the upper route before the first delivery lane.
        new TownPlatform(470, floor - 45, 130, 18, 'bench'),
        new TownPlatform(900, floor - 55, 140, 18, 'bench'),
        new TownPlatform(1190, floor - 65, 150, 18, 'bench'),
        new TownPlatform(1510, floor - 55, 150, 18, 'bench'),
        // Market: street, counters, and awnings all rejoin on solid ground.
        new TownPlatform(1750, floor - 55, 100, 55, 'crate'),
        new TownPlatform(1880, floor - 130, 240, 22, 'awning', '#d96252'),
        new TownPlatform(2130, floor - 65, 105, 65, 'crate'),
        new TownPlatform(2250, floor - 205, 245, 22, 'awning', '#258d91'),
        new TownPlatform(2560, floor - 150, 260, 22, 'awning', '#e4af46'),
        new TownPlatform(2810, floor - 60, 100, 60, 'crate'),
        // Shallow fountain; missed stepping stones are recoverable.
        new TownPlatform(3050, floor - 55, 100, 18, 'stone'),
        new TownPlatform(3220, floor - 120, 110, 20, 'stone'),
        new TownPlatform(3410, floor - 70, 110, 20, 'stone'),
        new TownPlatform(3630, floor - 45, 130, 18, 'bench'),
        // Gardens: fences and benches offer a bypass over the dog territory.
        new TownPlatform(3810, floor - 60, 100, 60, 'fence'),
        new TownPlatform(4020, floor - 85, 140, 18, 'bench'),
        new TownPlatform(4230, floor - 155, 180, 18, 'awning', '#8272ab'),
        new TownPlatform(4490, floor - 60, 100, 60, 'fence'),
        new TownPlatform(4690, floor - 45, 130, 18, 'bench'),
        // Parade floats reuse moving-platform carry physics. Benches are recovery stops.
        new TownPlatform(4950, floor - 50, 120, 18, 'bench'),
        new TownPlatform(5110, floor - 110, 220, 38, 'float', '#d96252', 80, easy ? 0.65 : 1),
        new TownPlatform(5360, floor - 55, 100, 18, 'bench'),
        new TownPlatform(5510, floor - 175, 240, 38, 'float', '#258d91', 85, easy ? 0.7 : 1.1),
        new TownPlatform(5780, floor - 60, 110, 18, 'bench'),
        new TownPlatform(5940, floor - 115, 230, 38, 'float', '#8272ab', 80, easy ? 0.6 : 0.95),
        new TownPlatform(6260, floor - 55, 150, 18, 'bench'),
    ];
    const enemies: LevelData['enemies'] = [
        new TownPedestrian(650, floor - 57, 75, 0.7),
        new TownPedestrian(810, floor - 57, 55, 0.85, false, '#d96252'),
        new TownCyclist(970, 1620, floor - 62, easy ? 3.4 : 4.6, easy ? 105 : 75),
        new TownPedestrian(1960, floor - 57, 95, 0.9, false, '#8272ab'),
        new TownPedestrian(2370, floor - 57, 105, 0.75, false, '#258d91'),
        new TownPedestrian(2680, floor - 57, 90, 1, false, '#d96252'),
        new RollingApple(2960, 2150, floor, easy ? 2.8 : 3.8, easy ? 450 : 350, 0),
        new RollingApple(2960, 2150, floor, easy ? 2.8 : 3.8, easy ? 450 : 350, 165),
        new TownTimedHazard(3160, floor, easy ? 330 : 265, easy ? 75 : 100, 0, jetHeight),
        new TownTimedHazard(3350, floor, easy ? 330 : 265, easy ? 75 : 100, 110, jetHeight),
        new TownTimedHazard(3540, floor, easy ? 330 : 265, easy ? 75 : 100, 220, jetHeight),
        new TownTimedHazard(3930, floor, easy ? 340 : 280, easy ? 80 : 110, 80, jetHeight, 'hydrant'),
        new YardDog(4190, 4420, floor - 36, easy ? 2.7 : 3.8, easy ? 85 : 60),
        new TownTimedHazard(4610, floor, easy ? 340 : 280, easy ? 80 : 110, 240, jetHeight, 'hydrant'),
    ];
    for (const [i, x] of [1850, 2180, 2510, 2860].entries()) {
        enemies.push(new TownPedestrian(x, floor - 57, 45, easy ? 0.65 : 1, false, ['#e4af46', '#8272ab'][i % 2]));
    }
    if (!easy) {
        // Road-closure barriers force the market climb. Frayed awnings reform after three seconds.
        for (let i = platforms.length - 1; i >= 0; i--) {
            const p = platforms[i];
            if (p.kind === 'awning' && p.x < 3000) {
                platforms.splice(i, 1, new CollapsingAwning(p.x, p.y, 160, p.color));
            } else if (p.kind === 'bench' && p.x >= 4950) {
                p.y = floor - 85;
                if (p.x === 5360 || p.x === 5780) p.w = 80;
            } else if (p.kind === 'stone') {
                p.w = 65;
                p.minX = p.x; p.maxX = p.x + 70; p.dx = i % 2 ? 1.1 : -1.1;
                if (p.dx < 0) p.x = p.maxX;
            } else if (p.kind === 'float') {
                p.w = 150; p.maxX = p.minX + 140;
                p.dx = p.x === 5510 ? -1.25 : 1.15;
                if (p.dx < 0) p.x = p.maxX;
            }
        }
        platforms.push(
            new TownPlatform(2045, floor - 150, 85, 150, 'barrier'),
            new TownPlatform(2440, floor - 190, 110, 190, 'barrier'),
            new TownPlatform(2760, floor - 120, 100, 120, 'barrier'),
            new TownPlatform(2950, floor - 55, 75, 18, 'stone'),
            new TownPlatform(3550, floor - 40, 75, 18, 'stone'),
        );
        // A second lane approaches from behind; the middle bench remains a safe waiting spot.
        enemies.push(new TownCyclist(1040, 1700, floor - 62, 4.2, 115, 1));
        enemies.push(new YardDog(4470, 4660, floor - 36, 3.6, 70));
    }
    if (easy) {
        for (let i = 0; i < 8; i++) {
            enemies.push(new TownPedestrian(5030 + i * 165, floor - 57, 50, 0.85, true, ['#d96252', '#258d91', '#8272ab'][i % 3]));
        }
    } else enemies.push(new MarchingBand(5030, floor, 1270));
    if (!easy) {
        enemies.push(new RollingApple(2960, 2150, floor, 3.8, 350, 270));
        enemies.push(new TownPedestrian(1370, floor - 57, 85, 1.1, false, '#e4af46'));
    }
    const props: LevelData['props'] = [
        new TownScenery(230, floor - 128, 'sign', 'MARKET DAY →'),
        new TownScenery(2920, floor - 5, 'cart'),
        new TownScenery(3090, floor - 24, 'fountain'),
        new TownScenery(3860, floor, 'garden'),
        new TownScenery(4190, floor, 'garden'),
        new TownScenery(4880, floor - 210, 'sign', 'PARADE →'),
        new TownScenery(6620, floor, 'gate'),
        new TownScenery(290, floor, 'neighbor'),
        new TownScenery(3700, floor - 45, 'neighbor'),
        ...(easy ? [new BandanaPickup(350, floor - 35), new BandanaPickup(3750, floor - 35)] : [new BandanaPickup(2380, floor - 242)]),
        new TownScenery(640, floor - 5, 'pigeon'),
        new TownScenery(1730, floor - 5, 'pigeon'),
        new TownScenery(3010, floor - 5, 'pigeon'),
        new TownScenery(3610, floor - 5, 'pigeon'),
        new TownScenery(6460, floor - 5, 'pigeon'),
    ];
    for (const platform of platforms) platform.floorY = floor;
    enemies.push(new TownTimedHazard(5600, floor, easy ? 340 : 280, easy ? 95 : 120, 160, easy ? 205 : 255, 'roadwork'));
    if (!easy) enemies.push(new TownTimedHazard(6100, floor, 310, 110, 60, 205, 'roadwork'));
    const exit = new Exit(6670, floor - 80);
    exit.lock();
    const bones = [
        [285, 70], [505, 100], [1205, 120], [1780, 110], [1990, 185], [2370, 260], [2680, 205],
        [3075, 110], [3260, 180], [3440, 130], [4070, 145], [4310, 215], [4720, 100],
        [5210, 190], [5620, 255], [6050, 195], [6320, 115], [6540, 65],
    ];
    return {
        platforms, enemies, props,
        collectibles: bones.map(([x, rise]) => new Collectible(x, floor - rise)),
        waters: easy ? [] : [new Water(2980, floor + 12, 640, 100)],
        exit,
        playerStart: { x: 80, y: floor - 40 },
        // Keep upper routes visible on short landscape screens.
        worldHeight: Math.max(height, 600),
    };
}
