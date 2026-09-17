
import { CUSTOM_LEVEL, validateLevel } from './LevelBuilder';
import { Belongings } from './Shop';
import { HOME_LEVEL } from './Home';
import { GameState, SoundType, Difficulty } from "../types";
import { audioManager } from "./Audio";
import { Renderer } from "./engine/Renderer";
import { World } from "./engine/World";
import { CutsceneManager, type CutsceneType } from "./engine/CutsceneManager";
import { gfxSettings } from "./GfxSettings";
import { inputManager } from './Input';
import { SAVE_SLOTS, saveKey, saveName, parseSave, packBelongings, unpackBelongings, type SaveGame } from './SaveGame';

interface GameEngineOptions {
    onSaveError?: (message: string) => void;
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
    private currentCutscene: CutsceneType = 'intro';
    public sessionMode: 'saved' | 'free' | null = null;
    public cheatsEnabled = false;
    public activeSave: { slot: number; name: string; difficulty: Difficulty } | null = null;
    private lastSaveText: string | null = null;
    private lastSnapshot = '';
    private saveQueued = false;
    private failureReason: string | undefined;
    
    // Default difficulty
    private difficulty: Difficulty = Difficulty.EASY;
    private isLoopRunning = false;
    private printPaused = false;

    public setPrintPaused(paused: boolean) {
        this.printPaused = paused;
        this.cutsceneManager.setPaused(paused || this.gameState !== GameState.CUTSCENE);
    }
    private practiceSession: { belongings: Belongings; bones: number; difficulty: Difficulty; level: number } | null = null;

