
export enum GameState {
    INTRO = 'INTRO',
    CUTSCENE = 'CUTSCENE',
    PLAYING = 'PLAYING',
    LEVEL_COMPLETE = 'LEVEL_COMPLETE',
    GAME_OVER = 'GAME_OVER',
    GAME_WON = 'GAME_WON'
}

export enum Difficulty {
    EASY = 'EASY',
    HARD = 'HARD',
    HARDCORE = 'HARDCORE'
}

export enum SoundType {
    // SFX
    JUMP = 'jump',
    LAND = 'land',
    COLLECT = 'collect',
    SPLASH = 'splash',
    CRASH = 'crash',
    BOOST = 'boost',
    WIN_SHORT = 'win_short',
    LOSE_SHORT = 'lose_short',
    SWIM = 'swim',
    BOSS_HIT = 'boss_hit',
    BOSS_STUN = 'boss_stun',
    BOSS_DEATH = 'boss_death',
    
    // Wolf Boss SFX
    WOLF_HOWL = 'wolf_howl',
    WOLF_GROWL = 'wolf_growl',
    
    // Zone 11 SFX
    MEOW = 'meow',
    DRONE_ALERT = 'drone_alert',
    
    // MUSIC TRACKS
    THEME_MENU = 'theme_menu',
    THEME_POUND = 'theme_pound',
    THEME_FOREST = 'theme_forest',
    THEME_BEACH = 'theme_beach',
    THEME_MOUNTAIN = 'theme_mountain',
    THEME_SKI = 'theme_ski',
    THEME_CHASE = 'theme_chase',
    THEME_UNDERWATER = 'theme_underwater',
    THEME_GOLDEN_SHARK = 'theme_golden_shark',
    THEME_PIER = 'theme_pier',
    THEME_BOSS = 'theme_boss',
    THEME_BOSS_WOLF = 'theme_boss_wolf',
    THEME_CONSTRUCTION = 'theme_construction',
    THEME_BOSS_EXCAVATOR = 'theme_boss_excavator',
    THEME_NEON = 'theme_neon'
}

export interface GameStats {
    level: number;
    bones: number;
    time: number;
}

export interface InputState {
    ArrowUp: boolean;
    ArrowDown: boolean;
    ArrowLeft: boolean;
    ArrowRight: boolean;
    Space: boolean;
}
