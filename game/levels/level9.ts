
import { Platform, Collectible, Exit, UmbrellaPickup, Seagull, MovingPlatform, Water } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

export function getLevel9(height: number, difficulty: Difficulty): LevelData {
    // Height is standard canvas height (likely ~600-800 depending on screen)
    // Level is linear but verticality matters for gliding

    const platforms = [
        // Start: The Docks
        new Platform(0, height - 100, 300, 100),
        new Platform(-50, 0, 50, height),
        
        // Umbrella Pickup Intro
        new Platform(400, height - 150, 100, 20),
        new UmbrellaPickup(430, height - 200),
        
        // First Gliding Gap (Test mechanics)
        new Platform(600, height - 150, 20, 150), // Piling
        new Platform(750, height - 150, 20, 150),
        new Platform(900, height - 150, 20, 150),
        
        // Safe Platform
        new Platform(1000, height - 200, 300, 200),
        
        // High construction crane structure
        new Platform(1400, height - 300, 20, 300), // Crane leg
        new Platform(1400, height - 300, 400, 20), // Crane arm
        
        // Long glide gap over water
        new Platform(2100, height - 150, 300, 150), // Landing
        
        // Moving Crate
        new MovingPlatform(2500, height - 200, 100, 100, 2500, 2800, 1.5),
        
        // Higher path requires wind assist
        new Platform(3000, height - 400, 200, 20),
        new Platform(3300, height - 350, 200, 20),
        
        // Broken Pier section (Poles only)
        new Platform(3600, height - 100, 20, 100),
        new Platform(3750, height - 120, 20, 120),
        new Platform(3900, height - 100, 20, 100),
        new Platform(4050, height - 120, 20, 120),
        
        // Final Lighthouse Base area
        new Platform(4200, height - 150, 600, 150)
    ];

    const waters = [
        // Instant death water below
        new Water(0, height - 50, 5000, 100, true)
    ];

    const enemies = [
        new Seagull(1200, height - 300, 200),
        new Seagull(1800, height - 350, 300),
        new Seagull(2600, height - 300, 200),
        new Seagull(3200, height - 500, 200), // High altitude
        new Seagull(3800, height - 200, 150)
    ];

    if (difficulty !== Difficulty.EASY) {
        enemies.push(new Seagull(800, height - 200, 100)); // Early annoyance
        enemies.push(new Seagull(2200, height - 200, 200)); // Over landing
        enemies.push(new Seagull(3600, height - 150, 200)); // Harassing pole jumps
    }

    const collectibles = [
        new Collectible(750, height - 250),
        new Collectible(1600, height - 350), // On crane
        new Collectible(3100, height - 450)  // High path
    ];

    const exit = new Exit(4600, height - 230);
    const playerStart = { x: 100, y: height - 200 };

    return { platforms, enemies, collectibles, waters, exit, playerStart };
}
