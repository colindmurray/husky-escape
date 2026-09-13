import React, { useRef, useState } from 'react';
import type { GameEngine } from './game/GameEngine';
import { CUSTOM_LEVEL, GRID_COLS, GRID_ROWS, TILES, saveDraft, starterLevel, validateLevel, type LevelDraft, type Tile } from './game/LevelBuilder';

export function LevelBuilderUI({ engine }: { engine: GameEngine }) {
    const [draft, setDraft] = useState(engine.world.editorDraft), [tool, setTool] = useState<Tile>('#');
    const [message, setMessage] = useState(''), [cursor, setCursor] = useState(0);
    const [confirmReset, setConfirmReset] = useState(false);
    const undo = useRef<LevelDraft[]>([]);
    const grid = useRef<HTMLDivElement>(null);
    const change = (next: LevelDraft) => {
        undo.current.push(draft); if (undo.current.length > 30) undo.current.shift();
        engine.world.editorDraft = next; setDraft(next); setMessage('Unsaved changes');
    };
    const paint = (i: number) => {
        const cells = [...draft.cells];
        if (tool === 'S' || tool === 'E') for (let k = 0; k < cells.length; k++) if (cells[k] === tool) cells[k] = '.';
        cells[i] = tool; change({ ...draft, cells });
    };
    const error = validateLevel(draft);
    return <section className="level-builder">
        <p>Build a course, then play it as Onyx! Choose a tile and tap a square. Move around the grid with arrow keys; Enter or Space places a tile. Scroll sideways to see the whole course.</p>
        <label>Level name <input maxLength={60} value={draft.name} onChange={e => change({ ...draft, name: e.target.value })} /></label>
        <div className="builder-tools" aria-label="Building tools">{(Object.keys(TILES) as Tile[]).map(tile => <button key={tile} aria-pressed={tool === tile} onClick={() => setTool(tile)}>{TILES[tile].icon} {TILES[tile].name}</button>)}</div>
        <div className="builder-scroll"><div ref={grid} className="builder-grid" role="group" aria-label="Level layout" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 34px)` }}>{draft.cells.map((tile, i) => <button key={i} className={`tile tile-${tile === '#' ? 'platform' : tile === '~' ? 'water' : tile}`} tabIndex={i === cursor ? 0 : -1} aria-label={`Row ${Math.floor(i / GRID_COLS) + 1}, column ${i % GRID_COLS + 1}: ${TILES[tile].name}`} onFocus={() => setCursor(i)} onClick={() => paint(i)} onKeyDown={e => {
            const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -GRID_COLS, ArrowDown: GRID_COLS }[e.key];
            if (offset === undefined) return;
            e.preventDefault(); const next = Math.max(0, Math.min(GRID_COLS * GRID_ROWS - 1, i + offset));
            setCursor(next); grid.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
        }}>{TILES[tile].icon}</button>)}</div></div>
        <div className="builder-tools">
            <button disabled={!undo.current.length} onClick={() => { const previous = undo.current.pop(); if (previous) { engine.world.editorDraft = previous; setDraft(previous); setMessage('Undone · unsaved changes'); } }}>Undo</button>
            <button onClick={() => setMessage(saveDraft(draft) ? 'Saved on this browser. Your layout survives refreshing.' : 'Could not save on this browser. Your layout is still available until you close this page.')}>Save layout</button>
            <button disabled={!!error} className="home-primary" onClick={() => engine.startPractice(CUSTOM_LEVEL)}>Play my level</button>
            <button onClick={() => setConfirmReset(true)}>Starter layout</button>
        </div>
        {confirmReset && <p>Replace the current layout? <button onClick={() => { change(starterLevel()); setConfirmReset(false); }}>Replace layout</button> <button onClick={() => setConfirmReset(false)}>Keep editing</button></p>}
        <p role="status">{[message, error].filter(Boolean).join(' · ') || 'Start and exit need solid platforms below them. Placing another start or exit moves the existing one.'}</p>
        <p className="home-note">Practice bones and treats stay in training. Return to the editor anytime to change your course. Save keeps one layout on this browser; Undo keeps the last 30 edits.</p>
    </section>;
}
