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
    await page.goto(base); await page.waitForFunction(() => window.__husky);
    assert.equal(await page.getByRole('button', { name: 'Home', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Free Roam', exact: true }).click();
    await page.getByRole('button', { name: 'Hard (Extra Challenges)', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Home', exact: true }).evaluate(b => b.previousElementSibling.textContent), '14');
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => { const e = window.__husky.engine; e.stop(); return [e.world.currentLevel, e.world.belongings.homeUnlocked, e.world.difficulty, e.cutsceneManager.currentType]; }), [15, true, 'HARD', 'house_chase']);
    await page.getByRole('button', { name: 'Skip >>', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__husky.engine.world.belongings.quests.peace), 'accepted');
    await page.evaluate(() => { const e = window.__husky.engine; e.stop(); e.world.player.bonesCollected = 37; e.world.belongings.quests.peace = 'complete'; e.startLevel(14, 'HARD'); e.stop(); e.world.triggerLevelComplete(); e.skipCutscene(); });
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => { const e = window.__husky.engine; e.stop(); return [e.world.currentLevel, e.gameState, e.world.player.bonesCollected, e.world.belongings.quests.peace]; }), [15, 'PLAYING', 37, 'complete']);
    const checks = await page.evaluate(async () => {
        const { World } = await import('/game/engine/World.ts');
        const { HOME_LEVEL, QUESTS, COMPANIONS, FLOORS, HomeDog, QuestPickup, questAvailable, dogRoom, houseChapter } = await import('/game/Home.ts');
        const { inputManager } = await import('/game/Input.ts');
        const { audioManager } = await import('/game/Audio.ts');
        const { Renderer } = await import('/game/engine/Renderer.ts');
        const { gfxSettings } = await import('/game/GfxSettings.ts');
        const engine = window.__husky.engine; engine.stop(); audioManager.setMusic(false); audioManager.setSFX(false);
        const passed = [], check = (ok, label) => { if (!ok) throw Error(label); passed.push(label); };
        const w = new World(1100, 720, { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() {}, onGameOver() {}, onGameWon() {} });
        w.loadLevel(1, false); w.loadLevel(HOME_LEVEL); check(!w.isHome, 'House requires story completion');
        w.loadLevel(14); w.triggerLevelComplete(); w.loadLevel(HOME_LEVEL);
        check(w.props.filter(p => p instanceof HomeDog).map(p => p.quest.dog).join(',') === 'Opal,Ruby,Samwise', 'Only the real family dogs occupy the entry hall');
        check(QUESTS.every(q => COMPANIONS.some(d => d.dog === q.dog)), 'All quests belong to the family; generic dogs are gone');
        const speak = dogName => {
            const dog = COMPANIONS.find(d => d.dog === dogName); w.changeHomeFloor(dogRoom(dog.id, w.belongings.quests));
            const actor = w.props.find(p => p instanceof HomeDog && p.quest.id === dog.id);
            w.player.x = actor.x; w.player.y = w.height - 140; w.update();
            check(w.openHomePanel(dog.id), `Talk to ${dog.dog} in ${w.homeFloor}`);
        };
        speak('Samwise'); check(!w.respondToDog('peace'), 'Cannot start quests before the chase introduction'); w.closeHomePanel();
        w.belongings.houseIntroSeen = true; w.belongings.quests.peace = 'accepted';
        speak('Opal'); check(!w.respondToDog('lammy') && !w.belongings.quests.lammy, 'First quest gates every later dog request'); w.closeHomePanel();
        w.belongings.quests.lammy = 'accepted'; w.loadLevel(5); check(!w.props.some(p => p instanceof QuestPickup), 'A locked prerequisite also blocks a stale accepted pickup'); delete w.belongings.quests.lammy; w.loadLevel(HOME_LEVEL);
        let rewards = 0;
        for (const q of QUESTS) {
            check(questAvailable(q, w.belongings.quests), `${q.item} unlocks after its prerequisites`);
            speak(q.dog);
            if (q.id !== 'peace') check(w.respondToDog(q.id), `Accept ${q.item}`);
            const beforePause = JSON.stringify([w.player.x, w.player.y, w.homeFrame]);
            for (let f = 0; f < 60; f++) w.update();
            check(JSON.stringify([w.player.x, w.player.y, w.homeFrame]) === beforePause, 'Conversation pauses the room and its animations');
            if (q.room === w.homeFloor) check(w.props.some(p => p instanceof QuestPickup && p.quest.id === q.id), `${q.item} appears immediately when accepted in its own room`);
            check(!w.respondToDog(q.id), 'Duplicate acceptance has no effect'); w.closeHomePanel();
            for (const difficulty of ['EASY', 'HARD', 'HARDCORE']) for (const height of [480, 800]) {
                w.height = height; w.belongings.quests[q.id] = 'accepted';
                if (q.room) w.homeFloor = q.room;
                w.loadLevel(q.level, true, difficulty);
                const item = w.props.find(p => p instanceof QuestPickup && p.quest.id === q.id);
                check(!!item, `${q.item} spawns in ${difficulty}, height ${height}`);
                const support = w.platforms.find(p => item.x >= p.x && item.x + item.w <= p.x + p.w && Math.abs(p.y - item.y - 32) < 2);
                check(!!support, `${q.item} has a reachable supporting platform`);
                w.player.x = item.x - 50; w.player.y = support.y - 40;
                inputManager.keys.ArrowRight = true;
                for (let f = 0; f < 30 && w.belongings.quests[q.id] === 'accepted'; f++) w.update();
                inputManager.clear();
                check(w.belongings.quests[q.id] === (q.room ? 'found' : 'carrying'), `${q.item} is collected through movement with hazards intact`);
                if (!q.room) {
                    if (q.id === 'lammy' && difficulty === 'EASY' && height === 480) {
                        w.loadLevel(HOME_LEVEL); speak(q.dog);
                        check(w.belongings.quests[q.id] === 'accepted' && !w.respondToDog(q.id), 'Returning early loses the unbanked item and cannot earn a reward');
                        w.closeHomePanel(); w.loadLevel(q.level);
                        check(w.props.some(p => p instanceof QuestPickup && p.quest.id === q.id), 'An abandoned item respawns on the next visit');
                        w.player.x=q.x; w.player.y=height-q.rise; w.update();
                        check(w.belongings.quests[q.id] === 'carrying', 'The item can be collected again');
                        w.triggerGameOver('fall', 'Quest test'); w.triggerLevelComplete();
                        check(w.belongings.quests[q.id] === 'carrying', 'A failed run cannot bank its quest item');
                        w.loadLevel(q.level);
                        check(w.belongings.quests[q.id] === 'accepted', 'Retrying after death requires collecting again');
                        w.player.x=q.x; w.player.y=height-q.rise; w.update();
                    }
                    w.triggerLevelComplete();
                    check(w.belongings.quests[q.id] === 'found', `${q.item} is banked only when its level is completed`);
                }
            }
            w.loadLevel(q.level); check(!w.props.some(p => p instanceof QuestPickup && p.quest.id === q.id), 'Found items cannot respawn on retry');
            w.homeFloor = 'ground'; w.loadLevel(HOME_LEVEL); speak(q.dog);
            const before = w.player.bonesCollected;
            check(w.respondToDog(q.id) && w.belongings.quests[q.id] === 'complete' && w.player.bonesCollected === before + q.reward, `Return ${q.item} for exactly ${q.reward} bones`);
            rewards += q.reward; check(!w.respondToDog(q.id), 'Reward cannot be claimed twice');
            if (q.id === 'peace') {
                check(houseChapter(w.belongings.quests) === 1 && ['lammy', 'cushion', 'lunch'].every(id => questAvailable(QUESTS.find(q => q.id === id), w.belongings.quests)), 'Peace sends dogs to their rooms and unlocks all three first adventures');
                check(w.props.filter(p => p instanceof HomeDog).length === 0, 'Dogs leave the entry hall immediately after the biscuits');
            }
            if (q.id === 'cushion') check(!questAvailable(QUESTS.find(q => q.id === 'ribbon'), w.belongings.quests), 'Chapter three waits for every chapter-two quest');
            if (q.id === 'lunch') check(houseChapter(w.belongings.quests) === 2 && dogRoom('opal', w.belongings.quests) === 'sunroom' && dogRoom('ruby', w.belongings.quests) === 'attic', 'All three returns unlock the goose, attic and baking adventures');
        }
        check(houseChapter(w.belongings.quests) === 3 && COMPANIONS.every(d => dogRoom(d.id, w.belongings.quests) === 'kitchen'), 'Final returns bring everybody to the kitchen celebration');
        check(w.player.bonesCollected >= rewards, 'All seven rewards survive room and level travel');
        w.changeHomeFloor('kitchen'); check(w.props.filter(p => p instanceof HomeDog).length === 3, 'Kitchen party contains all three dogs');
        const time = w.timeLeft; for (let i = 0; i < 130; i++) w.update(); check(w.timeLeft === time, 'House has no countdown');
        w.belongings.slots[0] = 'hush'; check(!w.useInventorySlot(0), 'House never wastes trail treats');
        w.practice = true; w.belongings.quests.recipe = 'accepted'; w.loadLevel(12); check(!w.props.some(p => p instanceof QuestPickup), 'Practice cannot collect real quest items'); w.practice = false; w.belongings.quests.recipe = 'complete';
        const canvas = document.createElement('canvas'), renderer = new Renderer(canvas); renderer.resize(1100, 800);
        for (const room of Object.keys(FLOORS)) for (const mode of ['classic', 'enhanced']) {
            w.homeFloor = room; w.loadLevel(HOME_LEVEL); gfxSettings.setVisualMode(mode);
            const before = JSON.stringify([w.belongings, w.props, w.player, w.homeFrame]); renderer.drawGame(w);
            check(JSON.stringify([w.belongings, w.props, w.player, w.homeFrame]) === before, `${mode} ${room} artwork does not mutate the story`);
            const ctx=canvas.getContext('2d'), labels=[], fillText=ctx.fillText;
            ctx.fillText=function(text,...args){labels.push(text);return fillText.call(this,text,...args);};
            renderer.drawGame(w); ctx.fillText=fillText;
            check(!labels.some(text => /E ·|Change floor|Opal|Ruby|Samwise|sunbeam|One uninvited|ALL LEVELS|SHOP/.test(text)), `${room} has no floating instructions or name labels in ${mode}`);
            w.player.x=1110; w.player.y=w.height-140; w.update();
            check(w.homeInteraction?.id==='floors', `${room} reveals a stair interaction only when close`);
            check(w.interactHome() && w.homePanel==='floors', 'Touch and keyboard share the same stair action'); w.closeHomePanel();

        }
        w.resize(390, 480); w.update(); check(w.player.y + 40 === 380, 'Home remains grounded after a mobile resize');
        w.loadLevel(1, false); check(!w.belongings.houseIntroSeen && !w.belongings.homeUnlocked && Object.keys(w.belongings.quests).length === 0, 'New journey resets intro and chapter progression');
        engine.startGame(); engine.stop(); engine.world.belongings.homeUnlocked = true; engine.goHome(); engine.stop();
        check(engine.gameState === 'CUTSCENE' && engine.cutsceneManager.currentType === 'house_chase', 'First home entry starts the chase cutscene');
        engine.skipCutscene(); engine.stop(); check(engine.gameState === 'PLAYING' && engine.world.belongings.quests.peace === 'accepted', 'Skipping the chase unlocks exactly the starter quest');
        engine.goHome(); engine.stop(); check(engine.gameState === 'PLAYING', 'The chase does not repeat during this journey');
        engine.startGame(); engine.stop(); engine.world.belongings.homeUnlocked = true; engine.goHome(); engine.stop(); engine.cutsceneManager.setPaused(true);
        engine.cutsceneManager.step = engine.cutsceneManager.getLines('house_chase').length; engine.cutsceneManager.nextLine(); engine.stop();
        check(engine.gameState === 'PLAYING' && engine.world.belongings.houseIntroSeen && engine.world.belongings.quests.peace === 'accepted', 'Natural chase completion unlocks the same quest');
        return passed;
    });
    // Play the whole first house quest using the real UI and real pickup collision.
    await page.getByRole('button', {name:'Quest journal', exact:true}).click();
    await page.getByRole('button', {name:'Rooms', exact:true}).click();
    await page.getByRole('button', {name:'Ground floor · Kitchen', exact:true}).click();
    await page.evaluate(() => { const e = window.__husky.engine; e.stop(); const w=e.world; w.player.x=810; w.player.y=w.height-140; window.__husky.inputManager.keys.ArrowRight=true; for(let i=0;i<25;i++) w.update(); window.__husky.inputManager.clear(); });
    assert.equal(await page.evaluate(()=>window.__husky.engine.world.belongings.quests.peace),'found');
    await page.getByRole('button', {name:'Quest journal', exact:true}).click();
    await page.getByRole('button', {name:'Rooms', exact:true}).click();
    await page.getByRole('button', {name:'Ground floor · Entry & shop', exact:true}).click();
    await page.evaluate(()=>{const e=window.__husky.engine;e.stop();e.world.player.x=880;e.world.player.y=e.world.height-140;e.world.update();});
    await page.getByRole('button',{name:'Talk to Samwise',exact:true}).click();
    await page.getByRole('button',{name:'Give distraction biscuits · receive 12 bones'}).click();
    await page.getByRole('button',{name:'Quest journal',exact:true}).click();
    assert.equal(await page.locator('.home-journal').getByText('Opal · Lammy the lamb',{exact:false}).count(),1);
    assert.equal(await page.locator('.home-journal').getByText('turquoise ribbon',{exact:false}).count(),0);
    await page.getByText('Find a friend', {exact:true}).click();
    await page.getByRole('button',{name:'Ruby · Second floor · Bedroom',exact:true}).click();
    await page.evaluate(()=>{const e=window.__husky.engine;e.stop();e.world.player.x=750;e.world.player.y=e.world.height-140;e.world.update();e.world.cameraX=200;e.renderer.drawGame(e.world);});
    await page.screenshot({path:'.playwright-mcp/living-bedroom.png'});
    await page.getByRole('button',{name:'Talk to Ruby',exact:true}).click();
    await page.getByRole('button',{name:'I’ll find it!'}).click();
    assert.equal(await page.evaluate(()=>window.__husky.engine.world.belongings.quests.cushion),'accepted');
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.locator('.home-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
    await page.screenshot({path:'.playwright-mcp/living-mobile-dialog.png'});
    await page.keyboard.press('Escape'); await page.setViewportSize({width:1100,height:720});
    await page.waitForFunction(()=>window.__husky.engine.world.width===1100);
    // Closed journals stay out of the walking lane; the same button works on the trail.
    await page.evaluate(()=>{const e=window.__husky.engine;e.stop();const w=e.world;w.changeHomeFloor('ground');w.player.x=400;w.player.y=w.height-140;w.update();});
    await page.locator('.home-interaction').waitFor({state:'hidden'});
    assert.equal(await page.getByRole('dialog').count(),0);
    assert.equal(await page.locator('.home-controls p').count(),0);
    await page.getByRole('button',{name:'Quest journal',exact:true}).click();
    assert.equal(await page.locator('.completed-quests').getAttribute('open'),null);
    await page.locator('.completed-quests summary').click();
    assert.equal(await page.locator('.completed-quests').getByText('Samwise · distraction biscuits',{exact:false}).count(),1);
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{const e=window.__husky.engine;e.revisitLevel(4);e.stop();});
    assert.equal(await page.getByRole('dialog').count(),0);
    assert.equal(await page.locator('.home-controls').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>innerWidth*.7&&r.bottom<250;}),true);
    assert.equal(await page.locator('.home-controls').innerText(),'1');
    const trailBefore=await page.evaluate(()=>{const w=window.__husky.engine.world;return [w.player.x,w.player.y,w.timeLeft,w.frameCounter];});
    await page.getByRole('button',{name:'Quest journal',exact:true}).click();
    await page.evaluate(()=>{const w=window.__husky.engine.world;for(let i=0;i<120;i++)w.update();});
    assert.deepEqual(await page.evaluate(()=>{const w=window.__husky.engine.world;return [w.player.x,w.player.y,w.timeLeft,w.frameCounter];}),trailBefore);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.locator('.journal-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
    await page.screenshot({path:'.playwright-mcp/quiet-journal-mobile.png'});
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(),0);
    assert.equal(await page.locator('.home-controls').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>innerWidth*.7&&r.bottom<250;}),true);
    await page.screenshot({path:'.playwright-mcp/quiet-trail-mobile.png'});
    await page.setViewportSize({width:1100,height:720});
    await page.waitForFunction(()=>window.__husky.engine.world.width===1100);
    await page.evaluate(()=>{const e=window.__husky.engine;e.renderer.drawGame(e.world);});
    await page.screenshot({path:'.playwright-mcp/quiet-trail.png'});
    await page.getByRole('button',{name:'Return home',exact:true}).click();
    await page.evaluate(()=>{const e=window.__husky.engine;e.stop();const w=e.world;w.changeHomeFloor('kitchen');w.player.x=722;w.player.y=w.height-140;w.update();});
    await page.getByRole('button',{name:'Talk to the little boy',exact:true}).click();
    assert.equal(await page.getByRole('heading',{name:'The little boy',exact:true}).count(),1);
    assert.match(await page.locator('.boy-conversation').innerText(),/Rocket League/);
    assert.match(await page.locator('.boy-conversation').innerText(),/demo/i);
    await page.screenshot({path:'.playwright-mcp/quiet-boy-dialog.png'});
    await page.keyboard.press('Escape');
    // Capture every furnished room at the story stage where its resident is active.
    for(const room of ['ground','kitchen','upstairs','bedroom','sunroom','attic','basement']) {
        await page.evaluate(room=>{const e=window.__husky.engine;const w=e.world;w.belongings.quests={peace:'complete'}; if(['sunroom','attic'].includes(room)) Object.assign(w.belongings.quests,{lammy:'complete',cushion:'complete',lunch:'complete'}); if(room==='bedroom') Object.assign(w.belongings.quests,{cushion:'complete',sun:'complete'}); if(room==='upstairs') w.belongings.quests.lammy='complete'; w.changeHomeFloor(room); e.stop();w.cameraX=200;w.homeFrame=300;e.renderer.drawGame(w);},room);
        await page.screenshot({path:`.playwright-mcp/living-${room}.png`});
    }
    await page.evaluate(()=>{const e=window.__husky.engine;e.currentCutscene='house_chase';e.gameState='CUTSCENE';e.cutsceneManager.start('house_chase');e.cutsceneManager.setPaused(true);e.cutsceneManager.frame=45;e.renderer.drawCutscene(e.cutsceneManager,1100,720);});
    await page.screenshot({path:'.playwright-mcp/living-chase.png'});
    await page.evaluate(()=>window.__husky.engine.skipCutscene());
    assert.deepEqual(errors,[]); console.log(checks.join('\n')); console.log(`PASS: ${checks.length} staged-house checks plus Free Roam home warp, proximity interactions, collapsed desktop/mobile journals, trail pause, boy dialogue and quest UI.`);
} finally {await browser?.close();server.kill('SIGTERM');}
