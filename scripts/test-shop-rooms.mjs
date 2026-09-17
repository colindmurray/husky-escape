import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 5196, base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
let serverLog = '', browser;
server.stdout.on('data', x => serverLog += x); server.stderr.on('data', x => serverLog += x);
try {
    for (let i = 0; i < 100; i++) {
        if (server.exitCode !== null) throw Error(serverLog);
        try { if ((await fetch(base)).ok) break; } catch {}
        if (i === 99) throw Error(serverLog);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__husky?.engine);
    const checks = await page.evaluate(async () => {
        const { World } = await import('/game/engine/World.ts');
        const { Belongings, shopStock, SHOP_COSMETICS, SUPPLIES, isSupply, SHOP_GOODS } = await import('/game/Shop.ts');
        const { audioManager } = await import('/game/Audio.ts');
        const { inputManager } = await import('/game/Input.ts');
        const { gfxSettings } = await import('/game/GfxSettings.ts');
        const { MUSIC_TRACKS } = await import('/game/audio/tracks.ts');
        const { Renderer } = await import('/game/engine/Renderer.ts');
        const engine = window.__husky.engine; engine.stop(); audioManager.setMusic(false); audioManager.setSFX(false);
        const passed = [], check = (ok, label) => { if (!ok) throw Error(label); passed.push(label); };
        let completions = 0, deaths = 0;
        const w = new World(1280, 800, { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() { completions++; }, onGameOver() { deaths++; }, onGameWon() { completions++; } });
        const tap = key => { inputManager.clear(); window.dispatchEvent(new KeyboardEvent('keydown', { code: key })); window.dispatchEvent(new KeyboardEvent('keyup', { code: key })); w.update(); };
        const snapshot = () => JSON.stringify({ player: w.player, platforms: w.platforms, enemies: w.enemies, props: w.props, collectibles: w.collectibles, clock: w.timeLeft, frame: w.frameCounter, camera: [w.cameraX, w.cameraY], hush: w.hushTimer, quests: w.belongings.quests });
        const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 800; const renderer = new Renderer(canvas), pictures = new Set();
        w.loadLevel(3, false); w.belongings.homeUnlocked = true;
        for (const level of [3, 6, 9, 12, 15]) {
            w.loadLevel(level); const door = w.shopDoor;
            check(!w.openShop(), `${level}: locked or distant doors cannot be entered`);
            door.unlocked = true; w.player.x = door.x + 20; w.player.y = door.y + door.h - w.player.h; w.player.grounded = true; door.update(w.player);
            w.player.springTimer = 527; w.player.feastTimer = 713; w.hushTimer = 83; w.frameCounter = 47;
            w.belongings.quests.lammy = 'carrying';
            const player = w.player, enemies = w.enemies, before = snapshot(), music = audioManager.musicTrack;
            tap('KeyE');
            check(w.shopRoom && !w.shopOpen, `${level}: E enters a room with the store HUD closed`);
            check(audioManager.musicTrack === 'theme_shop', `${level}: entering selects the dedicated shop song even while muted`);
            check(!w.openShop() && !w.openHomePanel('journal') && !w.useInventorySlot(0), `${level}: room blocks nested entry, trail menus and consumables`);
            check(!w.interactShop() && !w.buyGood('hat'), `${level}: counter cannot be used from across the room`);
            inputManager.keys.ArrowRight = true;
            for (let i = 0; i < 180 && !w.shopRoom.interaction; i++) w.update();
            inputManager.clear();
            check(w.shopRoom.interaction?.id === 'counter' && w.shopRoom.player.x > 600, `${level}: regular movement reaches Juniper`);
            check(snapshot() === before && w.player === player && w.enemies === enemies, `${level}: walking inside freezes the exact exterior, effects and unfinished quest`);
            for (const mode of ['classic', 'enhanced']) {
                gfxSettings.setVisualMode(mode); renderer.drawGame(w); pictures.add(canvas.toDataURL());
                check(snapshot() === before, `${level}: ${mode} shop rendering leaves gameplay intact`);
            }
            tap('KeyE'); check(w.shopOpen, `${level}: E at Juniper opens the store HUD`);
            const still = w.shopRoom.player.x; for (let i = 0; i < 100; i++) w.update();
            check(w.shopRoom.player.x === still && snapshot() === before, `${level}: browsing also freezes room movement`);
            w.player.bonesCollected = 100;
            const stock = shopStock(level, w.belongings), supplies = stock.filter(isSupply);
            check(supplies.length === 3 && new Set(supplies).size === 3 && supplies.every(id => SUPPLIES.includes(id)), `${level}: three different consumables are selected from the ten-item pool`);
            check(Object.values(SHOP_COSMETICS).filter(id => stock.includes(id)).join() === SHOP_COSMETICS[level], `${level}: exactly its own branch-exclusive cosmetic is sold`);
            const unavailable = SUPPLIES.find(id => !supplies.includes(id));
            check(!w.buyGood(unavailable) && w.player.bonesCollected === 100, `${level}: unstocked consumables cannot charge the wallet`);
            w.belongings.slots.fill(null);
            check(w.buyGood(supplies[0]) && w.player.bonesCollected === 100 - SHOP_GOODS[supplies[0]].price, `${level}: the actual random stock can be purchased at its listed price`);
            check(w.buyGood(SHOP_COSMETICS[level]) && w.shopRoom.player.accessories.has(SHOP_COSMETICS[level]), `${level}: purchased local outfit immediately appears in the room`);
            const purchased = snapshot(), wallet = w.player.bonesCollected;
            tap('Escape'); check(!w.shopOpen && w.shopRoom, `${level}: Escape closes only the HUD`);
            inputManager.keys.ArrowLeft = true;
            for (let i = 0; i < 200 && w.shopRoom.interaction?.id !== 'leave'; i++) w.update();
            inputManager.clear();
            check(w.shopRoom.interaction?.id === 'leave', `${level}: walking back reaches the entrance`);
            tap('KeyE');
            check(!w.shopRoom && snapshot() === purchased && w.player === player, `${level}: doorway returns to the exact trail position with purchases and carrying quest intact`);
            check(audioManager.musicTrack === music && w.player.bonesCollected === wallet, `${level}: departure restores trail music without charging or rewarding anything`);
            tap('KeyE'); check(w.shopRoom && shopStock(level, w.belongings).join() === stock.join(), `${level}: re-entry cannot reroll the shelf`);
            w.loadLevel(level); check(shopStock(level, w.belongings).join() === stock.join(), `${level}: retrying does not reroll the shelf`);
        }
        check(pictures.size === 10, 'Every branch and both graphics modes have distinct art');
        check(completions === 0 && deaths === 0, 'Shop visits neither finish quests/levels nor trigger hazards');
        w.loadLevel(3, false);
        check(Object.keys(w.belongings.shopSupplies).length === 0, 'A new journey clears branch stock');
        // Deterministic random sources exercise the shuffle without a flaky statistical assertion.
        const random = Math.random, all = new Set(), sets = new Set();
        try {
            for (let seed = 1; seed <= 40; seed++) {
                let state = seed * 104729;
                Math.random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 2 ** 32; };
                const stock = shopStock(3, new Belongings()).filter(isSupply); stock.forEach(id => all.add(id)); sets.add(stock.join());
            }
        } finally { Math.random = random; }
        check(SUPPLIES.length === 10 && all.size === 10 && sets.size > 10, 'The random selection can offer every consumable in varied combinations');
        w.belongings.slots = ['leap', 'trailmix', 'trailmix']; w.player.y -= 80; w.player.velY = 8; w.player.jumpsLeft = 0;
        check(w.useInventorySlot(0) && w.player.velY === -12 && w.player.jumpsLeft === 2 && !w.player.grounded, 'Sky biscuit bounces a falling dog and restores two jumps');
        check(w.useInventorySlot(1) && w.player.springTimer === 900 && w.player.sprintTimer === 900, 'Trail mix gives its two advertised boosts for fifteen seconds');
        check(!w.useInventorySlot(2) && w.belongings.slots[2] === 'trailmix', 'An active boost does not waste another trail mix');
        w.loadLevel(8); w.belongings.slots = ['leap', 'trailmix', null];
        check(!w.useInventorySlot(0) && !w.useInventorySlot(1) && w.belongings.slots.filter(Boolean).length === 2, 'Land-only new treats stay in pockets underwater');
        const song = MUSIC_TRACKS.theme_shop;
        check(song.sequence.reduce((sum, [, beats]) => sum + beats, 0) === 128 && song.sequence.every(([freq, beats]) => Number.isFinite(freq) && beats > 0), 'Shop tune is a complete eight-bar loop of valid notes');
        for (const mode of ['classic', 'enhanced']) {
            gfxSettings.setAudioMode(mode); audioManager.setMusic(true); audioManager.playMusic('theme_shop');
            check(audioManager.musicTrack === 'theme_shop' && audioManager.isPlaying, `${mode}: shop tune starts through the existing audio engine`);
            audioManager.setMusic(false); check(!audioManager.isPlaying, `${mode}: music toggle silences the shop tune`);
        }
        engine.startLevel(3); engine.stop(); engine.world.belongings.homeUnlocked = true; engine.world.belongings.houseIntroSeen = true;
        shopStock(3, engine.world.belongings); const real = JSON.stringify(engine.world.belongings.shopSupplies);
        engine.goHome(); engine.stop(); engine.world.changeHomeFloor('basement');
        check(engine.startPractice(3), 'Practice starts from the basement'); engine.stop(); engine.world.belongings.shopSupplies[3][0] = 'leap'; engine.goHome(); engine.stop();
        check(JSON.stringify(engine.world.belongings.shopSupplies) === real, 'Practice stock is isolated from the real journey');
        inputManager.clear(); return passed;
    });
    // Real HUD controls: enter, walk with keys, open with the nearby icon, purchase, and leave.
    await page.evaluate(() => {
        const e = window.__husky.engine; e.startLevel(3); const w = e.world; w.player.bonesCollected = 50; w.shopDoor.unlocked = true;
        w.player.x = w.shopDoor.x + 20; w.player.y = w.shopDoor.y + w.shopDoor.h - w.player.h; w.player.grounded = true; w.shopDoor.update(w.player); w.openShop();
    });
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Quest journal', exact: true }).count(), 0);
    await page.keyboard.down('ArrowRight');
    await page.getByRole('button', { name: 'Talk to Juniper', exact: true }).waitFor();
    await page.keyboard.up('ArrowRight');
    await page.getByRole('button', { name: 'Talk to Juniper', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    const goose = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Mischievous goose', exact: true }) });
    await goose.getByRole('button').click(); assert.equal(await goose.getByRole('button').innerText(), 'Take off');
    await page.getByRole('button', { name: 'Close store menu' }).click();
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(await page.evaluate(() => window.__husky.engine.world.shopRoom.player.accessories.has('goose')), true);
    await page.screenshot({ path: '.playwright-mcp/shop-room-desktop.png' });
    await page.keyboard.down('ArrowLeft'); await page.getByRole('button', { name: 'Leave shop', exact: true }).waitFor(); await page.keyboard.up('ArrowLeft');
    await page.getByRole('button', { name: 'Leave shop', exact: true }).click();
    assert.equal(await page.evaluate(() => !!window.__husky.engine.world.shopRoom), false);
    checks.push('Desktop: keyboard movement, nearby touchable prompts, purchase, menu close and doorway exit work together');
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    mobile.on('pageerror', e => errors.push(e.message)); await mobile.goto(base); await mobile.waitForFunction(() => window.__husky?.engine);
    await mobile.evaluate(() => { const e = window.__husky.engine; e.startLevel(6); const w = e.world; w.shopDoor.unlocked = w.shopDoor.nearby = true; w.openShop(); });
    const right = await mobile.getByRole('button', { name: 'Walk right', exact: true }).boundingBox();
    const cdp = await mobile.context().newCDPSession(mobile);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: right.x + 25, y: right.y + 20 }] });
    await mobile.getByRole('button', { name: 'Talk to Juniper', exact: true }).waitFor();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.getByRole('button', { name: 'Talk to Juniper', exact: true }).tap();
    await mobile.getByRole('dialog').waitFor();
    assert.ok(await mobile.evaluate(() => { const d = document.querySelector('.husky-shop'); return d.scrollWidth <= d.clientWidth; }));
    await mobile.getByRole('button', { name: 'Close store menu' }).tap();
    await mobile.screenshot({ path: '.playwright-mcp/shop-room-mobile.png' });
    await mobile.setViewportSize({ width: 844, height: 390 });
    assert.equal(await mobile.evaluate(() => { const w = window.__husky.engine.world, p = w.shopRoom.player; return p.y < 540 && w.shopRoom.interaction?.x > 0 && w.shopRoom.interaction?.x < w.width; }), true);
    await mobile.screenshot({ path: '.playwright-mcp/shop-room-landscape.png' });
    checks.push('Mobile: touch walking, counter prompts, a fitted shop HUD and rotation all work');
    assert.deepEqual(errors, []); console.log(checks.join('\n')); console.log(`PASS: ${checks.length} walk-in shop checks.`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
