import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { exportLevels, optionsFrom, slicesFor, ROOT } from './export-levels.mjs';

const digest = data => createHash('sha256').update(data).digest('hex');
const folder = await mkdtemp(path.join(tmpdir(), 'husky-export-check-'));
let browser;
try {
    for (const args of [['--level', '0'], ['--level', '16'], ['--scale', '4'], ['--overlap', '400', '--slice-width', '320'], ['--region', '1,2,-3,4'], ['--out', path.join(ROOT, 'public/captures')], ['--out', path.join(ROOT, 'dist')]]) assert.throws(() => optionsFrom(args));
    assert.equal(optionsFrom(['--help']), null);
    assert.equal(optionsFrom(['--level', 'all']).levels.length, 14);
    assert.equal(optionsFrom([]).sliceHeight, 800);
    assert.equal(optionsFrom(['--height', '600']).sliceHeight, 600);
    const tiles = slicesFor({ x: 100, y: -800, width: 5034, height: 1600 }, 1280, 800, 80);
    for (const axis of ['x', 'y']) {
        const starts = [...new Set(tiles.map(t => t[axis]))], span = axis === 'x' ? 1280 : 800;
        assert.equal(starts[0], axis === 'x' ? 100 : -800);
        assert.equal(starts.at(-1) + span, axis === 'x' ? 5134 : 800);
        for (let i = 1; i < starts.length; i++) assert(starts[i] > starts[i - 1] && starts[i] - starts[i - 1] <= span - 80);
    }
    assert.equal(slicesFor({ x: 0, y: 0, width: 5034, height: 800 }, 1280, 800, 80).length, 5);
    const pack = await exportLevels(optionsFrom(['--level', 'all', '--difficulty', 'both', '--graphics', 'both', '--scale', '1', '--out', folder]));
    assert.equal(pack.results.length, 56);
    const pngSize = async filename => { const data = await readFile(filename); assert.equal(data.subarray(1, 4).toString(), 'PNG'); return [data.readUInt32BE(16), data.readUInt32BE(20)]; };
    for (const result of pack.results) {
        assert.deepEqual(await pngSize(path.join(result.folder, 'full-color.png')), [result.bounds.width, result.bounds.height]);
        assert.equal((await readFile(path.join(result.folder, 'print.pdf'))).subarray(0, 5).toString(), '%PDF-');
        assert(result.entities.some(e => e.type === 'Player') && result.exit);
        assert.equal(result.slices[0].y, result.bounds.y);
        if (result.level === 11) { assert(result.bounds.y < -500); assert(result.slices.some(s => s.row > 1)); }
        for (const s of result.slices) assert.deepEqual(await pngSize(path.join(result.folder, `slices/${s.id}-worksheet.png`)), [s.width, s.height]);
    }
    const easy = pack.results.find(r => r.level === 14 && r.difficulty === 'EASY' && r.graphics === 'enhanced');
    const hard = pack.results.find(r => r.level === 14 && r.difficulty === 'HARD' && r.graphics === 'enhanced');
    assert.notDeepEqual(easy.entities, hard.entities);
    assert.notEqual(digest(await readFile(path.join(easy.folder, 'full-color.png'))), digest(await readFile(path.join(hard.folder, 'full-color.png'))));
    const crop = await exportLevels(optionsFrom(['--level', '14', '--difficulty', 'hard', '--region', '3100,350,1800,450', '--scale', '1', '--paper', 'a4', '--out', folder]));
    assert.deepEqual(await pngSize(path.join(crop.results[0].folder, 'full-color.png')), [1800, 450]);
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage();
    // A crop is byte-for-byte the same pixels as the corresponding full-map region.
    const fullData = (await readFile(path.join(hard.folder, 'full-color.png'))).toString('base64');
    const croppedData = (await readFile(path.join(crop.results[0].folder, 'full-color.png'))).toString('base64');
    const match = await page.evaluate(async ({ fullData, croppedData }) => {
        const load = async data => { const i = new Image(); i.src = `data:image/png;base64,${data}`; await i.decode(); return i; };
        const full = await load(fullData), crop = await load(croppedData);
        const c = document.createElement('canvas'); c.width = 1800; c.height = 450; const ctx = c.getContext('2d');
        ctx.drawImage(full, 3100, 350, 1800, 450, 0, 0, 1800, 450); const a = ctx.getImageData(0, 0, 1800, 450).data;
        ctx.clearRect(0, 0, 1800, 450); ctx.drawImage(crop, 0, 0); const b = ctx.getImageData(0, 0, 1800, 450).data;
        return a.every((v, i) => v === b[i]);
    }, { fullData, croppedData });
    assert(match, 'Separate region exports must match full-map pixels at the same seed');
    for (const result of [easy, crop.results[0]]) {
        await page.setContent(await readFile(path.join(result.folder, 'print.html'), 'utf8'));
        await page.emulateMedia({ media: 'print' });
        assert.equal(await page.locator('.page').count(), result.pages);
        assert(await page.locator('.page').evaluateAll(pages => pages.every(p => p.scrollHeight <= p.clientHeight && p.querySelector('footer').getBoundingClientRect().bottom <= p.getBoundingClientRect().bottom)));
    }
    await assert.rejects(exportLevels(optionsFrom(['--level', '14', '--region', '99999,0,100,100', '--scale', '1', '--out', folder])), /outside level/);
    const home = await exportLevels(optionsFrom(['--level', '15', '--floor', 'upstairs', '--scale', '1', '--out', folder]));
    assert.equal(home.results[0].entities.filter(e => e.type === 'HomeDog').length, 3); assert.equal(home.results[0].exit, null);
    const cells = Array(320).fill('.'); for (let i = 288; i < 320; i++) cells[i] = '#'; cells[257] = 'S'; cells[286] = 'E';
    const draftPath = path.join(folder, 'custom.json'); await writeFile(draftPath, JSON.stringify({ version: 1, name: 'A custom print course', cells }));
    const custom = await exportLevels(optionsFrom(['--level', '16', '--draft', draftPath, '--scale', '1', '--out', folder]));
    assert.equal(custom.results[0].name, 'A custom print course'); assert(custom.results[0].exit);
    const buildDir = path.join(folder, 'build');
    execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', buildDir], { cwd: ROOT, stdio: 'pipe' });
    for (const name of await readdir(path.join(buildDir, 'assets'))) if (name.endsWith('.js')) {
        assert(!/levelExport|__local-level-export|slicesFor/.test(await readFile(path.join(buildDir, 'assets', name), 'utf8')), 'Local export code must not appear in the production JavaScript');
    }
    assert(!(await readdir(buildDir)).some(name => ['scripts', 'output', 'docs'].includes(name)), 'Tooling and print packs must stay outside deployable output');
    console.log('PASS: option validation, complete overlapping coverage, all 56 level/difficulty/graphics variants, vertical levels, cropped-region pixel equality, letter/A4 print layout, house/custom levels, production exclusion, and failure cleanup.');
} finally { await browser?.close(); await rm(folder, { recursive: true, force: true }); }
