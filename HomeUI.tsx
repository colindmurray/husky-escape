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
            const buttons = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), select:not(:disabled)') ?? [])];
            if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
            else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
        };
        window.addEventListener('keydown', trap);
        return () => { window.removeEventListener('keydown', trap); focusGame(); };
    }, [panel]);
    if (!world.belongings.homeUnlocked) return null;
    const nearby = world.props.find(p => p instanceof HomeDog && p.nearby) as HomeDog | undefined;
    const companion = COMPANIONS.find(c => c.id === panel);
    const party = COMPANIONS.filter(c => world.belongings.companions.has(c.id));
    const chapter = houseChapter(progress);
    const chapterNames = ['A very undignified chase', 'Make yourself at home', 'A little more mischief', 'Biscuits for everybody'];
    const nextQuest = companion && QUESTS.find(q => q.dog === companion.dog && questAvailable(q, progress) && progress[q.id] !== 'complete');
    const lastRequest = companion && QUESTS.filter(q => q.dog === companion.dog && progress[q.id] === 'complete').at(-1);
    const active = world.practice ? [] : QUESTS.filter(q => progress[q.id] === 'found' || progress[q.id] === 'accepted' && q.level === world.currentLevel && (!q.room || q.room === world.homeFloor));
    return <>
        {!world.shopOpen && !panel && <div className={`home-controls ${world.isHome ? "" : "on-trail"}`}>
            <div className="home-actions">
                {world.isHome ? <><strong>{FLOORS[world.homeFloor]}</strong><button onClick={() => world.openHomePanel('floors')}>Change floor</button>
                    <button onClick={() => world.openHomePanel('travel')}>Quests & travel</button>
                    {world.homeFloor === 'basement' && <><button onClick={() => world.openHomePanel('practice')}>Hardcore practice</button><button onClick={() => world.openHomePanel('builder')}>Create a level</button></>}
                    {world.nearbyRoomDoor && <button onClick={() => { world.changeHomeFloor(world.nearbyRoomDoor!.to); focusGame(); }}>Enter {world.nearbyRoomDoor.label}</button>}
                    {nearby && <button onClick={() => world.openHomePanel(nearby.quest.id)}>E · Talk to {nearby.quest.dog}</button>}</> : <>
                    <button onClick={() => { engine.goHome(); focusGame(); }}>{world.practice ? 'Back to basement' : 'Return home'}</button>
                    {world.practice && <><button onClick={() => { engine.retryPractice(); focusGame(); }}>Retry practice</button>{world.isCustom && <button onClick={() => engine.returnToEditor()}>Back to editor</button>}</>}
                </>}
            </div>
            {world.isHome ? <p>← → / A D to walk · E to talk or shop · {world.homeFloor === 'basement' ? 'Practice board · Building bench · Stairs →' : 'Walk to a dog or doorway · Explore every room'}</p> : <div className="fetch-status" role="status">{active.map(q => <p key={q.id}>{q.icon} {progress[q.id] === 'found' ? `${q.item} found! Bring it home to ${q.dog}.` : `Find ${q.dog}’s ${q.item}. ${q.hint}`}</p>)}</div>}
            {world.isHome && <><p className="house-chapter">Chapter {chapter + 1} · {chapterNames[chapter]}</p>{world.homeNotice && <p className="house-notice" role="status">{world.homeNotice}</p>}<div className="fetch-status">{active.map(q => <p key={q.id}>{q.icon} {progress[q.id] === 'found' ? `Bring ${q.item} to ${q.dog} · ${FLOORS[dogRoom(COMPANIONS.find(c => c.dog === q.dog)!.id, progress)]}` : q.hint}</p>)}</div></>}
            {party.length > 0 && <p className="party-status">🐾 Coming along: {party.map(c => c.dog).join(' · ')}</p>}
            {world.practice && <p className="party-status">{world.isCustom ? (world.editorDraft.name || 'Custom course') : 'Hardcore training'} · Unlimited retries · Practice belongings only</p>}
        </div>}
        {panel && <div className="home-backdrop"><div className={`home-dialog ${panel === "builder" ? "builder-dialog" : ""}`} ref={dialog} role="dialog" aria-modal="true" aria-labelledby="home-title">
            <header><div><small>ONYX’S HOUSE</small><h1 id="home-title">{companion ? `Meet ${companion.dog}` : panel === 'floors' ? 'Make yourself at home' : panel === 'practice' ? 'Hardcore practice' : panel === 'builder' ? 'Build your own adventure' : 'Where shall we go?'}</h1></div><button onClick={close} aria-label="Close home conversation">Close · Esc</button></header>
            {panel === 'floors' ? <div className="floor-choices">{(Object.keys(FLOORS) as HomeFloor[]).map(floor => <button key={floor} aria-current={world.homeFloor === floor ? 'location' : undefined} onClick={() => { world.changeHomeFloor(floor); focusGame(); }}>{FLOORS[floor]}{world.homeFloor === floor ? ' · You are here' : ''}</button>)}</div>
            : panel === 'builder' ? <LevelBuilderUI engine={engine} />
            : panel === 'practice' ? <><p>Train on the actual Hardcore layouts. A mistake restarts only this practice attempt. Each retry restores your starting supplies; your real bones, quests, and belongings stay safe.</p><div className="home-levels">{LEVEL_NAMES.map((name, i) => <button key={name} onClick={() => { engine.startPractice(i + 1); focusGame(); }}><b>{i + 1}</b><span>{name}</span></button>)}</div></>
            : companion ? <><div className="dog-conversation"><DogPortrait id={companion.id} activity={world.props.find((p): p is HomeDog => p instanceof HomeDog && p.quest.id === companion.id)?.activity ?? ''} /><div><h2>{companion.dog}</h2><p>{companion.id === 'samwise' && world.player?.accessories.has('goose') ? 'GOOSE! HONK! Onyx? Is that you in there? Please take the feathers off before Opal sees me hiding behind this cushion.' : chapter === 3 ? 'Tea party in the kitchen! Everybody is home, the biscuits are warm, and nobody is chasing anybody. For now.' : lastRequest && !nextQuest ? lastRequest.thanks : companion.greeting}</p></div></div>
                {nextQuest ? <FetchRequest world={world} quest={nextQuest} /> : <p className="home-note">{chapter === 0 ? 'Bring the kitchen biscuits to Samwise in the entry hall first.' : chapter < 2 ? 'Help the other dogs settle in to unlock our next adventure.' : 'All my requests are finished. Let’s check on everyone else!'}</p>}
                {chapter > 0 && <><button onClick={() => world.toggleCompanion()}>{world.belongings.companions.has(companion.id) ? `Ask ${companion.dog} to stay home` : `Invite ${companion.dog} along`}</button><p className="home-note">Talk to a friend in their current room to change your traveling party.</p></>}
            </>
            : <>
                <p>You earned free travel! All 14 levels are open, without Dev Mode. Return home whenever you like; your bones, outfits, and found quest items come with you.</p>
                <div className="home-levels">{LEVEL_NAMES.map((name, i) => {
                    const jobs = QUESTS.filter(q => q.level === i + 1 && progress[q.id] === 'accepted');
                    return <button key={name} onClick={() => { engine.revisitLevel(i + 1); focusGame(); }}><b>{i + 1}</b><span>{name}{jobs.map(q => <small key={q.id}>{q.icon} Find {q.dog}’s {q.item}</small>)}</span></button>;
                })}</div>
                <section className="home-journal"><h2>Chapter {chapter + 1} · {chapterNames[chapter]}</h2>
                    <div className="dog-locations">{COMPANIONS.map(dog => <button key={dog.id} onClick={() => { world.changeHomeFloor(dogRoom(dog.id, progress)); focusGame(); }}>{dog.dog} · {FLOORS[dogRoom(dog.id, progress)]}</button>)}</div>
                    {QUESTS.filter(q => questAvailable(q, progress)).map(q => <p key={q.id}>{q.icon} <strong>{q.dog} · {q.item}</strong> — {progress[q.id] === 'complete' ? 'Returned ✓' : progress[q.id] === 'found' ? 'Found! Bring it to its owner.' : progress[q.id] === 'accepted' ? q.hint : 'Talk to its owner to begin.'}</p>)}
                    {chapter < 2 && <p className="home-note">{chapter === 0 ? 'Return Samwise’s biscuits to unlock the three room adventures.' : 'Return Lammy, the sploot cushion, and the lunchbox to unlock the next chapter.'}</p>}
                </section>
                <p className="home-note">Free travel keeps your chosen difficulty. After finishing the story, failed trips can be retried—even in Hardcore. Starting a new journey or reloading the page resets this journey’s progress.</p>
            </>}
        </div></div>}
    </>;
}

function FetchRequest({ world, quest }: { world: GameEngine['world']; quest: Quest }) {
    const status = world.belongings.quests[quest.id];
    return <section className="home-journal">
        <h2>{quest.icon} {quest.item}</h2>
        <p>{status === 'complete' ? quest.thanks : status === 'found' ? `You found my ${quest.item}! Is that for me?` : status === 'accepted' ? quest.hint : quest.request}</p>
        <p className="quest-reward">{status === 'complete' ? `✓ Reunited · ${quest.reward} bones rewarded` : `Thank-you gift: ${quest.reward} bones`}</p>
        {!status && questAvailable(quest, world.belongings.quests) && <button className="home-primary" onClick={() => world.respondToDog(quest.id)}>I’ll find it!</button>}
        {status === 'found' && <button className="home-primary" onClick={() => world.respondToDog(quest.id)}>Give {quest.item} · receive {quest.reward} bones</button>}
        {status === 'accepted' && <><p>Touch the item, return home, and talk to its owner. Quest items have their own bag.</p><button className="home-primary" onClick={() => quest.room ? world.changeHomeFloor(quest.room) : world.openHomePanel('travel')}>{quest.room ? `Go to ${FLOORS[quest.room]}` : 'Choose a level'}</button></>}
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
