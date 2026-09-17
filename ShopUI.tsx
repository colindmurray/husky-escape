import React, { useEffect, useRef } from 'react';
import type { World } from './game/engine/World';
import { Player } from './game/entities/Player';
import { SHOP_GOODS, SHOP_COSMETICS, shopStock, isSupply, isSkin, Belongings, type Accessory } from './game/Shop';
import './shop.css';
import { InteractionPrompt } from './HomeUI';
import { inputManager } from './game/Input';

function OutfitPreview({ id, equipped, visualMode }: { id: Accessory; equipped: ReadonlySet<Accessory>; visualMode: string }) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const outfit = [...equipped].join(',');
    useEffect(() => {
        const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
        const look = new Belongings();
        look.equipped = new Set(outfit ? outfit.split(',') as Accessory[] : []);
        if (!look.equipped.has(id)) look.toggleAccessory(id);
        const onyx = new Player(29, 25); onyx.accessories = look.equipped; onyx.grounded = true;
        ctx.clearRect(0, 0, 200, 140); ctx.save(); ctx.scale(2, 2); onyx.draw(ctx, 0, 0); ctx.restore();
    }, [id, outfit, visualMode]);
    return <canvas ref={canvas} className="outfit-preview" width={200} height={140} role="img" aria-label={`Onyx wearing ${SHOP_GOODS[id].name}`} />;
}

export function ShopUI({ world, visualMode }: { world: World; visualMode: string }) {
    const dialog = useRef<HTMLDivElement>(null);
    const focusGame = () => document.querySelector<HTMLCanvasElement>('canvas')?.focus();
    const leave = () => { world.closeShop(); focusGame(); };
    useEffect(() => {
        if (!world.shopOpen) return;
        const previous = document.activeElement as HTMLElement | null;
        dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
        const trapFocus = (event: KeyboardEvent) => {
            if (event.key === 'Escape') { event.preventDefault(); leave(); }
            if (event.key !== 'Tab') return;
            const buttons = [...(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
            const first = buttons[0], last = buttons.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        window.addEventListener('keydown', trapFocus);
        return () => { window.removeEventListener('keydown', trapFocus); previous?.focus(); };
    }, [world.shopOpen]);
    const { belongings } = world;
    const effects = world.player ? [
        ['spring', world.player.springTimer], ['sprint', world.player.sprintTimer], ['feather', world.player.featherTimer], ['feast', world.player.feastTimer], ['hush', world.hushTimer],
    ] as const : [];
    const visible = belongings.slots.some(Boolean) || belongings.owned.size > 0;
    return <>
        {world.shopRoom && !world.shopOpen && <>
            <InteractionPrompt world={world} focusGame={focusGame} />
            <div className="shop-walk-controls" aria-label="Walk around the shop">{(['ArrowLeft', 'ArrowRight'] as const).map((key, i) => <button key={key} aria-label={i ? 'Walk right' : 'Walk left'}
                onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); inputManager.setKey(key, true); }}
                onPointerUp={() => inputManager.setKey(key, false)} onPointerCancel={() => inputManager.setKey(key, false)} onLostPointerCapture={() => inputManager.setKey(key, false)}>{i ? '→' : '←'}</button>)}</div>
        </>}
        {!world.isHome && !world.shopRoom && !world.homePanel && <div className="pocket-hud" aria-label="Inventory">
            {effects.some(([, frames]) => frames > 0) && <p className="active-treats">{effects.filter(([, frames]) => frames > 0).map(([id, frames]) => `${SHOP_GOODS[id].icon} ${SHOP_GOODS[id].name} ${Math.ceil(frames / 60)}s`).join(" · ")}</p>}
            {visible && belongings.slots.map((item, index) => <button key={index} disabled={!item || world.isHome} aria-label={item ? `Use ${SHOP_GOODS[item].name}, slot ${index + 1}` : `Empty slot ${index + 1}`} title={item ? SHOP_GOODS[item].description : 'Find a secret doghouse to buy treats'} onClick={() => { world.useInventorySlot(index); focusGame(); }}>
                <kbd>{index + 1}</kbd><span>{item ? SHOP_GOODS[item].icon : '·'}</span><small>{item ? SHOP_GOODS[item].name : 'Empty'}</small>
            </button>)}
            {world.shopDoor?.nearby && world.shopDoor.unlocked && <button className="enter-shop" onClick={() => world.openShop()}>E · Enter doghouse</button>}
        </div>}
        {world.shopOpen && <div className={`shop-backdrop ${visualMode}`}>
            <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="shop-title" className="husky-shop">
                <header><div><small>SECRET DOGHOUSE · {world.shopDoor?.title}</small><h1 id="shop-title">The Hidden Paw</h1></div><button className="leave-shop" onClick={leave} aria-label="Close store menu">Back to shop <kbd>Esc</kbd></button></header>
                <div className="shop-welcome"><div><h2>Awoo, fellow explorer!</h2><p>Three trail treats and an outfit you’ll only find here.</p></div><strong>🍖 {world.player?.bonesCollected ?? 0} bones</strong></div>
                <div className="shop-shelves">{(['Treats for the trail', 'Wear something lovely', 'A different look'] as const).map((title, section) => <section key={title}><h2>{title}</h2><div className="shop-cards">{[...new Set([...shopStock(world.currentLevel, belongings), ...belongings.owned])].filter(id => section === 0 ? isSupply(id) : section === 1 ? !isSupply(id) && !isSkin(id) : isSkin(id)).map(id => {
                    const good = SHOP_GOODS[id], supply = isSupply(id), owned = !supply && belongings.owned.has(id), equipped = !supply && belongings.equipped.has(id);
                    const full = supply && !belongings.slots.includes(null), affordable = (world.player?.bonesCollected ?? 0) >= good.price;
                    return <article key={id}>{isSupply(id) ? <span className={`shop-item-icon ${id}`} aria-hidden="true">{good.icon}</span> : <OutfitPreview id={id} equipped={belongings.equipped} visualMode={visualMode} />}<h3>{good.name}</h3>{id === SHOP_COSMETICS[world.currentLevel] && <small className="shop-exclusive">Only here</small>}<p>{good.description}</p><button disabled={!owned && (full || !affordable)} onClick={() => world.buyGood(id)}>{owned ? (equipped ? 'Take off' : 'Wear') : full ? 'Pockets full' : `Buy · ${good.price} bones`}</button>{equipped && <small>Wearing ✓</small>}</article>;
                })}</div></section>)}</div>
                <footer><div className="shop-pockets" aria-label="Your three pockets">{belongings.slots.map((item, i) => <span key={i}>{i + 1} · {item ? SHOP_GOODS[item].name : 'Empty pocket'}</span>)}</div><p role="status" aria-live="polite">{world.shopMessage || 'Use pockets 1–3 on the trail, or tap their buttons. Outfits are just for style. Wear one hat and one skin at a time; take off a skin to be husky Onyx again.'}</p></footer>
            </div>
        </div>}
    </>;
}
