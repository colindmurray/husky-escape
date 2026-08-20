import { 
    Platform, 
    Collectible, 
    Exit, 
    MovingPlatform, 
    RevolvingPlatform, 
    BossExcavator, 
    BossWall, 
    CraneGirder, 
    ControlPanel, 
    WreckingBall, 
    Supervisor, 
    JackhammerOperator, 
    LunchboxThrower 
} from "../entities/index";
import { LevelData } from "./types";
import { Difficulty } from "../../types";

export function getLevel10(height: number, difficulty: Difficulty): LevelData {
    // Level 10: Construction Site with moving cranes, wrecking balls, and workers
    
    // 1. Set up dynamic crane platforms that are interactive or vertical lifts
    const hoistA = new CraneGirder(1100, height - 360, 140, 20, height - 420, height - 140, 2.0, "Crane Hoist A");
    const hoistB = new CraneGirder(2050, height - 320, 110, 20, height - 380, height - 160, 1.5, "Crane Hoist B");
    
    // G-10 Carriage Girder (Links with the Button Panel at start)
    const bridgeGirder = new CraneGirder(480, height - 460, 125, 20, height - 460, height - 460, 0, "Bridge G-10");
    const buttonPanel = new ControlPanel(210, height - 115, bridgeGirder, 480, height - 260);

    const platforms: any[] = [
        // Spawn/Start Station
        new Platform(0, height - 100, 350, 100),
        new Platform(-50, 0, 50, height), // Left boundary wall

        // Scaffolding Climbing Section
        new Platform(450, height - 160, 140, 160), 
        new Platform(650, height - 250, 120, 20), // Shaken by Jackhammer Operator
        
        // Interactive carriage girder
        bridgeGirder,
        buttonPanel,

        // High Girder
        new Platform(830, height - 320, 150, 20),
        
        // Vertical lift crane platforms
        hoistA,
        hoistB,
        
        // Giant Rotating Concrete mixer gears
        new RevolvingPlatform(1650, height - 350, 150, 0.02, 100, 20),
        new RevolvingPlatform(1650, height - 350, 150, 0.02, 100, 20, Math.PI), 

        new Platform(1900, height - 250, 100, 250), 
        
        // Elevated hook structures
        new Platform(2200, height - 380, 150, 20), // Shaken by Jackhammer Operator
        new Platform(2450, height - 460, 140, 20),
        new MovingPlatform(2700, height - 350, 110, 25, 2700, 3100, 2.5), 
        
        // Climb down section
        new Platform(3200, height - 200, 180, 200),
        
        // BOSS ARENA FOOTING (Level Ground from 3350 to 4450)
        new Platform(3350, height - 100, 1100, 100),
    ];

    const waters: any[] = []; 

    // Left and Right Arena Gate Walls
    const wallLeft = new BossWall(3350, height, 400);
    const wallRight = new BossWall(4400, height, 400);

    platforms.push(wallLeft);
    platforms.push(wallRight);

    // Instantiate Boss
    const exit = new Exit(4550, height - 215);
    const boss = new BossExcavator(3800, height - 230, 3420, 4280, exit, [wallLeft, wallRight], difficulty);

    // Register Boss's custom sub-platforms so player collides with them correctly
    platforms.push(boss.cabinPlatform);
    platforms.push(boss.armPlatform);

    const enemies: any[] = [
        // Swinging Wrecking Balls over gaps
        new WreckingBall(610, 20, 230, 45, 1.6),   // Swinging ball over the scaffolding climber
        new WreckingBall(1430, 10, 250, 50, 1.4),  // Swinging ball before concrete gear

        // Jackhammer Operators vibrating their respective metal scopes
        new JackhammerOperator(680, height - 305), // Standing on scaffold 650
        new JackhammerOperator(2250, height - 435), // Standing on girder 2200

        // Lunchbox / Hardhat Throwers standing overhead
        new LunchboxThrower(890, height - 375, 130), // Throwing from high girder 830
        new LunchboxThrower(2490, height - 515, 110), // Throwing from girder 2450
        
        // Excavator Boss
        boss
    ];

    if (difficulty === Difficulty.HARD || difficulty === Difficulty.HARDCORE) {
        // Supervisors are added only on hard/hardcore difficulty
        enemies.push(new Supervisor(50, height - 155, 100, 1.3));
        enemies.push(new Supervisor(1900, height - 305, 30, 1.5));
        enemies.push(new Supervisor(3210, height - 255, 40, 1.7));
    }

    const collectibles = [
        new Collectible(510, height - 230),
        new Collectible(890, height - 380),
        new Collectible(1650, height - 450), 
        new Collectible(2270, height - 450),
        new Collectible(2490, height - 520),
    ];

    const playerStart = { x: 80, y: height - 220 };

    return { platforms, enemies, collectibles, waters, exit, playerStart };
}
