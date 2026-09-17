
import { CUSTOM_LEVEL, validateLevel } from './LevelBuilder';
import { Belongings } from './Shop';
import { HOME_LEVEL } from './Home';
import { GameState, SoundType, Difficulty } from "../types";
import { audioManager } from "./Audio";
import { Renderer } from "./engine/Renderer";
import { World } from "./engine/World";
import { CutsceneManager } from "./engine/CutsceneManager";
import { gfxSettings } from "./GfxSettings";

interface GameEngineOptions {
    onShopUpdate?: () => void;
    onStateChange: (state: GameState, data?: any) => void;
    onScoreUpdate: (bones: number) => void;
    onTimeUpdate: (time: number) => void;
}

export class GameEngine {
    private renderer: Renderer;
    public world: World;
    public cutsceneManager: CutsceneManager;
    private frameId: number = 0;
    private options: GameEngineOptions;
    public gameState: GameState = GameState.INTRO;
    private currentCutscene: 'intro' | 'chase' | 'underwater_intro' | 'pound_escape' | 'pier_intro' | 'neon_intro' | 'bakery_intro' | 'town_intro' | 'raccoon_intro' | 'homecoming' = 'intro';
    
    // Default difficulty
    private difficulty: Difficulty = Difficulty.EASY;
    private isLoopRunning = false;
    private printPaused = false;

    public setPrintPaused(paused: boolean) {
        this.printPaused = paused;
        this.cutsceneManager.setPaused(paused);
    }
    private practiceSession: { belongings: Belongings; bones: number; difficulty: Difficulty; level: number } | null = null;

    constructor(canvas: HTMLCanvasElement, options: GameEngineOptions) {
        this.options = options;
        this.renderer = new Renderer(canvas);
        
        // Initialize World
        this.world = new World(window.innerWidth, window.innerHeight, {
            onRaccoonIntro: () => {
                this.currentCutscene = 'raccoon_intro'; this.gameState = GameState.CUTSCENE;
                this.options.onStateChange(GameState.CUTSCENE, { text: '' }); audioManager.stopMusic();
                this.cutsceneManager.start('raccoon_intro');
            },
            onShopUpdate: options.onShopUpdate,
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
                this.currentCutscene = 'homecoming'; this.gameState = GameState.CUTSCENE;
                this.options.onStateChange(GameState.CUTSCENE, { text: '' });
                this.cutsceneManager.start('homecoming');
            }
        });

        // Initialize Cutscenes
        this.cutsceneManager = new CutsceneManager(
            (text) => this.options.onStateChange(GameState.CUTSCENE, { text }),
            () => this.endCutscene()
        );

