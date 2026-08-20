
import { LevelData } from "./types";
import { getLevel1 } from "./level1";
import { getLevel2 } from "./level2";
import { getLevel3 } from "./level3";
import { getLevel4 } from "./level4";
import { getLevel5 } from "./level5";
import { getLevel6 } from "./level6";
import { getLevel7 } from "./level7";
import { getLevel8 } from "./level8";
import { getLevel9 } from "./level9";
import { getLevel10 } from "./level10";
import { Exit } from "../entities/Exit";
import { Difficulty } from "../../types";

export * from './types';

export function initLevel(level: number, height: number, difficulty: Difficulty): LevelData {
    switch(level) {
        case 1: return getLevel1(height, difficulty);
        case 2: return getLevel2(height, difficulty);
        case 3: return getLevel3(height, difficulty);
        case 4: return getLevel4(height, difficulty);
        case 5: return getLevel5(height, difficulty);
        case 6: return getLevel6(height, difficulty);
        case 7: return getLevel7(height, difficulty);
        case 8: return getLevel8(height, difficulty);
        case 9: return getLevel9(height, difficulty);
        case 10: return getLevel10(height, difficulty);
        default: 
            return {
                platforms: [],
                enemies: [],
                collectibles: [],
                waters: [],
                exit: new Exit(0, 0),
                playerStart: { x: 0, y: 0 }
            };
    }
}
