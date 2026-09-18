import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
    await page.waitForFunction(() => window.__husky);
    const result = await page.evaluate(async () => {
        const { World } = await import('/game/engine/World.ts');
        const { HomePerson, HomeDog, FAMILY, QUESTS, dogRoom } = await import('/game/Home.ts');
        const { packBelongings, unpackBelongings, parseSave } = await import('/game/SaveGame.ts');
        const { audioManager } = await import('/game/Audio.ts');
        const { shopStock } = await import('/game/Shop.ts');
        const { Player } = await import('/game/entities/Player.ts');
        const { inputManager } = await import('/game/Input.ts');
        const e = window.__husky.engine; e.stop(); audioManager.setMusic(false); audioManager.setSFX(false);
        const check = (ok, label) => { if (!ok) throw Error(label); };
        const w = new World(1200, 800, { onScoreUpdate() {}, onTimeUpdate() {}, onLevelComplete() {}, onGameOver() {}, onGameWon() {} });
        w.loadLevel(1, false); w.belongings.homeUnlocked = w.belongings.houseIntroSeen = true;
        w.belongings.quests.peace = 'complete'; w.loadLevel(15);
        const visit = id => { const p = FAMILY.find(p => p.id === id); w.changeHomeFloor(p.room); w.player.x = p.x; w.update(); check(w.homeInteraction?.id === id && w.interactHome(), `${id} nearby interaction`); };
        check(!w.receiveFamilyGift(), 'No gift without a family conversation');
        for (const person of FAMILY) { visit(person.id); check(w.homePanel === person.id, `${person.id} opens`); w.closeHomePanel(); }
        visit('maria');
        const bones = w.player.bonesCollected;
        check(w.receiveFamilyGift() && w.belongings.owned.has('book') && w.player.accessories.has('book'), 'Maria unlocks and equips book');
        check(!w.receiveFamilyGift() && w.player.bonesCollected === bones, 'One book gift with no currency changes');
        check(w.familyActivity() && !w.player.accessories.has('book'), 'Put book away');
        check(w.familyActivity() && w.player.accessories.has('book'), 'Wear book again');
        w.closeHomePanel(); visit('belle');
        w.belongings.slots = ['time', 'shield', 'magnet'];
        check(!w.receiveFamilyGift() && !w.belongings.familyGifts.includes('belle'), 'Full pockets preserve unclaimed gift');
        w.belongings.slots[1] = null;
        check(w.receiveFamilyGift() && w.belongings.slots[1] === 'spin' && !w.receiveFamilyGift(), 'One spin treat in first empty slot');
        w.closeHomePanel(); check(!w.useInventorySlot(0), 'Other trail treats cannot be wasted at home');
        inputManager.setKey('Digit2', true); w.update(); inputManager.clear();
        check(w.belongings.slots[1] === null && w.player.spinTimer === 359 && w.player.magnetTimer === 359, 'Keyboard spins at home');
        w.belongings.slots[1] = 'spin'; check(!w.useInventorySlot(1), 'No duplicate active treat consumption');
        const before = w.player.x; for (let i=0;i<360;i++) w.update();
        check(w.player.spinTimer === 0 && w.player.x === before, 'Spin expires without moving the hitbox');
        visit('belle'); check(w.familyActivity() && !w.homePanel && w.player.spinTimer === 360 && w.player.magnetTimer === 0, 'Free home dance is purely for fun');
        w.loadLevel(1); check(w.useInventorySlot(1), 'Spin treat works on the trail');
        const bone = w.collectibles.find(b => !b.markedForDeletion); w.player.x = bone.x - 100; w.player.y = bone.y; const bx=bone.x;
        w.update(); check(bone.x < bx, 'Spin treat attracts bones');
        const data = { version:1, name:'Family', updatedAt:Date.now(), difficulty:'EASY', level:15, homeFloor:'bedroom', bones:7, belongings:packBelongings(w.belongings), state:'PLAYING', cutscene:'intro' };
        const restored = unpackBelongings(parseSave(JSON.stringify(data)).belongings);
        check(restored.owned.has('book') && restored.familyGifts.join() === 'maria,belle', 'Gifts and wardrobe survive serialization');
        delete data.belongings.familyGifts;
        check(unpackBelongings(parseSave(JSON.stringify(data)).belongings).familyGifts.length === 0, 'Older saves remain readable');
        data.belongings.familyGifts=['unknown']; let invalid=false; try {parseSave(JSON.stringify(data));} catch {invalid=true;} check(invalid,'Invalid gift identities rejected');
        w.belongings.quests = Object.fromEntries(QUESTS.map(q => [q.id, q.id === 'ribbon' ? 'found' : q.id === 'sun' || q.id === 'recipe' ? 'accepted' : 'complete']));
        w.homeFloor='sunroom'; w.loadLevel(15); const opal = w.props.find(p => p instanceof HomeDog); w.player.x=opal.x; w.update(); w.openHomePanel('opal');
        check(w.respondToDog('ribbon') && w.belongings.owned.has('goose'), 'Ribbon quest awards goose skin');
        w.belongings.owned.delete('goose'); w.loadLevel(15); check(w.belongings.owned.has('goose'), 'Completed older ribbon quest also gets skin');
        check(shopStock(3,w.belongings).includes('goose'), 'Forest goose purchase retained');
        w.belongings.quests.sun=w.belongings.quests.recipe='complete';
        check(dogRoom('ruby',w.belongings.quests)==='bedroom','Ruby returns to Maria after the quests');
        w.changeHomeFloor('bedroom'); check(w.props.some(p=>p instanceof HomeDog && p.activity==='curl') && w.props.some(p=>p instanceof HomePerson && p.person.id==='maria'),'Maria and curled Ruby share nook');
        w.resize(390,480); w.player.x=720; w.update(); check(w.homeInteraction?.id==='maria','Family prompt survives resize');
        const oldX=w.player.x; w.player.x=70; w.update(); check(!w.openHomePanel('maria'), 'Conversation requires proximity'); w.player.x=oldX;
        w.loadLevel(1,false); check(w.belongings.familyGifts.length===0 && !w.belongings.owned.has('book'),'New journey resets family gifts');
        const { gfxSettings } = await import('/game/GfxSettings.ts');
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 160;
        const ctx = canvas.getContext('2d'), player = new Player(60,60);
        for (const mode of ['classic','enhanced']) for (const skin of ['husky','cat','fox','goose']) {
            gfxSettings.setVisualMode(mode); player.accessories = new Set(skin === 'husky' ? [] : [skin]);
            ctx.clearRect(0,0,160,160); player.draw(ctx,0,15); const plain = canvas.toDataURL();
            player.accessories.add('book'); ctx.clearRect(0,0,160,160); player.draw(ctx,0,15);
            check(plain !== canvas.toDataURL(), `Book visible with ${skin} in ${mode}`);
            player.spinTimer=340; player.hasUmbrella=true;
            for (const level of [6,8,9]) player.draw(ctx,0,level);
            player.spinTimer=0; player.hasUmbrella=false;
        }
        gfxSettings.setVisualMode('enhanced');
        return 'Family proximity, gifts, full pockets, spin keyboard/effects, wardrobe, old/new save parsing, goose quest reward, migration, and Ruby’s nook passed.';
    });
    console.log(result);
    // Use the real UI and saved journey for a gift -> reload -> no duplicate flow.
    await page.evaluate(() => { const e=window.__husky.engine; e.openSave(0,'Readers','EASY'); e.skipCutscene(); e.stop(); const w=e.world;w.belongings.homeUnlocked=w.belongings.houseIntroSeen=true;w.belongings.quests.peace='complete';w.homeFloor='bedroom';e.startLevel(15);e.stop();w.player.x=720;w.update();w.interactHome(); });
    await page.getByRole('heading',{name:'Maria',exact:true}).waitFor();
    await page.getByRole('button',{name:'Read together · unlock little storybook'}).click();
    assert.equal(await page.getByRole('button',{name:'Put my book away'}).count(),1);
    await page.evaluate(()=>window.__husky.engine.saveProgress());
    await page.reload(); await page.waitForFunction(()=>window.__husky);
    await page.getByRole('button',{name:'Continue Readers'}).click();
    await page.evaluate(()=>{const e=window.__husky.engine;e.stop();const w=e.world;w.player.x=720;w.update();w.interactHome();});
    assert.equal(await page.getByRole('button',{name:'Read together · unlock little storybook'}).count(),0);
    await page.getByRole('button',{name:'Keep chatting'}).click();
    assert(await page.getByText('A good reading nook needs three things:',{exact:false}).count());
    await page.screenshot({path:'/tmp/husky-family-maria-dialog.png'});
    for (const mode of ['enhanced','classic']) {
        for (const room of ['bedroom','attic','sunroom','ground']) {
            await page.evaluate(({room,mode})=>{const e=window.__husky.engine;e.stop();const w=e.world;w.closeHomePanel();w.changeHomeFloor(room);w.player.x=400;w.player.y=w.height-140;w.homeFrame=150;w.props.forEach(p=>{if('animTime' in p)p.animTime=2.5;});window.__husky.gfxSettings.setVisualMode(mode);e.renderer.drawGame(w);},{room,mode});
            await page.locator('canvas[tabindex]').screenshot({path:`/tmp/husky-family-${room}-${mode}.png`});
        }
    }
    await page.setViewportSize({width:390,height:750});
    await page.evaluate(()=>{const e=window.__husky.engine;e.stop();const w=e.world;w.changeHomeFloor('attic');w.player.x=605;w.update();w.interactHome();});
    await page.getByRole('button',{name:'Take a spin treat'}).click();
    await page.screenshot({path:'/tmp/husky-family-mobile.png'});
    assert(await page.locator('.home-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth));
    await page.getByRole('button',{name:'Let’s spin together!'}).click();
    assert.equal(await page.getByRole('dialog').count(),0);
    assert.deepEqual(errors,[]);
    console.log('PASS: real saved journey reload, family dialogue, mobile controls, and Classic/Enhanced rooms.');
} finally { await browser.close(); await server.close(); }
