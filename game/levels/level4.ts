
import { Platform, Collectible, Exit, Umbrella, Water, Crab } from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

export function getLevel4(height: number, difficulty: Difficulty): LevelData {
    const platforms = [
        new Platform(0, height - 100, 300, 100),
        new Platform(-50, 0, 50, height),
        new Platform(600, height - 100, 200, 100),
        new Umbrella(850, height - 100),
        new Platform(950, height - 300, 300, 50),
        new Platform(1450, height - 100, 80, 200),
        new Platform(1600, height - 100, 80, 200),
        new Platform(1800, height - 100, 600, 100),
        new Umbrella(2100, height - 100),
        new Platform(2200, height - 250, 200, 50)
    ];

    const waters = [
        new Water(300, height - 50, 300, 100, true),
        new Water(1300, height - 50, 500, 100, true)
    ];

    const enemies = [
        new Crab(650, height - 130, 50),
        new Crab(1000, height - 330, 100),
        new Crab(1900, height - 130, 150)
    ];

    if (difficulty !== Difficulty.EASY) {
        enemies.push(new Crab(1850, height - 130, 50));
        enemies.push(new Crab(2250, height - 280, 50));
    }

    const collectibles = [
        new Collectible(1050, height - 400),
        new Collectible(2250, height - 300)
    ];

    const exit = new Exit(2300, height - 330);
    const playerStart = { x: 100, y: height - 200 };

    return { platforms, enemies, collectibles, waters, exit, playerStart };
}
