# Husky Escape

A React/Vite platformer where you help Onyx the Husky escape the pound and find her way home. The game includes short, optional AI reactions after important gameplay events.

## Saved adventures and Free Roam

The main screen has four named save slots stored in this browser. Choose a name (up to 20 characters) and difficulty when creating a game. Difficulty is locked for that save, including after reloads. Progress autosaves after gameplay changes and when leaving the page; **Settings → Save & main menu** returns to the slot picker.

Continue restarts the current area, preserving bones, outfits, equipped items, unused treats, companions, quests, shop stock and unlocked entrances. Cleared levels remain cleared; transitional cutscenes replay. Carried outdoor quest items must be collected again after restarting an area, unless the level was already completed. Practice saves the original journey at the basement, never its borrowed supplies or currency. Hardcore deaths stay recorded across reloads and restart the story from level 1 until home is unlocked.

**Free Roam** starts a separate, unsaved run. Settings has a level selector (1–14 and Home), changeable difficulty, and optional **Cheats** for 100 bones, a fresh treat pouch, or 60 extra seconds. A difficulty change restarts the current area. Saved games have neither cheats nor the warp selector. Returning to the main menu discards the Free Roam run.

Save keys are `husky-escape:save-v1:0` through `:3`. Clearing site data removes them. Unreadable saves remain untouched, failed writes are reported, deletion asks for confirmation, and a stale tab cannot overwrite a newer save. Graphics/audio preferences and the explicitly saved custom course remain separate browser settings.

Run `npm run test:saves` for reload, slot isolation, progression, difficulty locking, storage failure, Free Roam, practice, quest and mobile checks.

## Print and draw levels

Open **Print & draw levels** on the main screen. Choose any level or cutscene, Classic/Enhanced artwork, pale drawing worksheets or full color, and Letter/A4 paper. Make a preview, select the sheets to include, then print or save as PDF. **Back to main menu** returns to the slot picker without changing saves.

For local PNGs and batch PDF exports, run `npm run export:levels -- --level 14 --difficulty both`. See [the export guide](docs/level-exports.md) for printing, crops, and using annotated pages to make changes.

## Classic / Enhanced presentation toggle

The game ships with two presentation layers, switchable live from the ⚙️ settings panel (Visuals and Audio each have a Classic / Enhanced switch; choices persist in `localStorage`):

- **Classic** — the original rendering and chiptune audio, fully preserved.
- **Enhanced** — the modern presentation: multi-layer parallax backgrounds for all 14 zones, an animated title screen, fully composed cinematic cutscene scenes, redrawn sprites (Onyx, every enemy, bosses, platforms, hazards, machines), a particle system, per-level color grading/vignette/glow passes, and layered music (detuned doubles, sub-octave, echo, tempo-locked percussion) plus re-synthesized SFX.

Switching is seamless — even mid-level or mid-jump — because Enhanced layers only *draw around* the untouched classic logic; world state is never touched, so gameplay is identical in either mode. Reference comparisons live under `design-ref/`.

Controls: Arrows **or** WASD to move; Space/W to jump; double jump for height.

### Zones

1–2 The Pound · 3 Dark Forest · 4 Beach · 5 Mountain · 6 Ski Slope · 7 The Chase · 8 Underwater Reef · 9 Stormy Pier · 10 Construction Site · **11 Neon Metropolis** — city night with industrial fan lifts (steady + pulsing), security drones with scan-and-chase AI, neon dash pads, roof cats, and a synthwave theme. **12 The Warm Bakery** — conveyor belts, falling pastries, and the Night Baker. **13 Market Day** — busy sidewalks, delivery bikes, market awnings, a fountain, garden dogs, and a parade to the backyard. **14 The Backyard** — leaking hydrants, fence platforms, raccoon patrols, and Baron von Bins, a top-hatted raccoon boss.


## Market Day (level 13)

The bakery exit leads to town; level 13 is also available through the Free Roam level selector. Classic and Enhanced visuals and audio switch live in settings. Both modes use the same collision shapes and timing.

