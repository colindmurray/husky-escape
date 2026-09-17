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
        for (let level = 1; level <= 14; level++) {
            world.loadLevel(level, false, 'EASY');
            check(!!world.shopDoor === [3, 6, 9, 12].includes(level), `Secret shop placement: level ${level}`);
            if (world.shopDoor) {
                const locked = world.exit.locked;
                check(!world.openShop(), `Level ${level} shop cannot open from the main path`);
                check(world.exit.locked === locked, `Level ${level} shop challenge is independent of the main exit`);
            }
        }
        world.loadLevel(3, false, 'EASY');
        const door = world.shopDoor;
        door.unlocked = true;
        world.player.x = door.x + 20; world.player.y = door.y + door.h - world.player.h; world.player.grounded = true;
        door.update(world.player);
        check(world.openShop(), 'An unlocked nearby doghouse opens');
        world.belongings.shopSupplies[3] = ['spring', 'hush', 'leap'];
        world.shopRoom.player.x = 770; world.interactShop();
        const paused = () => JSON.stringify({ player: world.player, time: world.timeLeft, platforms: world.platforms, enemies: world.enemies });
        const before = paused(); for (let f = 0; f < 180; f++) world.update();
        check(paused() === before, 'Shop pauses physics, enemies, item timers, and the level clock');
        check(!world.buyGood('shield') && world.player.bonesCollected === 0, 'Cannot buy without enough bones');
        check(!world.buyGood('unknown') && world.belongings.slots.every(x => x === null), 'Unknown goods cannot alter inventory');
        for (const [id, good] of Object.entries(SHOP_GOODS)) {
            world.player.bonesCollected = good.price - 1;
            check(!world.buyGood(id) && world.player.bonesCollected === good.price - 1 && world.belongings.owned.size === 0 && world.belongings.slots.every(x => x === null), `${good.name} requires its full bone price without charging or granting the item`);
        }
        world.player.bonesCollected = 61;
        for (const id of ['spring', 'hush', 'spring']) check(world.buyGood(id), `Buy ${id} into a free pocket`);
        check(world.player.bonesCollected === 35 && world.belongings.slots.join(',') === 'spring,hush,spring', 'Purchases debit exact prices and occupy three distinct pockets');
        check(!world.buyGood('spring') && world.player.bonesCollected === 35, 'Full pockets reject purchases without charging');
        check(!world.useInventorySlot(0), 'Consumables cannot be used while shopping');
        for (const id of ['hat', 'coat', 'collar']) check(world.buyGood(id), `Buy and equip ${id}`);
        check(world.player.bonesCollected === 5 && world.player.accessories.size === 3, 'All accessory categories can be worn together');
        world.buyGood('hat'); world.buyGood('hat');
        check(world.player.bonesCollected === 5 && world.player.accessories.has('hat'), 'Owned accessories can be removed and reworn without charging');
        world.closeShop(); world.shopRoom.player.x = 88; world.interactShop();
        check(!world.buyGood('time'), 'Purchases are unavailable outside a shop');
        check(!world.useInventorySlot(-1) && !world.useInventorySlot(3), 'Invalid pocket indexes do nothing');
        world.belongings.slots = ['shield', 'magnet', 'time']; // Legacy pockets remain usable.
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

        world.loadLevel(3, false, 'EASY');
        world.shopDoor.unlocked = true;
        world.player.x = world.shopDoor.x + 20; world.player.y = world.shopDoor.y + world.shopDoor.h - world.player.h; world.player.grounded = true;
        world.shopDoor.update(world.player); world.openShop(); world.shopRoom.player.x = 770; world.interactShop(); world.player.bonesCollected = 87;
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
        check(engine.world.difficulty === 'HARD' && engine.world.platforms.some(p => p.minX === 2150 && p.w === 110), 'Selected Hard difficulty carries through the forest intro to the shop route');
        inputManager.clear();
        return passed;
    });
    await page.evaluate(() => {
        const engine = window.__husky.engine; engine.startLevel(3, 'EASY'); engine.stop(); const w = engine.world;
        w.player.bonesCollected = 50; w.shopDoor.unlocked = true;
        w.player.x = w.shopDoor.x + 20; w.player.y = w.shopDoor.y + w.shopDoor.h - w.player.h; w.player.grounded = true;
        w.shopDoor.update(w.player); w.openShop(); w.shopRoom.player.x = 770; w.interactShop();
    });
    await page.getByRole('dialog').waitFor();
    assert.equal(await page.getByRole('article').count(), 10);
    for (const name of ['Little crown', 'Tuxedo cat', 'Red fox']) {
        const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
        await card.getByRole('button').click();
        assert.equal(await card.getByRole('button').innerText(), 'Take off');
    }
    assert.deepEqual(await page.evaluate(() => { const w = window.__husky.engine.world; return [w.player.bonesCollected, ...w.player.accessories]; }), [6, 'crown', 'fox']);
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
