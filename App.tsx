
import { TitleScreen } from './TitleScreen';
import { HomeUI } from './HomeUI';
import { ShopUI } from './ShopUI';
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { HOME_LEVEL } from './game/Home';
import { GameState, Difficulty } from './types';
import { audioManager } from './game/Audio';
import { inputManager } from './game/Input';
import { getHuskyWisdom } from './game/services/openRouterService';
import { gfxSettings, PresentationMode } from './game/GfxSettings';

export default function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
    const [bones, setBones] = useState(0);
    const [, refreshShop] = useState(0);
    const [timeLeft, setTimeLeft] = useState(300);
    const [cutsceneText, setCutsceneText] = useState("");
    const [modalData, setModalData] = useState<any>({});
    const [huskyWisdom, setHuskyWisdom] = useState("");
    const [loadingWisdom, setLoadingWisdom] = useState(false);
    
    const printDialog = useRef<HTMLDialogElement>(null);
    const [printUrl, setPrintUrl] = useState('');
    useEffect(() => {
        if (printUrl) printDialog.current?.showModal();
    }, [printUrl]);
    const closePrint = () => { engineRef.current?.setPrintPaused(false); inputManager.clear(); setPrintUrl(''); };

    const [showSettings, setShowSettings] = useState(false);
    const [musicOn, setMusicOn] = useState(true);
    const [sfxOn, setSfxOn] = useState(true);
    const [volume, setVolume] = useState(0.3); // Default volume
    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
    const [saveError, setSaveError] = useState('');
    // Presentation toggles: flip between the preserved Classic presentation and
    // the Enhanced one. Both apply live — even mid-level — without touching
    // world state, so gameplay is identical in either mode.
    const [visualMode, setVisualMode] = useState<PresentationMode>(gfxSettings.visualMode);
    const [audioMode, setAudioMode] = useState<PresentationMode>(gfxSettings.audioMode);

    // Using a ref to track time for AI context without triggering re-renders of the whole engine
    const timeLeftRef = useRef(300);
    // Track failures in the current level
    const levelFailuresRef = useRef(0);
    // Track history of events in the current level
    const levelHistoryRef = useRef<string[]>([]);

    useEffect(() => {
        if (!canvasRef.current || engineRef.current) return;
        const engine = new GameEngine(canvasRef.current, {
            onSaveError: setSaveError,
            onShopUpdate: () => refreshShop(n => n + 1),
            onStateChange: async (state, data) => {
                setGameState(state);
                if (data) {
                    if (data.text !== undefined) setCutsceneText(data.text);
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
        // Dev/testing hook: lets the visual harness inspect world state and flip
        // presentation settings live. Not used by gameplay code.
        (window as any).__husky = { engine, gfxSettings, inputManager };
        const save = () => engine.saveProgress();
        const hide = () => { if (document.visibilityState === 'hidden') save(); };
        window.addEventListener('pagehide', save);
        document.addEventListener('visibilitychange', hide);
        return () => { save(); engine.stop(); window.removeEventListener('pagehide', save); document.removeEventListener('visibilitychange', hide); };
    }, []);

    const toggleMusic = () => { setMusicOn(!musicOn); audioManager.setMusic(!musicOn); };
    const toggleSfx = () => { setSfxOn(!sfxOn); audioManager.setSFX(!sfxOn); };
    
    const updateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        audioManager.setVolume(val);
    };

    const changeDifficulty = (diff: Difficulty) => {
        if (engineRef.current?.sessionMode === 'saved') return;
        setDifficulty(diff);
        engineRef.current?.setDifficulty(diff);
    };

    const changeVisualMode = (mode: PresentationMode) => {
        setVisualMode(mode);
        gfxSettings.setVisualMode(mode);
    };

    const changeAudioMode = (mode: PresentationMode) => {
        setAudioMode(mode);
        gfxSettings.setAudioMode(mode);
    };

    const resetSessionUI = () => {
        levelFailuresRef.current = 0; levelHistoryRef.current = [];
        setHuskyWisdom(''); setModalData({}); setCutsceneText(''); setShowSettings(false);
        inputManager.clear(); audioManager.init();
    };
    const openSave = (slot: number, name?: string, selectedDifficulty?: Difficulty) => {
        resetSessionUI();
        const engine = engineRef.current;
        if (!engine?.openSave(slot, name, selectedDifficulty)) return false;
        setDifficulty(engine.activeSave!.difficulty); canvasRef.current?.focus(); return true;
    };
    const freeRoam = () => {
        resetSessionUI(); engineRef.current?.startFreeRoam(difficulty); setShowSettings(true);
    };
    const mainMenu = () => { if (engineRef.current?.returnToTitle()) { setShowSettings(false); setModalData({}); } };
    const openPrint = () => {
        const params = new URLSearchParams({ print: '1', level: '1', difficulty, graphics: visualMode, floor: 'ground' });
        engineRef.current?.setPrintPaused(true); inputManager.clear(); setPrintUrl(`?${params}`);
    };
    
    const skipCutscene = () => { engineRef.current?.skipCutscene(); };

    const nextLevel = () => {
        if (engineRef.current?.world.belongings.homeUnlocked) { engineRef.current.goHome(); return; }
        setHuskyWisdom("");
        levelFailuresRef.current = 0;
        levelHistoryRef.current = [];
        const currentLvl = modalData.level;
        if (currentLvl === 2) engineRef.current?.startPoundEscapeCutscene();
        else if (currentLvl === 6) engineRef.current?.startChaseCutscene();
        else if (currentLvl === 7) engineRef.current?.startUnderwaterCutscene();
        else if (currentLvl === 8) engineRef.current?.startPierCutscene();
        else if (currentLvl === 10) engineRef.current?.startNeonCutscene();
        else if (currentLvl === 11) engineRef.current?.startBakeryCutscene();
        else if (currentLvl === 12) engineRef.current?.startTownCutscene(difficulty);
        else engineRef.current?.startLevel((currentLvl || 0) + 1, difficulty);
    };

    const restartLevel = () => {
        if (engineRef.current?.world.practice) { engineRef.current.retryPractice(); return; }
        setHuskyWisdom("");
        // During the story, Hardcore deaths restart the journey. Completed runs unlock free travel.
        if (difficulty === Difficulty.HARDCORE && gameState === GameState.GAME_OVER && !engineRef.current?.world.belongings.homeUnlocked) {
             levelFailuresRef.current = 0;
             levelHistoryRef.current = [];
             engineRef.current?.startGame(difficulty);
             return;
        }

        if (modalData.level) {
            engineRef.current?.startLevel(modalData.level, difficulty);
        }
        else {
            levelFailuresRef.current = 0;
            levelHistoryRef.current = [];
            engineRef.current?.startGame(difficulty);
        }
    };
    
    const startSpecificLevel = (level: number) => {
        if (engineRef.current?.warpToLevel(level)) { setShowSettings(false); setHuskyWisdom(''); canvasRef.current?.focus(); }
    };

    const getModalContent = () => {
        const level = modalData.level || 1;
        const reason = modalData.reason;
        const isWin = gameState === GameState.GAME_WON;
        const isLevelComplete = gameState === GameState.LEVEL_COMPLETE;
        
        if (engineRef.current?.world.practice) return { title: isLevelComplete ? 'PRACTICE CLEAR!' : 'TRY THAT AGAIN!', desc: isLevelComplete ? 'Nice work! Keep practicing, build another course, or head upstairs to your friends.' : 'That’s what training is for. Try again with your original supplies; your real journey is safe.' };
        if (isWin) return { title: "VICTORY!", desc: "You crossed the busy town, reclaimed the backyard, and outsmarted the top-hatted trash-can king. You’re home! Good girl, Onyx! Go inside to meet your friends, visit Juniper’s shop, and unlock free travel to every level." };
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
                "You cleared the ultimate scaffolding obstacle!",
                "Through the neon night — home is just ahead!",
                "Warm buns! The Night Baker is beaten — home smells close!",
                "Past the parade! Just the backyard between you and home."
            ];
            return { title: `ZONE ${level} CLEAR!`, desc: congrats[level-1] || "Great job!" };
        }
        
        if (difficulty === Difficulty.HARDCORE && !engineRef.current?.world.belongings.homeUnlocked) {
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
            if (level === 13) return { title: 'FOUNTAIN SPLASH!', desc: 'The hard route crosses deep water. Ride the moving stones; the bandana cannot save you from a fall.' };
            if (level === 4) return { title: "WASHED AWAY!", desc: "The tide came in fast! You need to stay on the dry sand." };
            if (level === 9) return { title: "ROUGH SEAS!", desc: "The storm waves are too high! Don't fall in!" };
            return { title: "SPLASH!", desc: "Looks like you aren't much of a swimmer without your gear." };
        }

        if (reason === 'raccoon') return { title: 'RACCOON RUCKUS!', desc: modalData.narrative || 'Jump on small raccoons. Dodge the Baron’s charge and bonk him when he is dizzy.' };
        if (reason === 'trashlid') return { title: 'TRASH LID BONK!', desc: 'The Baron tosses lids before charging. Watch their arcs and leave room to jump.' };
        if (reason === 'cycled') return { title: "RING RING!", desc: "A delivery bike caught you! Wait on a bench when the bell rings, then cross behind it." };
        if (reason === 'appled') return { title: "APPLE BONK!", desc: "Watch for loose apples at the fruit cart, or take the awnings above the market." };
        if (reason === 'sprinkled') return { title: "SOAKED!", desc: "The jets hiss before spraying. Wait for a gap or hop across the stepping stones." };
        if (reason === 'yarddog') return { title: "WOOF!", desc: "The yard dog guards the gold-marked stretch. Wait for it to return home, or jump across the garden awning." };
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
        if (reason === 'droned') return { title: "SPOTTED!", desc: "A security drone's patrol light caught you! Stay out of the red scan." };
        if (reason === 'pastried') return { title: "PASTRY BONK!", desc: "A falling pastry flattened you! Watch the crumb shadows and keep moving." };
        if (reason === 'baked') return { title: "BAKED!", desc: "You fell into the oven and got baked into a cake! Hop the cooling racks instead." };
        if (reason === 'battered') return { title: "BATTERED!", desc: "You plopped into raw cake batter! Jump the vat next time." };
        if (reason === 'pressed') return { title: "FLATTENED!", desc: "The packaging press squished you flat! Dash under while the light is green." };
        if (reason === 'mothed') return { title: "MOTHED!", desc: "A flour moth tickled you senseless! Time your jumps between flaps." };
        if (reason === 'dough') return { title: "DOUGHED!", desc: "A wobbly dough blob absorbed you! Hop over it." };
        if (reason === 'baker') return { title: "BUSTED BY THE BAKER!", desc: "The Night Baker caught you! Bonk the glowing toque off his head, then bonk him while he's dizzy!" };

        return { title: "GAME OVER", desc: "The trail went cold. Try again, Onyx!" };
    };

    const modalContent = (gameState === GameState.LEVEL_COMPLETE || gameState === GameState.GAME_OVER || gameState === GameState.GAME_WON) 
        ? getModalContent() : { title: "", desc: "" };

    const freeMode = engineRef.current?.sessionMode === 'free';
    const savedMode = engineRef.current?.sessionMode === 'saved';
    const homeUnlocked = !!engineRef.current?.world.belongings.homeUnlocked;
    const goHome = () => { engineRef.current?.goHome(); canvasRef.current?.focus(); };

    const LevelSelector = () => (
         <div className="mt-8 pt-4 border-t border-white/10 w-full">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest text-center">Choose a level</p>
            <div className="flex gap-2 justify-center flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,HOME_LEVEL].map(lvl => (
                    <button key={lvl} onClick={() => startSpecificLevel(lvl)} className="min-w-8 px-2 h-8 bg-blue-900/40 hover:bg-blue-500 rounded text-sm transition">{lvl === HOME_LEVEL ? 'Home' : lvl}</button>
                ))}
            </div>
        </div>
    );

    return (<>
        {printUrl && <dialog ref={printDialog} onCancel={closePrint} onClose={closePrint} aria-label="Print and draw levels" style={{ width: 'min(1200px, 96vw)', height: '94dvh', maxWidth: '96vw', padding: 0, border: '2px solid #638c80', borderRadius: 14, background: '#f4f6f2' }}>
            <div style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong>Onyx’s drawing studio</strong><button autoFocus onClick={closePrint} style={{ padding: '8px 16px', background: '#1c5148', color: 'white', borderRadius: 8 }}>Back to main menu</button></div>
            <iframe title="Drawing studio" src={printUrl} style={{ width: '100%', height: 'calc(100% - 62px)', border: 0 }} />
        </dialog>}
        <div className="relative w-screen h-screen bg-gray-900 overflow-hidden font-sans">
            {saveError && <div role="alert" className="absolute z-[60] top-3 left-1/2 -translate-x-1/2 w-[min(80vw,600px)] bg-red-950 text-white border border-red-300 rounded-lg p-3 text-sm">{saveError}{savedMode && <button className="underline ml-2" onClick={() => engineRef.current?.saveProgress()}>Retry saving</button>}</div>}
            <canvas ref={canvasRef} tabIndex={0} className="block w-full h-full" />
            {gameState === GameState.PLAYING && engineRef.current && <><ShopUI world={engineRef.current.world} visualMode={visualMode} /><HomeUI engine={engineRef.current} /></>}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                <div className="p-5 flex justify-between items-start w-full z-50 text-white pointer-events-none">
                    {(gameState === GameState.PLAYING || gameState === GameState.LEVEL_COMPLETE) ? (
                         <div className={`${engineRef.current?.world.isHome ? 'text-lg' : 'text-2xl'} drop-shadow-md font-bold flex gap-4 pointer-events-auto`}>
                            {!engineRef.current?.world.isHome && !engineRef.current?.world.shopRoom && <span>Onyx Escape</span>}
                            <span>🍖 {bones}</span>
                        </div>
                    ) : <div></div>}
                    {(gameState === GameState.PLAYING && !engineRef.current?.world.isHome && !engineRef.current?.world.shopRoom) && (
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
                            <span className="text-xs uppercase tracking-[0.3em] font-bold text-gray-400">Time</span>
                            <span className={`text-4xl drop-shadow-lg font-bold tabular-nums ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}</span>
                        </div>
                    )}
                    <div className="relative pointer-events-auto">
                        <button aria-label="Settings" onClick={() => setShowSettings(!showSettings)} className="text-2xl hover:scale-110 transition bg-slate-800 p-2 rounded-full border border-slate-600 shadow-xl">⚙️</button>
                        {showSettings && (
                            <div style={{ maxHeight: 'calc(100dvh - 110px)', overflowY: 'auto' }} className="absolute right-0 top-14 bg-slate-800 border border-slate-600 rounded-lg p-4 w-72 max-w-[90vw] shadow-2xl text-sm">
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
                                    <p className="text-xs text-gray-400 mb-2 uppercase">Presentation</p>
                                    <div className="mb-2">
                                        <span className="text-xs text-gray-300 block mb-1">Visuals</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => changeVisualMode('classic')} className={`flex-1 text-xs py-1 px-2 rounded border transition ${visualMode === 'classic' ? 'bg-slate-500 border-slate-300 text-white' : 'bg-slate-700 border-slate-600 text-gray-400 hover:text-white'}`}>Classic</button>
                                            <button onClick={() => changeVisualMode('enhanced')} className={`flex-1 text-xs py-1 px-2 rounded border transition ${visualMode === 'enhanced' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-gray-400 hover:text-white'}`}>Enhanced</button>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-300 block mb-1">Audio</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => changeAudioMode('classic')} className={`flex-1 text-xs py-1 px-2 rounded border transition ${audioMode === 'classic' ? 'bg-slate-500 border-slate-300 text-white' : 'bg-slate-700 border-slate-600 text-gray-400 hover:text-white'}`}>Classic</button>
                                            <button onClick={() => changeAudioMode('enhanced')} className={`flex-1 text-xs py-1 px-2 rounded border transition ${audioMode === 'enhanced' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-gray-400 hover:text-white'}`}>Enhanced</button>
                                        </div>
                                    </div>
                                </div>

                                {freeMode && <div className="border-t border-slate-600 pt-3 mb-3">
                                    <p className="text-xs text-gray-400 mb-2 uppercase">Difficulty{freeMode && ' · Restarts area'}</p>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => changeDifficulty(Difficulty.EASY)} className={`text-xs py-1 px-2 rounded border ${difficulty === Difficulty.EASY ? 'bg-green-900 border-green-500 text-green-100' : 'bg-slate-700 border-slate-600 text-gray-400'}`}>Easy</button>
                                        <button onClick={() => changeDifficulty(Difficulty.HARD)} className={`text-xs py-1 px-2 rounded border ${difficulty === Difficulty.HARD ? 'bg-orange-900 border-orange-500 text-orange-100' : 'bg-slate-700 border-slate-600 text-gray-400'}`}>Hard (Extra Challenges)</button>
                                        <button onClick={() => changeDifficulty(Difficulty.HARDCORE)} className={`text-xs py-1 px-2 rounded border ${difficulty === Difficulty.HARDCORE ? 'bg-red-900 border-red-500 text-red-100' : 'bg-slate-700 border-slate-600 text-gray-400'}`}>Hardcore (Permadeath)</button>
                                    </div>
                                </div>}

                                {savedMode && <p className="border-t border-slate-600 pt-3 text-xs text-slate-300">{engineRef.current?.activeSave?.name} · {difficulty.toLowerCase()} 🔒<br />Autosaves in this browser</p>}
                                {freeMode && <>
                                    <p className="text-xs text-amber-200 mb-3">Free Roam · Progress is not saved</p>
                                    <label className="flex justify-between items-center border-t border-slate-600 pt-3">Cheats<input type="checkbox" checked={engineRef.current?.cheatsEnabled ?? false} onChange={e => engineRef.current?.enableCheats(e.target.checked)} /></label>
                                    {engineRef.current?.cheatsEnabled && <div className="grid gap-2 mt-3">
                                        <button onClick={() => engineRef.current?.cheat('bones')} className="rounded bg-amber-800 p-2">Give 100 bones</button>
                                        <button onClick={() => engineRef.current?.cheat('treats')} className="rounded bg-amber-800 p-2">Fill treat pouch</button>
                                        <button onClick={() => engineRef.current?.cheat('time')} className="rounded bg-amber-800 p-2">Add 60 seconds</button>
                                    </div>}
                                    <LevelSelector />
                                </>}
                                {gameState !== GameState.INTRO && <button onClick={mainMenu} className="w-full rounded border border-slate-500 p-2 mt-4">{savedMode ? 'Save & main menu' : 'Main Menu'}</button>}

                            </div>
                        )}
                    </div>
                </div>

                {gameState === GameState.INTRO && <TitleScreen onOpen={openSave} onFreeRoam={freeRoam} onPrint={openPrint} />}

                {gameState === GameState.CUTSCENE && (
                    <div data-story={engineRef.current?.cutsceneManager.currentType} className="absolute inset-0 z-20 flex flex-col justify-end items-center pb-20 pointer-events-auto">
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
                                {gameState === GameState.LEVEL_COMPLETE ? ( <button onClick={nextLevel} className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform transition duration-150">{engineRef.current?.world.practice ? "Back to basement" : homeUnlocked ? "Back home" : "Next Area"}</button> ) : gameState === GameState.GAME_WON ? null : ( <button onClick={restartLevel} className={`hover:brightness-110 active:scale-95 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform transition duration-150 ${difficulty === Difficulty.HARDCORE ? 'bg-red-600' : 'bg-blue-500'}`}>{difficulty === Difficulty.HARDCORE && !homeUnlocked ? "Restart Game (Hardcore)" : "Try Again"}</button> )}
                                {homeUnlocked && gameState !== GameState.LEVEL_COMPLETE && <button onClick={goHome} className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg text-xl">{gameState === GameState.GAME_WON ? 'Go inside · Home' : engineRef.current?.world.practice ? 'Back to basement' : 'Return home'}</button>}
                                {engineRef.current?.world.practice && <button onClick={() => engineRef.current?.retryPractice()} className="bg-teal-700 text-white py-3 rounded-lg">Practice again</button>}
                                {engineRef.current?.world.practice && engineRef.current.world.isCustom && <button onClick={() => engineRef.current?.returnToEditor()} className="bg-teal-700 text-white py-3 rounded-lg">Back to editor</button>}
                                <button onClick={mainMenu} className="text-sm text-gray-500 hover:text-white transition">Main Menu</button>
                            </div>
                            
                            {freeMode && <LevelSelector />}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .scale-up { animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    </>);
}
