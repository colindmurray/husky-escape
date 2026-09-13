import React, { useEffect, useRef } from 'react';
import type { World } from './game/engine/World';
import { Player } from './game/entities/Player';
import { SHOP_GOODS, isSupply, type ShopGood } from './game/Shop';
import './shop.css';

export function ShopUI({ world, visualMode }: { world: World; visualMode: string }) {
    const dialog = useRef<HTMLDivElement>(null);
    const portrait = useRef<HTMLCanvasElement>(null);
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
    useEffect(() => {
        const canvas = portrait.current; if (!canvas || !world.shopOpen) return;
        const ctx = canvas.getContext('2d')!;
        const shopkeeper = new Player(125, 58); shopkeeper.accessories.add('hat'); shopkeeper.accessories.add('collar');
        ctx.fillStyle = visualMode === 'enhanced' ? '#563a34' : '#77513b'; ctx.fillRect(0, 0, 320, 145);
        ctx.strokeStyle = '#bd886235'; ctx.lineWidth = 2;
        for (let y = 12; y < 145; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(320, y); ctx.stroke(); }
        ctx.fillStyle = '#f3d59a'; ctx.fillRect(17, 25, 70, 58); ctx.fillStyle = '#4d928d'; ctx.fillRect(23, 31, 58, 46);
        ctx.fillStyle = '#f2d39a'; ctx.fillRect(50, 31, 4, 46); ctx.fillRect(23, 53, 58, 4);
        ctx.save(); ctx.translate(-125, -58); ctx.scale(2, 2); shopkeeper.draw(ctx, 0, 0); ctx.restore();
        ctx.fillStyle = '#a9764f'; ctx.fillRect(0, 113, 320, 32); ctx.fillStyle = '#e0b77a'; ctx.fillRect(0, 109, 320, 7);
        ctx.fillStyle = '#f4d89e'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('JUNIPER', 119, 135);
        ctx.fillStyle = '#ddbf93'; ctx.fillRect(251, 78, 43, 30); ctx.fillStyle = '#498d84'; ctx.font = '24px sans-serif'; ctx.fillText('✦', 260, 102);
    }, [world.shopOpen, visualMode]);
    const { belongings } = world;
    const visible = belongings.slots.some(Boolean) || belongings.owned.size > 0;
    return <>
        {!world.shopOpen && <div className="pocket-hud" aria-label="Inventory">
            {visible && belongings.slots.map((item, index) => <button key={index} disabled={!item} aria-label={item ? `Use ${SHOP_GOODS[item].name}, slot ${index + 1}` : `Empty slot ${index + 1}`} title={item ? SHOP_GOODS[item].description : 'Find a secret doghouse to buy treats'} onClick={() => { world.useInventorySlot(index); focusGame(); }}>
                <kbd>{index + 1}</kbd><span>{item ? SHOP_GOODS[item].icon : '·'}</span><small>{item ? SHOP_GOODS[item].name : 'Empty'}</small>
            </button>)}
            {world.shopDoor?.nearby && world.shopDoor.unlocked && <button className="enter-shop" onClick={() => world.openShop()}>E · Enter doghouse</button>}
        </div>}
        {world.shopOpen && <div className={`shop-backdrop ${visualMode}`}>
            <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="shop-title" className="husky-shop">
                <header><div><small>SECRET DOGHOUSE · {world.shopDoor?.title}</small><h1 id="shop-title">The Hidden Paw</h1></div><button className="leave-shop" onClick={leave} aria-label="Leave shop">Back to trail <kbd>Esc</kbd></button></header>
                <div className="shop-welcome"><canvas ref={portrait} width={320} height={145} role="img" aria-label="Juniper the husky shopkeeper behind a wooden counter" /><div><h2>Awoo, fellow explorer!</h2><p>I'm Juniper. Pick a treat for the trail, or try on something lovely.</p><strong>🍖 {world.player?.bonesCollected ?? 0} bones</strong><small>The trail is paused. Your belongings stay with you through this journey.</small></div></div>
                <div className="shop-shelves">{(['Treats for the trail', 'Wear something lovely'] as const).map((title, section) => <section key={title}><h2>{title}</h2><div className="shop-cards">{(Object.keys(SHOP_GOODS) as ShopGood[]).filter(id => isSupply(id) === (section === 0)).map(id => {
                    const good = SHOP_GOODS[id], supply = isSupply(id), owned = !supply && belongings.owned.has(id), equipped = !supply && belongings.equipped.has(id);
                    const full = supply && !belongings.slots.includes(null), affordable = (world.player?.bonesCollected ?? 0) >= good.price;
                    return <article key={id}><span className={`shop-item-icon ${id}`} aria-hidden="true">{good.icon}</span><h3>{good.name}</h3><p>{good.description}</p><button disabled={!owned && (full || !affordable)} onClick={() => world.buyGood(id)}>{owned ? (equipped ? 'Take off' : 'Wear') : full ? 'Pockets full' : `Buy · ${good.price} bones`}</button>{equipped && <small>Wearing ✓</small>}</article>;
                })}</div></section>)}</div>
                <footer><div className="shop-pockets" aria-label="Your three pockets">{belongings.slots.map((item, i) => <span key={i}>{i + 1} · {item ? SHOP_GOODS[item].name : 'Empty pocket'}</span>)}</div><p role="status" aria-live="polite">{world.shopMessage || 'Use pockets 1–3 on the trail, or tap their buttons. Accessories are just for style.'}</p></footer>
            </div>
        </div>}
    </>;
}
