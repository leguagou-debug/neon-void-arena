// Neon Void Arena - entry point. Wires input, sound, the simulation and
// the renderer together, owns the screen state machine (title, play,
// paused, game over), runs the fixed-step loop, keeps the best score in
// localStorage, and stages the deterministic ?shot= scenes that the
// screenshots in the entry are taken from.

import { ARENA, STEP } from './config.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { makeRandom } from './random.js';
import { render, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE } from './render.js';
import { stageShot } from './shots.js';
import { upgradeCardRect } from './upgrades.js';
import { EVENT, World } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = ARENA.width;
canvas.height = ARENA.height;

const statusLine = document.getElementById('status');
const sound = new SoundBank();
const input = new Input(canvas);

const BEST_KEY = 'neon-void-arena-best';
let best = 0;
try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch { best = 0; }

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const shotSeed = Number(params.get('seed') || '1') || 1;

let world;
let screen;

if (shotName) {
  world = new World(makeRandom(shotSeed * 7919 + 13));
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  best = staged.best;
  render(ctx, world, screen, best);
  document.title = `Neon Void Arena - ${shotName}`;
  window.__shotReady = true;
} else {
  world = new World(makeRandom((Date.now() % 100000) + 1));
  screen = SCREEN_TITLE;
  runLiveGame();
}

function saveBest() {
  if (world.score > best) {
    best = world.score;
    try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* private mode: the run still counts */ }
  }
}

function playEvents(events) {
  for (const event of events) {
    if (event === EVENT.shoot) sound.shoot();
    else if (event === EVENT.explosion) sound.explosion();
    else if (event === EVENT.enemyHit) sound.enemyHit();
    else if (event === EVENT.playerHurt) sound.playerHurt();
    else if (event === EVENT.pickup) sound.pickup();
    else if (event === EVENT.waveStart) sound.waveStart();
    else if (event === EVENT.bossSpawn) sound.bossSpawn();
    else if (event === EVENT.bossAttack) sound.bossAttack();
    else if (event === EVENT.draftOpen) sound.draftOpen();
    else if (event === EVENT.upgrade) sound.upgrade();
    else if (event === EVENT.missile) sound.missile();
    else if (event === EVENT.dash) sound.dash();
    else if (event === EVENT.gameOver) { sound.gameOver(); saveBest(); }
  }
}

function startRun() {
  world.reset();
  screen = SCREEN_PLAY;
  sound.unlock();
}

function runLiveGame() {
  let last = performance.now();
  let accumulator = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    let elapsed = (now - last) / 1000;
    last = now;
    if (elapsed > 0.25) elapsed = 0.25;

    if (input.takePause()) {
      if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    if (input.keys.has('m')) { input.keys.delete('m'); sound.toggleMute(); }

    if (screen === SCREEN_UPGRADE) {
      // The draft: a number key or a click on a card picks the upgrade.
      // The world keeps its ambient effects ticking behind the cards.
      const events = [];
      let choice = input.takeChoice();
      const click = input.takeClick();
      if (choice === null && click && world.choices) {
        for (let i = 0; i < world.choices.length; i += 1) {
          const rect = upgradeCardRect(i);
          if (click.x >= rect.x && click.x <= rect.x + rect.width
            && click.y >= rect.y && click.y <= rect.y + rect.height) {
            choice = i;
            break;
          }
        }
      }
      input.takeConfirm(); // a card click must not leak into start/retry
      if (choice !== null) world.applyChoice(choice, events);
      world.step(STEP, {
        move: { x: 0, y: 0, moving: false },
        aimX: world.player.x + 140,
        aimY: world.player.y - 60,
        firing: false,
        dash: false,
      }, events);
      if (world.phase === 'combat') screen = SCREEN_PLAY;
      playEvents(events);
    } else if (screen === SCREEN_PLAY) {
      input.takeConfirm(); // clicks fire the cannon here; nothing to confirm
      accumulator += elapsed;
      const events = [];
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const move = input.moveVector();
        world.step(STEP, {
          move: { x: move.x, y: move.y, moving: move.moving },
          aimX: input.mouseX,
          aimY: input.mouseY,
          firing: input.firing(),
          dash: input.takeDash(),
        }, events);
        if (world.over) { screen = SCREEN_OVER; break; }
      }
      if (!world.over && world.phase === 'draft') screen = SCREEN_UPGRADE;
      playEvents(events);
    } else if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      const confirmed = input.takeConfirm();
      if (confirmed) startRun();
      if (screen === SCREEN_TITLE) {
        // Let a quiet wave drift behind the title so the arena feels alive.
        const events = [];
        world.step(STEP, {
          move: { x: 0, y: 0, moving: false },
          aimX: world.player.x + 140,
          aimY: world.player.y - 60,
          firing: false,
          dash: false,
        }, events);
      }
    }

    if (statusLine) {
      statusLine.textContent = `Score ${world.score}, wave ${world.wave}, hull ${world.player.health} percent, screen ${screen}`;
    }
    render(ctx, world, screen, best);
  }

  requestAnimationFrame(frame);
}