    constructor(canvas: HTMLCanvasElement, options: GameEngineOptions) {
        this.options = { ...options,
            onStateChange: (state, data) => {
                if (state === GameState.GAME_OVER) this.failureReason = data?.reason;
                else if (state === GameState.PLAYING) this.failureReason = undefined;
                options.onStateChange(state, data); this.queueSave();
            },
            onScoreUpdate: bones => { options.onScoreUpdate(bones); this.queueSave(); },
            onShopUpdate: () => { options.onShopUpdate?.(); this.queueSave(); },
        };
        this.renderer = new Renderer(canvas);
        
        // Initialize World
        this.world = new World(window.innerWidth, window.innerHeight, {
            onRaccoonIntro: () => {
                this.currentCutscene = 'raccoon_intro'; this.gameState = GameState.CUTSCENE;
                this.options.onStateChange(GameState.CUTSCENE, { text: '' }); audioManager.stopMusic();
                this.cutsceneManager.start('raccoon_intro');
            },
            onShopUpdate: this.options.onShopUpdate,
            onScoreUpdate: this.options.onScoreUpdate,
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

    private queueSave() {
        if (!this.activeSave || this.saveQueued) return;
        this.saveQueued = true;
        // World callbacks can fire halfway through a purchase or level load.
        queueMicrotask(() => { this.saveQueued = false; this.saveProgress(); });
    }

    public saveProgress(): boolean {
        if (this.sessionMode !== 'saved' || !this.activeSave || !this.world.player) return true;
        const practice = this.practiceSession;
        const snapshot = {
            version: 1 as const, name: this.activeSave.name, difficulty: this.activeSave.difficulty,
            level: practice ? HOME_LEVEL : this.world.currentLevel,
            homeFloor: practice ? 'basement' as const : this.world.homeFloor,
            bones: practice?.bones ?? this.world.player.bonesCollected,
            belongings: packBelongings(practice?.belongings ?? this.world.belongings),
            // The boss introduction belongs to its arena; replay it when the restarted run reaches it.
            state: practice || (this.gameState === GameState.CUTSCENE && this.currentCutscene === 'raccoon_intro') ? GameState.PLAYING : this.gameState,
            cutscene: practice ? 'house_chase' as const : this.currentCutscene,
            reason: practice ? undefined : this.failureReason,
        };
        try {
            const key = saveKey(this.activeSave.slot);
            if (localStorage.getItem(key) !== this.lastSaveText) {
                this.options.onSaveError?.('This save changed in another tab. Reload to continue the newer save. Changes made here have not been saved.');
                return false;
            }
            const packed = JSON.stringify(snapshot);
            if (packed === this.lastSnapshot) return true;
            const raw = JSON.stringify({ ...snapshot, updatedAt: Date.now() });
            parseSave(raw);
            localStorage.setItem(key, raw);
            this.lastSaveText = raw; this.lastSnapshot = packed;
            this.options.onSaveError?.('');
            return true;
        } catch (error) {
            this.options.onSaveError?.(`Couldn’t save. ${error instanceof Error ? error.message : 'Browser storage is unavailable.'} Keep this tab open and retry.`);
            return false;
        }
    }

    public openSave(slot: number, name?: string, difficulty = Difficulty.EASY): boolean {
        if (this.sessionMode || !Number.isInteger(slot) || slot < 0 || slot >= SAVE_SLOTS) return false;
        try {
            const raw = localStorage.getItem(saveKey(slot));
            if (name !== undefined && raw !== null) throw Error('This slot is already occupied. Choose another slot.');
            const saved: SaveGame | null = raw === null ? null : parseSave(raw);
            if (!saved && !saveName(name ?? '')) throw Error('Give your adventure a name first.');
            this.options.onSaveError?.('');
            this.lastSaveText = raw; this.lastSnapshot = '';
            this.cheatsEnabled = false;
            this.cutsceneManager.setPaused(true);
            this.startGame(saved?.difficulty ?? difficulty);
            if (saved) {
                this.world.belongings = unpackBelongings(saved.belongings);
                this.world.homeFloor = saved.homeFloor;
                this.world.player!.bonesCollected = saved.bones;
                this.startLevel(saved.level, saved.difficulty);
                this.currentCutscene = saved.cutscene;
                this.gameState = saved.state;
                this.options.onStateChange(saved.state, { level: saved.level, bones: saved.bones, reason: saved.reason, text: '' });
                if (saved.state === GameState.CUTSCENE) this.cutsceneManager.start(saved.cutscene);
                else this.cutsceneManager.setPaused(true);
            } else this.startCutscene();
            this.activeSave = { slot, name: saved?.name ?? saveName(name!), difficulty: saved?.difficulty ?? difficulty };
            this.sessionMode = 'saved';
            if (saved) { const { updatedAt, ...snapshot } = saved; this.lastSnapshot = JSON.stringify(snapshot); }
            if (!this.saveProgress()) {
                this.returnToTitle(false); return false;
            }
            this.options.onShopUpdate?.();
            return true;
        } catch (error) {
            this.options.onSaveError?.(error instanceof Error ? error.message : 'Browser storage is unavailable.');
            return false;
        }
    }

    public startFreeRoam(difficulty = Difficulty.EASY) {
        if (this.sessionMode) return false;
        this.sessionMode = 'free'; this.activeSave = null; this.cheatsEnabled = false;
        this.options.onSaveError?.(''); this.startGame(difficulty); return true;
    }

    public returnToTitle(save = true) {
        if (save && !this.saveProgress()) return false;
        this.cutsceneManager.setPaused(true); audioManager.stopMusic(); inputManager.clear();
        this.activeSave = null; this.sessionMode = null; this.cheatsEnabled = false;
        this.gameState = GameState.INTRO;
        this.options.onStateChange(GameState.INTRO);
        return true;
    }

    public warpToLevel(level: number) {
        if (this.sessionMode !== 'free' || !Number.isInteger(level) || level < 1 || level > HOME_LEVEL) return false;
        if (this.practiceSession) this.goHome();
        if (level === HOME_LEVEL) { this.world.belongings.homeUnlocked = true; this.world.homeFloor = 'ground'; }
        this.startLevel(level, this.difficulty); return true;
    }

    public enableCheats(enabled: boolean) {
        this.cheatsEnabled = this.sessionMode === 'free' && enabled;
        this.options.onShopUpdate?.();
    }

    public cheat(kind: 'bones' | 'treats' | 'time') {
        if (this.sessionMode !== 'free' || !this.cheatsEnabled || this.gameState !== GameState.PLAYING || !this.world.player) return false;
        if (kind === 'bones') { this.world.player.bonesCollected += 100; this.options.onScoreUpdate(this.world.player.bonesCollected); }
        else if (kind === 'treats') this.world.belongings.slots = ['shield', 'magnet', 'time'];
        else if (kind === 'time') { this.world.timeLeft += 60; this.options.onTimeUpdate(this.world.timeLeft); }
        else return false;
        this.options.onShopUpdate?.(); return true;
    }

    private resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.resize(w, h);
        this.world.resize(w, h);
    }

    public setDifficulty(difficulty: Difficulty) {
        if (this.sessionMode === 'saved') return;
        this.difficulty = difficulty;
        if (this.practiceSession) this.practiceSession.difficulty = difficulty;
        else if (this.sessionMode === 'free' && this.gameState === GameState.PLAYING) this.startLevel(this.world.currentLevel, difficulty);
    }

    public startLevel(level: number, difficulty: Difficulty = Difficulty.EASY) {
        if (level === HOME_LEVEL && !this.world.belongings.homeUnlocked) return;
        if (this.activeSave && !this.practiceSession) difficulty = this.activeSave.difficulty;
        this.cutsceneManager.setPaused(true);
        this.difficulty = difficulty;
        this.world.loadLevel(level, this.world.player !== null, difficulty);
        this.gameState = GameState.PLAYING;
        this.options.onStateChange(GameState.PLAYING);
        if (level === HOME_LEVEL && !this.world.belongings.houseIntroSeen) {
            this.currentCutscene = 'house_chase'; this.gameState = GameState.CUTSCENE;
            this.options.onStateChange(GameState.CUTSCENE, { text: '' });
            this.cutsceneManager.start('house_chase');
        }
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
        this.difficulty = this.activeSave?.difficulty ?? difficulty;
        this.currentCutscene = 'town_intro';
        this.gameState = GameState.CUTSCENE;
        this.options.onStateChange(GameState.CUTSCENE, { text: "" });
        audioManager.stopMusic();
        this.cutsceneManager.start('town_intro');
        this.startLoop();
    }

    public skipCutscene() {
        if (this.gameState === GameState.CUTSCENE) this.cutsceneManager.skip();
    }

    private endCutscene() {
        if (this.currentCutscene === 'house_chase') {
            this.world.belongings.houseIntroSeen = true;
            this.world.belongings.quests.peace ??= 'accepted';
            this.world.homeNotice = 'Samwise needs distraction biscuits! Find the blue tin in the kitchen, then bring it to him in the entry hall.';
            this.startLevel(HOME_LEVEL, this.difficulty);
        } else if (this.currentCutscene === 'homecoming') {
            this.gameState = GameState.GAME_WON;
            this.options.onStateChange(GameState.GAME_WON, { bones: this.world.player?.bonesCollected ?? 0, level: 14 });
        } else if (this.currentCutscene === 'raccoon_intro') {
            this.world.finishRaccoonIntro(); this.gameState = GameState.PLAYING; this.options.onStateChange(GameState.PLAYING);
        } else if (this.currentCutscene === 'intro') {
            this.startLevel(1, this.difficulty);
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
        this.cutsceneManager.setPaused(true);
        this.isLoopRunning = false;
        if (this.frameId) cancelAnimationFrame(this.frameId);
        audioManager.stopMusic();
    }
}
