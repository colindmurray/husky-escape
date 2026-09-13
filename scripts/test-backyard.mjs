import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 5197;
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
        const { BossRaccoon, Raccoon, TrashLid, BackyardGate } = await import('/game/entities/Backyard.ts');
        const { TownTimedHazard } = await import('/game/entities/Town.ts');
        const { getLevel14 } = await import('/game/levels/level14.ts');
        const { inputManager } = await import('/game/Input.ts');
        const { audioManager } = await import('/game/Audio.ts');
        const { gfxSettings } = await import('/game/GfxSettings.ts');
        const { Renderer } = await import('/game/engine/Renderer.ts');
        const { MUSIC_TRACKS } = await import('/game/audio/tracks.ts');
        const { playSoundEffect } = await import('/game/audio/sfx.ts');
        const { playSoundEffectEnhanced } = await import('/game/audio/enhancedSfx.ts');
        const { SoundType } = await import('/types.ts');
        window.__husky.engine.stop(); audioManager.setMusic(false); audioManager.setSFX(false);
        const passed = [], check = (ok, name) => { if (!ok) throw Error(name); passed.push(name); };
        const easy = getLevel14(800, 'EASY'), hard = getLevel14(800, 'HARD');
        check(easy.waters.length === 0 && hard.waters.length === 2, 'Hard replaces two lawn sections with flooded fence crossings');
        check(easy.platforms.every(p => !p.dx) && hard.platforms.filter(p => p.dx).length === 2, 'Only Hard has moving fence sections');
        check(easy.enemies.filter(e => e instanceof TownTimedHazard).every(e => e.kind === 'hydrant'), 'All backyard sprays come from hydrants');
        check(hard.enemies.filter(e => e instanceof Raccoon).length > easy.enemies.filter(e => e instanceof Raccoon).length, 'Hard adds raccoons on the upper fence route');
        check(easy.exit.locked && hard.exit.locked, 'Home remains locked until the boss is defeated');
        let death = '', wins = 0;
        const world = new World(1280, 800, { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() {}, onGameOver(reason) { death = reason; }, onGameWon() { wins++; } });
        world.loadLevel(14, false, 'EASY');
        let raccoon = new Raccoon(150, 700, 50, false); world.enemies = [raccoon];
        world.player.x = 150; world.player.y = 660; world.update();
        check(death === 'raccoon', 'A raccoon hurts Onyx on side contact');
        death = ''; world.loadLevel(14, false, 'EASY'); raccoon = new Raccoon(150, 700, 50, false); world.enemies = [raccoon];
        world.player.x = 155; world.player.y = raccoon.y - 30; world.player.velY = 4; world.update();
        check(!death && raccoon.markedForDeletion && world.player.velY < 0, 'Landing on a small raccoon defeats it and bounces Onyx');
        world.loadLevel(14, false, 'EASY');
        const boss = world.enemies.find(e => e instanceof BossRaccoon); world.enemies = [boss]; boss.activate();
        const landOnBoss = () => { world.player.x = boss.x + 45; world.player.y = boss.y - 30; world.player.velY = 4; world.player.invincibleTimer = 0; world.update(); };
        landOnBoss(); check(boss.health === 3 && world.player.velY < 0, 'The top hat blocks damage before the boss is dizzy');
        boss.state = 'stunned'; boss.timer = 0; landOnBoss(); world.update();
        check(boss.health === 2 && boss.state === 'recover', 'One dizzy opening permits one damaging bonk');
        for (let i = 0; i < 2; i++) { boss.state = 'stunned'; boss.timer = 0; landOnBoss(); }
        check(boss.health === 0 && !world.exit.locked && world.platforms.filter(p => p instanceof BackyardGate).every(p => !p.isActive), 'Defeating the boss unlocks home and lowers both gates');
        world.player.x = world.exit.x; world.player.y = world.exit.y; world.update(); world.update();
        check(wins === 1, 'The backyard exit wins the game exactly once');
        world.loadLevel(14, true, 'HARD'); const hardBoss = world.enemies.find(e => e instanceof BossRaccoon); hardBoss.activate(); hardBoss.update(world.platforms, world.player, world.enemies);
        check(hardBoss.health === 4 && world.enemies.filter(e => e instanceof TrashLid).length === 2, 'Hard boss adds a fourth hit and two telegraphed lid arcs');
        const lid = new TrashLid(130, 660, 0, 700); lid.velY = 0; world.enemies = [lid]; world.player.x = 130; world.player.y = 660; world.update();
        check(death === 'trashlid', 'Flying trash lids have a real collision and an explanatory failure message');
        world.loadLevel(14, true, 'EASY'); world.enemies = [];
        check(world.exit.locked && !world.raccoonIntroPending, 'Retry restores the locked boss encounter');

        // No teleports, invulnerability, removed hazards, or direct damage during these complete runs.
        for (const difficulty of ['EASY', 'HARD', 'HARDCORE']) for (const height of [480, 800]) for (const margin of [25, 45]) {
            let lost = '', won = false;
            const run = new World(1280, height, { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() {}, onGameOver(reason) { lost = reason; }, onGameWon() { won = true; } });
            run.loadLevel(14, false, difficulty);
            const boss = run.enemies.find(e => e instanceof BossRaccoon), targets = run.platforms.filter(p => p.kind === 'fence' && p.x < 3400);
            let index = 0, previousJump = false, frame = 0;
            inputManager.clear();
            for (; frame < 7000 && !lost && !won; frame++) {
                const p = run.player; let target = targets[index];
                if (target && p.grounded && Math.abs(p.y + p.h - target.y) < 3 && p.x + p.w > target.x && p.x < target.x + target.w) target = targets[++index];
                const targetX = target ? target.x + target.w / 2 : boss.health > 0 ? (boss.isActive ? boss.x + boss.w / 2 : 3540) : 4790;
                const dx = targetX - p.x - p.w / 2;
                inputManager.keys.ArrowRight = dx > 6; inputManager.keys.ArrowLeft = dx < -6;
                let jump = false;
                if (target) {
                    const support = run.platforms.find(s => p.x + p.w > s.x && p.x < s.x + s.w && Math.abs(p.y + p.h - s.y) < 3);
                    jump = p.grounded && (Math.abs(dx) < 200 || support?.kind === 'fence' && p.x + p.w > support.x + support.w - 35) || p.velY > 0 && p.jumpsLeft === 1 && p.y + p.h > target.y - margin;
                } else if (!boss.isActive && boss.health > 0) jump = p.grounded && p.x < 3465;
                else if (boss.health > 0) jump = p.grounded || p.velY > 0 && p.jumpsLeft === 1 && p.y + p.h > boss.y - margin;
                else jump = p.grounded && p.x < 4610;
                const jet = run.enemies.find(e => e instanceof TownTimedHazard && e.x > p.x - 20 && e.x < p.x + 100 && (e.dangerous || e.warning));
                if (jet && p.jumpsLeft > 0 && p.y + p.h > jet.y - 45) jump = true;
                inputManager.keys.Space = jump && !previousJump; previousJump = inputManager.keys.Space; run.update();
            }
            check(won && !lost && boss.health === 0, `${difficulty} complete route and boss, height ${height}, jump margin ${margin}: ${lost || `${frame} frames`}`);
        }
        inputManager.clear();
        const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 800; const renderer = new Renderer(canvas);
        for (const difficulty of ['EASY', 'HARD']) for (const mode of ['classic', 'enhanced']) {
            world.loadLevel(14, false, difficulty); gfxSettings.setVisualMode(mode);
            for (const camera of [0, 1250, 2450, 3370, 4100]) {
                world.cameraX = camera; const before = JSON.stringify([world.player, world.platforms, world.enemies, world.timeLeft]);
                renderer.drawGame(world); check(JSON.stringify([world.player, world.platforms, world.enemies, world.timeLeft]) === before, `${mode} ${difficulty} backyard artwork preserves gameplay at ${camera}`);
            }
        }
        for (const theme of [SoundType.THEME_BACKYARD, SoundType.THEME_BOSS_RACCOON]) check(MUSIC_TRACKS[theme].sequence.every(([note, duration]) => Number.isFinite(note) && duration > 0), `${theme} has a valid melody`);
        for (const rich of [false, true]) {
            const ctx = new OfflineAudioContext(1, 44100, 44100), gain = ctx.createGain(); gain.connect(ctx.destination);
            if (rich) check(playSoundEffectEnhanced(SoundType.RACCOON_CHATTER, ctx, gain), 'Premium raccoon chatter is handled');
            else playSoundEffect(SoundType.RACCOON_CHATTER, ctx, gain);
            const sound = await ctx.startRendering(); check(sound.getChannelData(0).some(x => Math.abs(x) > .0001), `${rich ? 'Premium' : 'Classic'} raccoon chatter is audible`);
        }
        return passed;
    });
    // Trigger the real engine cutscene, then exercise its native Skip button.
    await page.evaluate(() => {
        const e = window.__husky.engine; e.startLevel(14, 'HARD'); e.stop(); const w = e.world;
        w.player.bonesCollected = 31; w.belongings.slots[0] = 'time'; w.player.accessories.add('crown');
        w.player.x = 3520; w.player.y = w.height - 225; w.player.grounded = true; w.update();
    });
    assert.equal(await page.evaluate(() => window.__husky.engine.gameState), 'CUTSCENE');
    const frozen = await page.evaluate(() => { const w = window.__husky.engine.world; const before = JSON.stringify([w.player, w.timeLeft, w.enemies]); for (let i = 0; i < 100; i++) w.update(); return before === JSON.stringify([w.player, w.timeLeft, w.enemies]); });
    assert.ok(frozen);
    await page.getByRole('button', { name: /Skip/ }).click();
    assert.deepEqual(await page.evaluate(() => { const e = window.__husky.engine, w = e.world; return [e.gameState, w.currentLevel, w.player.bonesCollected, w.belongings.slots[0], w.player.accessories.has('crown'), w.raccoonIntroPending]; }), ['PLAYING', 14, 31, 'time', true, false]);
    checks.push('Boss reveal pauses the world; Skip resumes the same level, wallet, pocket and outfit');
    await page.evaluate(() => {
        const e = window.__husky.engine; e.startLevel(14, 'EASY'); const w = e.world;
        w.player.x = 3520; w.player.y = w.height - 225; w.player.grounded = true; w.player.bonesCollected = 31;
    });
    await page.waitForFunction(() => window.__husky.engine.gameState === 'CUTSCENE');
    await page.waitForFunction(() => window.__husky.engine.cutsceneManager.step === 2 && window.__husky.engine.cutsceneManager.frame >= 35);
    await page.waitForFunction(() => window.__husky.engine.gameState === 'PLAYING');
    assert.equal(await page.evaluate(() => { window.__husky.engine.stop(); return window.__husky.engine.world.player.bonesCollected; }), 31);
    checks.push('The full reveal animates and naturally resumes the same run after nine seconds');
    assert.equal(errors.length, 0, errors.join('\n'));
    for (const check of checks) console.log(`✓ ${check}`);
    console.log(`${checks.length} backyard checks passed.`);
} finally {
    await browser?.close(); server.kill('SIGTERM');
}