- **Easy:** a solid street provides recovery beneath optional market awnings and three required parade floats. Fountain jets and leaking garden hydrants interrupt low jumps, and a rising roadwork post challenges the middle float crossing; a shallow fountain, wider decks, generous warning windows, and two Good Dog Bandanas leave room for mistakes.
- **Hard / Hardcore:** road barriers force a market climb across frayed awnings that collapse after landing and reform after three seconds. Opposing delivery bikes, a deep fountain with moving stones, a second yard dog, and a street packed with marching musicians beneath narrow floats, raised benches, and two rising roadwork posts change the route. One bandana waits on the upper market path. Hardcore also retains its restart-from-level-1 rule.
- **Hard parade:** the entire street beneath the floats is filled by two marching ranks with drums and brass instruments. Falling into the band ends the run, even with a bandana or temporary protection. Raised benches provide safe waiting spots; the two middle benches are narrower. Ordinary shoppers and Easy-mode marchers still only bump Onyx.
- **Parade pass:** land on all three gold-marked floats to open the home gate. Each marker turns green with a check mark, and the parade HUD shows progress. Walking underneath them does not complete the level.
- **Good Dog Bandana:** walk into the gold pickup to wear it. Pedestrians stop, wave you through, and briefly say “Good dog!” It absorbs one bike, apple, water burst, roadwork post, or yard-dog collision, then disappears. It does not protect against the packed Hard-mode marching band, deep water, falls, or timeout. No extra button is needed.
- Obstacles have distinct silhouettes in both graphics modes: spoked bicycles, animated shoppers and dogs, planked crates, picket fences, striped road barriers, supported benches and stalls, textured fountain stones, and wheeled parade decks. Enhanced mode adds material shading and highlights. Water bursts and roadwork posts preview their danger area during the warning; frayed awnings visibly tear before collapsing.
- The town uses two wooden wayfinding signs, a compact parade counter, and an equipped-bandana indicator instead of repeated floating instruction boxes.
- Pedestrians bump rather than kill Onyx. Bells, barks, hissing water, mechanical beeps, and flashing beacons warn before hazards activate. The fountain stays in the square; leaking hydrants belong to the gardens and retractable roadwork posts guard the parade route. Benches, awnings, stones, and floats can be jumped through from below.

Run `npm run test:town` after installing dependencies. It uses the existing Playwright installation and local Google Chrome, starts its own temporary Vite server, and checks mechanics, full playable routes with hazards active, both rendering modes, and synthesized audio.

## The Backyard (level 14)

The town exit advances to the backyard; Free Roam also offers a direct warp to 14. Follow the fence tops past leaking hydrants and raccoon patrols. Small raccoons hurt on side contact and can be defeated by landing on their heads.

- **Easy:** fixed fences with raised, narrower tops above a continuous lawn, five hydrants with longer bursts, six ground patrols plus a raccoon on a fence, and a four-hit boss who throws a lid before each charge.
- **Hard / Hardcore:** two flooded stretches force an upper route with narrower fences, three faster moving sections, and eight raccoons that telegraph a pounce. The boss needs five hits and throws three arcing trash lids before charging. Both difficulties have faster charges, shorter warnings, and shorter dizzy openings. A successful boss hit gives half a second of protection for the bounce.
- **Boss:** approaching the arena starts a nine-second cutscene: a trash can rattles, its lid flies off, and Baron von Bins leaps out wearing a top hat. Skip resumes the same run. The level clock, player, hazards, and inventory effects pause throughout the reveal.
- **Fight:** the arrow warns which way he will charge. Dodge using the fence platforms; when he crashes at the end of a charge and sees stars, jump on his head. His hat blocks damage outside that opening. After recovering at either end, he charges back across the arena, so camping beside one endpoint cannot repeatedly stun him. Reposition during the warning, then use the opening after his crash. Successful stomps lift Onyx clear of his body before she bounces. Defeating him lowers the arena gates and opens home. Reaching the exit unlocks the house and plays a five-part reunion with your owner. Watching it or choosing Skip leads to victory. Choose **Go inside · Home** on the victory screen.

Classic and Enhanced share gameplay, with flat versus shaded art, parallax houses and hedges, ringed raccoon tails, metallic trash cans, a backyard melody, a boss theme, and raccoon chatter. Existing shop outfits and supplies work here.

`npm run test:backyard` covers collisions, boss phases and victory, real cutscene pause/resume, sounds, rendering, and full movement-only runs through live hazards and the boss at two screen heights and two jump timings in each difficulty.

## Home and the family adventures (after level 14)

Finish the backyard and owner reunion, then choose **Go inside · Home**. The first visit opens a four-part chase: Opal follows Samwise with hearts overhead, Ruby is furious, and Samwise asks Onyx for emergency biscuits. Watching or skipping the scene starts the same first quest. The scene plays once per journey.

