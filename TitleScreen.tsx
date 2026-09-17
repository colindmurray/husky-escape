import React, { useEffect, useState } from 'react';
import { Difficulty } from './types';
import { readSave, SAVE_SLOTS, saveKey, saveName } from './game/SaveGame';

export function TitleScreen({ onOpen, onFreeRoam, onPrint }: {
    onOpen: (slot: number, name?: string, difficulty?: Difficulty) => boolean;
    onFreeRoam: () => void; onPrint: () => void;
}) {
    const [slots, setSlots] = useState(() => Array.from({ length: SAVE_SLOTS }, (_, i) => readSave(i)));
    const [creating, setCreating] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [difficulty, setDifficulty] = useState(Difficulty.EASY);
    const [error, setError] = useState('');
    const refresh = () => setSlots(Array.from({ length: SAVE_SLOTS }, (_, i) => readSave(i)));
    useEffect(() => { window.addEventListener('storage', refresh); return () => window.removeEventListener('storage', refresh); }, []);
    const remove = (slot: number) => {
        if (!window.confirm(`Delete ${slots[slot].game?.name ?? `slot ${slot + 1}`}? Its progress and items will be permanently removed.`)) return;
        try { localStorage.removeItem(saveKey(slot)); refresh(); setError(''); }
        catch { setError('Browser storage is unavailable. The save was not deleted.'); }
    };
    return <main className="absolute inset-0 z-30 pointer-events-auto text-white overflow-y-auto bg-slate-950/60 backdrop-blur-[1.5px]" style={{ touchAction: 'pan-y' }}>
        <div className="mx-auto max-w-3xl px-5 pt-20 pb-8">
            <p className="text-center text-emerald-200 text-xs uppercase tracking-[.3em] mb-2">A long way home. Four little adventures.</p>
            <h1 className="text-center text-4xl sm:text-6xl font-bold text-blue-200 mb-3">Husky Escape</h1>
            <p className="text-center text-slate-300 text-sm mb-6">Choose your adventure</p>
            {error && <p role="alert" className="bg-red-950 p-3 rounded mb-4">{error}</p>}
            {creating !== null ? <form className="mx-auto max-w-md rounded-2xl border border-emerald-300/40 bg-slate-900 p-6" onSubmit={event => {
                event.preventDefault(); if (!onOpen(creating, saveName(name), difficulty)) refresh();
            }}>
                <h2 className="text-xl mb-4">New game · Slot {creating + 1}</h2>
                <label className="block text-sm mb-1" htmlFor="save-name">Adventure name</label>
                <input id="save-name" autoFocus required value={name} onChange={e => setName(Array.from(e.target.value).slice(0, 20).join(''))} aria-describedby="name-limit" className="w-full bg-slate-800 border border-slate-500 rounded-lg p-3 text-white" />
                <p id="name-limit" className="text-xs text-slate-400 mt-1 mb-5">{Array.from(name).length}/20 characters</p>
                <label className="block text-sm mb-1" htmlFor="save-difficulty">Difficulty</label>
                <select id="save-difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className="w-full bg-slate-800 border border-slate-500 rounded-lg p-3">
                    <option value={Difficulty.EASY}>Easy</option><option value={Difficulty.HARD}>Hard · Extra challenges</option><option value={Difficulty.HARDCORE}>Hardcore · Permadeath</option>
                </select>
                <p className="text-xs text-amber-100 mt-2 mb-5">Difficulty stays fixed for this save.{difficulty === Difficulty.HARDCORE && ' Dying before reaching home restarts the whole journey.'}</p>
                <div className="flex gap-3"><button type="submit" disabled={!saveName(name)} className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 rounded-lg py-3">Start adventure</button><button type="button" onClick={() => setCreating(null)} className="px-3 rounded border border-slate-600">Back</button></div>
            </form> : <>
                <div className="grid sm:grid-cols-2 gap-3">
                    {slots.map(({ game, error: unreadable }, slot) => <section key={slot} aria-label={`Save slot ${slot + 1}`} className="rounded-2xl border border-slate-500/60 bg-slate-900/90 p-5 min-w-0">
                        <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Slot {slot + 1}</p>
                        {game ? <>
                            <h2 className="text-xl font-bold break-words mb-1">{game.name}</h2>
                            <p className="text-sm text-slate-300">{game.level === 15 ? 'Home' : `Level ${game.level}`}{game.state === 'LEVEL_COMPLETE' ? ' · Cleared' : game.state === 'GAME_OVER' ? ' · Try again' : ''} · {game.difficulty.toLowerCase()} · 🍖 {game.bones}</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(game.updatedAt).toLocaleString()}</p>
                            <div className="flex gap-3 mt-4"><button onClick={() => onOpen(slot)} aria-label={`Continue ${game.name}`} className="flex-1 rounded-lg bg-blue-700 hover:bg-blue-600 py-2">Continue</button><button aria-label={`Delete ${game.name}`} onClick={() => remove(slot)} className="text-xs text-slate-400 hover:text-red-200 px-2">Delete</button></div>
                        </> : unreadable ? <><p className="text-sm text-amber-100">{unreadable}</p><button onClick={() => remove(slot)} className="text-sm underline mt-3">Delete unreadable slot {slot + 1}</button></> : <>
                            <h2 className="text-lg text-slate-300 mb-4">A fresh set of pawprints</h2>
                            <button onClick={() => { setCreating(slot); setName(''); setDifficulty(Difficulty.EASY); }} aria-label={`New game in slot ${slot + 1}`} className="w-full rounded-lg border border-emerald-400/50 bg-emerald-900/50 hover:bg-emerald-800 py-2">+ New game</button>
                        </>}
                    </section>)}
                </div>
                <p className="text-center text-xs text-slate-400 mt-4">Autosaved in this browser. Continue at the start of your current area.<br />Clearing site data removes saves.</p>
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                    <button onClick={onFreeRoam} className="rounded-xl bg-amber-200 text-slate-900 font-bold py-3 px-6 hover:bg-amber-100">Free Roam</button>
                    <button onClick={onPrint} className="rounded-xl border border-slate-400 py-3 px-6 hover:bg-slate-800">Print & draw levels</button>
                </div>
                <p className="text-center text-xs text-slate-300 mt-2">Free Roam · Every level, optional cheats, no saving</p>
            </>}
        </div>
    </main>;
}
