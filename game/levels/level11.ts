
import { Platform, Collectible, Exit, Fan, SecurityDrone, BoostPad, RoofCat } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

/**
 * Zone 11: NEON METROPOLIS — the city night, now a full vertical world.
 *
 * This level uses VERTICAL SCROLLING: the camera follows Onyx up AND back down
 * (soft center-follow with a deadzone), so the whole ~1750px-tall skyline is
 * playable even on short screens. The route forces repeated climbing and
 * descending:
 *
 *   Act 1  Street → fire-escape climb up a mid-rise (drone overhead)
 *          → forced DROP down a roof shaft to a sunken courtyard
 *   Act 2  Pulse-fan spire: timed lifts + alternating perches to the high
 *          tower, then a boost-pad dash across the boulevard
 *   Act 3  A long plunge off the boulevard tower into the low plaza
 *   Act 4  Steady-fan ascent onto the upper decks, then a zigzag fire-escape
 *          climb to the summit roof and the exit at the top of the world.
 */
export function getLevel11(height: number, difficulty: Difficulty): LevelData {
    // Drone pursuit gentleness scales with difficulty (EASY ~55%)
    const aggro = difficulty === Difficulty.EASY ? 0.55 : 1;

    // Ground line (world BOTTOM edge is always y = height)
    const G = height;
    // Total vertical span; content reaches ~G-1460, so leave headroom
    const WORLD_H = 1750;

    const platforms: any[] = [
        // Left boundary (full world height)
        new Platform(-50, G - WORLD_H, 50, WORLD_H),

        // --- Act 1: street start + fire-escape climb ---
        new Platform(0, G - 80, 520, 80),               // start street roof
        new Platform(620, G - 240, 150, 20),            // fire escape 1
        new Platform(840, G - 390, 150, 20),            // fire escape 2
        new Platform(1060, G - 545, 150, 20),           // fire escape 3
        new Platform(1240, G - 600, 460, 60),           // Rooftop A

        // Forced descent: drop shaft off Rooftop A's right edge down to courtyard
        new Platform(1740, G - 560, 26, 420),           // shaft guide wall
        new Platform(1790, G - 380, 120, 18),           // mid-drop ledge (optional break)
        new Platform(1880, G - 140, 520, 70),           // sunken courtyard floor

        // --- Act 2: pulse-fan spire ---
        new Fan(2080, G - 170, 'pulse'),                // timed lift out of the courtyard
        new Platform(1950, G - 480, 130, 20),           // left perch
        new Platform(2230, G - 640, 130, 20),           // right perch
        new Platform(1930, G - 800, 130, 20),           // left perch
        new Platform(2090, G - 950, 220, 40),           // spire landing
        new Fan(2140, G - 975, 'steady', 320),          // steady lift to Tower B
        new Platform(2320, G - 1280, 300, 55),          // Tower B

        // High traverse + boost dash across the boulevard
        new Platform(2620, G - 1320, 520, 60),          // Rooftop B run
        new BoostPad(3060, G - 1334, 1),
        new Platform(3320, G - 1340, 240, 40),          // pad landing tower

        // --- Act 3: long plunge into the plaza ---
        new Platform(3620, G - 760, 130, 18),           // mid-fall ledge w/ bone
        new Platform(3560, G - 160, 620, 70),           // low plaza

        // --- Act 4: final ascent to the summit ---
        new Fan(4080, G - 186, 'steady', 400),          // fan column off the plaza
        new Platform(3900, G - 560, 165, 50),           // upper deck LEFT (column gap)
        new Platform(4290, G - 560, 185, 50),           // upper deck RIGHT
        new Platform(4620, G - 700, 160, 20),           // zigzag fire escapes
        new Platform(4840, G - 850, 160, 20),
        new Platform(5060, G - 1000, 160, 20),
        new Platform(5280, G - 1140, 170, 20),
        new Platform(5500, G - 1280, 170, 20),
        new Platform(5700, G - 1350, 580, 60),          // summit roof

        // Right boundary wall (full world height)
        new Platform(6340, G - WORLD_H, 50, WORLD_H),
    ];

    // Extra perch on higher difficulties
    if (difficulty !== Difficulty.EASY) {
        platforms.push(new Platform(1660, G - 260, 120, 18)); // ledge inside drop shaft
    }

    const enemies: any[] = [
        new SecurityDrone(820, G - 560, 120, aggro),    // over the fire escapes
        new SecurityDrone(1400, G - 780, 140, aggro),   // above Rooftop A
        new SecurityDrone(2150, G - 700, 110, aggro),   // sweeping the pulse-fan perches
        new SecurityDrone(2500, G - 1470, 150, aggro),  // above Tower B
        new SecurityDrone(3860, G - 420, 170, aggro),   // plaza guard
        new SecurityDrone(5000, G - 1130, 150, aggro),  // final ascent
    ];
    if (difficulty !== Difficulty.EASY) {
        enemies.push(new SecurityDrone(1050, G - 320, 120, 1));
        enemies.push(new SecurityDrone(4420, G - 700, 130, 1));
    }

    const collectibles = [
        new Collectible(300, G - 140),     // start roof
        new Collectible(700, G - 310),     // fire escape 1
        new Collectible(920, G - 460),     // fire escape 2
        new Collectible(1140, G - 615),    // fire escape 3
        new Collectible(1450, G - 670),    // Rooftop A
        new Collectible(1830, G - 330),    // grabbed while dropping the shaft
        new Collectible(1850, G - 200),    // lower in the drop
        new Collectible(2120, G - 400),    // pulse-fan column
        new Collectible(2300, G - 700),    // right perch
        new Collectible(2180, G - 1020),   // above the spire landing
        new Collectible(2800, G - 1390),   // Rooftop B run
        new Collectible(3230, G - 1420),   // boost-dash flight path
        new Collectible(3660, G - 950),    // long-plunge arc
        new Collectible(3640, G - 600),    // long-plunge arc (lower)
        new Collectible(4130, G - 450),    // fan column 3
        new Collectible(5110, G - 1070),   // final ascent
        new Collectible(5850, G - 1420),   // summit
    ];

    // Roof cats: little watchers along the route
    const props = [
        new RoofCat(420, G - 102),
        new RoofCat(1500, G - 622),
        new RoofCat(3700, G - 182),
        new RoofCat(5950, G - 1372),
    ];

    return {
        platforms,
        enemies,
        collectibles,
        waters: [],
        exit: new Exit(6080, G - 1430),
        playerStart: { x: 100, y: G - 130 },
        props,
        worldHeight: WORLD_H,
    } as LevelData;
}
