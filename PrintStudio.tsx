import React, { useState } from 'react';
import { prepare, capture } from './game/printing/capture';
import { NAMES, slicesFor, printBooklet } from './game/printing/booklet.mjs';
import { CutsceneManager, type CutsceneType } from './game/engine/CutsceneManager';
import { Renderer } from './game/engine/Renderer';
import { gfxSettings, type PresentationMode } from './game/GfxSettings';
import { loadDraft } from './game/LevelBuilder';
import { Difficulty } from './types';
import type { HomeFloor } from './game/Home';

declare const __BUILD_REVISION__: string;
const STORIES: [CutsceneType, string][] = [['intro', 'Onyx’s story'], ['pound_escape', 'Escape from the pound'], ['chase', 'The chase'], ['underwater_intro', 'Into the ocean'], ['pier_intro', 'The stormy pier'], ['neon_intro', 'City lights'], ['bakery_intro', 'The warm bakery'], ['town_intro', 'Market day'], ['raccoon_intro', 'Baron von Bins reveal'], ['homecoming', 'Home with your owner'], ['house_chase', 'Samwise’s great escape']];
const params = new URLSearchParams(location.search);
const levelParam = Number(params.get('level') || 1);

export default function PrintStudio() {
    const [level, setLevel] = useState(Number.isInteger(levelParam) && levelParam >= 1 && levelParam <= 16 ? levelParam : 1);
    const [difficulty, setDifficulty] = useState<Difficulty>(Object.values(Difficulty).includes(params.get('difficulty') as Difficulty) ? params.get('difficulty') as Difficulty : Difficulty.EASY);
    const [graphics, setGraphics] = useState<PresentationMode>(params.get('graphics') === 'classic' ? 'classic' : 'enhanced');
    const [floor, setFloor] = useState<HomeFloor>(['ground', 'basement', 'upstairs', 'kitchen', 'bedroom', 'sunroom', 'attic'].includes(params.get('floor') || '') ? params.get('floor') as HomeFloor : 'ground');
    const [subject, setSubject] = useState('level');
    const [story, setStory] = useState<CutsceneType>('intro');
    const [layout, setLayout] = useState('both');
    const [kind, setKind] = useState<'worksheet' | 'color'>('worksheet');
    const [paper, setPaper] = useState('letter');
    const [closeup, setCloseup] = useState(1280);
    const [quests, setQuests] = useState(false);
    const [html, setHtml] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [pageCount, setPageCount] = useState(0);
    const change = (fn: () => void) => { fn(); setHtml(''); setError(''); };

    async function generate() {
        setBusy(true); setError(''); setHtml('');
        // Let the working message paint before rendering the map.
        await new Promise(resolve => setTimeout(resolve, 30));
        try {
            const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
            const meta = { story: subject === 'story', name: NAMES[level - 1], level, difficulty, graphics, floor, packId: stamp, revision: { short: __BUILD_REVISION__, dirty: false }, region: { x: 0, y: 0, width: 1280, height: 800 }, slices: [] };
            let pages;
            if (subject === 'level') {
                const draft = level === 16 ? loadDraft() : undefined;
                const data = prepare({ level, difficulty, graphics, floor, height: 800, scale: 1, seed: 13, quests, draft });
                if (draft) meta.name = draft.name;
                meta.region = data.bounds;
                const slices = slicesFor(data.bounds, closeup, 800, 80);
                pages = [];
                if (layout !== 'slices') pages.push({ id: 'Overview', rect: data.bounds, image: capture(data.bounds, kind, layout === 'both' ? slices : []) });
                if (layout !== 'map') for (const slice of slices) pages.push({ id: slice.id, rect: slice, image: capture(slice, kind) });
            } else {
                meta.level = ({ intro: 1, pound_escape: 3, chase: 7, underwater_intro: 8, pier_intro: 9, neon_intro: 11, bakery_intro: 12, town_intro: 13, raccoon_intro: 14, homecoming: 14, house_chase: 15 })[story];
                meta.name = STORIES.find(([id]) => id === story)![1];
                meta.packId += ` / ${story}`;
                gfxSettings.visualMode = graphics;
                const manager = new CutsceneManager(() => {}, () => {});
                manager.currentType = story;
                const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720;
                const renderer = new Renderer(canvas);
                pages = manager.getLines(story).map((line, i) => {
                    manager.step = i + 1; manager.frame = 60;
                    renderer.drawCutscene(manager, 1280, 720);
                    renderer.drawCinematicOverlay(manager, 1280, 720);
                    const image = document.createElement('canvas'); image.width = 1280; image.height = 720;
                    const ctx = image.getContext('2d')!;
                    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1280, 720);
                    if (kind === 'worksheet') { ctx.globalAlpha = .5; ctx.filter = 'grayscale(1)'; }
                    ctx.drawImage(canvas, 0, 0);
                    return { id: `Scene ${i + 1}`, rect: meta.region, caption: line.text, image: image.toDataURL('image/png').split(',')[1] };
                });
            }
            setHtml(printBooklet(meta, { pages }, paper)); setPageCount(pages.length);
        } catch (e) { setError(e instanceof Error ? e.message : 'The pages could not be prepared. Try a different level.'); }
        finally { setBusy(false); }
    }

    return <main className="studio">
        <style>{`
            html,body{margin:0;overflow:auto!important;touch-action:auto!important;background:#f4f6f2!important;color:#243f39;font-family:Arial,sans-serif!important}
            *{box-sizing:border-box}.studio{max-width:1120px;margin:auto;padding:22px}h1{font-size:28px;margin:0 0 8px}p{line-height:1.5;margin:8px 0 18px}
            form{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;background:white;border:1px solid #d4dfd6;padding:20px;border-radius:14px}
            label{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:bold}select{width:100%;padding:10px;border:1px solid #9cb2a8;border-radius:6px;background:white;color:#243f39;font:inherit}
            .check{flex-direction:row;align-items:center}.action{grid-column:1/-1}button{background:#216452;color:white;padding:12px 20px;border:0;border-radius:8px;font-size:16px;cursor:pointer}button:disabled{opacity:.6;cursor:wait}:focus-visible{outline:3px solid #c47c26;outline-offset:3px}
            .hint{font-size:13px;margin:8px 0 0;color:#536d63}.error{color:#932c2c}.preview{width:100%;height:75vh;border:1px solid #a5b9ad;border-radius:10px;background:#dce2e5}h2{font-size:19px;margin:24px 0 6px}
        `}</style>
        <h1>Print, draw, imagine</h1>
        <p>Pick a level or story, make your pages, then draw your ideas for Onyx. Keep the page codes visible when you send your drawings back.</p>
        <form onSubmit={e => { e.preventDefault(); void generate(); }}>
            <label>What to print<select aria-label="What to print" value={subject} onChange={e => change(() => setSubject(e.target.value))}><option value="level">Level maps</option><option value="story">Cutscene storyboard</option></select></label>
            {subject === 'level' ? <>
                <label>Level<select aria-label="Level" value={level} onChange={e => change(() => setLevel(Number(e.target.value)))}>{NAMES.map((name, i) => <option key={name} value={i + 1}>{i + 1} · {name}</option>)}</select></label>
                {level === 15 && <label>House floor<select aria-label="House floor" value={floor} onChange={e => change(() => setFloor(e.target.value as HomeFloor))}><option value="ground">Ground floor</option><option value="basement">Basement</option><option value="upstairs">Master bedroom</option><option value="kitchen">Kitchen</option><option value="bedroom">Bedroom</option><option value="sunroom">Sunroom</option><option value="attic">Attic hideout</option></select></label>}
                <label>Difficulty<select aria-label="Difficulty" value={difficulty} onChange={e => change(() => setDifficulty(e.target.value as Difficulty))}>{Object.values(Difficulty).map(d => <option key={d} value={d}>{d === 'EASY' ? 'Easy' : d === 'HARD' ? 'Hard' : 'Hardcore'}</option>)}</select></label>
                <label>Pages<select aria-label="Pages" value={layout} onChange={e => change(() => setLayout(e.target.value))}><option value="both">Whole map + close-ups</option><option value="map">Whole map only</option><option value="slices">Close-ups only</option></select></label>
                {layout !== 'map' && <label>Close-up size<select aria-label="Close-up size" value={closeup} onChange={e => change(() => setCloseup(Number(e.target.value)))}><option value="1280">Standard · fewer pages</option><option value="900">Larger details · more pages</option></select></label>}
            </> : <label>Story<select aria-label="Story" value={story} onChange={e => change(() => setStory(e.target.value as CutsceneType))}>{STORIES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>}
            <label>Artwork<select aria-label="Artwork" value={graphics} onChange={e => change(() => setGraphics(e.target.value as PresentationMode))}><option value="classic">Classic</option><option value="enhanced">Enhanced</option></select></label>
            <label>Page style<select aria-label="Page style" value={kind} onChange={e => change(() => setKind(e.target.value as 'worksheet' | 'color'))}><option value="worksheet">Pale worksheet · draw on it</option><option value="color">Full color · reference</option></select></label>
            <label>Paper<select aria-label="Paper" value={paper} onChange={e => change(() => setPaper(e.target.value))}><option value="letter">US Letter</option><option value="a4">A4</option></select></label>
            {subject === 'level' && <label className="check"><input type="checkbox" checked={quests} onChange={e => change(() => setQuests(e.target.checked))} />Show fetch-quest items</label>}
            <div className="action"><button disabled={busy} type="submit">{busy ? 'Making your pages…' : 'Make print preview'}</button><p className="hint">{subject === 'level' ? 'Moving obstacles appear in one pose. Maps use a consistent 800-pixel level height.' : 'One still per spoken line, with the dialogue beneath the heading.'}{level === 16 && subject === 'level' ? ' Custom Course uses the layout saved in this browser, or the starter course.' : ''}</p></div>
        </form>
        {error && <p role="alert" className="error">{error}</p>}
        {html && <section><h2>{pageCount} pages ready</h2><p>Select the sheets you want in the preview, then choose <strong>Print drawing pack</strong>. Print landscape at 100%, or save a PDF.</p><iframe title="Printable pages" className="preview" srcDoc={html} /></section>}
    </main>;
}
