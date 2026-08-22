import { SoundType } from "../../types";
import { audioManager } from "../Audio";

type CutsceneType = 'intro' | 'chase' | 'underwater_intro' | 'pound_escape' | 'pier_intro' | 'neon_intro';

export class CutsceneManager {
    public step = 0;
    public frame = 0;
    public currentType: CutsceneType = 'intro';
    private timer: any = null;
    private onTextChange: (text: string) => void;
    private onComplete: () => void;

    private storyLines = {
        'intro': [
            { text: "You are a dog named Onyx.", sound: null },
            { text: "You ran away from your house because you wanted to have some fun...", sound: null },
            { text: "...but you got caught by the Pound.", sound: SoundType.CRASH },
            { text: "This is very sad for you.\nYou realize you miss home and are very scared.", sound: null },
            { text: "You decide to escape and find your way home!", sound: SoundType.WIN_SHORT }
        ],
        'pound_escape': [
            { text: "FREEDOM! You made it out!", sound: SoundType.WIN_SHORT },
            { text: "The Pound is far behind you now.", sound: null },
            { text: "But that was the easy part...", sound: SoundType.LOSE_SHORT },
            { text: "Now you must cross the dark forest.", sound: SoundType.THEME_FOREST },
            { text: "Find your way home, Onyx!", sound: null }
        ],
        'chase': [
            { text: "You made it down the mountain...", sound: null },
            { text: "But wait...", sound: null },
            { text: "OH NO! The Pound found you!", sound: SoundType.CRASH },
            { text: "They are right behind you!", sound: null },
            { text: "RUN FOR YOUR LIFE!", sound: SoundType.THEME_CHASE }
        ],
        'underwater_intro': [
            { text: "Phew! You outran the dog catcher...", sound: null },
            { text: "...but you ran straight off a cliff!", sound: SoundType.SPLASH },
            { text: "Unfortunately, the only way forward is underwater.", sound: null },
            { text: "Good thing you brought your snorkeling gear!", sound: SoundType.COLLECT },
            { text: "Swim for it, Onyx!", sound: SoundType.THEME_UNDERWATER }
        ],
        'neon_intro': [
            { text: "You reached the harbor. The whole city glitters across the water...", sound: SoundType.SPLASH },
            { text: "Home is somewhere beyond those lights.", sound: null },
            { text: "But the city never sleeps -- and neither do its machines.", sound: SoundType.DRONE_ALERT },
            { text: "Ride the rooftop fans. Dodge the drones.", sound: SoundType.BOOST },
            { text: "Almost home, Onyx!", sound: SoundType.THEME_NEON }
        ],
        'pier_intro': [
            { text: "You surface from the deep ocean...", sound: SoundType.SPLASH },
            { text: "Look! In the distance! City lights!", sound: SoundType.WIN_SHORT },
            { text: "You are getting close to home.", sound: null },
            { text: "But a storm is rolling in...", sound: SoundType.LOSE_SHORT },
            { text: "Cross the pier before the storm gets worse!", sound: SoundType.THEME_PIER }
        ]
    };

    constructor(onTextChange: (text: string) => void, onComplete: () => void) {
        this.onTextChange = onTextChange;
        this.onComplete = onComplete;
    }

    start(type: CutsceneType = 'intro') {
        // Bug fix: clear any pending line timer from a previous run so
        // restarting a cutscene can't run two timer chains in parallel.
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.currentType = type;
        this.step = 0;
        this.frame = 0;
        this.nextLine();
    }

    update() {
        this.frame++;
    }

    skip() {
        if (this.timer) clearTimeout(this.timer);
        this.onComplete();
    }

    private nextLine() {
        const lines = this.storyLines[this.currentType];
        
        if (this.step >= lines.length) {
            this.onComplete();
            return;
        }

        const line = lines[this.step];
        if (line.sound) {
            if (line.sound === SoundType.THEME_CHASE) {
                audioManager.playMusic(SoundType.THEME_CHASE);
            } else if (line.sound === SoundType.THEME_UNDERWATER) {
                audioManager.playMusic(SoundType.THEME_UNDERWATER);
            } else if (line.sound === SoundType.THEME_FOREST) {
                audioManager.playMusic(SoundType.THEME_FOREST);
            } else if (line.sound === SoundType.THEME_PIER) {
                audioManager.playMusic(SoundType.THEME_PIER);
            } else if (line.sound === SoundType.THEME_NEON) {
                audioManager.playMusic(SoundType.THEME_NEON);
            } else {
                audioManager.playSFX(line.sound);
            }
        }
        
        this.onTextChange(line.text);
        
        this.frame = 0; 
        this.step++;

        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.nextLine();
        }, 3000); 
    }
}