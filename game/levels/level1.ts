
import { Platform, Enemy, Collectible, Exit } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

export function getLevel1(height: number, difficulty: Difficulty): LevelData {
    const platforms = [
        new Platform(0, height - 50, 600, 50),
        new Platform(700, height - 50, 600, 50),
        new Platform(1500, height - 50, 1000, 50),
        new Platform(300, height - 180, 150, 20),
        new Platform(550, height - 280, 150, 20),
        new Platform(800, height - 150, 150, 20),
        new Platform(1100, height - 250, 100, 20),
        new Platform(1300, height - 350, 150, 20),
        new Platform(1300, height - 150, 100, 20),
        new Platform(-50, 0, 50, height)
    ];

    const enemies = [
        new Enemy(800, height - 100, 100),
        new Enemy(1800, height - 100, 150),
        new Enemy(550, height - 330, 40)
    ];

    if (difficulty !== Difficulty.EASY) {
        enemies.push(new Enemy(1000, height - 100, 100, 1.5));
        enemies.push(new Enemy(2000, height - 100, 100, 1.5));
    }

    const collectibles = [
        new Collectible(580, height - 320),
        new Collectible(1130, height - 290),
        new Collectible(1600, height - 90)
    ];

    const exit = new Exit(2200, height - 130);
    const playerStart = { x: 100, y: height - 200 };

    return { platforms, enemies, collectibles, waters: [], exit, playerStart };
}
