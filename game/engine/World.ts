import { getHome, HOME_LEVEL, HOME_WIDTH, HomeDog, QUESTS, QuestPickup, COMPANIONS, FLOORS, type HomeFloor } from '../Home';
import { buildCustomLevel, CUSTOM_LEVEL, loadDraft } from '../LevelBuilder';
import { BossRaccoon, Raccoon, TrashLid } from '../entities/Backyard';

import { addSecretShop, Belongings, SHOP_GOODS, isSupply, type ShopGood, SecretDoghouse } from "../Shop";
import { Entity, Player, Collectible, Exit, Water, Porcupine, Jellyfish, Shark, Wolf, Crab, Seagull, Snowball, ChaserEnemy, BossCatcher, BossWolf, BossExcavator, ControlPanel, FallingDebris, WreckingBall, Supervisor, JackhammerOperator, SecurityDrone, Pastry, FlourMoth, DoughBlob, BakerChaser, BossBaker, PackagingPress, OvenMouth, BatterVat } from "../entities/index";
import { MarchingBand, TownPlatform, TownPedestrian, TownCyclist, RollingApple, TownTimedHazard, YardDog } from "../entities/Town";
import { initLevel } from "../levels/index";
import { inputManager } from "../Input";
import { audioManager } from "../Audio";
import { SoundType, Difficulty } from "../../types";

export interface WorldEvents {
    onRaccoonIntro?: () => void;
    onShopUpdate?: () => void;
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
    /**
     * Vertical camera: world-y currently at the viewport's TOP edge.
     * 0 = ground view (default for levels without vertical scrolling);
     * negative = scrolled up. Clamped to [height - worldHeight, 0].
     */
    public cameraY: number = 0;
    /** Total vertical span of the current level's world (defaults to viewport height). */
    private worldHeight: number = 0;
    public timeLeft: number = 300;
    private frameCounter: number = 0;
    private ended = false;

    public player: Player | null = null;
    public platforms: Entity[] = [];
    public enemies: Entity[] = [];
    public collectibles: Collectible[] = [];
    public waters: Water[] = [];
    public props: Entity[] = [];
    public exit: Exit | null = null;
    public difficulty: Difficulty = Difficulty.EASY;

    public belongings = new Belongings();
    public shopDoor: SecretDoghouse | null = null;
    public shopOpen = false;
    public homePanel: string | null = null;
    public homeFloor: HomeFloor = 'ground';
    public editorDraft = loadDraft();
    public practice = false;
    public companions: HomeDog[] = [];
    private playerTrail: { x: number; y: number; grounded: boolean }[] = [];
    public get isCustom() { return this.currentLevel === CUSTOM_LEVEL; }
    public get isHome() { return this.currentLevel === HOME_LEVEL; }
    public raccoonIntroPending = false;
    public shopMessage = '';
    private shopKeyHeld: Record<string, boolean> = {};
    private boneIds = new Map<Collectible, string>();
    private events: WorldEvents;

    constructor(width: number, height: number, events: WorldEvents) {
        this.width = width;
        this.height = height;
        this.events = events;
    }

    public resize(w: number, h: number) {
        if (this.isHome) {
            const dy = h - this.height;
            for (const entity of [...this.platforms, ...this.props, this.player, this.exit]) if (entity) entity.y += dy;
            this.worldHeight = h;
        }
        this.width = w;
        this.height = h;
        // Keep the vertical camera inside the (possibly resized) world bounds
        this.clampCameraY();
    }

