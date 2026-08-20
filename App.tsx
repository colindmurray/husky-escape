
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, Difficulty } from './types';
import { audioManager } from './game/Audio';
import { inputManager } from './game/Input';
import { getHuskyWisdom } from './game/services/openRouterService';

export default function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
    const [bones, setBones] = useState(0);
    const [timeLeft, setTimeLeft] = useState(300);
    const [cutsceneText, setCutsceneText] = useState("");
    const [modalData, setModalData] = useState<any>({});
    const [huskyWisdom, setHuskyWisdom] = useState("");
    const [loadingWisdom, setLoadingWisdom] = useState(false);
    
    const [showSettings, setShowSettings] = useState(false);
    const [musicOn, setMusicOn] = useState(true);
    const [sfxOn, setSfxOn] = useState(true);
    const [volume, setVolume] = useState(0.3); // Default volume
    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
    const [devMode, setDevMode] = useState(false);

    // Using a ref to track time for AI context without triggering re-renders of the whole engine
    const timeLeftRef = useRef(300);
    // Track failures in the current level
    const levelFailuresRef = useRef(0);
    // Track history of events in the current level
    const levelHistoryRef = useRef<string[]>([]);

    useEffect(() => {
        if (!canvasRef.current || engineRef.current) return;
        const engine = new GameEngine(canvasRef.current, {
            onStateChange: async (state, data) => {
                setGameState(state);
                if (data) {
                    if (data.text) setCutsceneText(data.text);
                    setModalData((prev: any) => ({...prev, ...data}));
                    
                    if (state === GameState.LEVEL_COMPLETE || state === GameState.GAME_OVER || state === GameState.GAME_WON) {
                        setLoadingWisdom(true);
                        const status = state === GameState.GAME_WON ? 'win' : (state === GameState.GAME_OVER ? 'loss' : 'complete');
                        
                        if (status === 'loss') {
                            levelFailuresRef.current += 1;
                            const historyItem = data.narrative || data.reason || 'Unknown failure';
                            levelHistoryRef.current = [...levelHistoryRef.current, historyItem].slice(-10);
                        }

                        try {
                            const wisdom = await getHuskyWisdom({
                                level: data.level || 1,
                                status,
                                reason: data.reason,
                                bones: data.bones || 0,
                                timeLeft: timeLeftRef.current, 
                                failures: levelFailuresRef.current,
                                history: levelHistoryRef.current
                            });
                            setHuskyWisdom(wisdom);
                        } catch (err) {
                            setHuskyWisdom("Awoooo! My thoughts are fuzzy!");
                        } finally {
                            setLoadingWisdom(false);
                        }
                    }
                }
            },
            onScoreUpdate: (val) => setBones(val),
            onTimeUpdate: (val) => {
                setTimeLeft(val);
                timeLeftRef.current = val;
            }
        });
        engineRef.current = engine;
        return () => engine.stop();
    }, []);

    const toggleMusic = () => { setMusicOn(!musicOn); audioManager.setMusic(!musicOn); };
    const toggleSfx = () => { setSfxOn(!sfxOn); audioManager.setSFX(!sfxOn); };
    
    const updateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        audioManager.setVolume(val);
    };

    const changeDifficulty = (diff: Difficulty) => {
        setDifficulty(diff);
        // If changing mid-game, it will apply on next level load/restart
    };

    const startStory = () => { 
        levelFailuresRef.current = 0;
        levelHistoryRef.current = [];
        audioManager.init(); 
        engineRef.current?.startCutscene(); 
    };
    
    const startGame = () => { 
        levelFailuresRef.current = 0;
        levelHistoryRef.current = [];
        engineRef.current?.startGame(difficulty); 
    };
    
    const skipCutscene = () => { engineRef.current?.skipCutscene(); };

    const nextLevel = () => {
        setHuskyWisdom("");
        levelFailuresRef.current = 0;
        levelHistoryRef.current = [];
        const currentLvl = modalData.level;
        if (currentLvl === 2) engineRef.current?.startPoundEscapeCutscene();
        else if (currentLvl === 6) engineRef.current?.startChaseCutscene();
        else if (currentLvl === 7) engineRef.current?.startUnderwaterCutscene();
        else if (currentLvl === 8) engineRef.current?.startPierCutscene();
        else engineRef.current?.startLevel((currentLvl || 0) + 1, difficulty);
    };

    const restartLevel = () => {
        setHuskyWisdom("");
        // HARDCORE MODE: If you die, you restart at Level 1
        if (difficulty === Difficulty.HARDCORE && gameState === GameState.GAME_OVER) {
             levelFailuresRef.current = 0;
             levelHistoryRef.current = [];
             engineRef.current?.startLevel(1, difficulty);
             return;
        }

        if (gameState === GameState.GAME_WON) {
            levelFailuresRef.current = 0;
            levelHistoryRef.current = [];
            engineRef.current?.startLevel(1, difficulty);
        }
        else if (modalData.level) {
            engineRef.current?.startLevel(modalData.level, difficulty);
        }
        else {
            levelFailuresRef.current = 0;
            levelHistoryRef.current = [];
            engineRef.current?.startLevel(1, difficulty);
        }
    };
    
    const startSpecificLevel = (lvl: number) => {
         setHuskyWisdom("");
         levelFailuresRef.current = 0;
         levelHistoryRef.current = [];
         // Pass difficulty to cutscenes or levels
         if (lvl === 3) engineRef.current?.startPoundEscapeCutscene();
         else if (lvl === 7) engineRef.current?.startChaseCutscene();
         else if (lvl === 8) engineRef.current?.startUnderwaterCutscene();
         else if (lvl === 9) engineRef.current?.startPierCutscene();
         else engineRef.current?.startLevel(lvl, difficulty);
    };

    const getModalContent = () => {
        const level = modalData.level || 1;
        const reason = modalData.reason;
        const isWin = gameState === GameState.GAME_WON;
        const isLevelComplete = gameState === GameState.LEVEL_COMPLETE;
        
        if (isWin) return { title: "VICTORY!", desc: "You've successfully crossed the busy construction site, disabled the excavator, and made it home to your warm bed and family!" };
        if (isLevelComplete) {
            const congrats = [
                "The pound breakout has begun!",
                "You navigated the pound's trickiest bars!",
                "The forest was no match for a husky!",
                "Sand in your paws, but you cleared the beach!",
                "The air is thin, but you reached the peak!",
                "Maximum speed! You're off the mountain!",
                "The pound can't catch a dog this fast!",
                "You're a natural diver! Surfacing now...",
                "The end is in sight!",
                "You cleared the ultimate scaffolding obstacle!"
            ];
            return { title: `ZONE ${level} CLEAR!`, desc: congrats[level-1] || "Great job!" };
        }
        
        if (difficulty === Difficulty.HARDCORE) {
             return { title: "GAME OVER (HARDCORE)", desc: "One mistake is all it takes! Back to the pound with you!" };
        }
        
        if (reason === 'timeout') return { title: "OUT OF TIME!", desc: "The dog catcher was patient... and eventually, he caught up to you." };
        if (reason === 'fall') {
            if (level <= 2) return { title: "CAGE FALL!", desc: "You slipped through a gap in the pound structure!" };
            if (level === 6) return { title: "WIPEOUT!", desc: "You lost control on the slope and flew off the edge!" };
            if (level === 8) return { title: "TOO DEEP!", desc: "The pressure was too much! Stay within the reef." };
            return { title: "WATCH YOUR STEP!", desc: "A husky always lands on his feet... but not from that height!" };
        }
        if (reason === 'drowned') {
            if (level === 4) return { title: "WASHED AWAY!", desc: "The tide came in fast! You need to stay on the dry sand." };
            if (level === 9) return { title: "ROUGH SEAS!", desc: "The storm waves are too high! Don't fall in!" };
            return { title: "SPLASH!", desc: "Looks like you aren't much of a swimmer without your gear." };
        }

        if (reason === 'caught') return { title: "BUSTED!", desc: "The pound dog-catcher nabbed you with his net!" };
        if (reason === 'wolfed') return { title: "WOLF PACK!", desc: "The mountain wolves don't like trespassers on their peaks." };
        if (reason === 'excavator') return { title: "CRUSHED!", desc: "You got trapped in the giant yellow excavator bucket! Wait for its arm to slam down, then run up it to hit the strobe cab light!" };
        if (reason === 'debris') return { title: "BONKED!", desc: "A heavy tool or hardhat dropped from the scaffolding! Watch worker animations and run past!" };
        if (reason === 'wrecking') return { title: "DEMOLISHED!", desc: "Smashed by a giant swinging wrecking ball! Wait for it to swing past, then run under!" };
        if (reason === 'crabbed') return { title: "PINCHED!", desc: "Those beach crabs have very sharp claws! Avoid the red ones." };
        if (reason === 'spiked') return { title: "OUCH!", desc: "Porcupines are cute, but their spikes are very sharp!" };
        if (reason === 'stung') return { title: "ZAPPED!", desc: "The jellyfish sting paralyzed you! Watch for the purple glows." };
        if (reason === 'seagulled') return { title: "BIRD ATTACK!", desc: "The seagulls are dive-bombing to protect their pier!" };
        if (reason === 'snowballed') return { title: "SNOWED UNDER!", desc: "That giant snowball turned you into a husky-popsicle!" };

        return { title: "GAME OVER", desc: "The trail went cold. Try again, Onyx!" };
    };

    const modalContent = (gameState === GameState.LEVEL_COMPLETE || gameState === GameState.GAME_OVER || gameState === GameState.GAME_WON) 
        ? getModalContent() : { title: "", desc: "" };

    const LevelSelector = () => (
         <div className="mt-8 pt-4 border-t border-white/10 w-full">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest text-center">Dev Mode: Warp</p>
            <div className="flex gap-2 justify-center flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map(lvl => (
                    <button key={lvl} onClick={() => startSpecificLevel(lvl)} className="w-8 h-8 bg-blue-900/40 hover:bg-blue-500 rounded text-sm transition">{lvl}</button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="relative w-screen h-screen bg-gray-900 overflow-hidden font-sans">
            <canvas ref={canvasRef} className="block w-full h-full" />
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                <div className="p-5 flex justify-between items-start w-full z-50 text-white pointer-events-none">
                    {(gameState === GameState.PLAYING || gameState === GameState.LEVEL_COMPLETE) ? (
                         <div className="text-2xl drop-shadow-md font-bold flex gap-4 pointer-events-auto">
                            <span>Onyx Escape</span>
                            <span>🍖 {bones}/3</span>
                        </div>
                    ) : <div></div>}
                    {(gameState === GameState.PLAYING) && (
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
                            <span className="text-xs uppercase tracking-[0.3em] font-bold text-gray-400">Time</span>
                            <span className={`text-4xl drop-shadow-lg font-bold tabular-nums ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}</span>
                        </div>
                    )}
                    <div className="relative pointer-events-auto">
                        <button onClick={() => setShowSettings(!showSettings)} className="text-2xl hover:scale-110 transition bg-slate-800 p-2 rounded-full border border-slate-600 shadow-xl">⚙️</button>
                        {showSettings && (
                            <div className="absolute right-0 top-14 bg-slate-800 border border-slate-600 rounded-lg p-4 w-56 shadow-2xl text-sm">
                                <div className="mb-4 pb-3 border-b border-slate-600">
                                    <div className="flex justify-between items-center mb-1">
                                        <span>Volume</span>
                                        <span className="text-xs text-gray-400">{Math.round(volume * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.05" 
                                        value={volume} 
                                        onChange={updateVolume}
                                        className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="flex justify-between items-center mb-3">
                                    <span>Music</span>
                                    <button onClick={toggleMusic} className={`w-10 h-5 rounded-full p-1 transition ${musicOn ? 'bg-green-500' : 'bg-gray-600'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full transition ${musicOn ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span>SFX</span>
                                    <button onClick={toggleSfx} className={`w-10 h-5 rounded-full p-1 transition ${sfxOn ? 'bg-green-500' : 'bg-gray-600'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full transition ${sfxOn ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                                
                                <div className="border-t border-slate-600 pt-3 mb-3">
                                    <p className="text-xs text-gray-400 mb-2 uppercase">Difficulty</p>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => changeDifficulty(Difficulty.EASY)} className={`text-xs py-1 px-2 rounded border ${difficulty === Difficulty.EASY ? 'bg-green-900 border-green-500 text-green-100' : 'bg-slate-700 border-slate-600 text-gray-400'}`}>Easy</button>
                                        <button onClick={() => changeDifficulty(Difficulty.HARD)} className={`text-xs py-1 px-2 rounded border ${difficulty === Difficulty.HARD ? 'bg-orange-900 border-orange-500 text-orange-100' : 'bg-slate-700 border-slate-600 text-gray-400'}`}>Hard (More Enemies)</button>
                                        <button onClick={() => changeDifficulty(Difficulty.HARDCORE)} className={`text-xs py-1 px-2 rounded border ${difficulty === Difficulty.HARDCORE ? 'bg-red-900 border-red-500 text-red-100' : 'bg-slate-700 border-slate-600 text-gray-400'}`}>Hardcore (Permadeath)</button>
                                    </div>
                                </div>

                                <div className="border-t border-slate-600 pt-3 flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Dev Mode</span>
                                     <button onClick={() => setDevMode(!devMode)} className={`w-4 h-4 border rounded ${devMode ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-gray-500'}`}>
                                        {devMode && "✓"}
                                     </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {gameState === GameState.INTRO && (
                    <div className="absolute inset-0 bg-slate-800 text-white flex flex-col justify-center items-center z-30 pointer-events-auto">
                        <h1 className="text-7xl text-blue-400 mb-6 font-bold drop-shadow-2xl">Husky Escape</h1>
                        {!modalData.showMenu ? ( <button onClick={startStory} className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform transition duration-150">Start Journey</button> ) : (
                            <div className="bg-black/80 p-10 rounded-2xl border-4 border-blue-500 text-center scale-up max-w-lg">
                                <h2 className="text-3xl mb-4">Ready for Adventure?</h2>
                                <p className="mb-4 text-gray-300">Arrows to move • Double jump for height</p>
                                <div className="text-sm bg-slate-800 p-3 rounded mb-6 text-gray-400">
                                    Current Mode: <span className={`font-bold ${difficulty === Difficulty.HARDCORE ? 'text-red-400' : (difficulty === Difficulty.HARD ? 'text-orange-400' : 'text-green-400')}`}>{difficulty}</span>
                                    <br/>
                                    <span className="text-xs italic">(Change in settings top right)</span>
                                </div>
                                <button onClick={startGame} className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform transition duration-150">Start Game</button>
                                
                                {devMode && <LevelSelector />}
                            </div>
                        )}
                    </div>
                )}

                {gameState === GameState.CUTSCENE && (
                    <div className="absolute inset-0 z-20 flex flex-col justify-end items-center pb-20 pointer-events-auto">
                         <div className="bg-black/70 p-8 rounded-2xl max-w-2xl mx-4 text-center backdrop-blur-md border border-white/10">
                            <h1 className="text-3xl text-white font-medium italic">{cutsceneText}</h1>
                         </div>
                         <button onClick={skipCutscene} className="absolute bottom-8 right-8 text-white/50 hover:text-white transition">Skip &gt;&gt;</button>
                    </div>
                )}

                {(gameState === GameState.LEVEL_COMPLETE || gameState === GameState.GAME_OVER || gameState === GameState.GAME_WON) && (
                    <div className="absolute inset-0 bg-black/70 flex justify-center items-center z-40 pointer-events-auto p-4">
                        <div className="bg-slate-900 p-8 rounded-3xl border-4 border-blue-500 text-center text-white max-w-md w-full shadow-2xl scale-up">
                            <h2 className="text-4xl mb-2 text-blue-400 font-bold">{modalContent.title}</h2>
                            <p className="text-gray-300 mb-6">{modalContent.desc}</p>
                            <div className="bg-blue-900/30 p-5 rounded-2xl mb-8 border border-blue-500/20 text-left relative min-h-[80px] flex items-center justify-center">
                                <div className="absolute -top-3 left-4 bg-blue-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Onyx's Inner Voice</div>
                                {loadingWisdom ? ( 
                                    <div className="flex gap-2 items-center text-sm italic text-blue-300 animate-pulse">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        Transmitting husky feelings...
                                    </div> 
                                ) : ( 
                                    <p className="text-sm italic font-light leading-snug w-full">"{huskyWisdom || "Awoo! The trail is long but I am strong!"}"</p> 
                                )}
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                {gameState === GameState.LEVEL_COMPLETE ? ( <button onClick={nextLevel} className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform transition duration-150">Next Area</button> ) : ( <button onClick={restartLevel} className={`hover:brightness-110 active:scale-95 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform transition duration-150 ${difficulty === Difficulty.HARDCORE ? 'bg-red-600' : 'bg-blue-500'}`}>{gameState === GameState.GAME_WON ? "Start Over" : (difficulty === Difficulty.HARDCORE ? "Restart Game (Hardcore)" : "Try Again")}</button> )}
                                <button onClick={() => setGameState(GameState.INTRO)} className="text-sm text-gray-500 hover:text-white transition">Main Menu</button>
                            </div>
                            
                            {devMode && <LevelSelector />}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .scale-up { animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}
