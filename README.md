# Husky Escape

A React/Vite platformer where you help Onyx the Husky escape the pound and find her way home. The game includes short, optional AI reactions after important gameplay events.

## Classic / Enhanced presentation toggle

The game ships with two presentation layers, switchable live from the ⚙️ settings panel (Visuals and Audio each have a Classic / Enhanced switch; choices persist in `localStorage`):

- **Classic** — the original rendering and chiptune audio, fully preserved.
- **Enhanced** — the modern presentation: multi-layer parallax backgrounds for all 13 zones, an animated title screen, fully composed cinematic cutscene scenes, redrawn sprites (Onyx, every enemy, bosses, platforms, hazards, machines), a particle system, per-level color grading/vignette/glow passes, and layered music (detuned doubles, sub-octave, echo, tempo-locked percussion) plus re-synthesized SFX.

Switching is seamless — even mid-level or mid-jump — because Enhanced layers only *draw around* the untouched classic logic; world state is never touched, so gameplay is identical in either mode. Reference comparisons live under `design-ref/`.

Controls: Arrows **or** WASD to move; Space/W to jump; double jump for height.

### Zones

1–2 The Pound · 3 Dark Forest · 4 Beach · 5 Mountain · 6 Ski Slope · 7 The Chase · 8 Underwater Reef · 9 Stormy Pier · 10 Construction Site · **11 Neon Metropolis** — city night with industrial fan lifts (steady + pulsing), security drones with scan-and-chase AI, neon dash pads, roof cats, and a synthwave theme. **12 The Warm Bakery** — conveyor belts, falling pastries, and the Night Baker. **13 Market Day** — busy sidewalks, delivery bikes, market awnings, a fountain, garden dogs, and a parade home.


## Market Day (level 13)

The bakery exit leads to town; level 13 is also available through the Dev Mode warp selector. Classic and Enhanced visuals and audio switch live in settings. Both modes use the same collision shapes and timing.

- **Easy:** solid street beneath optional awnings and floats, a shallow fountain, generous warning windows, and two Good Dog Bandanas.
- **Hard / Hardcore:** road barriers force a market climb across frayed awnings that collapse after landing and reform after three seconds. Opposing delivery bikes, a deep fountain with moving stones, a second yard dog, and a broken parade street with narrow floats change the route. One bandana waits on the upper market path. Hardcore also retains its restart-from-level-1 rule.
- **Good Dog Bandana:** walk into the gold pickup to wear it. Pedestrians stop and wave you through. It absorbs one bike, apple, jet, or yard-dog collision, then disappears. It does not protect against deep water, falls, or timeout. No extra button is needed.
- Pedestrians bump rather than kill Onyx. Bells, barks, labels, and hissing jets warn before hazards activate. Benches, awnings, stones, and floats can be jumped through from below.

Run `npm run test:town` after installing dependencies. It uses the existing Playwright installation and local Google Chrome, starts its own temporary Vite server, and checks mechanics, full playable routes with hazards active, both rendering modes, and synthesized audio.

## Local development

```bash
npm install
npm run dev
```

## Visual testing with DeepSeek Harness

This repository includes a project-scoped Playwright MCP configuration for
DeepSeek Harness. It runs an isolated, headless Chrome session at 1440×900 and
keeps generated screenshots and traces under the ignored `.playwright-mcp/`
directory.

Start the app in one terminal:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Then start the Harness browser UI in another terminal:

```bash
npm run dsh:web
```

For a one-shot visual check:

```bash
npm run dsh:headless -- "Use Playwright MCP to open http://127.0.0.1:5173, take a screenshot, and visually inspect the game."
```

The `dsh-ox` launcher reads the existing local OpenRouter key at runtime. No
credential is stored in this repository.

Cloudflare MCP uses a local OAuth grant with Pages read/write permissions. On
a new machine, authorize it once and stop the command after it reports that the
proxy was established:

```bash
npm run cloudflare:mcp:login
```

Subsequent `dsh-ox` sessions start and stop both Playwright MCP and Cloudflare
MCP automatically. OAuth state remains local under `~/.mcp-auth/` and is not
committed.

The browser game works without the AI endpoint; it displays a local fallback quote if the endpoint is unavailable. To exercise the server-side AI locally, build the app and run the Pages Functions emulator with an untracked `.dev.vars` file:

```text
OPENROUTER_API_KEY=your-openrouter-key
```

```bash
npm run build
npx wrangler pages dev dist
```

## OpenRouter integration

The browser calls `POST /api/husky-wisdom`. The API key is used only by the server-side function in `functions/api/husky-wisdom.js`; it is never included in the Vite bundle. The endpoint sends requests to OpenRouter using `nvidia/nemotron-3.5-lightning:free` and returns only the generated reaction text.

## Cloudflare Pages deployment

Create or select a Pages project, then store the key as an encrypted Pages secret:

```bash
npx wrangler pages secret put OPENROUTER_API_KEY --project-name husky-escape
npm run build
npx wrangler pages deploy dist --project-name husky-escape
```

Keep `.dev.vars` and all `.env` files local. Do not put an OpenRouter key in source code, `vite.config.ts`, or a public environment variable.

The production site is available at `https://huskyescape.com` and `https://www.huskyescape.com`. The domain remains registered at Namecheap, while its authoritative nameservers and DNS records are managed on Cloudflare's free plan.

## Optional Node server

The included Dockerfile can run the same built app behind the small Express server. Provide the secret at runtime rather than during the image build:

```bash
docker build -t husky-escape .
docker run --rm -p 3000:3000 -e OPENROUTER_API_KEY="$OPENROUTER_API_KEY" husky-escape
```
