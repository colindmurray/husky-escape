
import { Platform, Collectible, Exit, MovingPlatform, Water, Wolf, BossWolf, BossWall } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

export function getLevel5(height: number, difficulty: Difficulty): LevelData {
    const platforms: any[] = [
        new Platform(0, height - 100, 400, 100),
        new Platform(-50, 0, 50, height),
        new Platform(450, height - 100, 50, 200),
        new Platform(600, height - 100, 50, 200),
        new Platform(700, height - 200, 400, 50),
        new Platform(1150, height - 300, 100, 20),
        new Platform(1300, height - 400, 100, 20),
        new Platform(1450, height - 450, 200, 50),
        new MovingPlatform(1700, height - 460, 100, 20, 1700, 1950, 1.2),
        new Platform(2100, height - 450, 400, 50),
        
        // --- NEW EXTENDED SECTION ---
        new MovingPlatform(2600, height - 400, 120, 20, 2600, 2900, 1.5),
        new Platform(3000, height - 350, 200, 50),
        new Platform(3300, height - 250, 50, 250), // Pillar
        new Platform(3400, height - 250, 300, 50),
        
        new Platform(3800, height - 350, 100, 20),
        new Platform(4000, height - 450, 100, 20),
        new Platform(4200, height - 550, 200, 50), // High peak

        // --- BOSS ARENA (4600 - 5600) ---
        new Platform(4600, height - 200, 1000, 200), // Floor
        new Platform(4600, height - 800, 50, 600), // Left Wall barrier
        new Platform(5600, height - 800, 50, 600), // Right Wall barrier
    ];
    
    // Boss Walls (Gate) - Start hidden below/above
    const wallLeft = new BossWall(4600, height, 600); 
    const wallRight = new BossWall(5550, height, 600); 

    platforms.push(wallLeft);
    platforms.push(wallRight);

    const waters = [
        new Water(400, height - 50, 300, 100, true),
        new Water(1650, height - 400, 400, 50),
        new Water(2500, height - 400, 500, 50) // Under moving platform
    ];

    const enemies: any[] = [
        new Wolf(800, height - 230, 100),
        new Wolf(2200, height - 480, 100),
        // New wolves
        new Wolf(3450, height - 280, 150),
    ];
    
    if (difficulty !== Difficulty.EASY) {
        enemies.push(new Wolf(250, height - 130, 100)); // Early scare
        enemies.push(new Wolf(2350, height - 480, 50)); 
        enemies.push(new Wolf(3100, height - 380, 50));
    }

    const collectibles = [
        new Collectible(900, height - 280),
        new Collectible(2300, height - 500),
        new Collectible(2400, height - 550),
        new Collectible(3500, height - 350),
        new Collectible(4250, height - 600)
    ];

    const exit = new Exit(5450, height - 280);
    
    // Create Boss
    const boss = new BossWolf(5000, height - 290, 4650, 5500, exit, [wallLeft, wallRight], difficulty);
    enemies.push(boss);

    const playerStart = { x: 100, y: height - 200 };

    return { platforms, enemies, collectibles, waters, exit, playerStart };
}
