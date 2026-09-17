import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { preview } from 'vite';

const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
    const base = `http://127.0.0.1:${server.httpServer.address().port}`;
    const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__husky);
    assert.equal(await page.getByRole('button', { name: 'Dev Mode', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Print & draw levels' }).click();
    const before = await page.evaluate(() => ({ state: window.__husky.engine.gameState, storage: JSON.stringify(localStorage) }));
    const studio = page.frameLocator('iframe[title="Drawing studio"]');
    await studio.getByRole('heading', { name: 'Print, draw, imagine' }).waitFor();
    assert.equal(await studio.getByLabel('Level', { exact: true }).inputValue(), '1');
    await studio.getByLabel('Level', { exact: true }).selectOption('14');
    await studio.getByLabel('Difficulty', { exact: true }).selectOption('HARD');
    await studio.getByLabel('Artwork').selectOption('classic');
    await studio.getByRole('button', { name: 'Make print preview' }).click();
    const print = studio.frameLocator('iframe[title="Printable pages"]');
    await print.locator('.page').first().waitFor();
    assert.equal(await print.locator('.page').count(), 6);
    await print.getByLabel('Overview', { exact: true }).uncheck();
    assert.equal(await print.locator('.page:not(.omit)').count(), 5);
    const printFrame = page.frames().find(f => f.url() === 'about:srcdoc');
    await printFrame.evaluate(() => { window.print = () => { window.printRequested = true; }; });
    await print.getByRole('button', { name: 'Print drawing pack' }).click();
    assert(await printFrame.evaluate(() => window.printRequested));
    assert.deepEqual(await page.evaluate(() => ({ state: window.__husky.engine.gameState, storage: JSON.stringify(localStorage) })), before);
    await page.screenshot({ path: '/tmp/husky-print-studio.png' });
    await page.getByRole('button', { name: 'Back to main menu' }).click();
    assert.equal(await page.getByRole('button', { name: 'Free Roam', exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => window.__husky.engine.gameState), 'INTRO');
    // Closing print must not resume a story abandoned at the title screen.
    await page.evaluate(() => { const e = window.__husky.engine; e.startFreeRoam(); e.startChaseCutscene(); e.returnToTitle(); });
    await page.getByRole('button', { name: 'Print & draw levels' }).click();
    await page.getByRole('button', { name: 'Back to main menu' }).click();
    await page.waitForTimeout(3200);
    assert.equal(await page.evaluate(() => window.__husky.engine.gameState), 'INTRO');
    // Direct print entry mounts no live game and handles every existing story.
    await page.goto(`${base}/?print=1&level=11&difficulty=HARD&graphics=enhanced`);
    assert.equal(await page.evaluate(() => !!window.__husky), false);
    await page.getByLabel('What to print').selectOption('story');
    for (const graphics of ['classic', 'enhanced']) {
        await page.getByLabel('Artwork').selectOption(graphics);
        for (const story of ['intro','pound_escape','chase','underwater_intro','pier_intro','neon_intro','bakery_intro','town_intro','raccoon_intro']) {
            await page.getByLabel('Story', { exact: true }).selectOption(story);
            await page.getByLabel('Paper', { exact: true }).selectOption(graphics === 'classic' ? 'letter' : 'a4');
            await page.getByRole('button', { name: 'Make print preview' }).click();
            const pages = page.frameLocator('iframe[title="Printable pages"]');
            await pages.locator('.page').first().waitFor();
            assert.equal(await pages.locator('.page').count(), story === 'raccoon_intro' ? 3 : story === 'town_intro' ? 4 : 5);
            assert(await pages.locator('.page').evaluateAll(ps => ps.every(p => p.scrollHeight <= p.clientHeight && p.querySelector('img').naturalWidth > 0 && p.querySelector('footer').getBoundingClientRect().bottom <= p.getBoundingClientRect().bottom)));
        }
    }
    await page.frameLocator('iframe[title="Printable pages"]').locator('.page').nth(1).screenshot({ path: '/tmp/husky-print-raccoon.png' });
    await page.getByLabel('What to print').selectOption('level');
    await page.getByRole('button', { name: 'Make print preview' }).click();
    await page.frameLocator('iframe[title="Printable pages"]').getByText('R2-C1', { exact: true }).first().waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: '/tmp/husky-print-mobile.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: production print entry, title-screen access, isolated preferences, level pages and selection, print action, main-menu return, 18 storyboard variants, paper fit, tall maps, and mobile layout.');
} finally { await browser.close(); await new Promise(resolve => server.httpServer.close(resolve)); }
