import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 5195;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
let serverLog = '';
server.stdout.on('data', x => { serverLog += x; });
server.stderr.on('data', x => { serverLog += x; });
let browser;
try {
    for (let i = 0; i < 100; i++) {
        if (server.exitCode !== null) throw new Error(serverLog);
        try { if ((await fetch(base)).ok) break; } catch {}
        if (i === 99) throw new Error(`Vite did not start: ${serverLog}`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    const checks = await page.evaluate(async () => {
        const { World } = await import('/game/engine/World.ts');
        const { Enemy } = await import('/game/entities/Enemy.ts');
        const { inputManager } = await import('/game/Input.ts');
        const { audioManager } = await import('/game/Audio.ts');
        const { SHOP_GOODS } = await import('/game/Shop.ts');
        const { gfxSettings } = await import('/game/GfxSettings.ts');
        const { Renderer } = await import('/game/engine/Renderer.ts');
        window.__husky.engine.stop(); audioManager.setMusic(false); audioManager.setSFX(false);
        const passed = [];
        const check = (ok, label) => { if (!ok) throw Error(label); passed.push(label); };
        let deaths = [], changes = 0;
        const events = { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() {}, onGameOver(reason) { deaths.push(reason); }, onGameWon() {}, onShopUpdate() { changes++; } };
        const world = new World(1280, 800, events);
        for (let level = 1; level <= 13; level++) {
            world.loadLevel(level, false, 'EASY');
            check(!!world.shopDoor === [3, 6, 9, 12].includes(level), `Secret shop placement: level ${level}`);
            if (world.shopDoor) {
                const locked = world.exit.locked;
                check(!world.openShop(), `Level ${level} shop cannot open from the main path`);
                for (const [i, seal] of world.shopDoor.trail.entries()) {
                    world.player.x = seal.x; world.player.y = seal.y; world.shopDoor.update(world.player);
                    check(world.shopDoor.unlocked === (i === 2), `Level ${level} needs all three paw seals (${i + 1}/3)`);
                }
                check(world.exit.locked === locked, `Level ${level} shop challenge is independent of the main exit`);
            }
        }
        world.loadLevel(3, false, 'EASY');
        const door = world.shopDoor;
        door.seals.fill(true); door.unlocked = true;
        world.player.x = door.x + 20; world.player.y = door.y + door.h - world.player.h; world.player.grounded = true;
        door.update(world.player);
        check(world.openShop(), 'An unlocked nearby doghouse opens');
        const paused = () => JSON.stringify({ player: world.player, time: world.timeLeft, platforms: world.platforms, enemies: world.enemies });
        const before = paused(); for (let f = 0; f < 180; f++) world.update();
        check(paused() === before, 'Shop pauses physics, enemies, item timers, and the level clock');
        check(!world.buyGood('shield') && world.player.bonesCollected === 0, 'Cannot buy without enough bones');
        check(!world.buyGood('unknown') && world.belongings.slots.every(x => x === null), 'Unknown goods cannot alter inventory');
        world.player.bonesCollected = 30;
        for (const id of ['shield', 'magnet', 'time']) check(world.buyGood(id), `Buy ${id} into a free pocket`);
        check(world.player.bonesCollected === 20 && world.belongings.slots.join(',') === 'shield,magnet,time', 'Purchases debit exact prices and occupy three distinct pockets');
        check(!world.buyGood('time') && world.player.bonesCollected === 20, 'Full pockets reject purchases without charging');
        check(!world.useInventorySlot(0), 'Consumables cannot be used while shopping');
        for (const id of ['hat', 'coat', 'collar']) check(world.buyGood(id), `Buy and equip ${id}`);
        check(world.player.bonesCollected === 5 && world.player.accessories.size === 3, 'All accessory categories can be worn together');
        world.buyGood('hat'); world.buyGood('hat');
        check(world.player.bonesCollected === 5 && world.player.accessories.has('hat'), 'Owned accessories can be removed and reworn without charging');
        world.closeShop();
        check(!world.buyGood('time'), 'Purchases are unavailable outside a shop');
        check(!world.useInventorySlot(-1) && !world.useInventorySlot(3), 'Invalid pocket indexes do nothing');
        check(world.useInventorySlot(0) && world.player.invincibleTimer === 300, 'Star treat starts five seconds of enemy protection');
        check(world.useInventorySlot(1) && world.player.magnetTimer === 600, 'Bone magnet lasts ten seconds');
        const time = world.timeLeft;
        check(world.useInventorySlot(2) && world.timeLeft === time + 30, 'Time biscuit adds thirty seconds');
        check(!world.useInventorySlot(2), 'A consumed item cannot be reused');
        world.belongings.slots = ['shield', 'magnet', 'time'];
        check(!world.useInventorySlot(0) && !world.useInventorySlot(1) && world.belongings.slots[0] === 'shield', 'Already-active effects do not waste another treat');
        world.loadLevel(3, true, 'EASY');
        check(world.player.bonesCollected === 5 && world.belongings.slots.join(',') === 'shield,magnet,time' && world.player.accessories.size === 3, 'Retry preserves remaining purchases, bones, and clothing');
        check(world.player.invincibleTimer === 0 && world.player.magnetTimer === 0, 'Retry clears temporary effects');
        world.enemies = []; world.waters = []; world.platforms = [];
        const bone = world.collectibles[0], originalCount = world.collectibles.length;
        world.player.x = bone.x; world.player.y = bone.y; world.update();
        const balance = world.player.bonesCollected;
        check(balance === 6, 'Collecting a bone increases spending balance');
        world.loadLevel(3, true, 'EASY');
        check(world.player.bonesCollected === balance && world.collectibles.length === originalCount - 1, 'Retry cannot farm the same bone twice');
        world.enemies = []; world.waters = []; world.platforms = [];
        const magnetBone = world.collectibles[0]; world.player.x = magnetBone.x - 100; world.player.y = magnetBone.y;
        world.player.magnetTimer = 600;
        for (let f = 0; f < 15; f++) world.update();
        check(magnetBone.markedForDeletion && world.player.bonesCollected > balance, 'Magnet draws in and collects nearby bones');
        world.loadLevel(6, true, 'HARD');
        check(world.belongings.slots[2] === 'time' && world.player.accessories.size === 3, 'Belongings carry to the next level');
        inputManager.keys.Digit3 = true; const clock = world.timeLeft; world.update();
        check(world.timeLeft === clock + 30 && world.belongings.slots[2] === null, 'Number key uses its matching pocket');
        world.belongings.slots[2] = 'time'; world.update();
        check(world.belongings.slots[2] === 'time', 'Holding a number key does not consume another item');
        inputManager.keys.Digit3 = false; world.update(); inputManager.keys.Digit3 = true; world.update();
        check(world.belongings.slots[2] === null, 'Release and press uses another item');
        inputManager.keys.ArrowRight = true; inputManager.clear();
        check(Object.values(inputManager.keys).every(x => !x), 'Input reset clears movement and inventory controls');
        world.loadLevel(1, false, 'EASY');
        check(world.player.bonesCollected === 0 && world.belongings.slots.every(x => x === null) && world.belongings.owned.size === 0 && world.belongings.collectedBones.size === 0, 'A new journey resets the run economy');

        world.belongings.slots[0] = 'time'; const tapTime = world.timeLeft;
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Digit1' })); world.update();
        check(world.timeLeft === tapTime + 30, 'A fast key tap between frames still uses its item');
        world.belongings.slots[0] = 'time';
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', repeat: true })); world.update();
        check(world.belongings.slots[0] === 'time', 'Operating-system key repeat cannot consume an item');
        world.loadLevel(3, false, 'EASY'); world.enemies = [new Enemy(100, 600, 0, 0)];
        world.player.x = 100; world.player.y = 610; world.belongings.slots[0] = 'shield';
        const beforeShield = deaths.length; world.useInventorySlot(0); world.update();
        check(deaths.length === beforeShield && world.player.invincibleTimer === 299, 'Star protection actually blocks an enemy collision and ticks down');
        world.player.invincibleTimer = 0; world.update();
        check(deaths.length === beforeShield + 1, 'The same enemy is dangerous once protection ends');

        // Start at each existing branch approach; reach the optional doghouse using only movement and jumps, with live hazards.
        const starts = { 3: [1920, 150], 6: [3020, 150], 9: [3020, 400], 12: [930, 490] };
        for (const difficulty of ['EASY', 'HARD', 'HARDCORE']) for (const level of [3, 6, 9, 12]) {
            world.loadLevel(level, false, difficulty); const [x, rise] = starts[level];
            world.player.x = x; world.player.y = 800 - rise - world.player.h;
            let i = 0, held = false; const oldDeaths = deaths.length;
            for (let f = 0; f < 1600 && deaths.length === oldDeaths && !world.shopOpen; f++) {
                const p = world.player, door = world.shopDoor, target = door.trail[i];
                if (door.seals[i] && p.grounded && i < 2) i++;
                const dx = (door.unlocked ? door.x + door.w / 2 : target.x + 10) - p.x - p.w / 2 - (level === 6 ? p.velX * 10 : 0);
                inputManager.keys.ArrowRight = dx > 6; inputManager.keys.ArrowLeft = dx < -6;
                const jump = !door.unlocked && (p.grounded || p.jumpsLeft === 1 && p.velY > 0 && p.y + p.h > target.y - 20);
                inputManager.keys.Space = jump && !held; held = !!inputManager.keys.Space;
                if (door.unlocked && door.nearby) inputManager.keys.KeyE = true;
                world.update();
            }
            check(world.shopOpen && deaths.length === oldDeaths, `${difficulty} level ${level}: all paw seals and shop reached from branch approach with live hazards`);
            check(world.belongings.unlockedShops.has(level), 'Earned shop access is retained for retries');
            const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 800;
            const renderer = new Renderer(canvas);
            for (const mode of ['classic', 'enhanced']) {
                gfxSettings.setVisualMode(mode); world.player.accessories = new Set(['hat', 'coat', 'collar']);
                const state = paused(); renderer.drawGame(world); check(state === paused(), `${mode} shop route and accessories draw without changing gameplay`);
            }
        }
        world.loadLevel(3, false, 'EASY');
        world.shopDoor.unlocked = true;
        world.player.x = world.shopDoor.x + 20; world.player.y = world.shopDoor.y + world.shopDoor.h - world.player.h; world.player.grounded = true;
        world.shopDoor.update(world.player); world.openShop(); world.player.bonesCollected = 50;
        for (const id of ['hat', 'coat', 'collar', 'crown', 'cat', 'fox']) check(world.buyGood(id), `Purchase new wardrobe: ${id}`);
        check(world.player.bonesCollected === 13, 'Expanded wardrobe charges exactly the listed prices');
        check(world.player.accessories.has('crown') && !world.player.accessories.has('hat') && world.player.accessories.has('fox') && !world.player.accessories.has('cat'), 'Purchasing headwear and skins replaces the previous item in the same category');
        world.buyGood('cat'); world.buyGood('hat');
        check(world.player.bonesCollected === 13 && world.player.accessories.has('cat') && !world.player.accessories.has('fox') && world.player.accessories.has('hat') && !world.player.accessories.has('crown'), 'Owned skins and headwear switch for free without stacking');
        world.buyGood('cat');
        check(!world.player.accessories.has('cat') && !world.player.accessories.has('fox') && world.player.accessories.has('coat') && world.player.accessories.has('collar'), 'Taking off a skin returns to Onyx while retaining clothing');
        world.buyGood('cat'); world.buyGood('crown'); world.closeShop(); world.loadLevel(6, true, 'HARD');
        check(world.player.accessories.has('cat') && world.player.accessories.has('crown') && world.player.bonesCollected === 13 && world.belongings.owned.size === 6, 'Skins and crown persist with ownership and wallet through level transitions');
        const portrait = document.createElement('canvas'); portrait.width = 180; portrait.height = 130;
        const ctx = portrait.getContext('2d'); const images = new Set();
        world.player.x = 60; world.player.y = 45; world.player.hasUmbrella = true; world.player.hasBandana = true;
        for (const mode of ['classic', 'enhanced']) for (const skin of ['cat', 'fox']) for (const level of [3, 6, 8, 13]) for (const facing of [true, false]) {
            gfxSettings.setVisualMode(mode); world.player.accessories = new Set([skin, 'crown', 'coat', 'collar']); world.player.facingRight = facing;
            const before = JSON.stringify(world.player); ctx.clearRect(0, 0, 180, 130); world.player.draw(ctx, 0, level);
            check(JSON.stringify(world.player) === before && world.player.w === 40 && world.player.h === 40, `${mode} ${skin} keeps physics unchanged with gear on level ${level}, facing ${facing ? 'right' : 'left'}`);
            if (level === 3 && facing) images.add(portrait.toDataURL());
        }
        check(images.size === 4, 'Both skins and both graphics modes produce distinct artwork');
        const engine = window.__husky.engine;
        engine.setDifficulty('HARD'); engine.startPoundEscapeCutscene(); engine.skipCutscene(); engine.stop();
        check(engine.world.difficulty === 'HARD' && engine.world.platforms.some(p => p.x === 2160 && p.w === 85), 'Selected Hard difficulty carries through the forest intro to the shop route');
        inputManager.clear();
        return passed;
    });
    await page.evaluate(() => {
        const engine = window.__husky.engine; engine.startLevel(3, 'EASY'); engine.stop(); const w = engine.world;
        w.player.bonesCollected = 50; w.shopDoor.unlocked = true;
        w.player.x = w.shopDoor.x + 20; w.player.y = w.shopDoor.y + w.shopDoor.h - w.player.h; w.player.grounded = true;
        w.shopDoor.update(w.player); w.openShop();
    });
    await page.getByRole('dialog').waitFor();
    assert.equal(await page.getByRole('article').count(), 9);
    for (const name of ['Little crown', 'Tuxedo cat', 'Red fox']) {
        const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
        await card.getByRole('button').click();
        assert.equal(await card.getByRole('button').innerText(), 'Take off');
    }
    assert.deepEqual(await page.evaluate(() => { const w = window.__husky.engine.world; return [w.player.bonesCollected, ...w.player.accessories]; }), [28, 'crown', 'fox']);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('img', { name: 'Onyx wearing Red fox', exact: true }).scrollIntoViewIfNeeded();
    assert.ok(await page.getByRole('img', { name: 'Onyx wearing Red fox', exact: true }).isVisible());
    assert.ok(await page.evaluate(() => { const shop = document.querySelector('.husky-shop'); return shop.scrollWidth <= shop.clientWidth; }));
    checks.push('Shop buttons purchase and switch crown and skins with exact charges; mobile previews fit the dialog');
    assert.equal(errors.length, 0, errors.join('\n'));
    for (const check of checks) console.log(`✓ ${check}`);
    console.log(`${checks.length} shop checks passed.`);
} finally {
    await browser?.close();
    server.kill('SIGTERM');
}
