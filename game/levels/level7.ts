
import { Platform, ChaserEnemy, Collectible, Exit, Porcupine } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

export function getLevel7(height: number, difficulty: Difficulty): LevelData {
    // A long linear level with gaps and steps
    const platforms: Platform[] = [
        new Platform(0, height - 100, 500, 100),
        new Platform(-50, 0, 50, height),
        
        // Gap 1
        new Platform(600, height - 100, 400, 100),
        
        // Steps up
        new Platform(1100, height - 200, 300, 200),
        new Platform(1500, height - 300, 400, 300),
        
        // Ravine
        new Platform(2100, height - 300, 200, 300),
        new Platform(2400, height - 300, 200, 300),
        new Platform(2700, height - 300, 500, 300),
        
        // High Platform run
        new Platform(3300, height - 450, 100, 20),
        new Platform(3500, height - 450, 100, 20),
        new Platform(3700, height - 450, 100, 20),
        
        // Long landing
        new Platform(3900, height - 200, 1000, 200),
        
        // Final obstacles
        new Platform(5000, height - 200, 100, 200), // Wall to jump
        new Platform(5200, height - 200, 100, 200),
        new Platform(5400, height - 200, 600, 200),

        // --- EXTENDED SECTION (+20%) ---
        // Gap
        new Platform(6100, height - 200, 200, 200), 
        // Another step up
        new Platform(6400, height - 300, 300, 300),
        // Final stretch
        new Platform(6800, height - 200, 500, 200)
    ];

    // Enemies: 2 Smart Chasers + 3 Porcupines
    const enemies: any[] = [
        new ChaserEnemy(-50, height - 200), 
        new ChaserEnemy(-150, height - 200),
        
        // Porcupines
        new Porcupine(800, height - 130, 100), // On the second platform after first gap
        new Porcupine(2800, height - 330, 200), // On the long platform after ravines
        new Porcupine(4200, height - 230, 300), // On the long landing

        // Extended Section Enemies
        new Porcupine(6500, height - 330, 100) // Guarding the new step up
    ];

    if (difficulty !== Difficulty.EASY) {
        enemies.push(new ChaserEnemy(-300, height - 200)); // Third chaser!
        enemies.push(new Porcupine(1600, height - 330, 100)); // On the step up
        enemies.push(new Porcupine(5500, height - 230, 100)); // Final guard
    }

    const collectibles = [
        new Collectible(1250, height - 300),
        new Collectible(2800, height - 400),
        new Collectible(3550, height - 550),
        new Collectible(6500, height - 400) // New collectible in extended area
    ];

    // Extended exit position
    const exit = new Exit(7100, height - 280);
    const playerStart = { x: 200, y: height - 200 };

    return { platforms, enemies, collectibles, waters: [], exit, playerStart };
}
