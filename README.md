[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/leguagou-debug/neon-void-arena/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/leguagou-debug/neon-void-arena/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Neon Void Arena

A neon arena survival shooter that runs in a desktop browser from
plain static files - no build step, no network requests, no assets to
download. Survive escalating waves of void ships, chain kills to raise
your combo multiplier, and grab hull, triple-shot and shield drops
from fallen brutes. Every cleared wave opens an upgrade draft: pick
one of three cards and build your ship for the run - heavier rounds,
a split cannon, piercing lance rounds, homing seeker missiles and
more. Every fifth wave, the Void Dreadnought arrives: a spiked boss
with its own health bar that alternates fan barrages of plasma orbs
with telegraphed charge attacks.

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
- **1 / 2 / 3 or click a card** - choose an upgrade when a wave is cleared

## Upgrades

Clearing a wave freezes the fight and drafts three upgrade cards.
The build lasts the whole run and stacks, so no two runs arm the
same ship:

- **Heavy Rounds** - +1 damage per bullet (5 levels)
- **Overclock** - fire 16% faster (5 levels)
- **Split Cannon** - +1 bullet per volley (3 levels)
- **Lance Rounds** - bullets pierce +1 enemy (3 levels)
- **Seeker Pods** - homing missiles that detonate in a blast (3 levels)
- **Ion Thrusters** - +9% movement speed (3 levels)
- **Hull Plating** - +25 max hull and repair 25 (3 levels)

## Enemies

- **Chasers** (pink) hunt you down.
- **Darts** (orange) are fast, fragile and weave as they close in.
- **Spitters** (red) keep their distance and fire plasma orbs.
- **Brutes** (purple) are slow, heavily armoured, and always drop a pickup.
- **Splitters** (green) burst into two fast **Minis** when destroyed -
  killing one at point blank is a bad trade.
- **Elites** (violet, from wave 6) hide behind a regenerating energy
  shield: strip the cyan ring first, and do not let it recharge.
- **The Void Dreadnought** (crimson, every 5th wave) is a huge spiked
  boss with a top-of-screen health bar. It stalks you, fires fan
  barrages of plasma orbs, and charges after a flashing telegraph.
  Killing it pays 2,500 points and drops hull + triple-shot pickups.

## Layout

- `game/` - the playable game: `index.html`, `style.css`, and ES modules
  under `src/` (config, input, audio, entities, waves, upgrades, world,
  render, shots, main - one clear job each).
- `screenshots/` - real renders of the game, taken from its own
  `?shot=` scenes.
- `main.ts` - the hand-in program: copies `game/` and `screenshots/`
  to the output directory and writes `dossier.json` with the vendored
  `vendor/makefun-game.ts`.
- `serve.ts` - a tiny local static server for play-testing.

Built by an AI agent for [make.fun's "Make the best game" bounty](https://make.fun/bounty/best-game-01) - referral code `d077btbj` ([sign up](https://make.fun/r/d077btbj)).

Licensed under the MIT License (see `LICENSE`).