In **Free Roam**, the level selector includes **Home** after level 14. This unlocks the house immediately, including from a fresh game, and uses the same first-visit chase and quest progression.

Walk with arrows/WASD. Press **E** near a dog, stairway, or doorway; touch users have matching buttons. A hovering **E** appears only beside the nearest interaction and can also be tapped. The small book icon at the top-right opens the quest journal; **Rooms** and **Travel** inside it offer all seven spaces and all 14 replay levels. The journal starts closed in every room and on adventure levels. It groups in-progress, available, and completed requests; completed entries, friend locations, and control help can be expanded. Opening it pauses play, including the trail timer and hazards. The home and retry shortcuts are compact top-right icons. Home has no countdown or hazards. Conversations pause movement and room animations. Quest items have a separate bag and never use treat pockets.

| Chapter | Requests and dog locations | Unlock |
| --- | --- | --- |
| A very undignified chase | Fetch the kitchen’s distraction biscuits for Samwise in the entry hall (12 bones). | Return the biscuits to send the dogs to their rooms. |
| Make yourself at home | Opal in the master bedroom wants Lammy from level 5 (18). Ruby in the reading nook wants her cushion from level 4 (16). Samwise in the kitchen wants the boy’s lunchbox from level 1 (20). | Finish all three to open the next chapter. |
| A little more mischief | Opal in the sunroom wants the goose’s stolen ribbon, also in the sunroom (16). Ruby in the attic wants its rainbow sun-catcher (16). Samwise in the kitchen wants a recipe from the first raised conveyor in level 12 (22). | Recovering the ribbon also unlocks the goose skin. Finish all three for kitchen biscuits and Ruby’s quiet return to the reading nook. |

Accept each later request by talking to its owner, then touch the glowing item. In adventure levels the item is only being carried until you reach the exit: returning early, changing levels, or retrying requires collecting it again. Completing the level secures it for delivery to its owner’s current room. Errands located inside the house can be returned directly. The journal keeps track of where everybody is. Rewards are paid once. Locked requests cannot spawn items or be accepted early; accepting an item in the same room makes it appear immediately. The generic entryway dogs and their standalone quests have been replaced by this seven-quest family story.

**Rooms:** the entry hall has Dad on the sofa and Juniper’s shop; the kitchen has Xander, his toast, controller, and car-soccer game; the master bedroom has a double bed, white shaggy carpet, and Lammy’s basket; the reading nook has Maria, bookshelves, a reading lamp, Ruby’s cushion, and a window casting a real sunbeam with drifting dust and a later rainbow; the glass sunroom has Mom writing and humming among plants, plus an uninvited goose; the attic has Belle spinning beside a lit blanket fort; and the basement contains practice and level building. Doors connect the kitchen to the sunroom and the bedroom to the attic, as well as the original room links. Furniture is behind the walking lane. Floating labels and permanent instructions are removed from every room; text on wall artwork and the training chalkboard stays. Opal hints that her favorite carpet spot smells like Sammy. Talk to Xander for his enthusiastic Rocket League demo commentary.

Opal is a larger cream-white golden retriever with a turquoise collar and a grumpy expression. Ruby is a white husky with a red collar and a blep; in the reading nook she curls beside Maria with her head nestled into her fluffy tail, a tiny pink blep, and her red harness. Curly, light-brown Samwise snacks and helps stir biscuit batter. Their portraits and traveling sprites share the same artwork. Completing quests changes their activities: Lammy returns to Opal, Ruby gains her cushion and rainbow, the lunchbox returns to the kitchen, Opal and Samwise gather for biscuits, and Ruby returns to Maria’s reading nook. Enhanced Onyx has a charcoal-and-silver saddle, cream face mask and ruff, brown eyes, feathered paws, and a curled plume tail. Her running, jumping, skiing, swimming, and umbrella poses keep the same player hitbox and equipment. Cat, fox, and goose skins retain their own artwork. Ruby’s curled portrait has two sleepy eyes, a centered muzzle, and a blep above her tail.

Free travel keeps the chosen difficulty and permits retries even in postgame Hardcore. Return home from any replay. Bones, outfits, party choices, quest progress, and the chase flag persist in the selected browser save. Free Roam keeps these only until you leave the run. Juniper has the shared wallet and wardrobe, plus the home shop’s exclusive stock. Ordinary supplies are disabled at home; Belle’s spin treat works there too.