    public loadLevel(level: number, persistBones: boolean = true, difficulty: Difficulty = Difficulty.EASY) {
        if (level === HOME_LEVEL && (!persistBones || !this.player || !this.belongings.homeUnlocked)) return;
        const newJourney = !persistBones || !this.player;
        if (newJourney) { this.belongings = new Belongings(); this.homeFloor = 'ground'; this.practice = false; }
        this.homePanel = null; this.shopOpen = false; this.shopMessage = ''; this.shopKeyHeld = {}; inputManager.clear();
        this.ended = false; this.raccoonIntroPending = false;
        this.currentLevel = level;
        this.difficulty = difficulty;
        
        const data = this.isHome ? getHome(this.height, this.homeFloor) : this.isCustom ? buildCustomLevel(this.editorDraft, this.height) : initLevel(level, this.height, difficulty);
        this.shopDoor = addSecretShop(data, level, this.height, difficulty);
        if (this.shopDoor && this.belongings.unlockedShops.has(level)) {
            this.shopDoor.unlocked = true; this.shopDoor.seals.fill(true);
        }
        if (this.isHome && this.homeFloor === 'ground') {
            this.shopDoor = new SecretDoghouse(1260, this.height - 166, [], 'Home branch');
            this.shopDoor.unlocked = true; this.shopDoor.seals.fill(true); data.props!.push(this.shopDoor);
        }
        for (const quest of QUESTS) {
            if (!this.practice && this.belongings.homeUnlocked && quest.level === level && this.belongings.quests[quest.id] === 'accepted') {
                (data.props ??= []).push(new QuestPickup(quest, this.height));
            }
        }
        this.boneIds.clear();
        data.collectibles.forEach((bone, i) => this.boneIds.set(bone, `${level}:${i}`));
        data.collectibles = data.collectibles.filter(bone => !this.belongings.collectedBones.has(this.boneIds.get(bone)!));
        this.platforms = data.platforms;
        this.enemies = data.enemies;
        this.collectibles = data.collectibles;
        this.waters = data.waters;
        this.props = data.props || [];
        this.exit = data.exit;
        this.worldHeight = data.worldHeight ?? this.height;

        // Reset timer - Level 3 is now long, so give it more time (400)
        // Level 5 extended also needs more time
        this.timeLeft = (level === 3 || level === 5 || level >= 6) ? 400 : 300;
        this.frameCounter = 0;
        this.events.onTimeUpdate(this.timeLeft);

        const currentBones = this.player && persistBones ? this.player.bonesCollected : 0;
        this.player = new Player(data.playerStart.x, data.playerStart.y);
        this.player.bonesCollected = currentBones;
        this.player.accessories = this.belongings.equipped;
        this.playerTrail = [];
        this.companions = this.isHome ? [] : COMPANIONS.filter(c => this.belongings.companions.has(c.id)).map(c => { const dog = new HomeDog(c, this.player!.y + 40); dog.following = true; return dog; });
        this.events.onScoreUpdate(currentBones);

        this.cameraX = 0;
        this.cameraY = 0;

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
            case 11: track = SoundType.THEME_NEON; break;
            case 12: track = SoundType.THEME_BAKERY; break;
            case 13: track = SoundType.THEME_TOWN; break;
            case HOME_LEVEL: track = SoundType.THEME_HOME; break;
            case 14: track = SoundType.THEME_BACKYARD; break;
        }
        audioManager.playMusic(track);
        this.events.onShopUpdate?.();
    }

    public update() {
        if (this.ended || !this.player || !this.exit) return;

        for (const key of ['KeyE', 'Escape', 'Digit1', 'Digit2', 'Digit3'] as const) {
            const pressed = !!inputManager.keys[key], justPressed = inputManager.consumePress(key) || (pressed && !this.shopKeyHeld[key]);
            this.shopKeyHeld[key] = pressed;
            if (!justPressed) continue;
            if (key === 'KeyE') {
                if (this.homePanel) this.closeHomePanel();
                else if (this.shopOpen) this.closeShop();
                else if (this.isHome) {
                    const dog = this.props.find(p => p instanceof HomeDog && p.nearby) as HomeDog | undefined;
                    if (dog) this.openHomePanel(dog.quest.id);
                    else if (Math.abs(this.player.x - 1110) < 85) this.openHomePanel('floors');
                    else if (this.homeFloor === 'basement' && Math.abs(this.player.x - 430) < 100) this.openHomePanel('practice');
                    else if (this.homeFloor === 'basement' && Math.abs(this.player.x - 830) < 100) this.openHomePanel('builder');
                    else if (this.homeFloor === 'ground' && this.player.x < 210) this.openHomePanel('travel');
                    else this.openShop();
                } else this.openShop();
            }
            else if (key === 'Escape') { if (this.shopOpen) this.closeShop(); if (this.homePanel) this.closeHomePanel(); }
            else if (key.startsWith('Digit') && !this.shopOpen) this.useInventorySlot(Number(key.at(-1)) - 1);
        }
        if (this.shopOpen || this.homePanel) return;

        if (this.raccoonIntroPending) return;
        const raccoonBoss = this.enemies.find(e => e instanceof BossRaccoon) as BossRaccoon | undefined;
        if (raccoonBoss && !raccoonBoss.introPlayed && this.player.x >= raccoonBoss.arenaLeft + 100 && this.player.grounded) {
            this.raccoonIntroPending = true; inputManager.clear(); this.player.velX = 0;
            if (this.events.onRaccoonIntro) this.events.onRaccoonIntro(); else this.finishRaccoonIntro();
            return;
        }

        // Timer
        if (!this.isHome) this.frameCounter++;
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
        for (const prop of this.props) {
            const near = prop instanceof HomeDog && prop.nearby;
            if (prop !== this.shopDoor) prop.update(this.player);
            if (prop instanceof HomeDog && near !== prop.nearby) this.events.onShopUpdate?.();
        }
        this.waters.forEach(w => w.update());
        this.player.update(this.platforms, inputManager.keys, this.height, this.currentLevel);
        const wasNear = this.shopDoor?.nearby, wasUnlocked = this.shopDoor?.unlocked;
        this.shopDoor?.update(this.player);
        if (this.shopDoor?.unlocked) this.belongings.unlockedShops.add(this.currentLevel);
        if (wasNear !== this.shopDoor?.nearby || wasUnlocked !== this.shopDoor?.unlocked) this.events.onShopUpdate?.();

        if (this.currentLevel === 8 && this.player.ridingShark && this.player.ridingShark.isGolden) {
            audioManager.playMusic(SoundType.THEME_GOLDEN_SHARK);
        }

        if (this.currentLevel === 13) {
            const floats = this.platforms.filter(p => p instanceof TownPlatform && p.kind === 'float') as TownPlatform[];
            if (floats.length === 3 && floats.every(p => p.boarded)) this.exit.unlock();
        }

        // Camera
        const targetCamX = this.player.x - this.width / 3;
        this.cameraX += (targetCamX - this.cameraX) * 0.1;
        if(this.cameraX < 0) this.cameraX = 0;
        this.updateCameraY();

        if (this.isHome) {
            this.player.x = Math.max(0, Math.min(HOME_WIDTH - this.player.w, this.player.x));
            this.cameraX = Math.min(this.cameraX, Math.max(0, HOME_WIDTH - this.width));
            return;
        }

        // Enemy Collisions
        this.enemies.forEach(enemy => {
            if (this.ended || enemy.markedForDeletion) return;
            enemy.update(this.platforms, this.player, this.enemies, this.waters);
            
            if (enemy.markedForDeletion) return;
            const townHazard = enemy instanceof TownCyclist || enemy instanceof RollingApple || enemy instanceof TownTimedHazard || enemy instanceof YardDog;
            if (enemy instanceof RollingApple && !enemy.active) return;
            if ((enemy instanceof TownCyclist || enemy instanceof TownTimedHazard || enemy instanceof YardDog) && !enemy.dangerous) return;
            const pad = (enemy instanceof Raccoon || enemy instanceof BossRaccoon || enemy instanceof TrashLid || enemy instanceof Pastry || townHazard || enemy instanceof TownPedestrian || enemy instanceof MarchingBand) ? 4 : 12;
            if (this.player && 
                this.player.x + pad < enemy.x + enemy.w - pad &&
                this.player.x + this.player.w - pad > enemy.x + pad &&
                this.player.y + pad < enemy.y + enemy.h - pad &&
                this.player.y + this.player.h - pad > enemy.y + pad
            ) {
                if (enemy instanceof MarchingBand) {
                    this.triggerGameOver('parade', 'Swept into the marching band! Stay on the floats and raised benches.');
                    return;
                }
                if (this.player.invincibleTimer > 0) return;

                if (enemy instanceof TownPedestrian) {
                    if (!this.player.hasBandana && this.player.townBumpFrames === 0) {
                        this.player.velX = this.player.x + this.player.w / 2 < enemy.x + enemy.w / 2 ? -3 : 3;
                        this.player.velY = -3;
                        this.player.townBumpFrames = 40;
                        audioManager.playSFX(SoundType.LAND);
                    }
                    return;
                }
                if (townHazard) {
                    if (this.player.hasBandana) {
                        this.player.hasBandana = false;
                        this.player.invincibleTimer = 100;
                        this.player.velY = -7;
                        audioManager.playSFX(SoundType.COLLECT);
                    } else {
                        const reason = enemy instanceof TownCyclist ? 'cycled' : enemy instanceof RollingApple ? 'appled' : enemy instanceof TownTimedHazard ? (enemy.kind === 'roadwork' ? 'roadwork' : 'sprinkled') : 'yarddog';
                        const narrative = enemy instanceof TownCyclist ? 'A delivery bike caught up! Listen for the bell and wait on a bench.' : enemy instanceof RollingApple ? 'Bonked by a loose apple! Take the market awnings.' : enemy instanceof TownTimedHazard ? (enemy.kind === 'roadwork' ? 'Caught by a rising roadwork post! Wait for it to retract.' : enemy.kind === 'hydrant' ? 'Soaked by a leaking hydrant! Wait for the burst to stop.' : 'Soaked by a fountain jet! Wait for it to switch off.') : 'Chased out of the garden! Jump the fence after the bark.';
                        this.triggerGameOver(reason, narrative);
                    }
                    return;
                }

                if (enemy instanceof BossRaccoon || enemy instanceof Raccoon) {
                    if (enemy instanceof BossRaccoon && !enemy.isActive) return;
                    const stomp = this.player.velY >= 0 && this.player.y + this.player.h <= enemy.y + 35;
                    if (stomp) {
                        this.player.y = enemy.y - this.player.h;
                        this.player.velY = -12; this.player.grounded = false; this.player.jumpsLeft = 1;
                        if (enemy instanceof BossRaccoon) enemy.takeHit(this.enemies);
                        else { enemy.markedForDeletion = true; audioManager.playSFX(SoundType.BOSS_HIT); }
                    } else if (!(enemy instanceof BossRaccoon && enemy.isStunned)) {
                        this.triggerGameOver('raccoon', enemy instanceof BossRaccoon ? 'Baron von Bins charged into you! Dodge, then jump on his head while he is dizzy.' : 'Caught by a backyard raccoon! Jump over it or land on its head.');
                    }
                    return;
                }
                if (enemy instanceof TrashLid) { this.triggerGameOver('trashlid', 'Bonked by a flying trash lid! Watch the Baron’s hat before he charges.'); return; }

                // BOSS COLLISION LOGIC
                if (enemy instanceof BossCatcher || enemy instanceof BossWolf || enemy instanceof BossExcavator || enemy instanceof BossBaker) {
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
                        } else if (enemy instanceof BossBaker) {
                             this.triggerGameOver('baker', 'Caught by the Night Baker\'s rolling pin!');
                        } else if (enemy instanceof BossCatcher) {
                             this.triggerGameOver('caught', 'Caught by the Giant Dog Catcher');
                        } else {
                             this.triggerGameOver('excavator', 'Crushed by the heavy Excavator shovel!');
                        }
                        return;
                    }
                }

                if (enemy instanceof SecurityDrone) {
                     this.triggerGameOver('droned', 'Busted by a security drone\'s patrol light');
                } else if (enemy instanceof Jellyfish) {
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
                } else if (enemy instanceof Pastry) {
                    this.triggerGameOver('pastried', 'Bonked by a bakery pastry! Time your jumps and dodge them!');
                } else if (enemy instanceof FlourMoth) {
                    this.triggerGameOver('mothed', 'Tickled senseless by a flour moth!');
                } else if (enemy instanceof DoughBlob) {
                    this.triggerGameOver('dough', 'Swallowed by a wobbly dough blob!');
                } else if (enemy instanceof PackagingPress) {
                    // The press is only lethal while slamming or fully down
                    if (enemy.isLethal()) {
                        this.triggerGameOver('pressed', 'Flattened like a pancake by the packaging press! Time your dash!');
                    }
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
                    } else if (enemy instanceof BakerChaser) {
                        this.triggerGameOver('caught', 'Caught by the apprentice baker\'s net!');
                    } else {
                        this.triggerGameOver('caught', 'Caught by a patrolling dog catcher');
                    }
                }
            }
        });

        if (this.ended) return;

        // Water
        this.waters.forEach(water => {
            if (this.player &&
                this.player.x < water.x + water.w &&
                this.player.x + this.player.w > water.x &&
                this.player.y + this.player.h > water.y + 15 &&
                (!this.isCustom || this.player.y < water.y + water.h)
            ) {
                if (water instanceof OvenMouth) {
                    this.triggerGameOver('baked', 'Baked into a cake! Hop the cooling racks to get past the oven!');
                } else if (water instanceof BatterVat) {
                    this.triggerGameOver('battered', 'Plopped into raw cake batter! Jump the vat!');
                } else {
                    this.triggerGameOver('drowned', 'Fell into deep water and got soaked');
                }
            }
        });

        if (this.ended) return;

        this.playerTrail.push({ x: this.player.x, y: this.player.y, grounded: this.player.grounded });
        if (this.playerTrail.length > 85) this.playerTrail.shift();
        for (const [i, dog] of this.companions.entries()) {
            const point = this.playerTrail[this.playerTrail.length - 1 - (i + 1) * 24];
            if (point) { dog.velX = point.x - dog.x; dog.x = point.x; dog.y = point.y; dog.grounded = point.grounded; dog.update(this.player); dog.nearby = false; }
        }

        for (const prop of this.props) {
            if (prop instanceof QuestPickup && !prop.markedForDeletion && this.belongings.quests[prop.quest.id] === 'accepted' &&
                this.player.x < prop.x + prop.w && this.player.x + this.player.w > prop.x &&
                this.player.y < prop.y + prop.h && this.player.y + this.player.h > prop.y) {
                prop.markedForDeletion = true;
                this.belongings.quests[prop.quest.id] = 'found';
                audioManager.playSFX(SoundType.COLLECT); this.events.onShopUpdate?.();
            }
        }

        // Collectibles
        this.collectibles.forEach(bone => {
            bone.update();
            if (this.player && this.player.magnetTimer > 0 && Math.hypot(bone.x - this.player.x, bone.y - this.player.y) < 165) {
                bone.x += (this.player.x + 10 - bone.x) * 0.15;
                bone.y += (this.player.y + 15 - bone.y) * 0.15;
            }
            if (this.player && !bone.markedForDeletion && 
                this.player.x < bone.x + bone.w &&
                this.player.x + this.player.w > bone.x &&
                this.player.y < bone.y + bone.h &&
                this.player.y + this.player.h > bone.y
            ) {
                bone.markedForDeletion = true;
                const id = this.boneIds.get(bone);
                if (id) this.belongings.collectedBones.add(id);
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
        this.props = this.props.filter(pr => !pr.markedForDeletion);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.collectibles = this.collectibles.filter(c => !c.markedForDeletion);
    }

    public get followingDogs() { return this.companions.filter((_, i) => this.playerTrail.length > (i + 1) * 24); }

    public changeHomeFloor(floor: HomeFloor) {
        if (!this.isHome || !this.belongings.homeUnlocked || this.shopOpen || !Object.hasOwn(FLOORS, floor)) return false;
        this.homeFloor = floor; this.loadLevel(HOME_LEVEL, true, this.difficulty);
        audioManager.playSFX(SoundType.LAND); return true;
    }

    public toggleCompanion() {
        const dog = COMPANIONS.find(c => c.id === this.homePanel);
        if (!dog || !this.isHome || this.homeFloor !== 'upstairs') return false;
        if (!this.belongings.companions.delete(dog.id)) this.belongings.companions.add(dog.id);
        audioManager.playSFX(SoundType.DOG_BARK); this.events.onShopUpdate?.(); return true;
    }

    public openHomePanel(panel: string) {
        if (!this.isHome || this.ended || this.shopOpen || !this.player) return false;
        const station = panel === 'floors' || panel === 'travel' || (this.homeFloor === 'basement' && (panel === 'practice' || panel === 'builder'));
        if (!station && !this.props.some(p => p instanceof HomeDog && p.quest.id === panel && p.nearby)) return false;
        this.homePanel = panel; this.player.velX = 0; inputManager.clear();
        audioManager.playSFX(station ? SoundType.COLLECT : SoundType.DOG_BARK); this.events.onShopUpdate?.(); return true;
    }

    public closeHomePanel() {
        this.homePanel = null; inputManager.clear(); this.events.onShopUpdate?.();
    }

    public respondToDog() {
        const quest = QUESTS.find(q => q.id === this.homePanel);
        if (!quest || !this.isHome || !this.player || this.ended) return false;
        const status = this.belongings.quests[quest.id];
        if (!status) this.belongings.quests[quest.id] = 'accepted';
        else if (status === 'found') {
            this.belongings.quests[quest.id] = 'complete';
            this.player.bonesCollected += quest.reward;
            this.events.onScoreUpdate(this.player.bonesCollected);
        } else return false;
        audioManager.playSFX(status === 'found' ? SoundType.WIN_SHORT : SoundType.COLLECT);
        this.events.onShopUpdate?.(); return true;
    }

    public finishRaccoonIntro() {
        if (!this.raccoonIntroPending) return;
        this.raccoonIntroPending = false; inputManager.clear();
        const boss = this.enemies.find(e => e instanceof BossRaccoon) as BossRaccoon | undefined;
        boss?.activate();
    }

    public openShop() {
        if (this.ended || this.homePanel || !this.player || !this.shopDoor?.unlocked || !this.shopDoor.nearby) return false;
        this.shopOpen = true; this.shopMessage = ''; this.player.velX = 0; inputManager.clear();
        audioManager.playSFX(SoundType.COLLECT); this.events.onShopUpdate?.(); return true;
    }

    public closeShop() {
        this.shopOpen = false; inputManager.clear(); this.events.onShopUpdate?.();
    }

    public buyGood(id: ShopGood) {
        if (!this.shopOpen || this.ended || !this.player || !Object.hasOwn(SHOP_GOODS, id)) return false;
        const good = SHOP_GOODS[id];
        if (!isSupply(id) && this.belongings.owned.has(id)) {
            this.belongings.toggleAccessory(id);
            this.shopMessage = this.belongings.equipped.has(id) ? `${good.name} equipped.` : `${good.name} put away.`;
        } else {
            const slot = this.belongings.slots.indexOf(null);
            if (this.player.bonesCollected < good.price || (isSupply(id) && slot === -1)) {
                this.shopMessage = this.player.bonesCollected < good.price ? 'A few more bones first!' : 'Your three pockets are full. Save these treats for the trail.';
                this.events.onShopUpdate?.(); return false;
            }
            this.player.bonesCollected -= good.price;
            if (isSupply(id)) this.belongings.slots[slot] = id;
            else { this.belongings.owned.add(id); this.belongings.toggleAccessory(id); }
            this.shopMessage = isSupply(id) ? `${good.name} tucked into pocket ${slot + 1}.` : `${good.name} is yours!`;
            audioManager.playSFX(SoundType.COLLECT); this.events.onScoreUpdate(this.player.bonesCollected);
        }
        this.events.onShopUpdate?.(); return true;
    }

    public useInventorySlot(index: number) {
        if (this.ended || this.isHome || this.homePanel || this.shopOpen || this.raccoonIntroPending || !this.player || !Number.isInteger(index) || index < 0 || index > 2) return false;
        const item = this.belongings.slots[index]; if (!item) return false;
        if (item === 'shield') {
            if (this.player.invincibleTimer > 0) return false;
            this.player.invincibleTimer = 300;
        } else if (item === 'magnet') {
            if (this.player.magnetTimer > 0) return false;
            this.player.magnetTimer = 600;
        } else { this.timeLeft += 30; this.events.onTimeUpdate(this.timeLeft); }
        this.belongings.slots[index] = null;
        audioManager.playSFX(SoundType.BOOST); this.events.onShopUpdate?.(); return true;
    }

    /**
     * Vertical scrolling (Zone 11): soft center-follow. Onyx is kept inside a
     * deadzone band around the middle of the screen; the camera eases toward
     * true centering gently while he's inside the band and more firmly when he
     * leaves it, so the motion is smooth both climbing up and dropping back
     * down, but never rigidly locked.
     */
    private updateCameraY() {
        if (this.worldHeight <= this.height) return; // no vertical scroll for flat levels
        const desiredCamTop = (this.player.y + this.player.h / 2) - this.height / 2;
        const screenY = this.player.y - this.cameraY;
        const inDeadzone = screenY > this.height * 0.32 && screenY < this.height * 0.62;
        const ease = inDeadzone ? 0.02 : 0.09;
        this.cameraY += (desiredCamTop - this.cameraY) * ease;
        this.clampCameraY();
    }

    private clampCameraY() {
        if (this.worldHeight <= this.height) { this.cameraY = 0; return; }
        const minTop = this.height - this.worldHeight;
        if (this.cameraY < minTop) this.cameraY = minTop;
        if (this.cameraY > 0) this.cameraY = 0;
    }

    private triggerLevelComplete() {
        if (this.ended) return;
        this.ended = true;
        audioManager.stopMusic();
        audioManager.playSFX(SoundType.WIN_SHORT);
        if (this.currentLevel < 14 || this.practice) {
            this.events.onLevelComplete(this.currentLevel, this.player?.bonesCollected || 0);
        } else {
            this.belongings.homeUnlocked = true;
            this.events.onGameWon(this.player?.bonesCollected || 0);
        }
    }

    private triggerGameOver(reason: string, narrative: string) {
        if (this.ended) return;
        this.ended = true;
        audioManager.stopMusic();
        if (reason === 'drowned') audioManager.playSFX(SoundType.SPLASH);
        else audioManager.playSFX(SoundType.CRASH);
        setTimeout(() => audioManager.playSFX(SoundType.LOSE_SHORT), 400);
        this.events.onGameOver(reason, this.currentLevel, narrative);
    }
}
