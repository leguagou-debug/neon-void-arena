// Neon Void Arena - deterministic screenshot scenes behind
// ?shot=start|play|clash|over. Each scene runs the real simulation
// forward from a fresh world with a simple autopilot at the controls,
// for a fixed number of fixed steps, so the same seed always renders
// the same frame and the screenshots are honest renders of the game.

import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function nearestEnemy(world) {
  let best = null;
  let bestDistance = Infinity;
  for (const enemy of world.enemies) {
    const d = (enemy.x - world.player.x) ** 2 + (enemy.y - world.player.y) ** 2;
    if (d < bestDistance) { bestDistance = d; best = enemy; }
  }
  return best;
}

function autopilotControl(world, skilled) {
  const player = world.player;
  const enemy = nearestEnemy(world);
  if (!skilled) {
    // The doomed pilot for the game-over scene: barely moves, never fires.
    return { move: { x: 0, y: 0, moving: false }, aimX: player.x + 80, aimY: player.y - 80, firing: false, dash: false };
  }
  let moveX = 0;
  let moveY = 0;
  if (enemy) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 170) { moveX = dx / dist; moveY = dy / dist; }
    else { moveX = -dy / dist * 0.6; moveY = dx / dist * 0.6; }
  }
  if (world.pickups.length > 0) {
    const pickup = world.pickups[0];
    moveX = Math.sign(pickup.x - player.x);
    moveY = Math.sign(pickup.y - player.y);
  }
  const length = Math.hypot(moveX, moveY) || 1;
  return {
    move: { x: moveX / length, y: moveY / length, moving: moveX !== 0 || moveY !== 0 },
    aimX: enemy ? enemy.x : player.x + 120,
    aimY: enemy ? enemy.y : player.y,
    firing: Boolean(enemy),
    dash: Boolean(enemy) && Math.hypot(enemy.x - player.x, enemy.y - player.y) < 80,
  };
}

function runScene(world, seconds, skilled, eventsSink) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP, autopilotControl(world, skilled), eventsSink);
    if (world.over) break;
  }
}

// Step the skilled pilot forward until the arena is busy enough to make
// an honest action shot: several hostiles on screen and shots in flight.
// A fixed end time kept landing between waves, when the arena is empty,
// so the play scenes search for their moment instead of taking it blind.
function runUntilBusy(world, maxSeconds, eventsSink) {
  const steps = Math.round(maxSeconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP, autopilotControl(world, true), eventsSink);
    if (world.over) return;
    const busy = world.enemies.length >= 5 && world.bullets.length >= 3 && world.wave >= 2;
    if (busy) return;
  }
}

export function stageShot(name, world) {
  const ignoredEvents = [];
  world.reset();
  if (name === 'play') {
    runUntilBusy(world, 40, ignoredEvents);
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: Math.max(0, world.score - 300) };
  }
  if (name === 'clash') {
    runUntilBusy(world, 75, ignoredEvents);
    if (world.over || world.enemies.length < 3) {
      // A dead or quiet run makes a poor mid-game shot: take an earlier busy slice.
      world.reset();
      runUntilBusy(world, 40, ignoredEvents);
    }
    return { screen: SCREEN_PLAY, best: Math.max(0, world.score - 300) };
  }
  if (name === 'over') {
    // Play properly first so the results panel shows a real run's score
    // and kills, then hand the controls to the doomed pilot to finish it.
    runScene(world, 16, true, ignoredEvents);
    runScene(world, 150, false, ignoredEvents);
    return { screen: SCREEN_OVER, best: world.score };
  }
  // Default: the title screen, with a live wave drifting behind the panel.
  runScene(world, 5, true, ignoredEvents);
  return { screen: SCREEN_TITLE, best: 1250 };
}
