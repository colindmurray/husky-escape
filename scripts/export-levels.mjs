import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import { chromium } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
import { NAMES, slicesFor, printBooklet } from '../game/printing/booklet.mjs';
export { slicesFor, printBooklet };
const HELP = `Local batch level exporter - generated files stay on this computer.

npm run export:levels -- --level 14 --difficulty both

Options:
  --level 14              One level, comma-separated levels, or all (1-14)
  --difficulty easy       easy, hard, hardcore, or both (easy + hard)
  --graphics enhanced     classic, enhanced, or both
  --height 800            Reference game viewport height (480-1200)
  --scale 2               PNG pixels per game pixel (1 or 2)
  --slice-width 1280      Slice width in game pixels
  --slice-height 800      Slice height (defaults to the reference height)
  --overlap 80            Minimum shared pixels between neighboring sheets
  --region x,y,w,h        Export a rectangle within the level bounds
  --paper letter         letter or a4, landscape
  --floor ground         ground, basement, or upstairs (level 15)
  --quests               Show optional fetch-quest items
  --draft file.json      Saved custom layout, required for level 16
  --seed 13              Reproducible visual seed
  --out output/level-exports   Parent folder for a new dated export pack
  --help

Each pack contains full-color and pale worksheet PNGs, matching slices,
a printable PDF/HTML booklet, and a coordinate/revision manifest.
`;

export function optionsFrom(argv) {
    const { values: v } = parseArgs({ args: argv, options: Object.fromEntries([
        ...['level', 'difficulty', 'graphics', 'height', 'scale', 'slice-width', 'slice-height', 'overlap', 'region', 'paper', 'floor', 'draft', 'seed', 'out'].map(name => [name, { type: 'string' }]),
        ['help', { type: 'boolean' }], ['quests', { type: 'boolean' }],
    ]) });
    if (v.help) return null;
    const number = (key, fallback, min, max) => { const n = Number(v[key] ?? fallback); if (!Number.isInteger(n) || n < min || n > max) throw Error(`--${key} must be an integer from ${min} to ${max}.`); return n; };
    const choice = (key, fallback, allowed) => { const value = v[key] ?? fallback; if (!allowed.includes(value)) throw Error(`--${key} must be ${allowed.join(', ')}.`); return value; };
    const levels = v.level === 'all' ? Array.from({ length: 14 }, (_, i) => i + 1) : [...new Set((v.level ?? '14').split(',').map(Number))];
    if (levels.some(n => !Number.isInteger(n) || n < 1 || n > 16)) throw Error('--level must contain numbers 1-16, or all.');
    if (levels.includes(16) && !v.draft) throw Error('Level 16 needs --draft file.json.');
    const difficulty = choice('difficulty', 'easy', ['easy', 'hard', 'hardcore', 'both']), graphics = choice('graphics', 'enhanced', ['classic', 'enhanced', 'both']);
    const result = { levels, difficulties: difficulty === 'both' ? ['EASY', 'HARD'] : [difficulty.toUpperCase()], graphics: graphics === 'both' ? ['classic', 'enhanced'] : [graphics], height: number('height', 800, 480, 1200), scale: number('scale', 2, 1, 2), sliceWidth: number('slice-width', 1280, 320, 2400), sliceHeight: number('slice-height', v.height ?? 800, 240, 1600), overlap: number('overlap', 80, 0, 400), paper: choice('paper', 'letter', ['letter', 'a4']), floor: choice('floor', 'ground', ['ground', 'basement', 'upstairs']), seed: number('seed', 13, 0, 2147483647), quests: !!v.quests, draftPath: v.draft, out: path.resolve(v.out ?? path.join(ROOT, 'output/level-exports')) };
    for (const name of ['public', 'dist']) { const relative = path.relative(path.join(ROOT, name), result.out); if (!relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) throw Error('Exports must stay outside public/ and dist/ so they cannot be published with the game.'); }
    if (result.overlap >= Math.min(result.sliceWidth, result.sliceHeight)) throw Error('--overlap must be smaller than each slice dimension.');
    if (v.region) { const [x, y, width, height, ...extra] = v.region.split(',').map(Number); if (extra.length || ![x, y, width, height].every(Number.isInteger) || width <= 0 || height <= 0) throw Error('--region must be x,y,width,height with positive dimensions.'); result.region = { x, y, width, height }; }
    return result;
}

