# Printable level design packs

This local tool renders the game's real platforms, enemies, collectibles, and props into whole-level images and overlapping slices. It also creates pale worksheets with a coordinate grid and space for handwritten ideas. Nothing is added to the game menus or production bundle, and generated packs are ignored by Git.

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

No output is placed in `public/` or `dist/`; the command rejects those output paths. Keep drawing packs outside deployable folders when choosing a custom `--out`. The temporary server listens only on `127.0.0.1`. Export code lives under `scripts/` and is not imported by the game entry point. Building or deploying the game does not include it.

## Checks

`npm run test:level-export` checks argument validation, complete overlapping coverage, all 14 story levels in both difficulty layouts and both graphics modes, tall maps, exact crop-to-full-image pixel correspondence, printable Letter/A4 layout, house/custom courses, exclusion from a production build, and cleanup on an invalid crop. It uses a temporary output directory and removes its own generated fixtures.
