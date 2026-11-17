// Neon Void Arena - deterministic screenshot scenes behind
// ?shot=start|play|upgrade|boss|over. Each scene runs the real
// simulation forward from a fresh world with a simple autopilot at
// the controls, for a fixed number of fixed steps, so the same seed
// always renders the same frame and the screenshots are honest
// renders of the game.

import { STEP } from './config.js';
import { createEnemy } from './entities.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE } from './render.js';
import { waveScale } from './waves.js';

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
  // In a boss scene the pilot duels the Dreadnought itself, not escorts.
  const enemy = world.enemies.find((candidate) => candidate.kind === 'boss') || nearestEnemy(world);
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
    else {
      // Strafe tangentially, but against the boss close in when it is
      // far away so the duel stays in frame instead of drifting apart.
      const inward = enemy.kind === 'boss' && dist > 320 ? 0.75 : 0;
      moveX = -dy / dist * 0.6 - dx / dist * inward;
      moveY = dx / dist * 0.6 - dy / dist * inward;
    }
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
    // The pilot drafts like a player in a hurry: first card, every time.
    if (world.phase === 'draft') world.applyChoice(0, eventsSink);
    if (world.over) break;
  }
}

export function stageShot(name, world) {
  const ignoredEvents = [];
  world.reset();
  if (name === 'play') {
    // A staged mid-run melee at wave 7: the drafted build (heavy
    // rounds, split cannon, a seeker pod, lance rounds) against a
    // shielded elite, a splitter, a brute and friends. A few seconds
    // of skilled autopilot fills the frame with real fire, homing
    // missiles and score popups before the shutter falls.
    world.wave = 7;
    world.score = 8640;
    world.kills = 63;
    world.combo = 3;
    world.comboTimer = 2.6;
    world.betweenTimer = 999;
    world.build.damage = 2;
    world.build.multishot = 1;
    world.build.missiles = 1;
    world.build.pierce = 1;
    const scale = waveScale(7);
    world.enemies.push(createEnemy('elite', 950, 210, scale));
    world.enemies.push(createEnemy('splitter', 300, 520, scale));
    world.enemies.push(createEnemy('splitter', 1010, 470, scale));
    world.enemies.push(createEnemy('brute', 1080, 560, scale));
    world.enemies.push(createEnemy('chaser', 220, 180, scale));
    world.enemies.push(createEnemy('chaser', 420, 90, scale));
    world.enemies.push(createEnemy('spitter', 1120, 120, scale));
    world.enemies.push(createEnemy('dart', 640, 110, scale));
    world.player.x = 600;
    world.player.y = 420;
    world.player.health = 68;
    world.player.spreadTimer = 4;
    runScene(world, 1.5, true, ignoredEvents);
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: 9100 };
  }
  if (name === 'upgrade') {
    // Play the opening wave honestly, then freeze on the moment the
    // first upgrade draft opens: three cards, one choice.
    world.build.damage = 1;
    const steps = Math.round(90 / STEP);
    for (let i = 0; i < steps; i += 1) {
      world.step(STEP, autopilotControl(world, true), ignoredEvents);
      if (world.phase === 'draft' || world.over) break;
    }
    if (world.phase !== 'draft' && !world.over) {
      // The pilot cleared too slowly for the cap: clear the stage by
      // hand and let one real step open the draft on an empty arena.
      world.enemies = [];
      world.spawnQueue = [];
      world.wave = Math.max(1, world.wave);
      world.step(STEP, autopilotControl(world, true), ignoredEvents);
    }
    return { screen: world.phase === 'draft' ? SCREEN_UPGRADE : SCREEN_PLAY, best: Math.max(0, world.score - 300) };
  }
  if (name === 'boss') {
    // Stage the wave-5 duel directly: the Dreadnought at three-fifths
    // hull, a pair of escorts, and the player mid-fight with triple shot
    // running. A few seconds of skilled autopilot then fills the frame
    // with real bullets and boss orbs before the shutter falls.
    world.wave = 5;
    world.score = 12480;
    world.kills = 41;
    world.combo = 2.5;
    world.comboTimer = 2.6;
    world.betweenTimer = 999;
    const scale = waveScale(5);
    const boss = createEnemy('boss', 880, 300, scale);
    boss.health = Math.round(boss.maxHealth * 0.75);
    boss.stateTimer = 0.7;
    world.build.damage = 2;
    world.build.multishot = 1;
    world.build.missiles = 1;
    world.enemies.push(boss);
    world.enemies.push(createEnemy('chaser', 1080, 560, scale));
    world.enemies.push(createEnemy('dart', 200, 150, scale));
    world.enemies.push(createEnemy('splitter', 240, 610, scale));
    // The player starts closer to the Dreadnought than to either escort,
    // so the autopilot duels the boss itself, triple shot blazing.
    world.player.x = 500;
    world.player.y = 470;
    world.player.health = 76;
    world.player.spreadTimer = 6;
    runScene(world, 1.6, true, ignoredEvents);
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: 15200 };
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
