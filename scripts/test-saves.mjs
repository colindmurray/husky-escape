import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0, open: false } });
await server.listen();
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
let checks = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
try {
    const base = `http://127.0.0.1:${server.httpServer.address().port}`;
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const button = name => page.getByRole('button', { name, exact: true });
    const ready = async () => { await page.waitForFunction(() => window.__husky); };
    const stop = () => page.evaluate(() => window.__husky.engine.stop());
    const title = async () => { await page.evaluate(() => { const e = window.__husky.engine; if (!e.returnToTitle()) throw Error('Title return failed'); e.stop(); }); await button('Free Roam').waitFor(); };
    const snapshot = () => page.evaluate(() => { const e = window.__husky.engine, w = e.world; return { level: w.currentLevel, difficulty: w.difficulty, bones: w.player.bonesCollected, state: e.gameState, mode: e.sessionMode, slots: w.belongings.slots }; });
    const create = async (slot, name, difficulty = 'EASY') => {
        await button(`New game in slot ${slot}`).click(); await page.getByLabel('Adventure name').fill(name);
        await page.getByLabel('Difficulty', { exact: true }).selectOption(difficulty);
        await button('Start adventure').click(); await button('Skip >>').click(); await stop();
    };
    await page.goto(base); await ready();
    equal(await page.getByRole('region', { name: /^Save slot/ }).count(), 4);
    equal(await button('Print & draw levels').count(), 1);
    equal(await button('Dev Mode').count(), 0);
    await create(1, '🐾'.repeat(21), 'HARD');
    const name = '🐾'.repeat(20);
    equal(await page.evaluate(() => window.__husky.engine.activeSave.name), name);
    await button('Settings').click();
    equal(await page.getByRole('checkbox', { name: 'Cheats' }).count(), 0);
    equal(await button('Easy').count(), 0);
    equal(await button('Home').count(), 0);
    equal(await button('Print & draw levels').count(), 0);
    equal(await page.evaluate(() => { const e = window.__husky.engine; e.setDifficulty('EASY'); e.enableCheats(true); const denied = [e.cheatsEnabled, e.cheat('bones'), e.warpToLevel(15), e.startFreeRoam()]; e.startLevel(2, 'EASY'); e.stop(); return [...denied, e.world.difficulty]; }), [false, false, false, false, 'HARD']);
    // A real collection, shop purchase and consumed treat survive reloading without respawning paid bones.
    await page.evaluate(() => {
        const e = window.__husky.engine, w = e.world; e.startLevel(3); e.stop();
        const bone = w.collectibles[0]; w.player.x = bone.x; w.player.y = bone.y; w.update();
        w.player.bonesCollected = 100; w.shopDoor.unlocked = true; w.shopDoor.nearby = true;
        if (!w.openShop()) throw Error('Shop entry failed');
        w.shopRoom.player.x = 770; w.shopRoom.player.y = 500;
    });
    // Use the existing counter interaction rather than opening the menu through save code.
    equal(await page.evaluate(() => {
        const w = window.__husky.engine.world;
        if (!w.interactShop()) throw Error('Counter interaction failed');
        if (!w.buyGood('goose')) throw Error('Purchase failed');
        w.belongings.slots = ['shield', 'magnet', 'time'];
        w.closeShop(); w.shopRoom.player.x = 88; if (!w.interactShop()) throw Error('Shop exit failed');
        w.useInventorySlot(0);
        return window.__husky.engine.saveProgress();
    }), true);
    const savedShop = await page.evaluate(() => JSON.parse(localStorage.getItem('husky-escape:save-v1:0')));
    equal(savedShop.bones, 84); equal(savedShop.belongings.slots, [null, 'magnet', 'time']);
    equal(savedShop.belongings.collectedBones.length > 0, true);
    await page.reload(); await ready(); await button(`Continue ${name}`).click(); await stop();
    equal(await snapshot(), { level: 3, difficulty: 'HARD', bones: 84, state: 'PLAYING', mode: 'saved', slots: [null, 'magnet', 'time'] });
    equal(await page.evaluate(() => { const w = window.__husky.engine.world; return [w.belongings.owned.has('goose'), w.player.accessories.has('goose'), w.shopDoor.unlocked, [...w.belongings.collectedBones], w.belongings.shopSupplies]; }), [true, true, true, savedShop.belongings.collectedBones, savedShop.belongings.shopSupplies]);
    // Keep a completed level completed, including through a story transition.
    await page.evaluate(() => { const e = window.__husky.engine; e.startLevel(2); e.stop(); e.world.triggerLevelComplete(); });
    await page.reload(); await ready(); await button(`Continue ${name}`).click(); await stop();
    equal((await snapshot()).state, 'LEVEL_COMPLETE');
    await button('Next Area').click(); await stop();
    await page.reload(); await ready(); await button(`Continue ${name}`).click();
    equal(await page.evaluate(() => window.__husky.engine.cutsceneManager.currentType), 'pound_escape');
    await button('Skip >>').click(); await stop(); equal((await snapshot()).level, 3);
    await title();
    await create(2, 'Ruby', 'EASY');
    equal((await snapshot()).bones, 0); equal((await snapshot()).slots, [null, null, null]);
    await title(); await create(3, 'Opal', 'HARDCORE');
    await page.evaluate(() => { const e = window.__husky.engine; e.startLevel(6); e.stop(); e.world.player.bonesCollected = 30; e.world.triggerGameOver('fall', 'Test fall'); });
    await page.reload(); await ready(); await button('Continue Opal').click(); await stop();
    equal((await snapshot()).state, 'GAME_OVER');
    await button('Restart Game (Hardcore)').click(); await stop();
    equal(await snapshot(), { level: 1, difficulty: 'HARDCORE', bones: 0, state: 'PLAYING', mode: 'saved', slots: [null, null, null] });
    await title(); await create(4, 'Samwise');
    await page.evaluate(() => {
        const e = window.__husky.engine, w = e.world; w.belongings.homeUnlocked = true; w.belongings.houseIntroSeen = true;
        w.belongings.quests = { peace: 'complete', lammy: 'accepted', cushion: 'found', lunch: 'complete' };
        w.belongings.companions.add('opal'); w.player.bonesCollected = 63; w.belongings.slots = ['hush', 'spring', null];
        w.homeFloor = 'upstairs'; e.startLevel(15); e.stop();
    });
    await page.reload(); await ready(); await button('Continue Samwise').click(); await stop();
    equal(await page.evaluate(() => { const e = window.__husky.engine, w = e.world; return [w.currentLevel, w.homeFloor, w.belongings.quests, [...w.belongings.companions], w.belongings.houseIntroSeen, w.player.bonesCollected]; }), [15, 'upstairs', { peace: 'complete', lammy: 'accepted', cushion: 'found', lunch: 'complete' }, ['opal'], true, 63]);
    // Borrowed practice supplies and currency never overwrite the actual saved journey.
    await page.evaluate(() => { const e = window.__husky.engine, w = e.world; w.changeHomeFloor('basement'); e.startPractice(6); e.stop(); w.player.bonesCollected = 999; w.belongings.slots = [null, null, null]; e.saveProgress(); });
    await page.reload(); await ready(); await button('Continue Samwise').click(); await stop();
    equal(await page.evaluate(() => { const e = window.__husky.engine, w = e.world; return [w.currentLevel, w.homeFloor, w.practice, w.difficulty, w.player.bonesCollected, w.belongings.slots]; }), [15, 'basement', false, 'EASY', 63, ['hush', 'spring', null]]);
    // An unbanked fetch item returns to its level on reload, then banks only on a clear.
    await page.evaluate(() => { const e = window.__husky.engine; e.revisitLevel(5); e.stop(); const w = e.world; w.player.x = 1520; w.player.y = w.height - 482; w.update(); });
    equal(await page.evaluate(() => window.__husky.engine.world.belongings.quests.lammy), 'carrying');
    await page.reload(); await ready(); await button('Continue Samwise').click(); await stop();
    equal(await page.evaluate(() => window.__husky.engine.world.belongings.quests.lammy), 'accepted');
    await page.evaluate(() => { const w = window.__husky.engine.world; w.player.x = 1520; w.player.y = w.height - 482; w.update(); w.triggerLevelComplete(); });
    await page.reload(); await ready(); await button('Continue Samwise').click(); await stop();
    equal(await page.evaluate(() => window.__husky.engine.world.belongings.quests.lammy), 'found');
    await button('Back home').click(); await stop();
    await title();
    equal(await page.getByRole('button', { name: /^Continue / }).count(), 4);
    await page.screenshot({ path: '.playwright-mcp/saves-full.png' });
    const allSaved = await page.evaluate(() => [0,1,2,3].map(i => localStorage.getItem(`husky-escape:save-v1:${i}`)));
    // Free Roam provides all levels and optional cheats, and writes no save keys.
    await button('Free Roam').click(); await stop();
    equal(await button('Give 100 bones').count(), 0);
    equal(await page.evaluate(() => window.__husky.engine.cheat('bones')), false);
    await page.getByRole('checkbox', { name: 'Cheats' }).check();
    await button('Give 100 bones').click(); await button('Fill treat pouch').click();
    equal((await snapshot()).bones, 100); equal((await snapshot()).slots, ['shield', 'magnet', 'time']);
    const time = await page.evaluate(() => window.__husky.engine.world.timeLeft);
    await button('Add 60 seconds').click(); equal(await page.evaluate(() => window.__husky.engine.world.timeLeft), time + 60);
    await button('Hard (Extra Challenges)').click(); await stop(); equal((await snapshot()).difficulty, 'HARD');
    await button('Home').click(); await button('Skip >>').click(); await stop(); equal((await snapshot()).level, 15);
    await title();
    equal(await page.evaluate(() => [0,1,2,3].map(i => localStorage.getItem(`husky-escape:save-v1:${i}`))), allSaved);
    await button('Continue Ruby').click(); await stop();
    equal((await snapshot()).bones, 0); equal(await page.evaluate(() => window.__husky.engine.cheatsEnabled), false);
    await title();
    // Returning to the title cancels any pending cutscene callbacks.
    await button('Free Roam').click();
    await page.evaluate(() => { const e = window.__husky.engine; e.startChaseCutscene(); e.returnToTitle(); });
    await page.waitForTimeout(3200); equal(await page.evaluate(() => window.__husky.engine.gameState), 'INTRO');
    equal(await page.evaluate(() => [0,1,2,3].map(i => localStorage.getItem(`husky-escape:save-v1:${i}`))), allSaved);
    // A failed active save keeps the game in memory until a retry succeeds.
    await button('Continue Ruby').click(); await stop();
    const rubyBefore = await page.evaluate(() => localStorage.getItem('husky-escape:save-v1:1'));
    equal(await page.evaluate(() => {
        window.originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
        const e = window.__husky.engine; e.world.player.bonesCollected = 19; return e.returnToTitle();
    }), false);
    equal(await page.evaluate(() => localStorage.getItem('husky-escape:save-v1:1')), rubyBefore);
    equal((await snapshot()).mode, 'saved'); equal((await snapshot()).bones, 19);
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
    await button('Retry saving').click(); await title();
    equal(await page.evaluate(() => JSON.parse(localStorage.getItem('husky-escape:save-v1:1')).bones), 19);
    await button('Continue Ruby').click(); await stop();
    await page.evaluate(() => { window.__husky.engine.world.player.bonesCollected = 21; });
    await page.reload(); await ready();
    equal(await page.evaluate(() => JSON.parse(localStorage.getItem('husky-escape:save-v1:1')).bones), 21);
    // Malformed storage is kept, and a failed write is never presented as a successful new game.
    await page.evaluate(() => localStorage.setItem('husky-escape:save-v1:1', '{bad json'));
    await page.reload(); await ready();
    equal(await page.getByText('This save could not be read. It has been kept untouched.', { exact: true }).count(), 1);
    equal(await page.evaluate(() => window.__husky.engine.openSave(1)), false);
    equal(await page.evaluate(() => localStorage.getItem('husky-escape:save-v1:1')), '{bad json');
    page.once('dialog', dialog => dialog.dismiss()); await button('Delete unreadable slot 2').click();
    equal(await page.evaluate(() => localStorage.getItem('husky-escape:save-v1:1')), '{bad json');
    page.once('dialog', dialog => dialog.accept()); await button('Delete unreadable slot 2').click();
    await page.reload(); await ready();
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); }; });
    await button('New game in slot 2').click(); await page.getByLabel('Adventure name').fill('No room'); await button('Start adventure').click();
    equal(await page.getByRole('alert').count(), 1);
    equal(await page.evaluate(() => [window.__husky.engine.sessionMode, localStorage.getItem('husky-escape:save-v1:1')]), [null, null]);
    await page.reload(); await ready();
    // Another tab cannot silently overwrite a newer version of the same slot.
    await button('Continue Samwise').click(); await stop();
    await page.evaluate(() => { const key = 'husky-escape:save-v1:3', data = JSON.parse(localStorage.getItem(key)); data.bones = 77; localStorage.setItem(key, JSON.stringify(data)); });
    equal(await page.evaluate(() => window.__husky.engine.saveProgress()), false);
    equal(await page.evaluate(() => JSON.parse(localStorage.getItem('husky-escape:save-v1:3')).bones), 77);
    await page.reload(); await ready();
    const schemaChecks = await page.evaluate(async () => {
        const { parseSave } = await import('/game/SaveGame.ts'); const original = JSON.parse(localStorage.getItem('husky-escape:save-v1:3'));
        const mutations = [s => s.version = 999, s => s.name = 'x'.repeat(21), s => s.difficulty = 'oops', s => s.level = 16, s => s.bones = -1, s => s.belongings.slots = ['oops'], s => s.belongings.quests = { lammy: 'cheated' }, s => s.belongings.equipped = ['__proto__'], s => s.belongings.shopSupplies = { 6: ['shield','shield','time'] }, s => s.cutscene = 'oops'];
        return mutations.map(mutate => { const data = structuredClone(original); mutate(data); try { parseSave(JSON.stringify(data)); return false; } catch { return true; } });
    }); equal(schemaChecks.every(Boolean), true); checks += schemaChecks.length;
    await page.setViewportSize({ width: 390, height: 844 });
    equal(await page.locator('main').evaluate(e => e.scrollWidth <= e.clientWidth && e.scrollHeight > e.clientHeight), true);
    await button('Free Roam').scrollIntoViewIfNeeded(); await page.screenshot({ path: '.playwright-mcp/saves-mobile.png' });
    equal(await button('Free Roam').isVisible(), true);
    equal(errors, []);
    console.log(`PASS: ${checks} save, reload, difficulty, Free Roam, quest, practice, storage safety, and mobile checks.`);
} finally { await browser.close(); await server.close(); }
