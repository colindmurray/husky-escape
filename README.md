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

- **Easy:** a solid street provides recovery beneath optional market awnings and three required parade floats. Fountain jets and leaking garden hydrants interrupt low jumps, and a rising roadwork post challenges the middle float crossing; a shallow fountain, wider decks, generous warning windows, and two Good Dog Bandanas leave room for mistakes.
- **Hard / Hardcore:** road barriers force a market climb across frayed awnings that collapse after landing and reform after three seconds. Opposing delivery bikes, a deep fountain with moving stones, a second yard dog, and a street packed with marching musicians beneath narrow floats, raised benches, and two rising roadwork posts change the route. One bandana waits on the upper market path. Hardcore also retains its restart-from-level-1 rule.
- **Hard parade:** the entire street beneath the floats is filled by two marching ranks with drums and brass instruments. Falling into the band ends the run, even with a bandana or temporary protection. Raised benches provide safe waiting spots; the two middle benches are narrower. Ordinary shoppers and Easy-mode marchers still only bump Onyx.
- **Parade pass:** land on all three gold-marked floats to open the home gate. Each marker turns green with a check mark, and the parade HUD shows progress. Walking underneath them does not complete the level.
- **Good Dog Bandana:** walk into the gold pickup to wear it. Pedestrians stop, wave you through, and briefly say “Good dog!” It absorbs one bike, apple, water burst, roadwork post, or yard-dog collision, then disappears. It does not protect against the packed Hard-mode marching band, deep water, falls, or timeout. No extra button is needed.
- Obstacles have distinct silhouettes in both graphics modes: spoked bicycles, animated shoppers and dogs, planked crates, picket fences, striped road barriers, supported benches and stalls, textured fountain stones, and wheeled parade decks. Enhanced mode adds material shading and highlights. Water bursts and roadwork posts preview their danger area during the warning; frayed awnings visibly tear before collapsing.
- The town uses two wooden wayfinding signs, a compact parade counter, and an equipped-bandana indicator instead of repeated floating instruction boxes.
- Pedestrians bump rather than kill Onyx. Bells, barks, hissing water, mechanical beeps, and flashing beacons warn before hazards activate. The fountain stays in the square; leaking hydrants belong to the gardens and retractable roadwork posts guard the parade route. Benches, awnings, stones, and floats can be jumped through from below.

Run `npm run test:town` after installing dependencies. It uses the existing Playwright installation and local Google Chrome, starts its own temporary Vite server, and checks mechanics, full playable routes with hazards active, both rendering modes, and synthesized audio.

## Secret doghouse shops

Optional shops appear every three levels: a canopy trail in 3, snowy ledges in 6, lighthouse perches in 9, and bakery rafters in 12. Follow the three gold paw seals above the main path to unlock a doghouse. Hard and Hardcore have narrower approach ledges. These challenges never gate the normal exit.

Press **E** beside an unlocked door, or tap **Enter doghouse**. Juniper the husky sells three consumables and three cosmetics. Shopping pauses the level, enemies, and active effects; **Escape**, **E**, or **Back to trail** returns to the same spot.

| Purchase | Bones | Effect |
| --- | ---: | --- |
| Star treat | 3 | 5 seconds of protection from enemies; water, falls, timeout, and the packed parade band still defeat Onyx |
| Bone magnet | 4 | Pulls nearby bones toward Onyx for 10 seconds |
| Time biscuit | 3 | Adds 30 seconds to the current level |
| Trail cap | 5 | Teal hat; cosmetic |
| Berry sweater | 6 | Knitted coat; cosmetic |
| Moonstone collar | 4 | Violet collar and pendant; cosmetic |

Three pockets hold one consumable each. Use **1**, **2**, **3**, or tap a pocket on the trail. Full pockets and insufficient bones block a purchase without charging. Already-active effects cannot consume another matching treat. Owned accessories can be worn or removed in any shop without paying again, and hat, sweater, and collar can be worn together in both visual modes.

Belongings and unspent bones carry between levels and survive ordinary retries; used items remain used and collected bones do not respawn for farming. Earned shop access also survives retries. Temporary effects end when a level reloads. A new journey, Start Over, or Hardcore restart clears the run's belongings and balance. This inventory is in-memory for the current playthrough; it is not a browser-reload save system.

`npm run test:shop` checks purchases, the run economy, item use, pause behavior, cosmetics, and movement-only access from each side-route approach with hazards active on Easy, Hard, and Hardcore. It uses the same local Chrome setup as `test:town`.

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
