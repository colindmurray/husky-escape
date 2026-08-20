import { Entity, Collectible, Exit, Water } from "../entities/index";

export interface LevelData {
    platforms: Entity[];
    enemies: Entity[];
    collectibles: Collectible[];
    waters: Water[];
    exit: Exit;
    playerStart: { x: number, y: number };
}