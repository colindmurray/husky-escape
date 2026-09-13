import React, { useEffect, useRef } from 'react';
import type { GameEngine } from './game/GameEngine';
import { HomeDog, QUESTS } from './game/Home';
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
            const buttons = [...(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
            if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
            else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
        };
        window.addEventListener('keydown', trap);
        return () => { window.removeEventListener('keydown', trap); focusGame(); };
    }, [panel]);
    if (!world.belongings.homeUnlocked) return null;
    const nearby = world.props.find(p => p instanceof HomeDog && p.nearby) as HomeDog | undefined;
    const quest = QUESTS.find(q => q.id === panel), status = quest && progress[quest.id];
    const active = QUESTS.filter(q => progress[q.id] === 'found' || progress[q.id] === 'accepted' && q.level === world.currentLevel);
    return <>
        {!world.shopOpen && !panel && <div className={`home-controls ${world.isHome ? "" : "on-trail"}`}>
            <div className="home-actions">
                {world.isHome ? <><strong>Home, sweet home</strong><button onClick={() => world.openHomePanel('travel')}>Explore old levels</button>{nearby && <button onClick={() => world.openHomePanel(nearby.quest.id)}>E · Talk to {nearby.quest.dog}</button>}</> : <button onClick={() => { engine.goHome(); focusGame(); }}>Return home</button>}
            </div>
            {world.isHome ? <p>← → / A D to walk · E to talk or shop · Friends and Juniper are to the right →</p> : <div className="fetch-status" role="status">{active.map(q => <p key={q.id}>{q.icon} {progress[q.id] === 'found' ? `${q.item} found! Bring it home to ${q.dog}.` : `Find ${q.dog}’s ${q.item}. ${q.hint}`}</p>)}</div>}
        </div>}
        {panel && <div className="home-backdrop"><div className="home-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="home-title">
            <header><div><small>ONYX’S HOUSE</small><h1 id="home-title">{quest ? `${quest.dog}’s ${quest.item}` : 'Where shall we go?'}</h1></div><button onClick={close} aria-label="Close home conversation">Close · Esc</button></header>
            {quest ? <>
                <div className="dog-conversation"><span aria-hidden="true">{quest.icon}</span><div><h2>{quest.dog}</h2><p>{status === 'complete' ? quest.thanks : status === 'found' ? `You found my ${quest.item}! Is that for me?` : status === 'accepted' ? `Still looking? ${quest.hint} It’s in level ${quest.level}.` : quest.request}</p></div></div>
                <p className="quest-reward">{status === 'complete' ? `✓ Reunited · ${quest.reward} bones rewarded` : `Thank-you gift: ${quest.reward} bones`}</p>
                {!status && <button className="home-primary" onClick={() => world.respondToDog()}>I’ll find it!</button>}
                {status === 'found' && <button className="home-primary" onClick={() => world.respondToDog()}>Give {quest.item} · receive {quest.reward} bones</button>}
                {status === 'accepted' && <><p>Your quest is in the travel list. Touch the item to collect it, then use Return home. Quest items have their own bag and don’t use your three treat pockets.</p><button className="home-primary" onClick={() => world.openHomePanel('travel')}>Choose a level</button></>}
                {status === 'complete' && <button className="home-primary" onClick={close}>You’re welcome!</button>}
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
