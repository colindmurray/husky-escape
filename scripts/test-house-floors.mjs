import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const port = 5199, base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
let output = '', browser;
server.stdout.on('data', x => output += x); server.stderr.on('data', x => output += x);
try {
    for (let i = 0; i < 100; i++) {
        if (server.exitCode !== null) throw Error(output);
        try { if ((await fetch(base)).ok) break; } catch {}
        if (i === 99) throw Error(output);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1100, height: 720 } }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__husky);
    const checks = await page.evaluate(async () => {
        const { HOME_LEVEL, COMPANIONS, HomeDog, dogRoom } = await import('/game/Home.ts');
        const { CUSTOM_LEVEL, GRID_COLS, GRID_ROWS, TILE_SIZE, starterLevel, isLevelDraft, validateLevel, saveDraft, loadDraft, buildCustomLevel } = await import('/game/LevelBuilder.ts');
        const { audioManager } = await import('/game/Audio.ts');
        const { engine, inputManager, gfxSettings } = window.__husky;
        audioManager.setMusic(false); audioManager.setSFX(false); engine.startGame('EASY'); engine.stop();
        const w = engine.world, passed = [], check = (ok, text) => { if (!ok) throw Error(text); passed.push(text); };
        check(!w.changeHomeFloor('basement') && !engine.startPractice(1), 'Floors and practice stay locked until the story is complete');
        engine.startLevel(14); engine.stop(); w.triggerLevelComplete(); engine.goHome(); engine.skipCutscene(); engine.stop(); w.belongings.quests.peace = 'complete';
        w.player.bonesCollected = 35; w.belongings.owned.add('crown'); w.belongings.equipped.add('crown'); w.belongings.slots = ['shield', 'magnet', 'time']; w.belongings.quests.lammy = 'accepted';
        check(w.changeHomeFloor('upstairs'), 'Stairs reach the second floor');
        check(w.props.filter(p => p instanceof HomeDog).map(p => p.quest.dog).join(',') === 'Opal', 'Opal lives in the snuggle loft after the chase');
        check(!w.shopDoor && !w.openHomePanel('builder') && !w.toggleCompanion(), 'Upstairs keeps recruitment separate from the workshop and shop');
        for (const dog of COMPANIONS) {
            w.changeHomeFloor(dogRoom(dog.id, w.belongings.quests));
            w.player.x = w.props.find(p => p instanceof HomeDog && p.quest.id === dog.id).x; w.player.y = w.height - 140; w.update(); w.openHomePanel(dog.id);
            check(w.toggleCompanion() && w.belongings.companions.has(dog.id), `${dog.dog} joins the party`); w.closeHomePanel();
        }
        check(w.belongings.companions.size === 3 && w.player.bonesCollected === 35, 'All three can join together for free');
        engine.revisitLevel(1); engine.stop();
        check(w.companions.length === 3 && w.followingDogs.length === 0, 'Followers enter each trail without stacking on the start');
        const trace = [];
        inputManager.keys.ArrowRight = true;
        for (let f = 0; f < 100; f++) { inputManager.keys.ArrowUp = f === 35; w.update(); trace.push({ x: w.player.x, y: w.player.y }); }
        inputManager.clear();
        for (const [i, dog] of w.followingDogs.entries()) {
            const target = trace[trace.length - 1 - (i + 1) * 24];
            check(dog.x === target.x && dog.y === target.y, `${dog.quest.dog} follows the actual jump path with its own spacing`);
            check(!w.enemies.includes(dog) && !w.collectibles.includes(dog), `${dog.quest.dog} cannot block or collect for Onyx`);
        }
        engine.startLevel(8); engine.stop(); for (let i = 0; i < 80; i++) w.update();
        check(w.followingDogs.length === 3, 'Companions also follow swimming movement');
        engine.goHome(); engine.stop(); w.changeHomeFloor('upstairs'); w.player.x = 650; w.player.y = w.height - 140; w.update(); w.openHomePanel('opal');
        check(w.toggleCompanion() && !w.belongings.companions.has('opal') && w.belongings.companions.size === 2, 'A companion can be asked to stay home'); w.closeHomePanel();
        w.changeHomeFloor('basement');
        check(!w.shopDoor && w.props.length === 0 && w.player.bonesCollected === 35 && w.belongings.quests.lammy === 'accepted', 'Basement preserves the wallet, party, outfits, pockets, and quests');
        const original = w.belongings, wallet = w.player.bonesCollected;
        const snapshot = JSON.stringify({ ...original, owned: [...original.owned], equipped: [...original.equipped], companions: [...original.companions], collectedBones: [...original.collectedBones], unlockedShops: [...original.unlockedShops] });
        check(engine.startPractice(5), 'Basement launches a real level for practice'); engine.stop();
        check(w.practice && w.difficulty === 'HARDCORE' && w.currentLevel === 5, 'Practice always loads the Hardcore layout');
        check(w.belongings !== original && w.belongings.slots !== original.slots && w.player.accessories !== original.equipped, 'Training uses a separate copy of all mutable belongings');
        check(!w.props.some(p => p.quest?.id === 'lammy'), 'Training cannot advance real fetch quests');
        check(w.useInventorySlot(0), 'Practice allows trying purchased supplies');
        w.player.bonesCollected += 50; w.belongings.quests.lammy = 'complete'; w.belongings.equipped.delete('crown'); w.belongings.companions.clear(); w.belongings.collectedBones.add('5:test');
        engine.retryPractice(); engine.stop();
        check(w.player.bonesCollected === wallet && w.belongings.slots[0] === 'shield' && w.player.accessories.has('crown'), 'Retry restores starting bones, supplies, and outfit');
        engine.setDifficulty('HARD'); engine.goHome(); engine.stop();
        check(!w.practice && w.isHome && w.homeFloor === 'basement' && w.difficulty === 'HARD', 'Leaving practice returns to the basement and the chosen journey difficulty');
        check(w.belongings === original && snapshot === JSON.stringify({ ...original, owned: [...original.owned], equipped: [...original.equipped], companions: [...original.companions], collectedBones: [...original.collectedBones], unlockedShops: [...original.unlockedShops] }), 'Training never mutates original quest, collection, or party progress');
        for (let level = 1; level <= 14; level++) {
            check(engine.startPractice(level), `Practice level ${level} is selectable`); engine.stop();
            check(w.currentLevel === level && w.difficulty === 'HARDCORE' && w.platforms.length > 0, `Practice ${level} has live Hardcore geometry`);
            if (level === 14) { w.triggerLevelComplete(); check(engine.gameState === 'LEVEL_COMPLETE' && w.practice, 'Finishing practice 14 stays in training instead of announcing a story victory'); }
            engine.goHome(); engine.stop();
        }
        check(!engine.startPractice(0) && !engine.startPractice(15) && !engine.startPractice(17), 'Invalid practice destinations leave the house intact');
        const draft = starterLevel();
        check(!validateLevel(draft) && draft.cells.length === GRID_COLS * GRID_ROWS, 'Starter course passes placement validation');
        check(!isLevelDraft({ ...draft, cells: ['S'] }) && !isLevelDraft({ ...draft, cells: draft.cells.map(() => 'bogus') }) && !isLevelDraft({ ...draft, name: 'x'.repeat(100) }), 'Saved layouts validate dimensions, tiles, and name length');
        for (const tile of ['S', 'E']) {
            const invalid = structuredClone(draft); invalid.cells[invalid.cells.indexOf(tile)] = '.';
            check(!!validateLevel(invalid), `Missing ${tile} blocks play`);
        }
        const unsupported = structuredClone(draft); unsupported.cells[unsupported.cells.indexOf('S') + GRID_COLS] = '~';
        check(!!validateLevel(unsupported), 'Water under the start blocks immediate-death courses');
        const floating = structuredClone(draft); floating.cells[4] = 'R'; check(!!validateLevel(floating), 'Raccoons need a support platform');
        check(saveDraft(draft) && JSON.stringify(loadDraft()) === JSON.stringify(draft), 'A saved layout round-trips through browser storage');
        localStorage.setItem('husky-escape:custom-level-v1', '{broken'); check(!validateLevel(loadDraft()), 'Broken saved data falls back to a usable starter course'); saveDraft(draft);
        for (const height of [480, 800]) {
            const data = buildCustomLevel(draft, height);
            check(data.enemies.length === 1 && data.waters.length === 3 && data.collectibles.length === 2 && data.worldHeight >= height, `Custom tiles create actual gameplay objects at height ${height}`);
        }
        const highPool = structuredClone(draft); highPool.cells[4 * GRID_COLS + 3] = '~'; w.editorDraft = highPool;
        engine.startPractice(CUSTOM_LEVEL); engine.stop(); w.player.x = 3 * TILE_SIZE + 10; w.player.y = w.height - 140; w.update();
        check(engine.gameState === 'PLAYING', 'Custom water does not harm Onyx on a path far below its tile');
        w.player.y = w.waters.find(water => water.x === 3 * TILE_SIZE).y; w.update();
        check(engine.gameState === 'GAME_OVER', 'Touching a custom water tile still ends the practice attempt');
        engine.goHome(); engine.stop();
        w.editorDraft = unsupported; check(!engine.startPractice(CUSTOM_LEVEL) && w.isHome, 'Invalid custom course cannot alter the active session');
        w.editorDraft = draft;
        check(engine.startPractice(CUSTOM_LEVEL), 'Play custom course from the basement'); engine.stop();
        check(w.isCustom && !w.isHome && w.practice, 'Custom play uses the training rules');
        // Complete the starter course through actual input, including the three-cell water gap.
        inputManager.keys.ArrowRight = true;
        let jumpHeld = false;
        for (let f = 0; f < 1400 && engine.gameState === 'PLAYING'; f++) {
            const p = w.player;
            let jump = false;
            if (p.x >= 1130 && p.x < 1190 && p.grounded) jump = true;
            if (p.x > 1190 && p.x < 1420 && p.velY > 0 && p.jumpsLeft > 0) jump = true;
            if (p.x >= 1510 && p.x < 1700 && p.grounded) jump = true;
            inputManager.keys.ArrowUp = jump && !jumpHeld; jumpHeld = inputManager.keys.ArrowUp;
            w.update();
        }
        inputManager.clear();
        check(engine.gameState === 'LEVEL_COMPLETE', `Starter course can be completed with movement alone (state ${engine.gameState}, x ${w.player.x})`);
        engine.returnToEditor(); engine.stop();
        check(w.isHome && w.homeFloor === 'basement' && w.homePanel === 'builder' && w.editorDraft === draft && w.player.bonesCollected === wallet, 'Return to editor preserves the layout and real wallet');
        w.closeHomePanel();
        for (const floor of ['basement', 'upstairs']) for (const mode of ['classic', 'enhanced']) {
            w.changeHomeFloor(floor); gfxSettings.setVisualMode(mode); engine.renderer.drawGame(w);
            const c = document.querySelector('canvas'); check(c.getContext('2d').getImageData(500, 400, 1, 1).data[3] > 0, `${floor} renders in ${mode}`);
        }
        w.changeHomeFloor('basement'); engine.startPractice(1); engine.stop();
        engine.startGame(); engine.stop(); engine.goHome(); engine.stop();
        check(w.currentLevel === 1, 'Starting over during practice discards the previous journey snapshot');
        check(w.belongings.companions.size === 0 && !w.practice && !w.belongings.homeUnlocked, 'A new journey resets recruited companions and practice state');
        return passed;
    });
    console.log(checks.join('\n'));
    // Actual stairs, companion conversation, painter, storage, focus, play, and return buttons.
    await page.evaluate(() => { const e = window.__husky.engine; e.startLevel(14); e.stop(); e.world.triggerLevelComplete(); e.skipCutscene(); });
    await page.getByRole('button', { name: 'Go inside · Home' }).click();
    await page.getByRole('button', { name: 'Skip >>' }).click();
    await page.evaluate(() => { window.__husky.engine.world.belongings.quests.peace = 'complete'; });
    await page.getByRole('button', { name: 'Change floor', exact: true }).click();
    await page.getByRole('button', { name: 'Second floor · Snuggle loft' }).click();
    await page.evaluate(() => { const e = window.__husky.engine; e.stop(); e.world.player.x = 650; e.world.player.y = e.world.height - 140; e.world.update(); e.renderer.drawGame(e.world); });
    await page.getByRole('button', { name: 'E · Talk to Opal' }).click();
    await page.getByRole('button', { name: 'Invite Opal along' }).click();
    await page.getByRole('button', { name: 'Ask Opal to stay home' }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Change floor', exact: true }).click();
    await page.getByRole('button', { name: 'Basement · Training & building' }).click();
    await page.evaluate(() => { const e = window.__husky.engine; e.stop(); e.renderer.drawGame(e.world); });
    await page.screenshot({ path: '.playwright-mcp/house-basement.png' });
    await page.getByRole('button', { name: 'Create a level' }).click();
    await page.getByLabel('Level name').fill('Onyx’s training course');
    await page.getByRole('button', { name: '🦴 Bone', exact: true }).click();
    await page.getByRole('button', { name: 'Row 9, column 4: Erase', exact: true }).click();
    await page.getByRole('button', { name: 'Row 9, column 4: Bone', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.getByRole('button', { name: 'Row 9, column 4: Erase', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Save layout', exact: true }).click();
    assert.match(await page.getByRole('status').last().textContent(), /Saved on this browser/);
    await page.screenshot({ path: '.playwright-mcp/house-builder.png' });
    await page.getByRole('button', { name: 'Play my level', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__husky.engine.world.isCustom), true);
    await page.evaluate(() => { const e = window.__husky.engine; e.stop(); e.world.triggerGameOver('fall', 'Practice fall'); });
    await page.getByRole('heading', { name: 'TRY THAT AGAIN!' }).waitFor();
    await page.getByRole('button', { name: 'Try Again', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__husky.engine.world.isCustom && window.__husky.engine.world.practice), true);
    await page.getByRole('button', { name: 'Back to editor', exact: true }).click();
    assert.equal(await page.getByLabel('Level name').inputValue(), 'Onyx’s training course');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('.home-dialog').evaluate(e => e.scrollWidth <= e.clientWidth), true);
    await page.screenshot({ path: '.playwright-mcp/house-builder-mobile.png' });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Change floor', exact: true }).click();
    await page.getByRole('button', { name: 'Second floor · Snuggle loft' }).click();
    await page.setViewportSize({ width: 1100, height: 720 });
    await page.waitForFunction(() => window.__husky.engine.world.width === 1100 && window.__husky.engine.world.height === 720);
    await page.evaluate(() => { const e = window.__husky.engine; e.stop(); e.renderer.drawGame(e.world); });
    await page.screenshot({ path: '.playwright-mcp/house-upstairs.png' });
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__husky);
    assert.equal(await page.evaluate(() => window.__husky.engine.world.editorDraft.name), 'Onyx’s training course');
    assert.deepEqual(errors, []);
    console.log(`PASS: ${checks.length} floor, companion, practice, and builder checks; stairs, editor, save/reload, mobile, and play/return UI flows.`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
