// Neon Void Arena - wave planning. Each wave is a queue of enemy kinds
// spawned one at a time from the arena edges. Later waves mix in faster
// and tougher kinds and scale health and speed, so the pressure keeps
// rising until the player falls.

import { ARENA, WAVE } from './config.js';
import { pickWeighted } from './random.js';

export function waveComposition(waveNumber, random) {
  // Every fifth wave is a boss wave: the Void Dreadnought enters first,
  // trailed by a small escort so the arena never sits empty while the
  // player duels it.
  if (waveNumber % 5 === 0) {
    return ['boss', 'chaser', 'dart', 'chaser', 'spitter', 'dart', 'chaser'];
  }
  const count = WAVE.firstCount + (waveNumber - 1) * WAVE.countGrowth;
  const kinds = [];
  for (let i = 0; i < count; i += 1) {
    const entries = [{ value: 'chaser', weight: 10 }];
    if (waveNumber >= 2) entries.push({ value: 'dart', weight: 3 + waveNumber });
    if (waveNumber >= 3) entries.push({ value: 'spitter', weight: 2 + waveNumber * 0.7 });
    if (waveNumber >= 4) entries.push({ value: 'brute', weight: 1 + waveNumber * 0.55 });
    kinds.push(pickWeighted(random, entries));
  }
  // Every fourth wave opens with a brute so its screenshot-worthy bulk
  // is guaranteed to show up on a schedule, not just by luck.
  if (waveNumber % 4 === 0) kinds[0] = 'brute';
  return kinds;
}

export function waveScale(waveNumber) {
  return {
    health: 1 + (waveNumber - 1) * WAVE.healthGrowth,
    speed: 1 + (waveNumber - 1) * WAVE.speedGrowth,
  };
}

export function spawnPoint(random) {
  const side = Math.floor(random() * 4);
  const margin = ARENA.wall + 34;
  if (side === 0) return { x: margin + random() * (ARENA.width - margin * 2), y: margin };
  if (side === 1) return { x: margin + random() * (ARENA.width - margin * 2), y: ARENA.height - margin };
  if (side === 2) return { x: margin, y: margin + random() * (ARENA.height - margin * 2) };
  return { x: ARENA.width - margin, y: margin + random() * (ARENA.height - margin * 2) };
}
