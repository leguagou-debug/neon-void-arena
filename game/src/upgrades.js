// Neon Void Arena - the between-wave upgrade draft. Clearing a wave
// offers three random upgrades from this pool; the player picks one
// with the number keys or a click, and the build grows for the rest of
// the run. Each entry knows its level cap, its card text and how it
// changes the ship, so world.js only has to count levels.

import { ARENA, PLAYER } from './config.js';

export const UPGRADES = [
  {
    id: 'damage', name: 'HEAVY ROUNDS', icon: 'DMG', color: '#ffe95a', max: 5,
    blurb: '+1 damage per bullet',
    detail: (level) => `Bullet damage ${1 + level} -> ${2 + level}`,
  },
  {
    id: 'rapid', name: 'OVERCLOCK', icon: 'ROF', color: '#3ffbe0', max: 5,
    blurb: 'Fire 16% faster',
    detail: (level) => `Fire rate level ${level} -> ${level + 1}`,
  },
  {
    id: 'multishot', name: 'SPLIT CANNON', icon: 'MLT', color: '#ffb347', max: 3,
    blurb: '+1 bullet per volley',
    detail: (level) => `${1 + level} -> ${2 + level} bullets per volley`,
  },
  {
    id: 'pierce', name: 'LANCE ROUNDS', icon: 'PIR', color: '#ff2bd6', max: 3,
    blurb: 'Bullets pierce +1 enemy',
    detail: (level) => `Pierces ${level} -> ${level + 1} extra enemies`,
  },
  {
    id: 'missiles', name: 'SEEKER PODS', icon: 'MSL', color: '#ff5a7a', max: 3,
    blurb: 'Homing missiles ride along',
    detail: (level) => `${level} -> ${level + 1} seeker missiles per volley`,
  },
  {
    id: 'velocity', name: 'ION THRUSTERS', icon: 'SPD', color: '#8aff5a', max: 3,
    blurb: '+9% movement speed',
    detail: (level) => `Speed level ${level} -> ${level + 1}`,
  },
  {
    id: 'hull', name: 'HULL PLATING', icon: 'HUL', color: '#40e0ff', max: 3,
    blurb: '+25 max hull, repair 25',
    detail: (level) => `Max hull ${PLAYER.maxHealth + level * 25} -> ${PLAYER.maxHealth + (level + 1) * 25}`,
  },
];

export function emptyBuild() {
  const build = {};
  for (const upgrade of UPGRADES) build[upgrade.id] = 0;
  return build;
}

// Three distinct upgrades the build still has room for. If the pool is
// exhausted (a very long run), the draft offers repair and score instead.
export function draftChoices(build, random) {
  const available = UPGRADES.filter((upgrade) => build[upgrade.id] < upgrade.max);
  const choices = [];
  const pool = [...available];
  while (choices.length < 3 && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    choices.push(pool.splice(index, 1)[0]);
  }
  while (choices.length < 3) {
    choices.push(choices.length === 1
      ? { id: 'repair', name: 'FIELD REPAIR', icon: 'REP', color: '#3dff7c', max: Infinity, blurb: 'Restore 40 hull now', detail: () => 'Instant repair' }
      : { id: 'cache', name: 'SCORE CACHE', icon: 'SCR', color: '#ffe95a', max: Infinity, blurb: '+750 points now', detail: () => 'Instant points' });
  }
  return choices;
}

// Card geometry, shared by the renderer (which draws the cards) and by
// main.js (which maps a click back to a card). One source of truth.
export function upgradeCardRect(index) {
  const width = 300;
  const height = 240;
  const gap = 28;
  const totalWidth = width * 3 + gap * 2;
  return {
    x: (ARENA.width - totalWidth) / 2 + index * (width + gap),
    y: (ARENA.height - height) / 2 + 26,
    width,
    height,
  };
}
