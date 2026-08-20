
import { Platform, Enemy, Collectible, Exit, RevolvingPlatform, BossCatcher, BossWall } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

export function getLevel2(height: number, difficulty: Difficulty): LevelData {
    const platforms = [
        new Platform(0, height - 50, 300, 50),
        new Platform(-50, 0, 50, height),
        new RevolvingPlatform(500, height - 100, 120, 0.01, 100, 20, 0),
        new RevolvingPlatform(500, height - 100, 120, 0.01, 100, 20, Math.PI),
        new Platform(800, height - 150, 200, 50),
        new RevolvingPlatform(1200, height - 250, 150, -0.0075, 100, 20, 0),
        new RevolvingPlatform(1200, height - 250, 150, -0.0075, 100, 20, Math.PI * 0.66),
        new RevolvingPlatform(1200, height - 250, 150, -0.0075, 100, 20, Math.PI * 1.33),
        new Platform(1500, height - 100, 400, 50),
        new RevolvingPlatform(2100, height - 50, 200, 0.005, 120, 20, Math.PI/2),
        // Path to Arena
        new Platform(2300, height - 300, 300, 50),
        new Platform(2700, height - 150, 150, 20),
        
        // BOSS ARENA (3000 - 4000)
        new Platform(3000, height - 50, 1000, 50), // Floor
        new Platform(3000, 0, 1000, 50), // Ceiling
    ];
    
    // Boss Walls (Gate) - Start hidden below/above
    const wallLeft = new BossWall(3000, height, 400); // Rises from ground
    const wallRight = new BossWall(3950, height, 400); 

    platforms.push(wallLeft);
    platforms.push(wallRight);

    const enemies: any[] = [
        new Enemy(850, height - 200, 50, 0.8),
        new Enemy(1600, height - 150, 100, 0.8)
    ];

    if (difficulty !== Difficulty.EASY) {
        enemies.push(new Enemy(2400, height - 350, 80, 1.2)); 
        enemies.push(new Enemy(1700, height - 150, 80, 1.0)); 
    }

    const collectibles = [
        new Collectible(1220, height - 450),
        new Collectible(900, height - 200),
        new Collectible(3500, height - 200) // Boss arena reward
    ];

    // Locked exit at end of arena
    const exit = new Exit(3900, height - 130);
    
    // Add Boss
    const boss = new BossCatcher(3500, height - 200, 3050, 3900, exit, [wallLeft, wallRight], difficulty);
    enemies.push(boss);

    const playerStart = { x: 100, y: height - 200 };

    return { platforms, enemies, collectibles, waters: [], exit, playerStart };
}
