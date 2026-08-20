
import { Entity, Player, Collectible, Exit, Water, Porcupine, Jellyfish, Shark, Wolf, Crab, Seagull, Snowball, ChaserEnemy, BossCatcher, BossWolf, BossExcavator, ControlPanel, FallingDebris, WreckingBall, Supervisor, JackhammerOperator } from "../entities/index";
import { initLevel } from "../levels/index";
import { inputManager } from "../Input";
import { audioManager } from "../Audio";
import { SoundType, Difficulty } from "../../types";

export interface WorldEvents {
    onScoreUpdate: (bones: number) => void;
    onTimeUpdate: (time: number) => void;
    onLevelComplete: (level: number, bones: number) => void;
    onGameOver: (reason: string, level: number, narrative: string) => void;
    onGameWon: (bones: number) => void;
}

export class World {
    public width: number;
    public height: number;
    public currentLevel: number = 1;
    public cameraX: number = 0;
    public timeLeft: number = 300;
    private frameCounter: number = 0;

    public player: Player | null = null;
    public platforms: Entity[] = [];
    public enemies: Entity[] = [];
    public collectibles: Collectible[] = [];
    public waters: Water[] = [];
    public exit: Exit | null = null;

    private events: WorldEvents;

    constructor(width: number, height: number, events: WorldEvents) {
        this.width = width;
        this.height = height;
        this.events = events;
    }

    public resize(w: number, h: number) {
        this.width = w;
        this.height = h;
    }

    public loadLevel(level: number, persistBones: boolean = true, difficulty: Difficulty = Difficulty.EASY) {
        this.currentLevel = level;
        
        const data = initLevel(level, this.height, difficulty);
        this.platforms = data.platforms;
        this.enemies = data.enemies;
        this.collectibles = data.collectibles;
        this.waters = data.waters;
        this.exit = data.exit;

        // Reset timer - Level 3 is now long, so give it more time (400)
        // Level 5 extended also needs more time
        this.timeLeft = (level === 3 || level === 5 || level >= 6) ? 400 : 300;
        this.frameCounter = 0;
        this.events.onTimeUpdate(this.timeLeft);

        const currentBones = this.player && persistBones ? this.player.bonesCollected : 0;
        this.player = new Player(data.playerStart.x, data.playerStart.y);
        this.player.bonesCollected = currentBones;
        this.events.onScoreUpdate(currentBones);

        this.cameraX = 0;

        // Music Logic
        let track = SoundType.THEME_POUND;
        switch (level) {
            case 1: case 2: track = SoundType.THEME_POUND; break;
            case 3: track = SoundType.THEME_FOREST; break;
            case 4: track = SoundType.THEME_BEACH; break;
            case 5: track = SoundType.THEME_MOUNTAIN; break;
            case 6: track = SoundType.THEME_SKI; break;
            case 7: track = SoundType.THEME_CHASE; break;
            case 8: track = SoundType.THEME_UNDERWATER; break;
            case 9: track = SoundType.THEME_PIER; break;
            case 10: track = SoundType.THEME_CONSTRUCTION; break;
        }
        audioManager.playMusic(track);
    }

