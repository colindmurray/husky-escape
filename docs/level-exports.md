# Printable level design packs

The drawing studio and local batch tool render the game's real platforms, enemies, collectibles, and props into whole-level images and overlapping slices, with pale worksheets, coordinates, and room for handwritten ideas.

## Print from the website

Open **Print & draw levels** on the main screen. The studio starts at level 1 with the current difficulty and graphics choice. Choose **Level maps** or **Cutscene storyboard**, then select the content, page style, and Letter/A4 paper. **Make print preview** prepares the pages; use its checkboxes to omit individual sheets, then **Print drawing pack**. The browser offers printing or Save as PDF. Print landscape at 100% and turn off browser headers and footers.

Maps can include the whole level, close-ups, or both. Smaller close-up areas give larger printed details. All 14 story levels, all house floors, and the custom course are available without completing them. Custom Course reads the layout saved in this browser, or uses the starter course; save editor changes before printing. Storyboards include one actual rendered still and its dialogue per spoken line, including Baron von Bins’s reveal.

The studio opens from the main screen, with no active game running behind it. **Back to main menu** returns to the four save slots and Free Roam. Printing runs in a separate document and does not change saved adventures, the saved course, or graphics/audio preferences. No mode or cheat toggle is needed.

Keep the printed revision, level/story, page code, and coordinates visible in returned photos. Screenshots represent a frozen pose, so use arrows to describe motion. Browser printing works without a server-side export service; the browser controls printer/PDF availability.

## Make a pack

From the development checkout, with its existing dependencies and Google Chrome installed:

```sh
npm run export:levels -- --level 14 --difficulty both
```

The command starts its own temporary server on loopback, uses an isolated browser, and closes both when finished. It does not disturb the open game, use the player's save, restart the development server, upload anything, or require a running game server.

The printed folder path contains separate Easy and Hard packs. Every run creates a new dated folder under `output/level-exports/`, preserving previous exports.

Each level/difficulty/graphics folder contains:

- `full-color.png`: the complete panorama, or requested rectangle, in game colors.
- `full-worksheet.png`: the same geometry on a pale background with a 100-game-pixel grid.
- `sheet-index.png`: an overview showing where the numbered close-ups belong.
- `slices/R1-C1-color.png` and `slices/R1-C1-worksheet.png`, etc.: matching reference and drawing slices. R means row, C means column, ordered top-to-bottom and left-to-right.
- `print.pdf`: an overview followed by one worksheet per slice, with margins and note space.
- `print.html`: the same booklet as a standalone file with a Print button; images are embedded.
- `manifest.json`: the source revision, export settings, world bounds, object positions, and coordinates for every slice.

## Print and return drawings

Send the PDF to your collaborator. Print landscape at **actual size / 100%**, using the paper size selected when exporting. The booklet has its own margins. Default paper is US Letter; use `--paper a4` for A4.

Draw directly on the pale picture: add platforms, cross out obstacles, circle something to move, and use arrows for movement. The note area can explain what should happen. Neighboring sheets overlap, so an idea crossing an edge can be marked on either sheet. Tall levels get additional rows of sheets, including their upper routes.

When photographing or scanning a page, keep its level, difficulty, page code, and coordinate line visible. Send the marked-up page back along with its `manifest.json` (or keep the original pack on the development machine). A coding helper can use that information to identify the exact area and compare it against the recorded source revision before implementing the drawing. No automatic drawing recognition or level modification is performed by this exporter.

## Useful commands

```sh
# Multiple levels, one difficulty
npm run export:levels -- --level 5,13,14 --difficulty hard

# Classic and Enhanced art, separately
npm run export:levels -- --level 14 --graphics both

# Every story level
npm run export:levels -- --level all --difficulty both

# A closer look at the backyard's final stretch: x,y,width,height
npm run export:levels -- --level 14 --difficulty hard --region 3100,350,1800,450

# Smaller slices for more room to draw; at least 80 pixels of overlap
npm run export:levels -- --level 13 --slice-width 1000 --slice-height 800 --overlap 80

# Capture the house's companion loft
npm run export:levels -- --level 15 --floor upstairs

# Show the red ball and other optional fetch-quest objects
npm run export:levels -- --level 5 --quests

# Print on A4; lower-resolution PNGs use less memory
npm run export:levels -- --level 11 --paper a4 --scale 1

npm run export:levels -- --help
```

Level 16 exports a custom course and requires `--draft file.json`. The file must contain the saved JSON object from the builder's browser-storage key `husky-escape:custom-level-v1`. The exporter uses an isolated browser, so it cannot read that save from your regular game automatically.

World coordinates are game pixels, not printed inches or PNG pixels. PNGs default to two pixels per game pixel (`--scale 2`). `--height 800` sets the reference game viewport used to generate level geometry; use the same height when comparing drawings to the game. Slice height defaults to that reference height. A crop must fit inside the level's bounds; an invalid crop reports the available bounds. Upper floors of tall levels have negative Y coordinates.

## What the picture represents

The export is a static authored layout, not a simulated playthrough. Enemies and moving/timed obstacles appear in one starting pose; hidden or later-spawned hazards are not a complete motion diagram. The raccoon boss is shown outside its trash-can reveal so it can be drawn around. The panorama composes the existing background artwork across the map; it does not stitch changing gameplay camera views. Worksheets omit scenic backgrounds except for a faint house interior.

The tool uses the existing level loader, entity draw methods, and background renderer. Time and random visual details are fixed by `--seed`, so a region export matches the same pixels in a full export. All slices are cropped from one frozen map, avoiding seams caused by moving enemies or different animation times.

No output is placed in `public/` or `dist/`; the command rejects those output paths. Keep drawing packs outside deployable folders when choosing a custom `--out`. The temporary server listens only on `127.0.0.1`. The Node/Playwright batch runner stays under `scripts/` and is not bundled. Shared capture and booklet helpers under `game/printing/` also serve the website’s print studio. Generated local PNG/PDF packs are ignored by Git and excluded from deployment.

## Checks

`npm run test:level-export` checks argument validation, complete overlapping coverage, all 14 story levels in both difficulty layouts and both graphics modes, tall maps, exact crop-to-full-image pixel correspondence, printable Letter/A4 layout, house/custom courses, exclusion of Node batch tooling and local output from a production build, and cleanup on an invalid crop. It uses a temporary output directory and removes its own generated fixtures.

`npm run test:print-studio` checks main-screen access and return, preference isolation, page selection, all cutscenes in both graphics modes, mobile layout, and the built website.
