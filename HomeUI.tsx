import React, { useEffect, useRef } from 'react';
import type { GameEngine } from './game/GameEngine';
import { LevelBuilderUI } from './LevelBuilderUI';
import { HomeDog, QUESTS, COMPANIONS, FLOORS, type Quest, type HomeFloor } from './game/Home';
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
    const quest = QUESTS.find(q => q.id === panel);
    const active = world.practice ? [] : QUESTS.filter(q => progress[q.id] === 'found' || progress[q.id] === 'accepted' && q.level === world.currentLevel);
    return <>
        {!world.shopOpen && !panel && <div className={`home-controls ${world.isHome ? "" : "on-trail"}`}>
            <div className="home-actions">
                {world.isHome ? <><strong>{FLOORS[world.homeFloor]}</strong><button onClick={() => world.openHomePanel('floors')}>Change floor</button>
                    {world.homeFloor === 'ground' && <button onClick={() => world.openHomePanel('travel')}>Explore old levels</button>}
                    {world.homeFloor === 'basement' && <><button onClick={() => world.openHomePanel('practice')}>Hardcore practice</button><button onClick={() => world.openHomePanel('builder')}>Create a level</button></>}
                    {world.nearbyRoomDoor && <button onClick={() => { world.changeHomeFloor(world.nearbyRoomDoor!.to); focusGame(); }}>Enter {world.nearbyRoomDoor.label}</button>}
                    {nearby && <button onClick={() => world.openHomePanel(nearby.quest.id)}>E · Talk to {nearby.quest.dog}</button>}</> : <>
                    <button onClick={() => { engine.goHome(); focusGame(); }}>{world.practice ? 'Back to basement' : 'Return home'}</button>
                    {world.practice && <><button onClick={() => { engine.retryPractice(); focusGame(); }}>Retry practice</button>{world.isCustom && <button onClick={() => engine.returnToEditor()}>Back to editor</button>}</>}
                </>}
            </div>
            {world.isHome ? <p>← → / A D to walk · E to talk or shop · {world.homeFloor === 'ground' ? 'Friends and Juniper are to the right →' : world.homeFloor === 'basement' ? 'Practice board · Building bench · Stairs →' : world.homeFloor === 'upstairs' ? 'Meet Opal, Ruby & Samwise · Bedroom →' : 'Walk to a doorway and press E · Stairs →'}</p> : <div className="fetch-status" role="status">{active.map(q => <p key={q.id}>{q.icon} {progress[q.id] === 'found' ? `${q.item} found! Bring it home to ${q.dog}.` : `Find ${q.dog}’s ${q.item}. ${q.hint}`}</p>)}</div>}
            {party.length > 0 && <p className="party-status">🐾 Coming along: {party.map(c => c.dog).join(' · ')}</p>}
            {world.practice && <p className="party-status">{world.isCustom ? (world.editorDraft.name || 'Custom course') : 'Hardcore training'} · Unlimited retries · Practice belongings only</p>}
        </div>}
        {panel && <div className="home-backdrop"><div className={`home-dialog ${panel === "builder" ? "builder-dialog" : ""}`} ref={dialog} role="dialog" aria-modal="true" aria-labelledby="home-title">
            <header><div><small>ONYX’S HOUSE</small><h1 id="home-title">{quest ? `${quest.dog}’s ${quest.item}` : companion ? `Meet ${companion.dog}` : panel === 'floors' ? 'Make yourself at home' : panel === 'practice' ? 'Hardcore practice' : panel === 'builder' ? 'Build your own adventure' : 'Where shall we go?'}</h1></div><button onClick={close} aria-label="Close home conversation">Close · Esc</button></header>
            {panel === 'floors' ? <div className="floor-choices">{(Object.keys(FLOORS) as HomeFloor[]).map(floor => <button key={floor} aria-current={world.homeFloor === floor ? 'location' : undefined} onClick={() => { world.changeHomeFloor(floor); focusGame(); }}>{FLOORS[floor]}{world.homeFloor === floor ? ' · You are here' : ''}</button>)}</div>
            : panel === 'builder' ? <LevelBuilderUI engine={engine} />
            : panel === 'practice' ? <><p>Train on the actual Hardcore layouts. A mistake restarts only this practice attempt. Each retry restores your starting supplies; your real bones, quests, and belongings stay safe.</p><div className="home-levels">{LEVEL_NAMES.map((name, i) => <button key={name} onClick={() => { engine.startPractice(i + 1); focusGame(); }}><b>{i + 1}</b><span>{name}</span></button>)}</div></>
            : companion ? <><div className="dog-conversation"><span aria-hidden="true">🐕</span><div><h2>{companion.dog}</h2><p>{companion.id === 'samwise' && world.player?.accessories.has('goose') ? 'GOOSE! HONK! Oh no, oh no. Onyx? Is that you in there? Please take the feathers off before Opal sees me hiding behind this cushion.' : companion.greeting}</p></div></div><p>{world.belongings.companions.has(companion.id) ? `${companion.dog} is coming on your next trip!` : `${companion.dog} is waiting for an adventure.`}</p><button className="home-primary" onClick={() => world.toggleCompanion()}>{world.belongings.companions.has(companion.id) ? `Ask ${companion.dog} to stay home` : `Invite ${companion.dog} along`}</button><FetchRequest world={world} quest={QUESTS.find(q => q.dog === companion.dog)!} /><p className="home-note">All three friends can join you. They follow your path and jumps without blocking you, taking damage, or collecting your quest items. Come back upstairs to change the party.</p></>
            : quest ? <>
                <FetchRequest world={world} quest={quest} />
            </> : <>
                <p>You earned free travel! All 14 levels are open, without Dev Mode. Return home whenever you like; your bones, outfits, and found quest items come with you.</p>
                <div className="home-levels">{LEVEL_NAMES.map((name, i) => {
                    const jobs = QUESTS.filter(q => q.level === i + 1 && progress[q.id] === 'accepted');
                    return <button key={name} onClick={() => { engine.revisitLevel(i + 1); focusGame(); }}><b>{i + 1}</b><span>{name}{jobs.map(q => <small key={q.id}>{q.icon} Find {q.dog}’s {q.item}</small>)}</span></button>;
                })}</div>
                <section className="home-journal"><h2>Friends’ requests</h2>{QUESTS.map(q => <p key={q.id}>{q.icon} <strong>{q.dog}</strong> · {progress[q.id] === 'complete' ? 'Happy at home ✓' : progress[q.id] === 'found' ? 'Found! Talk to them at home for your reward.' : progress[q.id] === 'accepted' ? `Find the ${q.item} in level ${q.level}.` : 'Walk over and talk to accept a quest.'}</p>)}</section>
                <p className="home-note">Free travel keeps your chosen difficulty. After finishing the story, failed trips can be retried—even in Hardcore. Starting a new journey or reloading the page resets this journey’s progress.</p>
            </>}
        </div></div>}
    </>;
}

function FetchRequest({ world, quest }: { world: GameEngine['world']; quest: Quest }) {
    const status = world.belongings.quests[quest.id];
    return <section className="home-journal">
        <h2>{quest.icon} {quest.item}</h2>
        <p>{status === 'complete' ? quest.thanks : status === 'found' ? `You found my ${quest.item}! Is that for me?` : status === 'accepted' ? `${quest.hint} Look in level ${quest.level}.` : quest.request}</p>
        <p className="quest-reward">{status === 'complete' ? `✓ Reunited · ${quest.reward} bones rewarded` : `Thank-you gift: ${quest.reward} bones`}</p>
        {!status && <button className="home-primary" onClick={() => world.respondToDog(quest.id)}>I’ll find it!</button>}
        {status === 'found' && <button className="home-primary" onClick={() => world.respondToDog(quest.id)}>Give {quest.item} · receive {quest.reward} bones</button>}
        {status === 'accepted' && <><p>Touch the item, return home, and talk to its owner. Quest items have their own bag.</p><button className="home-primary" onClick={() => world.openHomePanel('travel')}>Choose a level</button></>}
    </section>;
}
