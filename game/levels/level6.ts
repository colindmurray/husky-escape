
import { Platform, Collectible, Exit, SkiJump, Snowball, Wolf } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

export function getLevel6(height: number, difficulty: Difficulty): LevelData {
    const platforms = [
        // Section 1: Initial Descent
        new Platform(0, height - 400, 300, 400),
        new Platform(-50, 0, 50, height),
        new Platform(300, height - 300, 400, 300),
        new Platform(700, height - 300, 100, 300),
        new SkiJump(720, height - 340),
        
        // Section 2: Middle Humps
        new Platform(1000, height - 300, 500, 300),
        new Platform(1500, height - 200, 300, 200),
        new SkiJump(1750, height - 240),
        
        // Section 3: The Gap Jump
        new Platform(2100, height - 100, 600, 100),
        new SkiJump(2600, height - 140),
        
        // Section 4: Long Run (Extended)
        new Platform(3000, height - 150, 1000, 150),
        
        // Section 5: The High Pass
        new SkiJump(3900, height - 190),
        new Platform(4300, height - 250, 500, 250),
        new SkiJump(4700, height - 290),
        
        // Section 6: Final Landing
        new Platform(5100, height - 100, 800, 100)
    ];

    const enemies = [
        // Early obstacles
        new Snowball(500, -200, -1),
        new Snowball(1250, -300, -1),
        new Snowball(1400, -500, -1),
        new Wolf(2300, height - 130, 150),
        
        // New extended obstacles
        new Snowball(3400, -200, -1),
        new Snowball(3700, -500, -1),
        new Wolf(4500, height - 280, 100)
    ];

    if (difficulty !== Difficulty.EASY) {
        enemies.push(new Snowball(800, -300, -1)); // Right after first jump
        enemies.push(new Snowball(2400, -300, -1)); // On the gap jump platform
        enemies.push(new Wolf(5300, height - 130, 200)); // Final stretch wolf
    }

    const collectibles = [
        new Collectible(1250, height - 450),
        new Collectible(3500, height - 200), // Mid-run
        new Collectible(4800, height - 400)  // In the air for final jump
    ];

    const exit = new Exit(5600, height - 180);
    const playerStart = { x: 50, y: height - 500 };

    return { platforms, enemies, collectibles, waters: [], exit, playerStart };
}
