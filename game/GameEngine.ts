
import { GameState, SoundType, Difficulty } from "../types";
import { audioManager } from "./Audio";
import { Renderer } from "./engine/Renderer";
import { World } from "./engine/World";
import { CutsceneManager } from "./engine/CutsceneManager";

interface GameEngineOptions {
    onStateChange: (state: GameState, data?: any) => void;
    onScoreUpdate: (bones: number) => void;
    onTimeUpdate: (time: number) => void;
}

export class GameEngine {
    private renderer: Renderer;
    private world: World;
    private cutsceneManager: CutsceneManager;
    private frameId: number = 0;
    private options: GameEngineOptions;
    public gameState: GameState = GameState.INTRO;
    private currentCutscene: 'intro' | 'chase' | 'underwater_intro' | 'pound_escape' | 'pier_intro' = 'intro';
    
    // Default difficulty
    private difficulty: Difficulty = Difficulty.EASY;

    constructor(canvas: HTMLCanvasElement, options: GameEngineOptions) {
        this.options = options;
        this.renderer = new Renderer(canvas);
        
        // Initialize World
        this.world = new World(window.innerWidth, window.innerHeight, {
            onScoreUpdate: options.onScoreUpdate,
            onTimeUpdate: options.onTimeUpdate,
            onLevelComplete: (level, bones) => {
                 this.gameState = GameState.LEVEL_COMPLETE;
                 this.options.onStateChange(GameState.LEVEL_COMPLETE, { level, bones });
            },
            onGameOver: (reason, level, narrative) => {
                this.gameState = GameState.GAME_OVER;
                this.options.onStateChange(GameState.GAME_OVER, { reason, level, narrative });
            },
            onGameWon: (bones) => {
                this.gameState = GameState.GAME_WON;
                this.options.onStateChange(GameState.GAME_WON, { bones });
            }
        });

        // Initialize Cutscenes
        this.cutsceneManager = new CutsceneManager(
            (text) => this.options.onStateChange(GameState.CUTSCENE, { text }),
            () => this.endCutscene()
        );

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    private resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.resize(w, h);
        this.world.resize(w, h);
    }

    public startLevel(level: number, difficulty: Difficulty = Difficulty.EASY) {
        this.difficulty = difficulty;
        this.world.loadLevel(level, this.world.player !== null, difficulty);
        this.gameState = GameState.PLAYING;
        this.options.onStateChange(GameState.PLAYING);
        this.startLoop();
    }

    public startGame(difficulty: Difficulty = Difficulty.EASY) {
        this.world.player = null; // Force reset
        this.startLevel(1, difficulty);
    }

    public startCutscene() {
        this.currentCutscene = 'intro';
        this.gameState = GameState.CUTSCENE;
        this.options.onStateChange(GameState.CUTSCENE);
        audioManager.playMusic(SoundType.THEME_POUND); 
        this.cutsceneManager.start('intro');
        this.startLoop();
    }
    
    public startPoundEscapeCutscene() {
        this.currentCutscene = 'pound_escape';
        this.gameState = GameState.CUTSCENE;
        this.options.onStateChange(GameState.CUTSCENE, { text: "" });
        audioManager.stopMusic(); 
        this.cutsceneManager.start('pound_escape');
        this.startLoop();
    }

    public startChaseCutscene() {
        this.currentCutscene = 'chase';
        this.gameState = GameState.CUTSCENE;
        this.options.onStateChange(GameState.CUTSCENE, { text: "" }); // Reset text
        audioManager.stopMusic(); // Silence before chaos
        this.cutsceneManager.start('chase');
        this.startLoop();
    }

    public startUnderwaterCutscene() {
        this.currentCutscene = 'underwater_intro';
        this.gameState = GameState.CUTSCENE;
        this.options.onStateChange(GameState.CUTSCENE, { text: "" });
        audioManager.stopMusic();
        this.cutsceneManager.start('underwater_intro');
        this.startLoop();
    }

    public startPierCutscene() {
        this.currentCutscene = 'pier_intro';
        this.gameState = GameState.CUTSCENE;
        this.options.onStateChange(GameState.CUTSCENE, { text: "" });
        audioManager.stopMusic();
        this.cutsceneManager.start('pier_intro');
        this.startLoop();
    }
    
    public skipCutscene() {
        this.cutsceneManager.skip();
    }

    private endCutscene() {
        if (this.currentCutscene === 'intro') {
            this.gameState = GameState.INTRO; 
            audioManager.stopMusic();
            this.options.onStateChange(GameState.INTRO, { showMenu: true });
        } else if (this.currentCutscene === 'pound_escape') {
            this.startLevel(3, this.difficulty);
        } else if (this.currentCutscene === 'chase') {
            // Immediately start Level 7
            this.startLevel(7, this.difficulty);
        } else if (this.currentCutscene === 'underwater_intro') {
            // Start Level 8
            this.startLevel(8, this.difficulty);
        } else if (this.currentCutscene === 'pier_intro') {
            // Start Level 9
            this.startLevel(9, this.difficulty);
        }
    }

    private startLoop() {
        if (this.frameId) cancelAnimationFrame(this.frameId);
        const loop = () => {
            if (this.gameState === GameState.PLAYING) {
                this.world.update();
                this.renderer.drawGame(this.world);
            } else if (this.gameState === GameState.CUTSCENE) {
                this.cutsceneManager.update();
                this.renderer.drawCutscene(this.cutsceneManager, this.world.width, this.world.height);
            }
            this.frameId = requestAnimationFrame(loop);
        };
        this.frameId = requestAnimationFrame(loop);
    }

    public stop() {
        cancelAnimationFrame(this.frameId);
        audioManager.stopMusic();
    }
}