    public update() {
        if (!this.player || !this.exit) return;

        // Timer
        this.frameCounter++;
        if (this.frameCounter >= 60) {
            this.frameCounter = 0;
            this.timeLeft--;
            this.events.onTimeUpdate(this.timeLeft);
            if (this.timeLeft <= 0) {
                this.triggerGameOver('timeout', 'Ran out of time and got caught');
                return;
            }
        }

        this.platforms.forEach(p => {
            if (p instanceof ControlPanel) {
                p.update(this.platforms, this.player);
            } else {
                p.update();
            }
        });
        this.waters.forEach(w => w.update());
        this.player.update(this.platforms, inputManager.keys, this.height, this.currentLevel);

        if (this.currentLevel === 8 && this.player.ridingShark && this.player.ridingShark.isGolden) {
            audioManager.playMusic(SoundType.THEME_GOLDEN_SHARK);
        }

        // Camera
        const targetCamX = this.player.x - this.width / 3;
        this.cameraX += (targetCamX - this.cameraX) * 0.1;
        if(this.cameraX < 0) this.cameraX = 0;

        // Enemy Collisions
        this.enemies.forEach(enemy => {
            enemy.update(this.platforms, this.player, this.enemies);
            
            const pad = 12;
            if (this.player && 
                this.player.x + pad < enemy.x + enemy.w - pad &&
                this.player.x + this.player.w - pad > enemy.x + pad &&
                this.player.y + pad < enemy.y + enemy.h - pad &&
                this.player.y + this.player.h - pad > enemy.y + pad
            ) {
                if (this.player.invincibleTimer > 0) return;

                // BOSS COLLISION LOGIC
                if (enemy instanceof BossCatcher || enemy instanceof BossWolf || enemy instanceof BossExcavator) {
                    if (!enemy.isActive || enemy.health <= 0) return;

                    // Check if player is above enemy (falling on head)
                    // We need to check if previous frame Y was higher to confirm downward trajectory or landing
                    // Simple check: player's bottom is near enemy top, and player is not moving up
                    if (this.player.velY >= 0 && this.player.y + this.player.h <= enemy.y + 40) {
                        // Bounce off
                        this.player.velY = -12;
                        enemy.takeHit();
                        return; // Successfully hit boss, don't take damage
                    } else if (enemy.isStunned) {
                        // If touching stunned boss but not on head, it's safe (no damage)
                        return;
                    } else {
                        // Touching active boss not on head -> DAMAGE
                        if (enemy instanceof BossWolf) {
                             this.triggerGameOver('wolfed', 'Eaten by the Alpha Wolf!');
                        } else if (enemy instanceof BossCatcher) {
                             this.triggerGameOver('caught', 'Caught by the Giant Dog Catcher');
                        } else {
                             this.triggerGameOver('excavator', 'Crushed by the heavy Excavator shovel!');
                        }
                        return;
                    }
                }

                if (enemy instanceof Jellyfish) {
                     if (this.player.ridingShark) {
                         this.player.ridingShark.markedForDeletion = true;
                         this.player.ridingShark = null;
                         this.player.invincibleTimer = 90;
                         this.player.velY = -4;
                         audioManager.playSFX(SoundType.CRASH);
                     } else {
                         this.triggerGameOver('stung', 'Stung by a purple jellyfish tentacles');
                     }
                } else if (enemy instanceof Porcupine) {
                    this.triggerGameOver('spiked', 'Pricked by a sharp porcupine quill');
                } else if (enemy instanceof Wolf) {
                    this.triggerGameOver('wolfed', 'Scared away by a growling mountain wolf');
                } else if (enemy instanceof Crab) {
                    this.triggerGameOver('crabbed', 'Pinched by a red beach crab claw');
                } else if (enemy instanceof Seagull) {
                    this.triggerGameOver('seagulled', 'Dive-bombed by an angry seagull');
                } else if (enemy instanceof Snowball) {
                    this.triggerGameOver('snowballed', 'Flattened by a giant rolling snowball');
                } else if (enemy instanceof Shark) {
                     // Non-lethal
                } else if (enemy instanceof FallingDebris) {
                    this.triggerGameOver('debris', `Bonked on the head by a heavy falling ${enemy.debrisType}!`);
                } else if (enemy instanceof WreckingBall) {
                    this.triggerGameOver('wrecking', 'Smashed by a giant swinging wrecking ball!');
                } else if (enemy instanceof Supervisor) {
                    this.triggerGameOver('caught', 'Caught by a patrolling construction supervisor!');
                } else if (enemy instanceof JackhammerOperator) {
                    this.triggerGameOver('caught', 'Ran into a high-powered vibrating pneumatic drill!');
                } else {
                    if (enemy instanceof ChaserEnemy) {
                        this.triggerGameOver('caught', 'Caught by a fast-running dog catcher');
                    } else {
                        this.triggerGameOver('caught', 'Caught by a patrolling dog catcher');
                    }
                }
            }
        });

        // Water
        this.waters.forEach(water => {
            if (this.player &&
                this.player.x < water.x + water.w &&
                this.player.x + this.player.w > water.x &&
                this.player.y + this.player.h > water.y + 15 
            ) {
                this.triggerGameOver('drowned', 'Fell into deep water and got soaked');
            }
        });

        // Collectibles
        this.collectibles.forEach(bone => {
            bone.update();
            if (this.player && !bone.markedForDeletion && 
                this.player.x < bone.x + bone.w &&
                this.player.x + this.player.w > bone.x &&
                this.player.y < bone.y + bone.h &&
                this.player.y + this.player.h > bone.y
            ) {
                bone.markedForDeletion = true;
                this.player.bonesCollected++;
                this.events.onScoreUpdate(this.player.bonesCollected);
                audioManager.playSFX(SoundType.COLLECT);
            }
        });

        if (this.player.y > this.height + 150) {
            this.triggerGameOver('fall', 'Fell off the path into the abyss');
        }

        if (this.player.x < this.exit.x + this.exit.w && this.player.x + this.player.w > this.exit.x &&
            this.player.y < this.exit.y + this.exit.h && this.player.y + this.player.h > this.exit.y) {
            
            if (this.exit.locked) {
                // Cannot exit
                // Maybe play a locked sound or visual cue?
            } else {
                this.triggerLevelComplete();
            }
        }

        this.platforms = this.platforms.filter(p => !p.markedForDeletion);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.collectibles = this.collectibles.filter(c => !c.markedForDeletion);
    }

    private triggerLevelComplete() {
        audioManager.stopMusic();
        audioManager.playSFX(SoundType.WIN_SHORT);
        if (this.currentLevel < 10) {
            this.events.onLevelComplete(this.currentLevel, this.player?.bonesCollected || 0);
        } else {
            this.events.onGameWon(this.player?.bonesCollected || 0);
        }
    }

    private triggerGameOver(reason: string, narrative: string) {
        audioManager.stopMusic();
        if (reason === 'drowned') audioManager.playSFX(SoundType.SPLASH);
        else audioManager.playSFX(SoundType.CRASH);
        setTimeout(() => audioManager.playSFX(SoundType.LOSE_SHORT), 400);
        this.events.onGameOver(reason, this.currentLevel, narrative);
    }
}
