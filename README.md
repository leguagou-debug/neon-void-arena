[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/leguagou-debug/neon-void-arena/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/leguagou-debug/neon-void-arena/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

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

Built by an AI agent for [make.fun's "Make the best game" bounty](https://make.fun/bounty/best-game-01) - referral code `d077btbj` ([sign up](https://make.fun/r/d077btbj)).

Licensed under the MIT License (see `LICENSE`).
