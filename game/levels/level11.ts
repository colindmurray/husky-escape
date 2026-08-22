
import { Platform, Collectible, Exit, Fan, SecurityDrone, BoostPad, RoofCat } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

/**
 * Zone 11: NEON METROPOLIS — the city night.
 *
 * Onyx crosses a bustling skyline of neon-lit rooftops. Industrial fans in
 * alley shafts blast him skyward (steady + pulsing variants), security drones
 * patrol the gaps with scan cones, and neon dash pads fling him across wide
 * streets. A few roof cats keep watch.
 */
export function getLevel11(height: number, difficulty: Difficulty): LevelData {
    // Drone pursuit gentleness scales with difficulty (EASY ~55%)
    const aggro = difficulty === Difficulty.EASY ? 0.55 : 1;
    const platforms: any[] = [
        // Left boundary
        new Platform(-50, 0, 50, height),

        // --- Act 1: first rooftops ---
        new Platform(0, height - 80, 520, 80),          // start roof
        new Platform(660, height - 150, 360, 70),       // hop across the street
        // Fan shaft #1 (steady): open alley column, lifts to the mid-tower
        new Platform(1020, height - 60, 250, 40),       // alley floor (safety net)
        new Fan(1120, height - 90, 'steady', 420),
        new Platform(1052, height - 520, 26, 320),      // left guide wall (doorway at street level)
        new Platform(1250, height - 430, 280, 55),      // landing tower (right of column)

        // Fire escape climb with a drone overhead
        new Platform(1470, height - 490, 150, 20),
        new Platform(1690, height - 550, 150, 20),
        new SecurityDrone(1560, height - 750, 120, aggro),

        // Mid-tower long roof + dash pad across the boulevard
        new Platform(1840, height - 500, 520, 60),
        new BoostPad(2260, height - 514, 1),
        new Platform(2520, height - 520, 240, 40),      // pad landing

        // --- Act 2: descend, pulse-fan tower ---
        new Platform(2860, height - 300, 340, 60),
        new Platform(3180, height - 200, 200, 40),      // pulse-shaft floor
        new Fan(3260, height - 230, 'pulse'),           // timed lift!
        new Platform(3080, height - 580, 160, 55),      // high tower LEFT of column
        new Platform(3440, height - 580, 160, 55),      // high tower RIGHT of column
        new Platform(3232, height - 700, 130, 20),      // sky perch above the column

        new SecurityDrone(3320, height - 800, 160, aggro),
        new Platform(3650, height - 630, 160, 20),      // fire escape hop
        new Platform(3870, height - 690, 160, 20),

        // --- Act 3: high run + big dash ---
        new Platform(4040, height - 640, 560, 60),
        new BoostPad(4520, height - 654, 1),
        new Platform(4800, height - 660, 260, 40),
        new SecurityDrone(4700, height - 560, 200),

        // Drop down to the plaza
        new Platform(5150, height - 300, 420, 60),
        new Platform(5560, height - 210, 220, 40),      // shaft floor
        new Fan(5640, height - 240, 'steady'),
        new Platform(5420, height - 560, 190, 50),      // upper deck LEFT (column open)
        new Platform(5740, height - 560, 200, 50),      // upper deck RIGHT

        // --- Final ascent to home suburb sign ---
        new Platform(5970, height - 615, 170, 20),
        new Platform(6180, height - 675, 170, 20),
        new Platform(6380, height - 730, 520, 60),      // summit roof

        // Right boundary wall
        new Platform(6940, 0, 50, height),
    ];

    // Extra drones on higher difficulties
    if (difficulty !== Difficulty.EASY) {
        platforms.push(new Platform(1240, height - 240, 160, 20)); // extra perch in shaft 1
    }
    const enemies: any[] = [
        new SecurityDrone(850, height - 380, 120, aggro),
        new SecurityDrone(1900, height - 620, 220, aggro),
        new SecurityDrone(2960, height - 420, 150, aggro),
        new SecurityDrone(4180, height - 760, 200, aggro),
        new SecurityDrone(5250, height - 400, 170, aggro),
    ];
    if (difficulty !== Difficulty.EASY) {
        enemies.push(new SecurityDrone(1120, height - 260, 120, 1));
        enemies.push(new SecurityDrone(5700, height - 660, 130, 1));
    }

    const collectibles = [
        new Collectible(300, height - 140),
        new Collectible(800, height - 210),
        new Collectible(1180, height - 200),   // floating in fan shaft 1
        new Collectible(1240, height - 300),
        new Collectible(1700, height - 630),
        new Collectible(2000, height - 560),
        new Collectible(2600, height - 580),
        new Collectible(3320, height - 320),   // inside pulse-fan column (timed grab)
        new Collectible(3720, height - 700),
        new Collectible(4300, height - 700),
        new Collectible(5300, height - 360),
        new Collectible(5700, height - 380),   // fan shaft 3
        new Collectible(6240, height - 740),
    ];

    const exit = new Exit(6680, height - 810);

    // Roof cats: two little watchers
    const props = [
        new RoofCat(420, height - 102),
        new RoofCat(4400, height - 662),
        new RoofCat(6500, height - 752),
    ];

    return {
        platforms,
        enemies,
        collectibles,
        waters: [],
        exit,
        playerStart: { x: 100, y: height - 130 },
        props,
    } as LevelData;
}
