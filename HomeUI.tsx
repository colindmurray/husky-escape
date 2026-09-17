import React, { useEffect, useRef } from 'react';
import type { GameEngine } from './game/GameEngine';
import { LevelBuilderUI } from './LevelBuilderUI';
import { HomeDog, QUESTS, COMPANIONS, FLOORS, questAvailable, houseChapter, dogRoom, type Quest, type HomeFloor } from './game/Home';
import { drawFamilyDog } from './game/engine/FamilyArt';
import { gfxSettings } from './game/GfxSettings';
import './home.css';

const LEVEL_NAMES = ['The Pound', 'Pound Escape', 'The Forest', 'The Beach', 'The Mountains', 'The Ski Slopes', 'The Chase', 'Underwater', 'The Pier', 'Construction', 'Neon City', 'The Bakery', 'The Town', 'The Backyard'];

export function HomeUI({ engine }: { engine: GameEngine }) {
    const world = engine.world, panel = world.homePanel, progress = world.belongings.quests;
    const dialog = useRef<HTMLDivElement>(null);
    const focusGame = () => document.querySelector<HTMLCanvasElement>('canvas[tabindex]')?.focus();
    const close = () => { world.closeHomePanel(); focusGame(); };
    useEffect(() => {
        if (!panel) return;
        dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
        const trap = (event: KeyboardEvent) => {
            if (event.key === 'Escape') { event.preventDefault(); close(); }
            if (event.key !== 'Tab') return;
            const buttons = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), select:not(:disabled), summary') ?? [])];
            if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
            else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
        };
        window.addEventListener('keydown', trap);
        return () => { window.removeEventListener('keydown', trap); focusGame(); };
    }, [panel]);
    if (!world.belongings.homeUnlocked) return null;
    const companion = COMPANIONS.find(c => c.id === panel);
    const party = COMPANIONS.filter(c => world.belongings.companions.has(c.id));
    const chapter = houseChapter(progress);
    const chapterNames = ['A very undignified chase', 'Make yourself at home', 'A little more mischief', 'Biscuits for everybody'];
    const nextQuest = companion && QUESTS.find(q => q.dog === companion.dog && questAvailable(q, progress) && progress[q.id] !== 'complete');
    const lastRequest = companion && QUESTS.filter(q => q.dog === companion.dog && progress[q.id] === 'complete').at(-1);
    const pending = QUESTS.filter(q => ['accepted', 'carrying', 'found'].includes(progress[q.id]));
    const available = QUESTS.filter(q => !progress[q.id] && questAvailable(q, progress));
    const completed = QUESTS.filter(q => progress[q.id] === 'complete');
    return <>
        {!world.shopOpen && !panel && <>
            <div className="home-controls" aria-label="Adventure tools">
                <button className="journal-toggle" aria-label="Quest journal" aria-haspopup="dialog" title="Quest journal" onClick={() => world.openHomePanel('journal')}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5C8 2 4 3 3 4v15c3-2 6-1 9 1 3-2 6-3 9-1V4c-3-2-6-1-9 1Zm0 0v15" /></svg>
                    {(pending.length || available.length) > 0 && <span className="journal-count" aria-hidden="true">{pending.length || available.length}</span>}
                </button>
                {!world.isHome && <button aria-label={world.practice ? 'Back to basement' : 'Return home'} title={world.practice ? 'Back to basement' : 'Return home'} onClick={() => { engine.goHome(); focusGame(); }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10" /></svg>
                </button>}
                {world.practice && <button aria-label="Retry practice" title="Retry practice" onClick={() => { engine.retryPractice(); focusGame(); }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11a8 8 0 1 1 1 6M4 4v7h7" /></svg>
                </button>}
            </div>
            {world.isHome && <InteractionPrompt world={world} focusGame={focusGame} />}
        </>}
        {panel && <div className="home-backdrop"><div className={`home-dialog ${panel === "builder" ? "builder-dialog" : panel === "journal" ? "journal-dialog" : ""}`} ref={dialog} role="dialog" aria-modal="true" aria-labelledby="home-title">
            <header><div><small>ONYX’S HOUSE</small><h1 id="home-title">{companion ? `Meet ${companion.dog}` : panel === 'boy' ? 'The little boy' : panel === 'journal' ? 'Quest journal' : panel === 'floors' ? 'Make yourself at home' : panel === 'practice' ? 'Hardcore practice' : panel === 'builder' ? 'Build your own adventure' : 'Where shall we go?'}</h1></div><button onClick={close} aria-label="Close home conversation">Close · Esc</button></header>
            {['journal', 'floors', 'travel'].includes(panel) && world.isHome && <nav className="home-panel-nav" aria-label="House navigation">
                <button aria-current={panel === 'journal' ? 'page' : undefined} onClick={() => world.openHomePanel('journal')}>Quest journal</button>
                <button aria-current={panel === 'floors' ? 'page' : undefined} onClick={() => world.openHomePanel('floors')}>Rooms</button>
                <button aria-current={panel === 'travel' ? 'page' : undefined} onClick={() => world.openHomePanel('travel')}>Travel</button>
            </nav>}
            {panel === 'journal' ? <>
                <p className="journal-chapter">{chapterNames[chapter]}</p>
                <section className="home-journal"><h2>In progress · {pending.length}</h2>
                    {!pending.length && <p className="home-note">No errands in progress.</p>}
                    {pending.map(q => <article key={q.id}><h3>{q.icon} {q.dog} · {q.item}</h3><p>{progress[q.id] === 'carrying' ? `Collected — reach the exit of level ${q.level} to bring it home. Leaving early or losing this run puts it back.` : progress[q.id] === 'found' ? `Ready to return to ${q.dog} · ${FLOORS[dogRoom(COMPANIONS.find(c => c.dog === q.dog)!.id, progress)]}.` : q.hint}</p></article>)}
                </section>
                {available.length > 0 && <section className="home-journal"><h2>Around the house</h2>{available.map(q => <article key={q.id}><h3>{q.icon} {q.dog} · {q.item}</h3><p>Talk to {q.dog} · {FLOORS[dogRoom(COMPANIONS.find(c => c.dog === q.dog)!.id, progress)]}.</p></article>)}</section>}
                <details className="home-journal completed-quests"><summary>Completed · {completed.length}</summary>{completed.map(q => <p key={q.id}>✓ {q.dog} · {q.item} <small>+{q.reward} bones</small></p>)}</details>
                {world.isHome && <details className="home-journal"><summary>Find a friend</summary><div className="dog-locations">{COMPANIONS.map(dog => <button key={dog.id} onClick={() => { world.changeHomeFloor(dogRoom(dog.id, progress)); focusGame(); }}>{dog.dog} · {FLOORS[dogRoom(dog.id, progress)]}</button>)}</div></details>}
                {party.length > 0 && <p className="home-note">Coming along: {party.map(c => c.dog).join(', ')}</p>}
                {world.practice && <><p className="home-note">Practice has unlimited retries and does not advance quests.</p>{world.isCustom && <button onClick={() => engine.returnToEditor()}>Back to editor</button>}</>}
                {world.homeNotice && world.isHome && <p className="home-note">{world.homeNotice}</p>}
                <details className="home-journal"><summary>How to play</summary><p>Walk with ← → or A D. Press E or tap the hovering E when you are near a dog, doorway, or stairway.</p><p>Collect an errand item and reach that level’s exit before returning home. House errands can be returned directly. Progress lasts for this journey; reloading or starting over resets it.</p></details>
            </> : panel === 'floors' ? <div className="floor-choices">{(Object.keys(FLOORS) as HomeFloor[]).map(floor => <button key={floor} aria-current={world.homeFloor === floor ? 'location' : undefined} onClick={() => { world.changeHomeFloor(floor); focusGame(); }}>{FLOORS[floor]}{world.homeFloor === floor ? ' · You are here' : ''}</button>)}</div>
            : panel === 'boy' ? <div className="boy-conversation"><span aria-hidden="true">🎮</span><h2>“{['AHHHH, Demo’ed!!! That car came out of NOWHERE!', 'I’m going for the demo! Onyx, watch this. WATCH THIS!', 'Samwise demo’ed my sandwich. I wasn’t even AFK!', 'One more Rocket League match. Just one. I’m on a demo streak.'][Math.floor(world.homeFrame / 180) % 4]}”</h2><p>He keeps one eye on Rocket League and the other on his toast.</p></div>
            : panel === 'builder' ? <LevelBuilderUI engine={engine} />
            : panel === 'practice' ? <><p>Train on the actual Hardcore layouts. A mistake restarts only this practice attempt. Each retry restores your starting supplies; your real bones, quests, and belongings stay safe.</p><div className="home-levels">{LEVEL_NAMES.map((name, i) => <button key={name} onClick={() => { engine.startPractice(i + 1); focusGame(); }}><b>{i + 1}</b><span>{name}</span></button>)}</div></>
            : companion ? <><div className="dog-conversation"><DogPortrait id={companion.id} activity={world.props.find((p): p is HomeDog => p instanceof HomeDog && p.quest.id === companion.id)?.activity ?? ''} /><div><h2>{companion.dog}</h2><p>{companion.id === 'samwise' && world.player?.accessories.has('goose') ? 'GOOSE! HONK! Onyx? Is that you in there? Please take the feathers off before Opal sees me hiding behind this cushion.' : chapter === 3 ? 'Tea party in the kitchen! Everybody is home, the biscuits are warm, and nobody is chasing anybody. For now.' : lastRequest && !nextQuest ? lastRequest.thanks : companion.greeting}</p></div></div>
                {nextQuest ? <FetchRequest world={world} quest={nextQuest} /> : <p className="home-note">{chapter === 0 ? 'Bring the kitchen biscuits to Samwise in the entry hall first.' : chapter < 2 ? 'Help the other dogs settle in to unlock our next adventure.' : 'All my requests are finished. Let’s check on everyone else!'}</p>}
                {chapter > 0 && <><button onClick={() => world.toggleCompanion()}>{world.belongings.companions.has(companion.id) ? `Ask ${companion.dog} to stay home` : `Invite ${companion.dog} along`}</button><p className="home-note">Talk to a friend in their current room to change your traveling party.</p></>}
            </>
            : <>
                <p>You earned free travel! All 14 levels are open, without Dev Mode. Return home whenever you like; your bones and outfits come with you. Quest items come home after you reach the level’s exit.</p>
                <div className="home-levels">{LEVEL_NAMES.map((name, i) => {
                    const jobs = QUESTS.filter(q => q.level === i + 1 && progress[q.id] === 'accepted');
                    return <button key={name} onClick={() => { engine.revisitLevel(i + 1); focusGame(); }}><b>{i + 1}</b><span>{name}{jobs.map(q => <small key={q.id}>{q.icon} Find {q.dog}’s {q.item}</small>)}</span></button>;
                })}</div>
                <p className="home-note">Free travel keeps your chosen difficulty. After finishing the story, failed trips can be retried—even in Hardcore. Starting a new journey or reloading the page resets this journey’s progress.</p>
            </>}
        </div></div>}
    </>;
}

function FetchRequest({ world, quest }: { world: GameEngine['world']; quest: Quest }) {
    const status = world.belongings.quests[quest.id];
    return <section className="home-journal">
        <h2>{quest.icon} {quest.item}</h2>
        <p>{status === 'complete' ? quest.thanks : status === 'found' ? `You found my ${quest.item}! Is that for me?` : status === 'carrying' ? `Reach the exit of level ${quest.level} to bring it home.` : status === 'accepted' ? quest.hint : quest.request}</p>
        <p className="quest-reward">{status === 'complete' ? `✓ Reunited · ${quest.reward} bones rewarded` : `Thank-you gift: ${quest.reward} bones`}</p>
        {!status && questAvailable(quest, world.belongings.quests) && <button className="home-primary" onClick={() => world.respondToDog(quest.id)}>I’ll find it!</button>}
        {status === 'found' && <button className="home-primary" onClick={() => world.respondToDog(quest.id)}>Give {quest.item} · receive {quest.reward} bones</button>}
        {status === 'accepted' && <><p>{quest.room ? 'Find the item in the house and bring it back.' : 'Collect the item and finish its level before bringing it home.'}</p><button className="home-primary" onClick={() => quest.room ? world.changeHomeFloor(quest.room) : world.openHomePanel('travel')}>{quest.room ? `Go to ${FLOORS[quest.room]}` : 'Choose a level'}</button></>}
    </section>;
}

function DogPortrait({ id, activity }: { id: string; activity: string }) {
    const canvas = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
        ctx.clearRect(0, 0, 180, 140); ctx.save(); ctx.scale(2.2, 2.2); drawFamilyDog(ctx, id, 24, 19, true, false, 2, false, false, activity); ctx.restore();
    }, [id, activity, gfxSettings.visualMode]);
    return <canvas ref={canvas} width={180} height={140} className="dog-portrait" role="img" aria-label={`Portrait of ${COMPANIONS.find(c => c.id === id)?.dog}`} />;
}

function InteractionPrompt({ world, focusGame }: { world: GameEngine['world']; focusGame: () => void }) {
    const button = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        let frame: number;
        const update = () => {
            const target = world.homeInteraction, node = button.current;
            if (node) {
                node.hidden = !target;
                if (target) {
                    node.style.left = `${Math.max(26, Math.min(world.width - 26, target.x - world.cameraX))}px`;
                    node.style.top = `${Math.max(90, target.y - world.cameraY)}px`;
                    node.setAttribute('aria-label', target.label); node.title = target.label;
                }
            }
            frame = requestAnimationFrame(update);
        };
        update(); return () => cancelAnimationFrame(frame);
    }, [world]);
    return <button ref={button} hidden className="home-interaction" aria-keyshortcuts="E" onClick={() => { world.interactHome(); focusGame(); }}><span aria-hidden="true">E</span></button>;
}
