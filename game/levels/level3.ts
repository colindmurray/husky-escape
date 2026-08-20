
import { Platform, Enemy, Collectible, Exit, MovingPlatform, Water } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

export function getLevel3(height: number, difficulty: Difficulty): LevelData {
    const platforms = [
        // Zone 1: The Outskirts (0 - 1500)
        new Platform(0, height - 150, 300, 150),
        new Platform(-50, 0, 50, height),
        new MovingPlatform(320, height - 140, 120, 20, 320, 500, 1.0),
        new Platform(600, height - 150, 300, 150),
        new MovingPlatform(920, height - 120, 100, 20, 920, 1150, 1.2),
        new Platform(1250, height - 200, 250, 200),

        // Zone 2: The Thicket (1500 - 3000)
        new MovingPlatform(1550, height - 180, 100, 20, 1550, 1800, 0.8),
        new Platform(1900, height - 150, 400, 150),
        new Platform(2000, height - 350, 150, 20), // High ground
        new MovingPlatform(2400, height - 220, 120, 20, 2350, 2600, 1.5),
        new Platform(2700, height - 150, 300, 150),

        // Zone 3: The Deep Dark (3000 - 4500)
        new MovingPlatform(3050, height - 300, 100, 20, 3050, 3300, 1.0),
        new Platform(3400, height - 250, 200, 250),
        new MovingPlatform(3650, height - 400, 100, 20, 3650, 3900, 1.3),
        new Platform(4000, height - 200, 500, 200),
        new Platform(4200, height - 400, 150, 20), // High path

        // Zone 4: The Escape Path (4500 - 6000)
        new MovingPlatform(4600, height - 180, 120, 20, 4550, 4850, 1.8),
        new Platform(4950, height - 250, 300, 250),
        new MovingPlatform(5300, height - 350, 100, 20, 5250, 5550, 1.2),
        new Platform(5600, height - 150, 400, 150)
    ];

    const waters = [
        new Water(300, height - 50, 300, 50),
        new Water(900, height - 50, 350, 50),
        new Water(1500, height - 50, 400, 50),
        new Water(2300, height - 50, 400, 50),
        new Water(3000, height - 50, 400, 50),
        new Water(4500, height - 50, 450, 50),
        new Water(5250, height - 50, 350, 50)
    ];

    const enemies = [
        new Enemy(650, height - 200, 80, 1.1),
        new Enemy(1300, height - 250, 100, 1.3),
        new Enemy(2000, height - 200, 150, 1.4),
        new Enemy(3450, height - 300, 50, 1.5),
        new Enemy(4100, height - 250, 200, 1.6),
        new Enemy(5000, height - 300, 100, 1.8),
        new Enemy(5700, height - 200, 120, 2.0)
    ];

    if (difficulty !== Difficulty.EASY) {
        enemies.push(new Enemy(2800, height - 200, 80, 1.5));
        enemies.push(new Enemy(4300, height - 250, 80, 1.8));
    }

    const collectibles = [
        new Collectible(650, height - 250),
        new Collectible(1640, height - 400),
        new Collectible(2100, height - 400),
        new Collectible(3500, height - 300),
        new Collectible(4250, height - 450),
        new Collectible(5100, height - 350)
    ];

    const exit = new Exit(5850, height - 230);
    const playerStart = { x: 100, y: height - 200 };

    return { platforms, enemies, collectibles, waters, exit, playerStart };
}
