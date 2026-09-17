import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 5204, base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
let log = '', browser;
server.stdout.on('data', x => log += x); server.stderr.on('data', x => log += x);
try {
    for (let i = 0; i < 100; i++) {
        if (server.exitCode !== null) throw Error(log);
        try { if ((await fetch(base)).ok) break; } catch {}
        if (i === 99) throw Error('Vite failed to start');
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__husky);
    const checks = await page.evaluate(async () => {
        const { World } = await import('/game/engine/World.ts');
        const { Player } = await import('/game/entities/Player.ts');
        const { shopStock, SHOP_GOODS, isSupply } = await import('/game/Shop.ts');
        const { drawFamilyDog } = await import('/game/engine/FamilyArt.ts');
        const { gfxSettings } = await import('/game/GfxSettings.ts');
        const { inputManager } = await import('/game/Input.ts');
        const { audioManager } = await import('/game/Audio.ts');
        const engine = window.__husky.engine; engine.stop(); audioManager.setMusic(false); audioManager.setSFX(false);
        const passed = [], check = (ok, label) => { if (!ok) throw Error(label); passed.push(label); };
        const w = new World(1100, 720, { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() {}, onGameOver() {}, onGameWon() {} });
        w.loadLevel(1, false); w.belongings.homeUnlocked = true;
        const exclusive = ['goose', 'scarf', 'sailor', 'chef', 'bow'];
        for (const [i, level] of [3, 6, 9, 12, 15].entries()) {
            w.loadLevel(level); w.shopDoor.unlocked = w.shopDoor.nearby = true; w.openShop(); w.player.bonesCollected = 500;
            check(exclusive.filter(id => shopStock(level).includes(id)).join() === exclusive[i], `Shop ${level} has its own exclusive cosmetic`);
            check(shopStock(level).filter(isSupply).length === 2 && !shopStock(level).includes('shield'), `Shop ${level} has two new power-ups`);
            const other = exclusive[(i + 1) % 5]; w.belongings.owned.delete(other);
            check(!w.buyGood(other) && w.player.bonesCollected === 500, `Shop ${level} refuses out-of-stock purchases`);
            check(w.buyGood(exclusive[i]), `Buy ${exclusive[i]}`);
            for (const id of shopStock(level).filter(isSupply)) {
                w.belongings.slots.fill(null); const before = w.player.bonesCollected;
                check(w.buyGood(id) && w.player.bonesCollected === before - SHOP_GOODS[id].price, `Buy ${id} at its exact price`);
            }
            w.closeShop();
        }
        for (const id of ['spring', 'sprint', 'feather', 'feast', 'hush']) {
            w.loadLevel(1); w.belongings.slots = [id, id, null];
            check(w.useInventorySlot(0) && !w.useInventorySlot(1) && w.belongings.slots[1] === id, `${id} activates without wasting duplicate treats`);
            const timer = id === 'hush' ? w.hushTimer : w.player[`${id}Timer`];
            check(timer === (id === 'hush' ? 300 : id === 'feast' ? 900 : 720), `${id} has the advertised duration`);
            w.loadLevel(1); check(w.hushTimer === 0 && w.player[`${id}Timer`] !== timer, `${id} expires on retry`);
        }
        const normal = new Player(100, 100), boosted = new Player(100, 100);
        normal.jumpsLeft = boosted.jumpsLeft = 2; boosted.springTimer = 720;
        normal.update([], { Space: true }, 720, 1); boosted.update([], { Space: true }, 720, 1);
        check(boosted.velY < normal.velY && boosted.jumpsLeft === 1, 'Spring biscuit increases height while preserving double jump');
        boosted.sprintTimer = 720;
        for (let i = 0; i < 30; i++) { normal.update([], { ArrowRight: true }, 720, 1); boosted.update([], { ArrowRight: true }, 720, 1); }
        check(boosted.velX > normal.velX, 'Zoomies increase real running speed');
        boosted.featherTimer = 720; boosted.velY = 10; boosted.jumpsLeft = 0;
        boosted.update([], { Space: true }, 720, 1); check(boosted.velY === 1.5, 'Feather wafer slows a held-jump descent');
        w.loadLevel(1); w.belongings.slots = ['hush', 'feast', null]; w.useInventorySlot(0); w.useInventorySlot(1);
        const before = JSON.stringify(w.enemies); w.update(); check(JSON.stringify(w.enemies) === before, 'Quiet-time freezes enemy motion');
        const bone = w.collectibles[0]; w.player.x = bone.x; w.player.y = bone.y; const bones = w.player.bonesCollected; w.update();
        check(w.player.bonesCollected === bones + 2, 'Bakery bonus doubles a collected bone');
        w.loadLevel(1); check(!w.collectibles.some(b => b.x === bone.x && b.y === bone.y), 'Bonus bones cannot be farmed on retry');
        for (const [from, to, x] of [['ground', 'kitchen', 242], ['kitchen', 'ground', 242], ['upstairs', 'bedroom', 1272], ['bedroom', 'upstairs', 242]]) {
            w.homeFloor = from; w.loadLevel(15); w.player.x = x; w.player.y = 580; w.update();
            check(w.nearbyRoomDoor?.to === to, `${from} doorway points to ${to}`);
            inputManager.keys.KeyE = true; w.update(); inputManager.clear();
            check(w.homeFloor === to && w.isHome, `E walks through the ${to} door`);
        }
        const c = document.createElement('canvas'); c.width = 220; c.height = 160; const ctx = c.getContext('2d'); const art = new Set();
        for (const mode of ['classic', 'enhanced']) {
            gfxSettings.setVisualMode(mode);
            for (const id of ['opal', 'ruby', 'samwise']) {
                ctx.clearRect(0, 0, 220, 160); ctx.save(); ctx.scale(2, 2); drawFamilyDog(ctx, id, 35, 25, true, false, 2); ctx.restore(); art.add(c.toDataURL());
            }
            const goose = new Player(80, 70); goose.accessories.add('goose');
            for (const level of [1, 6, 8, 9]) { goose.hasUmbrella = level === 9; goose.draw(ctx, 0, level); check(goose.w === 40 && goose.h === 40, `Goose keeps its normal hitbox in ${mode}, level ${level}`); }
        }
        check(art.size === 6, 'All three dogs have distinct Classic and Enhanced portraits');
        engine.startLevel(14); engine.stop(); engine.world.triggerLevelComplete();
        check(engine.gameState === 'CUTSCENE' && engine.cutsceneManager.currentType === 'homecoming', 'Finishing level 14 starts the owner reunion');
        engine.cutsceneManager.setPaused(true);
        const time = engine.world.timeLeft; engine.world.update(); check(engine.world.timeLeft === time, 'Victory world stays paused throughout reunion');
        engine.skipCutscene(); check(engine.gameState === 'GAME_WON' && engine.world.belongings.homeUnlocked, 'Skipping reunion reaches victory with home unlocked');
        engine.startLevel(14); engine.stop(); engine.world.triggerLevelComplete(); engine.cutsceneManager.setPaused(true);
        engine.cutsceneManager.step = engine.cutsceneManager.getLines('homecoming').length; engine.cutsceneManager.nextLine();
        check(engine.gameState === 'GAME_WON', 'Natural reunion completion also reaches victory'); engine.cutsceneManager.skip();
        return passed;
    });
    await page.getByRole('button', { name: 'Go inside · Home' }).click();
    await page.evaluate(() => { const e = window.__husky.engine; e.stop(); e.world.changeHomeFloor('upstairs'); e.world.cameraX = 200; e.renderer.drawGame(e.world); });
    await page.screenshot({ path: '.playwright-mcp/revamp-companions.png' });
    await page.evaluate(() => { const w = window.__husky.engine.world; w.player.x = 380; w.player.y = w.height - 140; w.update(); w.openHomePanel('opal'); });
    await page.getByRole('button', { name: 'I’ll find it!' }).click();
    assert.equal(await page.evaluate(() => window.__husky.engine.world.belongings.quests.lammy), 'accepted');
    await page.screenshot({ path: '.playwright-mcp/revamp-opal.png' });
    await page.keyboard.press('Escape');
    await page.evaluate(() => { const e = window.__husky.engine; e.world.changeHomeFloor('kitchen'); e.world.cameraX = 150; e.renderer.drawGame(e.world); });
    await page.screenshot({ path: '.playwright-mcp/revamp-kitchen.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Change floor' }).click();
    assert.equal(await page.locator('.home-dialog').evaluate(e => e.scrollWidth <= e.clientWidth), true);
    await page.screenshot({ path: '.playwright-mcp/revamp-mobile.png' });
    await page.keyboard.press('Escape'); await page.setViewportSize({ width: 1100, height: 720 });
    await page.waitForFunction(() => window.__husky.engine.world.width === 1100);
    await page.evaluate(() => { const e = window.__husky.engine; e.startLevel(3); e.stop(); const w = e.world; w.player.bonesCollected = 100; w.shopDoor.unlocked = w.shopDoor.nearby = true; w.openShop(); });
    assert.equal(await page.getByRole('heading', { name: 'Mischievous goose' }).count(), 1);
    assert.equal(await page.getByRole('heading', { name: 'Snowday scarf' }).count(), 0);
    await page.screenshot({ path: '.playwright-mcp/revamp-shop.png' });
    await page.evaluate(() => { const e = window.__husky.engine; e.world.closeShop(); e.startLevel(14); e.stop(); e.world.triggerLevelComplete(); e.cutsceneManager.setPaused(true); e.cutsceneManager.step = 4; e.renderer.drawCutscene(e.cutsceneManager, 1100, 720); });
    await page.screenshot({ path: '.playwright-mcp/revamp-reunion.png' });
    await page.evaluate(() => window.__husky.engine.skipCutscene());
    assert.deepEqual(errors, []); console.log(checks.join('\n')); console.log(`PASS: ${checks.length} revamp checks plus quest, shop, reunion and mobile UI.`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
