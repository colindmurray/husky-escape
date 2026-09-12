import {
    Platform, Collectible, Exit, BossWall,
    ConveyorBelt, Pastry, FlourMoth, DoughBlob, BakerChaser,
    OvenMouth, BatterVat, PackagingPress, BossBaker,
} from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

/**
 * Zone 12: THE WARM BAKERY — Onyx smells sugar, sneaks in the back door, and
 * rides the bread line straight toward the big oven.
 *
 * 100% Conveyor-belt factory layout:
 *   - Every single floating platform is an active Conveyor Belt with animated chevrons.
 *   - Staggered multi-tier Donkey Kong cascades (4 to 5 tiers per section) running
 *     at distinct speeds (slow 0.9 to fast 2.2, alternating directions).
 *   - Pastries rain from high in the rafters (y = -350px off-screen) onto EVERY tier,
 *     telegraphed with top-of-screen warning beacons and glowing impact shadows on the belts.
 *   - Cakes cascade from tier to tier down to the floor belts into the ovens or batter vat.
 *
 * Jump budget: every tier rise is <=115px and every gap <=130px.
 * Single jumps always suffice; double jump provides kid-friendly safety.
 */
export function getLevel12(height: number, difficulty: Difficulty): LevelData {
    const easy = difficulty === Difficulty.EASY;
    // Kid-fair belt speeds: EASY ~65%, always outrunnable (Onyx tops ~3.5)
    const b = (v: number) => Math.round(v * (easy ? 0.65 : 1) * 10) / 10;

    const G = height; // world bottom edge

    const platforms: any[] = [
        new Platform(-50, 0, 50, height), // left boundary

        // --- Back alley (quiet start, smell-trail bones) ---
        new Platform(0, G - 100, 700, 100),
        // Alley entry conveyor step
        new ConveyorBelt(520, G - 180, 160, 22, b(1.0)),

        // --- SECTION 1: The Mixing Floor (4-tier cascade into Batter Vat) ---
        // Floor belt: 700..1660 (feeds into vat at 1660)
        new ConveyorBelt(700, G - 100, 960, 100, b(1.2)),

        // 4-Tier Donkey Kong cascade over Section 1 (different speeds!):
        // Tier 4 (top, fast right): 880..1500, speed 1.8 -> drops at ~1510
        new ConveyorBelt(880, G - 490, 620, 22, b(1.8)),
        // Tier 3 (slow left): 820..1580, speed -1.1 -> catches 1510 drop, drops at ~810
        new ConveyorBelt(820, G - 380, 760, 22, b(-1.1)),
        // Tier 2 (fast right): 760..1560, speed 2.2 -> catches 810 drop, drops at ~1570
        new ConveyorBelt(760, G - 270, 800, 22, b(2.2)),
        // Tier 1 (medium left): 720..1600, speed -1.5 -> catches 1570 drop, drops at ~710
        new ConveyorBelt(720, G - 160, 880, 22, b(-1.5)),
        // Floor belt catches 710 drop, rolls right into BatterVat at 1660!

        // Safe Vat Bypass Conveyor (carries player over the BatterVat!)
        new ConveyorBelt(1540, G - 200, 280, 22, b(1.4)),

        // --- SECTION 2: The Deck Oven Gauntlet (5-tier grand DK cascade into oven) ---
        // Floor belt 2A: 1800..2450 (feeds into oven 1 at 2450)
        new ConveyorBelt(1800, G - 100, 650, 100, b(1.5)),
        // Floor belt 2B: 2620..3100 (resumes after oven)
        new ConveyorBelt(2620, G - 100, 480, 100, b(1.2)),

        // 5-Tier Donkey Kong cascade over Section 2 (different speeds!):
        // Tier 5 (top, fast right): 1940..2420, speed 2.0 -> drops at ~2430
        new ConveyorBelt(1940, G - 560, 480, 22, b(2.0)),
        // Tier 4 (medium left): 1860..2500, speed -1.4 -> catches 2430 drop, drops at ~1850
        new ConveyorBelt(1860, G - 450, 640, 22, b(-1.4)),
        // Tier 3 (slow right): 1800..2440, speed 1.0 -> catches 1850 drop, drops at ~2450
        new ConveyorBelt(1800, G - 340, 640, 22, b(1.0)),
        // Tier 2 (fast left): 1760..2480, speed -1.8 -> catches 2450 drop, drops at ~1750
        new ConveyorBelt(1760, G - 230, 720, 22, b(-1.8)),
        // Tier 1 (medium right): 1720..2380, speed 1.4 -> catches 1750 drop, drops at ~2390
        new ConveyorBelt(1720, G - 160, 660, 22, b(1.4)),
        // Floor belt 2A catches 2390 drop, rolls into OvenMouth 1 at 2450!

        // Safe Oven 1 Bypass Conveyors:
        new ConveyorBelt(2420, G - 240, 260, 22, b(1.3)),      // bridge over oven 1 (2420..2680)
        new ConveyorBelt(2640, G - 170, 150, 22, b(1.1)),      // step down to Floor 2B

        // --- SECTION 3: Press gauntlet + apprentice chase (3100..4200) ---
        new ConveyorBelt(3100, G - 100, 1100, 100, b(1.4)),    // Floor belt 3: 3100..4200
        // All floating platforms are conveyors with varied speeds:
        new ConveyorBelt(3140, G - 180, 140, 22, b(1.1)),      // entrance step conveyor
        new ConveyorBelt(3260, G - 240, 220, 22, b(1.6)),      // lower press approach
        new ConveyorBelt(3450, G - 270, 420, 22, b(-1.3)),     // press bypass (rides left over press)
        new ConveyorBelt(3300, G - 350, 240, 22, b(1.8)),      // mid-level fast conveyor
        new ConveyorBelt(3540, G - 420, 280, 22, b(-1.0)),     // high slow observation conveyor
        new ConveyorBelt(3820, G - 310, 340, 22, b(1.5)),      // upper exit conveyor
        new ConveyorBelt(3920, G - 450, 200, 22, b(-1.2)),     // high ceiling conveyor
        new ConveyorBelt(4080, G - 200, 140, 22, b(1.2)),      // step down to Section 4

        // --- SECTION 4: Grand Bakery Cascade (5-tier cascade into 2nd oven) ---
        new ConveyorBelt(4200, G - 100, 900, 100, b(1.5)),     // Floor belt 4: 4200..5100
        new Platform(5260, G - 100, 40, 100),                  // Floor lip before arena gate

        // 5-Tier Donkey Kong cascade over Section 4 (different speeds!):
        // Tier 5 (top, fast right): 4340..4820, speed 2.2 -> drops at ~4830
        new ConveyorBelt(4340, G - 560, 480, 22, b(2.2)),
        // Tier 4 (medium left): 4260..4900, speed -1.2 -> catches 4830 drop, drops at ~4250
        new ConveyorBelt(4260, G - 450, 640, 22, b(-1.2)),
        // Tier 3 (fast right): 4220..4840, speed 1.6 -> catches 4250 drop, drops at ~4850
        new ConveyorBelt(4220, G - 340, 620, 22, b(1.6)),
        // Tier 2 (slow left): 4180..4880, speed -1.0 -> catches 4850 drop, drops at ~4170
        new ConveyorBelt(4180, G - 230, 700, 22, b(-1.0)),
        // Tier 1 (medium right): 4160..4980, speed 1.4 -> catches 4170 drop, drops at ~4990
        new ConveyorBelt(4160, G - 160, 820, 22, b(1.4)),
        // Floor belt 4 catches 4990 drop, rolls into OvenMouth 2 at 5100!

        // Safe Oven 2 Bypass Conveyors:
        new ConveyorBelt(5060, G - 240, 240, 22, b(1.3)),      // bridge over oven 2 (5060..5300)
        new ConveyorBelt(5180, G - 170, 120, 22, b(1.0)),      // gate approach step

        // --- BOSS ARENA: the Night Baker blocks the back door (5300..6820) ---
        new Platform(5300, G - 100, 1520, 100),
        new Platform(6820, G - 600, 50, 600),                  // right boundary wall

        // Boss arena elevated conveyor perches for stomping the toque:
        new ConveyorBelt(5480, G - 220, 200, 20, b(1.2)),      // left staging conveyor
        new ConveyorBelt(5740, G - 330, 240, 20, b(1.0)),      // elevated mid-left conveyor
        new ConveyorBelt(6020, G - 430, 240, 20, b(-1.3)),     // high central conveyor
        new ConveyorBelt(6320, G - 330, 240, 20, b(-1.0)),     // elevated mid-right conveyor
        new ConveyorBelt(6560, G - 220, 180, 20, b(-1.2)),     // right staging conveyor
    ];

    const waters: any[] = [
        new BatterVat(1660, G - 70, 140, 120),
        new OvenMouth(2450, G - 130, 170, 40),
        new OvenMouth(5100, G - 130, 160, 40),
    ];

    // Arena gate walls (rise when the boss wakes)
    const wallLeft = new BossWall(5300, height, 400);
    const wallRight = new BossWall(6640, height, 400);
    platforms.push(wallLeft);
    platforms.push(wallRight);

    const exit = new Exit(6700, G - 215);
    const boss = new BossBaker(6050, G - 228, 5380, 6500, exit, [wallLeft, wallRight], difficulty);

    // High rafter spawn Y (way off-screen above the visible viewport)
    const RAFTER_Y = -350;

    const enemies: any[] = [
        // --- SECTION 1: Pastries rain from high rafters onto EVERY tier ---
        new Pastry(920, RAFTER_Y, 'cupcake', 0),        // drops onto Tier 4
        new Pastry(980, RAFTER_Y, 'layercake', 40),     // drops onto Tier 4
        new Pastry(1360, RAFTER_Y, 'cupcake', 20),      // drops onto Tier 3
        new Pastry(1120, RAFTER_Y, 'cupcake', 60),      // drops onto Tier 2
        new Pastry(1420, RAFTER_Y, 'layercake', 85),    // drops onto Tier 1

        // --- SECTION 2: 5-Tier Deck Oven Gauntlet (pastries rain onto EVERY tier) ---
        new Pastry(1980, RAFTER_Y, 'cupcake', 0),       // drops onto Tier 5
        new Pastry(2040, RAFTER_Y, 'layercake', 35),    // drops onto Tier 5
        new Pastry(2320, RAFTER_Y, 'cupcake', 15),      // drops onto Tier 4
        new Pastry(2020, RAFTER_Y, 'cupcake', 55),      // drops onto Tier 3
        new Pastry(2260, RAFTER_Y, 'layercake', 75),    // drops onto Tier 2
        new Pastry(1880, RAFTER_Y, 'cupcake', 95),      // drops onto Tier 1
        new Pastry(2000, RAFTER_Y, 'cupcake', 120),     // second wave on Tier 5

        // --- SECTION 3: Apprentice + Press gauntlet ---
        new Pastry(3560, RAFTER_Y, 'cupcake', 0),       // drops onto press bypass
        new Pastry(3740, RAFTER_Y, 'cupcake', 45),      // drops onto press bypass
        new Pastry(3960, RAFTER_Y, 'layercake', 25),    // drops onto upper exit conveyor
        new PackagingPress(3550, G - 100, !easy),
        new BakerChaser(3280, G - 200, easy ? 2.0 : 3.0),

        // --- SECTION 4: Grand 5-Tier Bakery Cascade (pastries rain onto EVERY tier) ---
        new Pastry(4380, RAFTER_Y, 'cupcake', 0),       // drops onto Tier 5
        new Pastry(4440, RAFTER_Y, 'layercake', 40),    // drops onto Tier 5
        new Pastry(4740, RAFTER_Y, 'cupcake', 20),      // drops onto Tier 4
        new Pastry(4420, RAFTER_Y, 'cupcake', 60),      // drops onto Tier 3
        new Pastry(4680, RAFTER_Y, 'layercake', 80),    // drops onto Tier 2
        new Pastry(4320, RAFTER_Y, 'cupcake', 100),     // drops onto Tier 1
        new Pastry(4400, RAFTER_Y, 'cupcake', 125),     // second wave on Tier 5

        // --- Ground / air kitchen pests ---
        new DoughBlob(1050, G - 128, 120),
        new FlourMoth(1150, G - 430, 130),
        new FlourMoth(2520, G - 410, 150),

        // --- The Night Baker blocks the back door ---
        boss,
    ];

    if (!easy) {
        enemies.push(
            new Pastry(2010, RAFTER_Y, 'cupcake', 140),  // HARD: extra stream on S2
            new Pastry(2280, RAFTER_Y, 'cupcake', 160),
            new Pastry(4410, RAFTER_Y, 'cupcake', 140),  // HARD: extra stream on S4
            new Pastry(4700, RAFTER_Y, 'layercake', 160),
            new DoughBlob(4450, G - 128, 130),
            new FlourMoth(4900, G - 430, 140),
            new PackagingPress(4720, G - 100, true),
        );
    }

    const collectibles = [
        new Collectible(350, G - 170),   // alley smell-trail
        new Collectible(520, G - 240),   // above entry conveyor
        new Collectible(800, G - 170),   // entry to mixing belt
        new Collectible(1100, G - 540),  // high above Tier 4
        new Collectible(1180, G - 430),  // over Tier 3
        new Collectible(1350, G - 320),  // over Tier 2
        new Collectible(1450, G - 210),  // over Tier 1
        new Collectible(1680, G - 250),  // dare: arc over BatterVat
        new Collectible(2180, G - 610),  // high above S2-Tier 5
        new Collectible(2240, G - 500),  // S2-Tier 4
        new Collectible(2120, G - 390),  // S2-Tier 3
        new Collectible(2530, G - 300),  // oven bypass bridge reward
        new Collectible(2535, G - 180),  // dare: arc over oven mouth 1
        new Collectible(3620, G - 330),  // press bypass reward
        new Collectible(3960, G - 500),  // high ceiling conveyor
        new Collectible(4580, G - 610),  // high above S4-Tier 5
        new Collectible(4680, G - 500),  // S4-Tier 4
        new Collectible(4520, G - 390),  // S4-Tier 3
        new Collectible(5180, G - 200),  // dare: arc over second oven
        new Collectible(5480, G - 280),  // arena left conveyor
        new Collectible(6020, G - 490),  // arena high central conveyor
        new Collectible(6560, G - 280),  // arena right conveyor
    ];

    return {
        platforms,
        enemies,
        collectibles,
        waters,
        exit,
        playerStart: { x: 80, y: G - 220 },
    };
}
