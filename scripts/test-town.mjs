import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 5194;
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
        const { Player } = await import('/game/entities/Player.ts');
        const { inputManager } = await import('/game/Input.ts');
        const { getLevel13 } = await import('/game/levels/level13.ts');
        const { TownPedestrian, TownCyclist, TownTimedHazard, YardDog, CollapsingAwning, BandanaPickup, TownPlatform } = await import('/game/entities/Town.ts');
        const { Difficulty, SoundType } = await import('/types.ts');
        const { audioManager } = await import('/game/Audio.ts');
        const { gfxSettings } = await import('/game/GfxSettings.ts');
        const { Renderer } = await import('/game/engine/Renderer.ts');
        const { CutsceneManager } = await import('/game/engine/CutsceneManager.ts');
        const { MUSIC_TRACKS } = await import('/game/audio/tracks.ts');
        const { playSoundEffect } = await import('/game/audio/sfx.ts');
        const { playSoundEffectEnhanced } = await import('/game/audio/enhancedSfx.ts');
        audioManager.setMusic(false); audioManager.setSFX(false);
        const passed = [];
        function check(condition, label) { if (!condition) throw new Error(label); passed.push(label); }
        const easy = getLevel13(720, Difficulty.EASY), hard = getLevel13(720, Difficulty.HARD);
        check(easy.waters.length === 0 && hard.waters.length === 1, 'Hard replaces the safe fountain floor with deep water');
        check(easy.platforms.some(p => p.x === 0 && p.w === 6940) && !hard.platforms.some(p => p.x === 0 && p.w === 6940), 'Hard has distinct ground geometry');
        check(hard.platforms.filter(p => p instanceof CollapsingAwning).length === 3 && !easy.platforms.some(p => p instanceof CollapsingAwning), 'Only Hard has collapsing awnings');
        check(hard.enemies.some(e => e instanceof TownCyclist && e.direction === 1), 'Hard has opposing delivery traffic');
        check(easy.props.filter(p => p instanceof BandanaPickup).length === 2 && hard.props.filter(p => p instanceof BandanaPickup).length === 1, 'Hard bandana requires the upper route');
        check(hard.platforms.filter(p => p.kind === 'float').every(p => p.w === 150), 'Hard parade requires narrow moving floats');
        check(easy.exit.locked && hard.exit.locked, 'Both routes require the parade pass to open home');
        check(easy.enemies.filter(e => e instanceof TownTimedHazard).every(e => e.h >= 155), 'Easy timed hazards reach beyond low obstacles');
        check(hard.enemies.filter(e => e instanceof TownTimedHazard).length > easy.enemies.filter(e => e instanceof TownTimedHazard).length, 'Hard adds a second parade roadwork post');
        check(JSON.stringify(getLevel13(720, Difficulty.HARDCORE)) === JSON.stringify(hard), 'Hardcore uses the hard layout');
        for (const layout of [easy, hard]) {
            const traps = layout.enemies.filter(e => e instanceof TownTimedHazard);
            check(traps.filter(e => e.kind === 'fountain').length === 3 && traps.filter(e => e.kind === 'fountain').every(e => e.x >= 3000 && e.x < 3800), 'Fountain jets stay in the square');
            check(traps.filter(e => e.kind === 'hydrant').length === 2 && traps.filter(e => e.kind === 'roadwork').every(e => e.x >= 5000), 'Gardens use hydrants; finale uses mechanical posts');
            check(layout.props.filter(p => p.kind === 'sign').length === 2, 'Only town and parade wayfinding signs remain');
        }


        const idle = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false };
        const awning = new CollapsingAwning(100, 400, 160, '#d96252');
        const onyx = new Player(130, 360);
        onyx.update([awning], idle, 720, 13);
        check(awning.countdown === 55 && onyx.grounded, 'Landing arms a collapsing awning');
        for (let i = 0; i < 55; i++) awning.update();
        check(awning.collapsed, 'Awning collapses after its warning');
        onyx.update([awning], idle, 720, 13);
        check(!onyx.grounded && onyx.y > 360, 'Collapsed awning cannot hold the player');
        for (let i = 0; i < 180; i++) awning.update();
        check(!awning.collapsed, 'Awning reforms so waiting cannot softlock the route');

        const bike = new TownCyclist(900, 1600, 558, 4, 90);
        const target = new Player(1150, 580);
        bike.update([], target);
        check(bike.phase === 'warning' && !bike.dangerous, 'Bike warns before moving');
        for (let i = 0; i < 89; i++) bike.update([], target);
        check(bike.x === 1600 && !bike.dangerous, 'Bike gives its complete warning window');
        bike.update([], target); bike.update([], target);
        check(bike.dangerous && bike.x < 1600, 'Bike rides only after the warning');
        const dog = new YardDog(1000, 1230, 584, 3.8, 60);
        target.x = 1080; dog.update([], target);
        check(dog.phase === 'warning' && !dog.dangerous, 'Yard dog barks before charging');
        for (let i = 0; i < 400; i++) {
            dog.update([], target);
            if (dog.x < dog.minX || dog.x > dog.maxX) throw new Error('Dog escaped its territory');
        }
        check(true, 'Dog charge stays inside its marked territory');

        let lost = [], completed = [], wins = 0;
        const world = new World(1100, 720, { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete(level) { completed.push(level); }, onGameOver(reason) { lost.push(reason); }, onGameWon() { wins++; } });
        world.loadLevel(13, false, Difficulty.EASY);
        world.enemies = [];
        world.player.x = 350; world.player.y = 585; world.update();
        check(world.player.hasBandana && !world.props.some(p => p instanceof BandanaPickup && p.x === 350), 'Bandana pickup equips and disappears');
        const pedestrian = new TownPedestrian(350, 563, 80);
        pedestrian.update([], world.player);
        check(pedestrian.yielding && pedestrian.greetingFrames > 0, 'Bandana makes pedestrians yield and say Good dog');
        for (let f = 0; f < 100; f++) pedestrian.update([], world.player);
        check(pedestrian.yielding && pedestrian.greetingFrames === 0, 'Good dog greeting fades while the pedestrian keeps yielding');
        world.enemies = [pedestrian]; world.player.hasBandana = false;
        world.player.x = 350; world.player.y = 580; world.player.velY = 0; world.update();
        check(lost.length === 0 && world.player.townBumpFrames > 0, 'Pedestrians bump without ending the run');
        world.player.hasBandana = true; world.player.x = 350; world.player.y = 580;
        const jet = new TownTimedHazard(350, 620, 330, 75, 55);
        world.enemies = [jet]; world.update();
        check(!world.player.hasBandana && world.player.invincibleTimer === 100 && lost.length === 0, 'Bandana absorbs one town hazard');
        world.player.x = 350; world.player.y = 580; world.player.invincibleTimer = 0; world.player.velY = 0;
        world.enemies.push(new TownTimedHazard(350, 620, 330, 75, 55)); world.update(); world.update();
        check(lost.length === 1 && lost[0] === 'sprinkled', 'Overlapping hazards emit only one game-over event');
        world.loadLevel(13, false, Difficulty.HARD);
        check(!world.player.hasBandana && world.player.townBumpFrames === 0, 'Restart clears town item and bump state');
        world.player.hasBandana = true; world.enemies = [];
        world.player.x = 3370; world.player.y = 652; world.update();
        check(lost.at(-1) === 'drowned', 'Bandana cannot bypass the hard fountain crossing');
        world.loadLevel(13, false, Difficulty.EASY); world.props = [];
        const post = new TownTimedHazard(600, 620, 340, 95, 0, 205, 'roadwork');
        world.enemies = [post]; world.player.x = 600; world.player.y = 580;
        const deathsBeforePost = lost.length; world.update();
        check(lost.length === deathsBeforePost, 'Retracted roadwork post is harmless during its warning');
        post.frame = 55; world.player.hasBandana = true; world.update();
        check(!world.player.hasBandana && world.player.invincibleTimer > 0, 'Bandana saves one roadwork collision');
        world.player.invincibleTimer = 0; world.update();
        check(lost.at(-1) === 'roadwork', 'Raised roadwork post uses its own defeat reason');
        world.loadLevel(12, false, Difficulty.EASY); world.enemies = [];
        world.exit.unlock(); world.player.x = world.exit.x; world.player.y = world.exit.y; world.update();
        check(completed.at(-1) === 12 && wins === 0, 'Bakery exit advances instead of ending the game');
        world.loadLevel(13, false, Difficulty.EASY); world.enemies = [];
        world.player.x = 4900; world.player.y = 580;
        Object.assign(inputManager.keys, idle, { ArrowRight: true });
        for (let f = 0; f < 750; f++) world.update();
        Object.assign(inputManager.keys, idle);
        check(world.player.x > world.exit.x && wins === 0 && world.exit.locked, 'Walking under all parade floats cannot win Easy');
        const parade = world.platforms.filter(p => p.kind === 'float');
        for (const [i, deck] of parade.entries()) {
            world.player.x = deck.x + deck.w / 2; world.player.y = deck.y - world.player.h;
            world.player.velX = 0; world.player.velY = 0; world.update();
            check(deck.boarded && world.exit.locked === (i < 2), `Landing on float ${i + 1} advances the pass; only the third opens home`);
        }
        world.player.x = world.exit.x; world.player.y = world.exit.y; world.update(); world.update();
        check(wins === 1, 'Completed town pass wins exactly once');
        world.loadLevel(13, false, Difficulty.EASY);
        check(world.exit.locked && world.platforms.filter(p => p.kind === 'float').every(p => !p.boarded), 'Restart resets the parade pass and home gate');

        const float = new TownPlatform(100, 400, 200, 38, 'float', '#258d91', 80, 0.7);
        const rider = new Player(150, 360);
        rider.update([float], idle, 720, 13);
        const oldX = rider.x; float.update(); rider.update([float], idle, 720, 13);
        check(Math.abs(rider.x - oldX - float.dx) < 0.001, 'Parade floats carry a standing player');

        for (const kind of ['awning', 'bench', 'stone', 'float']) {
            const shelf = new TownPlatform(100, 400, 200, 22, kind);
            const jumper = new Player(150, 420); jumper.velY = -10;
            jumper.update([shelf], idle, 720, 13);
            check(jumper.velY < 0 && jumper.y < 420, `${kind} allows jumping through from below`);
        }
        // Use only player input: run the streets, then aim for each moving deck.
        // Vary the second-jump height to cover a landing window, not a single exact timing.
        for (const [difficulty, period] of [[Difficulty.EASY, 88], [Difficulty.HARD, 52], [Difficulty.HARDCORE, 52]]) {
            for (const extraHeight of [10, 40, 70]) {
                let death = '', won = false, previousJump = false;
                const run = new World(1280, 800, { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() {}, onGameOver(reason) { death = reason; }, onGameWon() { won = true; } });
                run.loadLevel(13, false, difficulty);
                const floats = run.platforms.filter(p => p.kind === 'float');
                Object.assign(inputManager.keys, idle);
                for (let f = 0; f < 3800 && !death && !won; f++) {
                    const p = run.player, target = floats.find(deck => !deck.boarded);
                    let jump = false;
                    if (p.x < 4870) {
                        jump = f % period === 0;
                        inputManager.keys.ArrowRight = true; inputManager.keys.ArrowLeft = false;
                    } else if (target) {
                        const dx = target.x + target.w / 2 - p.x - p.w / 2;
                        inputManager.keys.ArrowRight = dx > 8; inputManager.keys.ArrowLeft = dx < -8;
                        const support = run.platforms.find(deck => p.x + p.w > deck.x && p.x < deck.x + deck.w && Math.abs(p.y + p.h - deck.y) < 2);
                        if (p.grounded) jump = !support || support.kind === 'pavement' || (dx > 0 ? p.x + p.w >= support.x + support.w - 25 : p.x <= support.x + 25);
                        else jump = p.velY > 0 && p.y + p.h > target.y - extraHeight && p.jumpsLeft === 1;
                    } else {
                        inputManager.keys.ArrowRight = p.x < 6655; inputManager.keys.ArrowLeft = false;
                        jump = p.x < 6400 && f % period === 0;
                    }
                    inputManager.keys.Space = jump && !previousJump;
                    previousJump = inputManager.keys.Space;
                    run.update();
                }
                check(won && !death && floats.every(p => p.boarded), `${difficulty} completes with live hazards and double-jump margin ${extraHeight} (${death || 'survived'})`);
            }
        }
        Object.assign(inputManager.keys, idle);

        const canvas = document.createElement('canvas'); canvas.width = 1100; canvas.height = 720;
        const renderer = new Renderer(canvas);
        for (const difficulty of [Difficulty.EASY, Difficulty.HARD, Difficulty.HARDCORE]) {
            world.loadLevel(13, false, difficulty);
            for (const visual of ['classic', 'enhanced']) {
                gfxSettings.setVisualMode(visual);
                for (const x of [80, 1200, 2300, 3300, 4300, 5600, 6670]) {
                    world.player.x = x; world.cameraX = Math.max(0, x - 300);
                    const before = JSON.stringify({ p: world.player, platforms: world.platforms, enemies: world.enemies });
                    renderer.drawGame(world);
                    if (before !== JSON.stringify({ p: world.player, platforms: world.platforms, enemies: world.enemies })) throw new Error('Rendering mutated gameplay');
                }
                const scene = new CutsceneManager(() => {}, () => {});
                scene.currentType = 'town_intro'; scene.step = 3; scene.frame = 30;
                renderer.drawCutscene(scene, 1100, 720);
            }
        }
        check(true, 'Both visual modes draw every town section and intro without mutating gameplay');
        for (let level = 1; level <= 12; level++) {
            world.loadLevel(level, false, Difficulty.EASY);
            for (let frame = 0; frame < 3; frame++) world.update();
            for (const visual of ['classic', 'enhanced']) {
                gfxSettings.setVisualMode(visual); renderer.drawGame(world);
            }
        }
        check(true, 'Existing levels still initialize, update, and draw in both visual modes');
        check(MUSIC_TRACKS[SoundType.THEME_TOWN].sequence.every(([f, d]) => Number.isFinite(f) && d > 0), 'Town theme has a valid melody');
        for (const enhanced of [false, true]) {
            for (const sound of [SoundType.BIKE_BELL, SoundType.DOG_BARK, SoundType.WATER_JET, SoundType.ROADWORK]) {
                const ctx = new OfflineAudioContext(1, 44100, 44100), gain = ctx.createGain(); gain.connect(ctx.destination);
                if (enhanced) check(playSoundEffectEnhanced(sound, ctx, gain), `Enhanced ${sound} has its own sound`);
                else playSoundEffect(sound, ctx, gain);
                const result = await ctx.startRendering();
                check(result.getChannelData(0).some(v => Math.abs(v) > 0.0001), `${enhanced ? 'Enhanced' : 'Classic'} ${sound} renders audible samples`);
            }
        }
        return passed;
    });
    assert.equal(errors.length, 0, errors.join('\n'));
    for (const check of checks) console.log(`✓ ${check}`);
    console.log(`${checks.length} town checks passed.`);
} finally {
    await browser?.close();
    server.kill('SIGTERM');
}