export async function exportLevels(options) {
    let server, browser;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const directory = path.join(options.out, `pack-${stamp}`);
    const revision = { sha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(), dirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim() }; revision.short = revision.sha.slice(0, 7);
    const draft = options.draftPath ? JSON.parse(await readFile(options.draftPath, 'utf8')) : undefined;
    try {
        server = await createServer({ root: ROOT, configFile: false, server: { host: '127.0.0.1', port: 0, open: false }, logLevel: 'error', plugins: [{ name: 'local-level-export', configureServer(server) {
            server.middlewares.use('/__local-level-export', (_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><head><title>Local level export</title></head><body><script type="module" src="/scripts/level-export/capture.ts"></script></body></html>'); });
        } }] });
        await server.listen();
        browser = await chromium.launch({ headless: true, channel: 'chrome' });
        const page = await browser.newPage();
        const pageErrors = []; page.on('pageerror', error => pageErrors.push(error.message));
        await page.addInitScript(() => { Date.now = () => 1700000000000; Object.defineProperty(performance, 'now', { value: () => 1000 }); });
        const address = server.httpServer.address();
        await page.goto(`http://127.0.0.1:${address.port}/__local-level-export`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.levelExport, null, { timeout: 10000 }).catch(error => { throw Error(pageErrors.join('; ') || error.message); });
        const results = [];
        for (const level of options.levels) for (const difficulty of options.difficulties) for (const graphics of options.graphics) {
            const name = level === 16 ? (draft?.name || NAMES[level - 1]) : NAMES[level - 1], packId = `L${String(level).padStart(2, '0')}-${difficulty.toLowerCase()}-${graphics}${level === 15 ? `-${options.floor}` : ''}`;
            const folder = path.join(directory, packId);
            const data = await page.evaluate(o => window.levelExport.prepare(o), { level, difficulty, graphics, height: options.height, scale: options.scale, seed: options.seed, floor: options.floor, quests: options.quests, draft });
            const region = options.region ?? data.bounds, b = data.bounds;
            if (region.x < b.x || region.y < b.y || region.x + region.width > b.x + b.width || region.y + region.height > b.y + b.height) throw Error(`Requested region is outside level ${level}. Bounds: ${JSON.stringify(b)}`);
            const slices = slicesFor(region, options.sliceWidth, options.sliceHeight, options.overlap);
            await mkdir(path.join(folder, 'slices'), { recursive: true });
            const shot = (rect, kind, tiles = []) => page.evaluate(({ rect, kind, tiles }) => window.levelExport.capture(rect, kind, tiles), { rect, kind, tiles });
            const savePng = async (name, data) => writeFile(path.join(folder, name), Buffer.from(data, 'base64'));
            await savePng('full-color.png', await shot(region, 'color'));
            await savePng('full-worksheet.png', await shot(region, 'worksheet'));
            const overview = await shot(region, 'worksheet', slices); await savePng('sheet-index.png', overview);
            const sheets = [];
            for (const slice of slices) {
                await savePng(`slices/${slice.id}-color.png`, await shot(slice, 'color'));
                const sheet = await shot(slice, 'worksheet'); sheets.push(sheet); await savePng(`slices/${slice.id}-worksheet.png`, sheet);
            }
            const meta = { version: 1, packId, name, level, difficulty, graphics, floor: options.floor, revision, generatedAt: stamp, referenceHeight: options.height, scale: options.scale, seed: options.seed, quests: options.quests, paper: options.paper, ...data, region, slices, note: 'Static authored layout, not a simulated playthrough. Foreground uses the game draw methods. Background is composed for the panorama; print worksheets omit it. Raccoon boss is shown outside its reveal. Movement/timed hazards are not exhaustively represented.' };
            const html = printBooklet(meta, { overview, sheets }, options.paper);
            await writeFile(path.join(folder, 'manifest.json'), JSON.stringify(meta, null, 2));
            await writeFile(path.join(folder, 'print.html'), html);
            const printPage = await browser.newPage();
            await printPage.setContent(html, { waitUntil: 'load' });
            await printPage.pdf({ path: path.join(folder, 'print.pdf'), preferCSSPageSize: true, printBackground: true });
            await printPage.close(); results.push({ folder, pages: slices.length + 1, ...meta });
            console.log(`${packId}: ${region.width} x ${region.height} game pixels, ${slices.length} slices, ${slices.length + 1} printable pages\n${folder}`);
        }
        await writeFile(path.join(directory, 'README.txt'), 'Print each print.pdf at actual size in landscape. Draw on the pale worksheets; full-color.png and the color slices are references. Keep the page code visible in returned photos. Give the annotated page and manifest.json to your coding helper to map changes back to the correct revision and coordinates. These files are local exports and are not deployed with the game.\n');
        return { directory, results };
    } finally { await browser?.close(); await server?.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try { const options = optionsFrom(process.argv.slice(2)); if (!options) console.log(HELP); else await exportLevels(options); }
    catch (error) { console.error(`Export failed: ${error.message}`); process.exitCode = 1; }
}
