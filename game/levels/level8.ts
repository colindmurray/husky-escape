
import { Platform, Collectible, Exit, Jellyfish, Shark, Entity } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

export function getLevel8(height: number, difficulty: Difficulty): LevelData {
    // Extended Underwater Level (approx 10000px)
    
    // --- PLATFORMS ---
    // Note: Sharks are added here as platforms so they can be ridden
    const platforms: Platform[] = [
        // Start Cave
        new Platform(0, height - 100, 300, 100),
        new Platform(-50, 0, 50, height), // Left wall
        
        // --- ZONE 1: The Reef (0 - 2000) ---
        new Platform(400, 0, 100, 300),
        new Platform(600, height - 200, 100, 200),
        new Platform(800, 0, 100, 450), // Stalactite
        
        // Shark 1: Helper to get through fast (Normal)
        new Shark(900, height - 300, 900, 1500),
        
        new Platform(1100, height - 300, 100, 300),
        new Platform(1400, 0, 200, 300),
        new Platform(1600, height - 150, 200, 150),

        // --- ZONE 2: The Tunnel (2000 - 3500) ---
        new Platform(2000, 0, 1500, 200), // Ceiling
        new Platform(2000, height - 200, 1500, 200), // Floor
        // Obstacles inside tunnel
        new Platform(2400, height - 350, 50, 150),
        new Platform(2800, 200, 50, 150),
        new Platform(3200, height - 350, 50, 150),

        // --- ZONE 3: Open Ocean (3500 - 6000) ---
        // Big gaps, rely on swimming or Sharks
        new Platform(3600, height - 100, 200, 100),
        
        new Shark(3900, height - 200, 3800, 4800), // Shark 2
        
        // ** THE GOLDEN SHARK **
        // Fast, patroling a large area in the middle
        new Shark(4200, height - 300, 4000, 6000, true), 
        
        new Platform(5000, height - 150, 200, 150),
        
        new Shark(5300, height - 300, 5200, 6200), // Shark 4
        
        // --- ZONE 4: Deep Trench (6000 - 8000) ---
        // Floor drops out
        new Platform(6000, 0, 2000, 100), // Ceiling
        // No floor here! Just deep water.
        
        new Shark(6200, height - 500, 6200, 7500), // High shark
        new Shark(6200, height - 100, 6200, 7500), // Low shark
        
        new Platform(7000, height/2 - 50, 200, 100), // Floating rock island
        
        // --- ZONE 5: Final Ascent (8000 - 10000) ---
        new Platform(8200, height - 100, 200, 100), // Checkpoint-ish
        
        new Platform(8500, 0, 50, height - 300), // Wall blocking high path
        new Platform(8500, height - 200, 50, 200), // Wall blocking low path -> Gap in middle
        
        new Shark(8700, height/2, 8600, 9500), // Final Shark
        
        new Platform(9500, height - 100, 800, 100), // Landing
    ];

    // --- ENEMIES ---
    const enemies: Entity[] = [
        // Zone 1
        new Jellyfish(500, height/2),
        new Jellyfish(700, 200),
        new Jellyfish(1200, height - 200),
        new Jellyfish(1300, height/2),
        
        // Zone 2 (Tunnel Swarm)
        new Jellyfish(2200, height/2),
        new Jellyfish(2500, height/2 - 50),
        new Jellyfish(2600, height/2 + 50),
        new Jellyfish(2900, height/2),
        new Jellyfish(3100, height/2 - 30),
        new Jellyfish(3300, height/2 + 30),

        // Zone 3 (Open Ocean Schools)
        new Jellyfish(3800, 200),
        new Jellyfish(3900, 300),
        new Jellyfish(4000, 200),
        
        new Jellyfish(4500, height - 200),
        new Jellyfish(4600, height - 300),
        new Jellyfish(4700, height - 200),
        
        new Jellyfish(5500, height/2),

        // Zone 4 (Trench Hazards)
        new Jellyfish(6300, 200),
        new Jellyfish(6500, height - 200),
        new Jellyfish(6700, height/2),
        new Jellyfish(7200, 300),
        new Jellyfish(7400, height - 300),
        new Jellyfish(7600, height/2),

        // Zone 5 (Final Guard)
        new Jellyfish(8400, height/2),
        new Jellyfish(8450, height/2 - 100),
        new Jellyfish(8450, height/2 + 100),
        
        new Jellyfish(9000, 200),
        new Jellyfish(9200, height - 300)
    ];

    if (difficulty !== Difficulty.EASY) {
        // Add random clusters of Jellyfish in the open areas
        for(let i=0; i<10; i++) {
            enemies.push(new Jellyfish(4000 + i*400, height/2 + (Math.random() * 200 - 100)));
        }
        // Extra guards near golden shark
        enemies.push(new Jellyfish(4300, height/2));
        enemies.push(new Jellyfish(4400, height/2));
    }

    const collectibles = [
        new Collectible(500, height - 100),
        new Collectible(2500, height/2),
        new Collectible(4000, height - 500),
        new Collectible(6500, height/2),
        new Collectible(7050, height/2 - 100),
        new Collectible(9000, height - 200)
    ];

    const exit = new Exit(9800, height - 180);
    const playerStart = { x: 100, y: height - 200 };

    return { platforms, enemies, collectibles, waters: [], exit, playerStart };
}
