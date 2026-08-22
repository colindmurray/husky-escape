import { Entity, Collectible, Exit, Water } from "../entities/index";

export interface LevelData {
    platforms: Entity[];
    enemies: Entity[];
    collectibles: Collectible[];
    waters: Water[];
    exit: Exit;
    playerStart: { x: number, y: number };
    /** Optional decorative props (roof cats etc.): updated + drawn, never solid or lethal. */
    props?: Entity[];
    /**
     * Total world height in px (defaults to the viewport height). When larger
     * than the viewport the camera scrolls vertically (Zone 11). The world's
     * BOTTOM edge stays fixed at y = viewport height, so extra height extends
     * upward above the visible screen.
     */
    worldHeight?: number;
}