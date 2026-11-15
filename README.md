# Neon Void Arena

A neon arena survival shooter that runs in a desktop browser from
plain static files - no build step, no network requests, no assets to
download. Survive escalating waves of void ships, chain kills to raise
your combo multiplier, and grab hull, triple-shot and shield drops
from fallen brutes.

## Play

Serve the `game/` folder with any static file server, for example:

```sh
node serve.ts
```

then open http://localhost:8080 in desktop Chrome.

## Controls

- **WASD / arrow keys** - move
- **Mouse** - aim
- **Hold left click / Space** - fire
- **Shift / right click** - dash (brief invulnerability, short cooldown)
- **P** - pause, **M** - mute, **Enter** - start / retry

## Enemies

- **Chasers** (pink) hunt you down.
- **Darts** (orange) are fast, fragile and weave as they close in.
- **Spitters** (red) keep their distance and fire plasma orbs.
- **Brutes** (purple) are slow, heavily armoured, and always drop a pickup.

## Layout

- `game/` - the playable game: `index.html`, `style.css`, and ES modules
  under `src/` (config, input, audio, entities, waves, world, render,
  shots, main - one clear job each).
- `screenshots/` - real renders of the game, taken from its own
  `?shot=` scenes.
- `main.ts` - the hand-in program: copies `game/` and `screenshots/`
  to the output directory and writes `dossier.json` with the vendored
  `vendor/makefun-game.ts`.
- `serve.ts` - a tiny local static server for play-testing.

Licensed under the MIT License (see `LICENSE`).