        this.resize();
        window.addEventListener('resize', () => this.resize());
        // Keep the render loop alive from boot so the Enhanced title backdrop
        // animates behind the main menu (classic mode draws nothing here).
        this.startLoop();
    }

    private resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.resize(w, h);
        this.world.resize(w, h);
    }

    public setDifficulty(difficulty: Difficulty) { this.difficulty = difficulty; if (this.practiceSession) this.practiceSession.difficulty = difficulty; }

    public startLevel(level: number, difficulty: Difficulty = Difficulty.EASY) {
        if (level === HOME_LEVEL && !this.world.belongings.homeUnlocked) return;
        this.difficulty = difficulty;
        this.world.loadLevel(level, this.world.player !== null, difficulty);
        this.gameState = GameState.PLAYING;
        this.options.onStateChange(GameState.PLAYING);
        this.startLoop();
    }

    public goHome() {
        if (!this.world.belongings.homeUnlocked) return;
        if (this.practiceSession) {
            const saved = this.practiceSession;
            this.world.belongings = saved.belongings;
            this.world.player!.bonesCollected = saved.bones;
            this.difficulty = saved.difficulty; this.world.homeFloor = 'basement';
            this.world.practice = false; this.practiceSession = null;
        } else this.world.homeFloor = 'ground';
        this.startLevel(HOME_LEVEL, this.difficulty);
    }

    public startPractice(level: number) {
        if (!this.world.isHome || this.world.homeFloor !== 'basement' || !this.world.belongings.homeUnlocked || !this.world.player || this.practiceSession ||
            !Number.isInteger(level) || (level !== CUSTOM_LEVEL && (level < 1 || level > 14)) || (level === CUSTOM_LEVEL && validateLevel(this.world.editorDraft))) return false;
        this.practiceSession = { belongings: this.world.belongings, bones: this.world.player.bonesCollected, difficulty: this.difficulty, level };
        this.retryPractice(); return true;
    }

    public retryPractice() {
        const saved = this.practiceSession; if (!saved || !this.world.player) return;
        this.world.belongings = Object.assign(new Belongings(), structuredClone(saved.belongings));
        this.world.player.bonesCollected = saved.bones;
        this.world.practice = true;
        this.startLevel(saved.level, Difficulty.HARDCORE);
    }

    public returnToEditor() {
        if (!this.practiceSession || this.practiceSession.level !== CUSTOM_LEVEL) return;
        this.goHome(); this.world.openHomePanel('builder');
    }

    public revisitLevel(level: number) {
        if (!this.world.isHome || !this.world.belongings.homeUnlocked || !Number.isInteger(level) || level < 1 || level > 14) return;
        this.startLevel(level, this.difficulty);
    }

    public startGame(difficulty: Difficulty = Difficulty.EASY) {
        this.practiceSession = null; this.world.practice = false;
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
    
    public startNeonCutscene() {
        this.currentCutscene = 'neon_intro';
        this.gameState = GameState.CUTSCENE;
        this.options.onStateChange(GameState.CUTSCENE, { text: "" });
        audioManager.stopMusic();
        this.cutsceneManager.start('neon_intro');
        this.startLoop();
    }

    public startBakeryCutscene() {
        this.currentCutscene = 'bakery_intro';
        this.gameState = GameState.CUTSCENE;
        this.options.onStateChange(GameState.CUTSCENE, { text: "" });
        audioManager.stopMusic();
        this.cutsceneManager.start('bakery_intro');
        this.startLoop();
    }

    public startTownCutscene(difficulty: Difficulty = this.difficulty) {
        this.difficulty = difficulty;
        this.currentCutscene = 'town_intro';
        this.gameState = GameState.CUTSCENE;
        this.options.onStateChange(GameState.CUTSCENE, { text: "" });
        audioManager.stopMusic();
        this.cutsceneManager.start('town_intro');
        this.startLoop();
    }

    public skipCutscene() {
        this.cutsceneManager.skip();
    }

    private endCutscene() {
        if (this.currentCutscene === 'homecoming') {
            this.gameState = GameState.GAME_WON;
            this.options.onStateChange(GameState.GAME_WON, { bones: this.world.player?.bonesCollected ?? 0, level: 14 });
        } else if (this.currentCutscene === 'raccoon_intro') {
            this.world.finishRaccoonIntro(); this.gameState = GameState.PLAYING; this.options.onStateChange(GameState.PLAYING);
        } else if (this.currentCutscene === 'intro') {
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
        } else if (this.currentCutscene === 'neon_intro') {
            // Start Level 11: Neon Metropolis
            this.startLevel(11, this.difficulty);
        } else if (this.currentCutscene === 'town_intro') {
            this.startLevel(13, this.difficulty);
        } else if (this.currentCutscene === 'bakery_intro') {
            // Start Level 12: The Warm Bakery
            this.startLevel(12, this.difficulty);
        }
    }

    private startLoop() {
        if (this.isLoopRunning) return;
        this.isLoopRunning = true;
        if (this.frameId) cancelAnimationFrame(this.frameId);
        const loop = () => {
            if (!this.isLoopRunning) return;
            if (this.printPaused) { this.frameId = requestAnimationFrame(loop); return; }
            if (this.gameState === GameState.PLAYING) {
                this.world.update();
                this.renderer.drawGame(this.world);
            } else if (this.gameState === GameState.INTRO) {
                // Enhanced mode: animated title backdrop behind the React menu.
                if (gfxSettings.visualMode === 'enhanced') {
                    this.renderer.drawMenuBackdrop(this.world.width, this.world.height);
                }
            } else if (this.gameState === GameState.CUTSCENE) {
                this.cutsceneManager.update();
                this.renderer.drawCutscene(this.cutsceneManager, this.world.width, this.world.height);
                this.renderer.drawCinematicOverlay(this.cutsceneManager, this.world.width, this.world.height);
            }
            this.frameId = requestAnimationFrame(loop);
        };
        this.frameId = requestAnimationFrame(loop);
    }

    public stop() {
        this.isLoopRunning = false;
        if (this.frameId) cancelAnimationFrame(this.frameId);
        audioManager.stopMusic();
    }
}
