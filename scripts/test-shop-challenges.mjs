import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 5197, base = `http://127.0.0.1:${port}`;
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
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__husky?.engine);
    const checks = await page.evaluate(async () => {
        const { World } = await import('/game/engine/World.ts');
        const { inputManager: input } = await import('/game/Input.ts');
        const { audioManager } = await import('/game/Audio.ts');
        const { gfxSettings } = await import('/game/GfxSettings.ts');
        const { Player } = await import('/game/entities/Player.ts');
        const { Renderer } = await import('/game/engine/Renderer.ts');
        window.__husky.engine.stop(); audioManager.setMusic(false); audioManager.setSFX(false);
        const passed = [], check = (ok, label) => { if (!ok) throw Error(label); passed.push(label); };
        let death = '', wins = 0;
        const events = { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() { wins++; }, onGameWon() { wins++; }, onGameOver(reason) { death = reason; } };
        const canvas = document.createElement('canvas'); canvas.width = 1100; canvas.height = 800; const renderer = new Renderer(canvas);
        // Simulate a normal double jump with no consumables; the best second jump is at the apex.
        const jumper = new Player(0, 0); jumper.grounded = true; jumper.jumpsLeft = 2;
        let rise = 0;
        for (let f = 0; f < 170; f++) { jumper.update([], { ArrowUp: f === 0 || jumper.velY >= 0 && jumper.jumpsLeft === 1 }, 800, 6); rise = Math.max(rise, -jumper.y); }
        check(rise < 470, 'Measured normal double-jump height stays below 470 pixels');
        const dateNow = Date.now, random = Math.random;
        let seed = 7351;
        Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
        try {
            // Strong, medium and weak headwinds; short and tall viewports keep the same route geometry.
            for (const height of [600, 900]) for (const difficulty of ['EASY', 'HARD', 'HARDCORE']) for (const level of [3, 6, 9, 12]) {
                Date.now = () => level === 9 ? 1500 * Math.PI * (difficulty === 'EASY' ? 1.5 : difficulty === 'HARD' ? 0 : .5) : dateNow();
                const w = new World(1100, height, events); w.loadLevel(level, false, difficulty); death = ''; input.clear();
                const door = w.shopDoor, route = door.challenge, p = w.player, exitLocked = w.exit.locked;
                p.x = door.x + 24; p.y = door.y + door.h - p.h; p.grounded = true; door.update(p);
                check(!door.unlocked && !w.openShop(), `${height}/${difficulty}/${level}: arriving at the door cannot bypass its challenge`);
                if (level === 6) check(850 - 300 > rise && route.ramp.launchPower > 14, `${height}/${difficulty}: ski shelf is above a normal double jump from the approach`);
                const starts = { 3: [2040, 350], 6: [3010, 150], 9: [3050, 400], 12: [65, 100] };
                p.x = starts[level][0]; p.y = height - starts[level][1] - p.h; p.grounded = true; p.jumpsLeft = 2;
                let stage = 'approach', heldJump = false, runPress = false, pressIndex = 0;
                for (let f = 0; f < 2400 && !death && !door.unlocked; f++) {
                    let target = p.x, jump = false;
                    if (level === 3) {
                        const log = route.logs[door.progress], dest = log ?? { x: door.x - 25, w: 140, y: door.y + 66 };
                        target = p.standingOn === dest ? p.x : dest.x + dest.w / 2 - 20;
                        if (p.standingOn !== dest) jump = p.grounded || p.jumpsLeft === 1 && p.velY > 0 && p.y + 40 > dest.y - 45;
                    } else if (level === 6) {
                        if (stage === 'approach') {
                            target = 3100; jump = p.grounded && p.y + 40 > height - 300;
                            if (p.standingOn?.y === height - 300) { stage = 'ramp'; jump = false; }
                        }
                        if (stage === 'ramp') target = 3240;
                        if (p.launchedFrom === route.ramp) stage = 'flight';
                        if (stage === 'flight') target = door.x + 24;
                    } else if (level === 9) {
                        if (stage === 'approach') {
                            target = 3330; jump = p.grounded || p.jumpsLeft === 1 && p.velY >= 0;
                            if (p.standingOn === route.launch) { stage = 'launch'; jump = false; }
                        } else if (stage === 'launch') {
                            target = 3330; if (Math.abs(p.x - 3330) < 8) { stage = 'flight'; jump = true; }
                        } else {
                            target = (route.rings[door.progress]?.x ?? door.x + 44) - 20; jump = true;
                            if (door.progress === 2 && p.jumpsLeft === 1) jump = !heldJump;
                        }
                    } else {
                        if (stage === 'approach') {
                            target = 85; jump = p.grounded && p.y + 40 > height - 230;
                            if (p.standingOn?.y === height - 230) { stage = 'belt'; jump = false; }
                        } else if (stage === 'belt') {
                            target = 230; jump = p.grounded && p.standingOn !== route.belt;
                            if (p.standingOn === route.belt) { stage = 'press'; jump = false; }
                        } else {
                            const press = route.presses[pressIndex];
                            if (press) {
                                if (press.state === 'up' && press.timer < 25) runPress = true;
                                target = runPress ? press.x + press.w + 25 : press.x - 65;
                                if (p.x > press.x + press.w + 10) { runPress = false; pressIndex++; }
                            } else { target = door.x + 24; jump = p.grounded && p.x > 650; }
                        }
                    }
                    const dx = target - p.x - (level === 6 ? p.velX * 10 : 0);
                    input.keys.ArrowRight = dx > 4; input.keys.ArrowLeft = dx < -4;
                    if (level === 3 && p.standingOn === route.logs[door.progress]) input.keys.ArrowRight = input.keys.ArrowLeft = false;
                    input.keys.Space = level === 9 && stage === 'flight' ? jump : jump && !heldJump; heldJump = input.keys.Space;
                    w.update();
                }
                input.clear();
                check(door.unlocked && !death, `${height}/${difficulty}/${level}: complete ${route.kind} using only movement with live hazards (${death || 'safe'})`);
                check(p.y - w.cameraY >= 0 && p.y + p.h - w.cameraY <= height, `${height}/${difficulty}/${level}: the camera keeps the shop landing visible`);
                check(w.exit.locked === exitLocked && wins === 0, `${height}/${difficulty}/${level}: entrance challenge leaves the normal level exit unchanged`);
                check(w.belongings.unlockedShops.has(level) && w.openShop(), `${height}/${difficulty}/${level}: completing the challenge admits Onyx and remembers access`);
                w.shopRoom.player.x = 88; w.interactShop();
                for (const mode of ['classic', 'enhanced']) {
                    gfxSettings.setVisualMode(mode); const before = JSON.stringify([door.progress, door.unlocked, w.player]); renderer.drawGame(w);
                    check(JSON.stringify([door.progress, door.unlocked, w.player]) === before, `${height}/${difficulty}/${level}: ${mode} route art preserves gameplay`);
                }
                w.loadLevel(level); check(w.shopDoor.unlocked, `${height}/${difficulty}/${level}: an ordinary retry preserves earned access`);
            }
        } finally { Date.now = dateNow; Math.random = random; input.clear(); }
        const w = new World(1100, 800, events); w.loadLevel(6, false);
        const d = w.shopDoor, p = w.player;
        p.launchedFrom = d.challenge.ramp; p.grounded = false; d.update(p);
        p.launchedFrom = null; p.grounded = true; d.update(p);
        p.x = d.x + 24; p.y = d.y + d.h - p.h; d.update(p);
        check(!d.unlocked, 'Ski attempt resets when Onyx lands somewhere other than the shop shelf');
        w.loadLevel(9); const glide = w.shopDoor, route = glide.challenge;
        w.player.standingOn = route.launch; w.player.grounded = true; glide.update(w.player);
        w.player.standingOn = null; w.player.grounded = false; w.player.hasUmbrella = true;
        w.player.x = route.rings[0].x - 20; w.player.y = route.rings[0].y - 20; glide.update(w.player);
        check(glide.progress === 0, 'Merely carrying an umbrella does not count as gliding through a ring');
        w.player.isGliding = true; glide.update(w.player); check(glide.progress === 1, 'An actual glide crosses the first ring');
        w.player.grounded = true; glide.update(w.player); check(glide.progress === 0, 'Landing early resets the continuous glide route');
        w.loadLevel(12); const bakery = w.shopDoor, belt = bakery.challenge.belt, press = bakery.challenge.presses[0];
        w.player.x = press.x + press.w / 2 - 20; w.player.y = belt.y - 80; w.player.grounded = false; bakery.update(w.player);
        check(bakery.progress === 0, 'Jumping over a press cannot replace following the conveyor beneath it');
        w.player.standingOn = belt; w.player.y = belt.y - 40; w.player.grounded = true; press.state = 'down'; bakery.update(w.player);
        check(bakery.progress === 0, 'A lowered press cannot grant its checkpoint');
        w.belongings.homeUnlocked = true; w.belongings.houseIntroSeen = true; w.loadLevel(15);
        w.player.x = w.shopDoor.x + 20; w.player.y = w.height - 140; w.player.grounded = true; w.shopDoor.update(w.player);
        check(!w.openShop() && w.interactHome() && w.homePanel === 'shop', 'Home shop waits for the opening biscuit errand and offers Juniper’s nearby hint');
        w.closeHomePanel(); w.belongings.quests.peace = 'found';
        const sam = w.props.find(p => p.quest?.id === 'samwise'); w.player.x = sam.x; sam.update(w.player); w.openHomePanel('samwise');
        check(w.respondToDog('peace') && w.shopDoor.unlocked, 'Giving Samwise the biscuits opens Juniper’s home branch');
        w.loadLevel(15); check(w.shopDoor.unlocked, 'Home shop stays open after changing rooms');
        w.loadLevel(3, false); check(!w.shopDoor.unlocked && w.belongings.unlockedShops.size === 0, 'A new journey resets entrance challenges');
        return passed;
    });
    // The locked-home hint is optional dialogue, never a persistent room label.
    await page.evaluate(() => { const e = window.__husky.engine; e.startLevel(1); e.world.belongings.homeUnlocked = true; e.world.belongings.houseIntroSeen = true; e.world.belongings.quests = {}; e.startLevel(15); const w = e.world; w.player.x = w.shopDoor.x + 20; w.player.y = w.height - 140; w.player.grounded = true; });
    await page.getByRole('button', { name: 'Talk to Juniper', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    assert.ok(await page.getByText('Help Samwise fetch the kitchen biscuits', { exact: false }).isVisible());
    await page.getByRole('button', { name: 'Close home conversation' }).click();
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.deepEqual(errors, []); console.log(checks.join('\n')); console.log(`PASS: ${checks.length} entrance challenge checks plus home hint UI.`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
