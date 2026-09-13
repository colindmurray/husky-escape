import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 5198, base = `http://127.0.0.1:${port}`;
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
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__husky);
    const checks = await page.evaluate(async () => {
        const { World } = await import('/game/engine/World.ts');
        const { HOME_LEVEL, QUESTS, HomeDog, QuestPickup } = await import('/game/Home.ts');
        const { inputManager } = await import('/game/Input.ts');
        const { audioManager } = await import('/game/Audio.ts');
        const { MUSIC_TRACKS } = await import('/game/audio/tracks.ts');
        const { SoundType } = await import('/types.ts');
        const { Renderer } = await import('/game/engine/Renderer.ts');
        const { gfxSettings } = await import('/game/GfxSettings.ts');
        window.__husky.engine.stop(); audioManager.setMusic(false); audioManager.setSFX(false);
        const passed = [], check = (ok, label) => { if (!ok) throw Error(label); passed.push(label); };
        let wins = 0;
        const world = new World(1100, 720, { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() {}, onGameOver() {}, onGameWon() { wins++; } });
        world.loadLevel(1, false); world.loadLevel(HOME_LEVEL);
        check(!world.isHome && !world.belongings.homeUnlocked, 'Home requires finishing level 14');
        world.loadLevel(5); check(!world.props.some(p => p instanceof QuestPickup), 'Quest objects do not appear during the story');
        world.loadLevel(14); world.player.bonesCollected = 20; world.belongings.slots[0] = 'shield'; world.belongings.owned.add('crown'); world.belongings.equipped.add('crown');
        world.triggerLevelComplete();
        check(wins === 1 && world.belongings.homeUnlocked, 'Backyard victory unlocks home before announcing the win');
        world.loadLevel(HOME_LEVEL);
        check(audioManager.currentTrack === SoundType.THEME_HOME && MUSIC_TRACKS[SoundType.THEME_HOME].sequence.every(([note, duration]) => Number.isFinite(note) && duration > 0), 'Home selects a valid cozy melody in the existing Classic / Enhanced sequencer');
        check(world.isHome && world.player.bonesCollected === 20 && world.player.accessories.has('crown') && world.belongings.slots[0] === 'shield', 'Entering home retains bones, clothes, and pockets');
        check(world.props.filter(p => p instanceof HomeDog).length === 3 && world.shopDoor.unlocked, 'Home has three quest dogs and an open doghouse shop');
        const time = world.timeLeft;
        for (let f = 0; f < 700; f++) world.update();
        check(world.timeLeft === time && world.player.grounded, 'Home has solid ground and no countdown');
        check(!world.useInventorySlot(0) && world.belongings.slots[0] === 'shield', 'Treats are not wasted at home');
        check(!world.openHomePanel('ball') && !world.respondToDog(), 'Walk to a dog before talking; no remote rewards');
        for (const q of QUESTS) {
            world.player.x = q.homeX; world.player.y = world.height - 140; world.update();
            check(world.openHomePanel(q.id), `Talk to ${q.dog}`);
            const before = JSON.stringify({ x: world.player.x, y: world.player.y, time: world.timeLeft });
            for (let f = 0; f < 100; f++) world.update();
            check(JSON.stringify({ x: world.player.x, y: world.player.y, time: world.timeLeft }) === before, `${q.dog}'s conversation pauses movement`);
            check(world.respondToDog() && world.belongings.quests[q.id] === 'accepted', `Accept ${q.item} quest`);
            check(!world.respondToDog() && world.player.bonesCollected === 20, 'Accepting twice cannot grant a reward');
            check(!world.openShop(), 'Conversation and shop cannot overlap'); world.closeHomePanel();
        }
        let total = 20;
        for (const q of QUESTS) {
            // Approach each pickup using real movement on its platform, with original hazards intact.
            for (const difficulty of ['EASY', 'HARD', 'HARDCORE']) for (const height of [480, 800]) {
                world.height = height; world.belongings.quests[q.id] = 'accepted'; world.loadLevel(q.level, true, difficulty);
                const item = world.props.find(p => p instanceof QuestPickup && p.quest.id === q.id);
                check(!!item, `${q.item} appears in ${difficulty} at height ${height}`);
                const support = world.platforms.find(p => item.x >= p.x && item.x + item.w <= p.x + p.w && Math.abs(p.y - item.y - 32) < 2);
                check(!!support, `${q.item} sits on an existing reachable platform`);
                world.player.x = item.x - 50; world.player.y = support.y - 40;
                inputManager.keys.ArrowRight = true;
                for (let f = 0; f < 24 && world.belongings.quests[q.id] !== 'found'; f++) world.update();
                inputManager.clear();
                check(world.belongings.quests[q.id] === 'found', `${q.item} can be picked up by walking in ${difficulty}, height ${height}`);
            }
            world.loadLevel(q.level);
            check(!world.props.some(p => p instanceof QuestPickup && p.quest.id === q.id), `Retry keeps ${q.item} and prevents duplicate pickups`);
            world.loadLevel(HOME_LEVEL); world.player.x = q.homeX; world.player.y = world.height - 140; world.update(); world.openHomePanel(q.id);
            total = world.player.bonesCollected;
            check(world.respondToDog(), `Return ${q.item} to its owner`); total += q.reward;
            check(world.player.bonesCollected === total && world.belongings.quests[q.id] === 'complete', `${q.dog} grants exactly ${q.reward} bones`);
            check(!world.respondToDog() && world.player.bonesCollected === total, `${q.dog} cannot pay twice`); world.closeHomePanel();
        }
        world.player.x = world.shopDoor.x + 20; world.player.y = world.height - 140; world.update();
        check(world.openShop() && world.buyGood('cat'), 'Juniper sells cosmetics at home using quest rewards');
        check(world.player.accessories.has('cat') && world.player.bonesCollected === total - 16, 'Home purchase equips the skin and debits its full price'); world.closeShop();
        world.loadLevel(4); check(world.belongings.homeUnlocked && world.player.accessories.has('cat'), 'Replay keeps home unlocked and wears purchased cosmetics');
        world.loadLevel(HOME_LEVEL); const canvas = document.createElement('canvas'); const renderer = new Renderer(canvas); renderer.resize(1100, 800);
        for (const mode of ['classic', 'enhanced']) { gfxSettings.setVisualMode(mode); renderer.drawGame(world); check(canvas.getContext('2d').getImageData(500, 400, 1, 1).data[3] > 0, `${mode} home renders`); }
        world.resize(390, 480); world.update();
        check(world.player.y + world.player.h === 380 && world.props.filter(p => p instanceof HomeDog).every(p => p.y + p.h === 380), 'Resizing home keeps Onyx and friends on the floor');
        world.loadLevel(1, false);
        check(!world.belongings.homeUnlocked && Object.keys(world.belongings.quests).length === 0 && world.player.bonesCollected === 0, 'New journey resets home, quests, and economy together');
        return passed;
    });
    // Exercise the actual non-dev victory -> home -> conversation -> travel -> return UI.
    await page.getByRole('button', { name: '⚙️', exact: true }).click();
    await page.getByRole('button', { name: 'Hardcore (Permadeath)' }).click();
    await page.getByRole('button', { name: '⚙️', exact: true }).click();
    await page.evaluate(() => { const e = window.__husky.engine; e.startLevel(14, 'HARDCORE'); e.stop(); e.world.triggerLevelComplete(); });
    await page.getByRole('button', { name: 'Go inside · Home' }).click();
    await page.getByRole('button', { name: 'Explore old levels' }).waitFor();
    assert.equal(await page.getByText('Dev Mode: Warp').count(), 0);
    await page.evaluate(() => { const e = window.__husky.engine; e.stop(); e.world.player.x = 380; e.world.player.y = e.world.height - 140; e.world.update(); });
    await page.keyboard.press('e');
    await page.evaluate(() => window.__husky.engine.world.update());
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: 'I’ll find it!' }).click();
    await page.getByRole('button', { name: 'Choose a level' }).click();
    assert.equal(await page.locator('.home-levels button').count(), 14);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.home-levels button:last-child')), true);
    await page.getByRole('button', { name: '5 The Mountains' }).click();
    assert.equal(await page.evaluate(() => window.__husky.engine.world.currentLevel), 5);
    await page.getByRole('button', { name: 'Return home', exact: true }).click();
    await page.evaluate(() => { const e = window.__husky.engine; e.stop(); e.world.player.x = 380; e.world.player.y = e.world.height - 140; e.world.update(); e.renderer.drawGame(e.world); });
    await page.screenshot({ path: '.playwright-mcp/home-enhanced.png' });
    await page.getByRole('button', { name: 'Explore old levels' }).click();
    await page.screenshot({ path: '.playwright-mcp/home-travel.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('.home-dialog').evaluate(e => e.scrollWidth <= e.clientWidth), true);
    await page.screenshot({ path: '.playwright-mcp/home-mobile.png' });
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.setViewportSize({ width: 1100, height: 720 });
    await page.waitForFunction(() => window.__husky.engine.world.width === 1100 && window.__husky.engine.world.height === 720);
    await page.evaluate(() => { const h = window.__husky; h.gfxSettings.setVisualMode('classic'); h.engine.goHome(); h.engine.stop(); h.engine.renderer.drawGame(h.engine.world); });
    assert.equal(await page.locator('canvas[tabindex]').evaluate(c => c.getContext('2d').getImageData(500, 400, 1, 1).data[3] > 0), true);
    await page.screenshot({ path: '.playwright-mcp/home-classic.png' });
    // Postgame Hardcore retry must not erase the completed story.
    await page.evaluate(() => { const e = window.__husky.engine; e.revisitLevel(5); e.stop(); e.world.triggerGameOver('fall', 'Fell off the trail'); });
    await page.getByRole('button', { name: 'Try Again', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__husky.engine.world.currentLevel === 5 && window.__husky.engine.world.difficulty === 'HARDCORE' && window.__husky.engine.world.belongings.homeUnlocked), true);
    await page.evaluate(() => { const e = window.__husky.engine; e.stop(); e.world.triggerLevelComplete(); });
    await page.getByRole('button', { name: 'Back home', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__husky.engine.world.isHome), true);
    assert.deepEqual(errors, []);
    console.log(checks.join('\n')); console.log(`PASS: ${checks.length} home logic checks, plus non-dev UI, keyboard focus, mobile, retry, and return-home flows.`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