**Family visits:** walk up to Maria, Belle, Mom, or Dad and press **E**, or tap their interaction prompt. **Keep chatting** cycles their conversations. Choose **Curl up & read with Maria** to rest beside her. Move, jump, press E/Escape, or tap **Stand up** to leave the pose. Reading keeps your outfit and has no cost; it ends when leaving the room or reloading. Maria also gives Onyx a storybook satchel and equips it; read with her again to put it away or wear it, or use the wardrobe at any shop. Belle gives one spin treat, kept safely until a pocket is empty. Use its pocket key (1–3) or tap it for six seconds of twirls and bone attraction; it does not protect against hazards. You can dance with Belle at home any time without spending a treat. Gifts are remembered in each named save; Free Roam gifts last for that run. Mom shares her stories and Dad has a paw-torney joke ready.

**Goose costume:** buy it at the forest shop in level 3, or recover Opal’s stolen ribbon in the sunroom to earn it. Saves that already completed that quest receive the costume when continued. Equip it in any shop’s wardrobe.

Run `npm run test:family` for family interactions, one-time gifts, full pockets, spin effects, save compatibility, goose rewards, Classic/Enhanced artwork, and mobile conversations.

## House companions, practice, and building

After the biscuit errand, talk to each dog in their current room to invite them along or ask them to stay home. All three can join. They follow Onyx’s recorded path, including jumps and swimming, without blocking her, taking damage, or collecting items.

The basement offers **Hardcore practice** for all 14 real layouts. Retries restore the supplies you entered with. Practice uses a separate copy of bones, outfits, party, and quest progress; leaving restores the real journey and difficulty. Practice does not advance fetch quests or earn spending bones.

The basement’s **Create a level** opens a 32 × 10 tile workshop. Place platforms, water, raccoons, bones, a start, and an exit. Click/tap a square to place the selected tile; arrow keys move the focused square and Enter/Space places it. Scroll horizontally to reach the entire course. Start, exit, and raccoons need supporting platforms. Moving the start or exit replaces its old position. **Undo** retains 30 edits; **Starter layout** asks before replacing the draft.

**Play my level** runs the course with normal movement and collisions under practice rules. **Back to editor** preserves the draft, including after a failed attempt. **Save layout** stores one custom course in this browser, independently of journey resets; saving is explicit, and a failed browser-storage write is reported. Layouts are checked when loaded and before play. The starter course is completable, but custom designs can intentionally be difficult or impossible—playtest and edit them.

`npm run test:house-floors` covers floor navigation, companion recruitment and jump paths, all 14 practice destinations, economy isolation, retries, editor validation and save/reload, mobile layout, and a movement-only completion of the starter course.

## Secret doghouse shops

Each optional shop has its own entrance challenge. Route markers turn gold as you complete the required actions, and the door opens when you reach it. These challenges never gate the normal level exit; earned access survives ordinary retries.

| Branch | Entrance challenge |
| --- | --- |
| Forest, level 3 | Ride each of two marked moving logs until its paw lights up, then jump to the canopy landing |
| Snowdrift, level 6 | Climb onto the flagged side ramp, take its boosted ski jump, and land on the high shelf; it is above normal double-jump height from the approach |
| Lighthouse, level 9 | Take the umbrella on the high launch perch, glide through both wind rings in one flight, and land at the shop; landing early resets the rings |
| Bakery, level 12 | Climb the little entry step, run against the conveyor, and pass beneath both timed presses while they are raised; jumping over them does not count |
| Home | Return the kitchen distraction biscuits to Samwise to end the chase; Juniper explains this when approached before opening |

Hard and Hardcore use narrower forest logs and ski/glide landings, faster logs, and tighter bakery press timing. The main level’s ski ramps retain their original launch strength; only the optional shop ramp has the extra boost.

Press **E** beside an unlocked door, or tap **Enter doghouse**, to walk into a themed room. Walk to Juniper behind the counter and press the nearby **E** prompt to open the store HUD. **Escape**, **E**, or **Back to shop** closes the HUD; walk back to the entrance and use **E** to leave. Touch devices have left/right walking buttons. The room uses an original eight-bar shop tune in both audio modes, restoring the previous theme on departure.

The entire exterior stays paused while inside: position, hazards, clock, effects, companions, and unfinished quest pickups resume where you left them. Shopping cannot finish a fetch quest. Each branch rolls three different consumables from the ten below and keeps that stock throughout the journey, including revisits and retries. Practice copies stock without changing the real journey. Each shop also has one exclusive cosmetic on display; the original six cosmetics and already-owned outfits remain available at every counter.

| Purchase | Bones | Effect |
| --- | ---: | --- |
| Star treat | 6 | Protection from enemies for 5 seconds; falls, water and the parade band still end the run |
| Bone magnet | 8 | Attract nearby bones for 10 seconds |
| Time biscuit | 6 | Add 30 seconds to the clock |
| Spring biscuit | 8 | Higher land jumps for 12 seconds |
| Zoomie snack | 8 | Faster running on land for 12 seconds |
| Feather wafer | 8 | Hold jump to slow your descent on land for 12 seconds |
| Bakery bonus | 10 | Double bone value for 15 seconds; collected bones still cannot be farmed |
| Quiet-time cookie | 10 | Pause enemies and their projectiles for 5 seconds; contact still hurts |
| Sky biscuit | 8 | Instant upward bounce on land, even in midair, with two fresh jumps |
| Trail mix | 12 | Higher jumps and faster running together for 15 seconds on land |
| Trail cap | 10 | Teal hat; cosmetic |
| Little crown | 12 | Gold crown with a rose jewel; cosmetic |
| Tuxedo cat | 16 | Dark fur, white socks, green eyes and whiskers; cosmetic skin |
| Red fox | 16 | Russet fur and a cream-tipped brush; cosmetic skin |
| Berry sweater | 12 | Knitted coat; cosmetic |
| Moonstone collar | 8 | Violet collar and pendant; cosmetic |

| Shop | Exclusive cosmetic | Interior |
| --- | --- | --- |
| Canopy, level 3 | Mischievous goose (16 bones) | Hanging vines, mushrooms, forest window and fireflies |
| Snowdrift, level 6 | Snowday scarf (10) | Timber chalet, snowy mountains and a glowing hearth |
| Lighthouse, level 9 | Sailor cap (10) | Ocean porthole, sweeping lighthouse beam, ropes and a life ring |
| Rafters, level 12 | Chef’s toque (10) | Brick oven, baking bread and a checked countercloth |
| Home | Welcome-home bow (10) | Garden window, dresser, houseplant and a framed heart |

The goose has a long white neck, orange beak and feet, and a waddling walk inspired by Untitled Goose Game. It is a cosmetic skin with the same controls and collision box.

Three pockets hold one consumable each. Use **1**, **2**, **3**, or tap a pocket on the trail. Full pockets and insufficient bones block a purchase without charging. Already-active effects cannot consume another matching treat. Owned accessories can be worn or removed in any shop without paying again, and headwear, sweater, collar, and a skin can be worn together in both visual modes. One headwear item and one skin can be active at a time. Taking off a skin restores husky Onyx. Shop previews show each cosmetic with the current outfit; all skins retain Onyx’s movement, hitbox, and level equipment.

Belongings and unspent bones carry between levels and survive ordinary retries; used items remain used and collected bones do not respawn for farming. Earned shop access and randomized stock also survive retries. Temporary effects end when a level reloads. A new journey, Start Over, or Hardcore restart clears the run's belongings and balance. Named saves preserve belongings across browser reloads; Free Roam belongings last only for the current run.

`npm run test:shop` checks purchases, the run economy, item use, pause behavior, and cosmetics. It uses the same local Chrome setup as `test:town`.

`npm run test:shop-challenges` checks all four trail routes using movement alone with live hazards on Easy, Hard, and Hardcore, in short/tall viewports and different pier wind conditions. It also checks shortcut rejection, camera framing, retry access, the home biscuit unlock, and Juniper’s nearby hint.

`npm run test:shop-rooms` checks walk-in/counter/exit controls, frozen exterior state, quest pickup preservation, stock variety and persistence, exclusive cosmetics, both new consumables, practice isolation, music selection/muting, distinct artwork, desktop interaction, and mobile touch/rotation.

`npm run test:home` checks the complete seven-quest chain, level-completion requirements, abandoned/failed fetch runs, prerequisite gates, room changes, once-only rewards, first-visit cutscene completion/skip, proximity prompts, collapsed journals, trail pause, keyboard/touch UI, boy dialogue, and both visual modes.

`npm run test:revamp` checks exclusive stock, new effects, room doorways, dog and goose rendering, companion requests, owner reunion completion/skip, and mobile layout.

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
