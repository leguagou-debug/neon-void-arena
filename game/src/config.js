// Neon Void Arena - shared tuning, palette and arena dimensions.
// Every other module reads its numbers from here so the game can be
// balanced in one place.

export const ARENA = {
  width: 1280,
  height: 720,
  wall: 26,
};

export const STEP = 1 / 60;

export const PLAYER = {
  radius: 15,
  speed: 335,
  maxHealth: 100,
  fireInterval: 0.145,
  bulletSpeed: 780,
  bulletRadius: 4,
  dashSpeed: 920,
  dashTime: 0.16,
  dashCooldown: 1.15,
  invulnerableAfterHit: 0.7,
};

export const COLORS = {
  background: '#05030f',
  grid: 'rgba(64, 224, 255, 0.07)',
  gridMajor: 'rgba(255, 43, 214, 0.08)',
  player: '#3ffbe0',
  playerCore: '#eafffb',
  bullet: '#ffe95a',
  enemyBullet: '#ff5a7a',
  heart: '#ff2e88',
  xp: '#8aff5a',
  shield: '#40e0ff',
  spread: '#ffb347',
  text: '#e8f6ff',
  dimText: '#8fa3c8',
};

// Enemy archetypes: chasers hunt, darts are fast and fragile, brutes are
// slow damage sponges, spitters keep their distance and fire plasma orbs,
// splitters burst into two fast minis when destroyed, and elites hide
// behind a regenerating energy shield that must be stripped first.
// Every fifth wave is led by the boss, the Void Dreadnought: a huge
// spiked dreadnought that alternates fan barrages of plasma orbs with
// telegraphed charge attacks, and is worth a small fortune in score.
export const ENEMY_TYPES = {
  chaser: { radius: 16, health: 3, speed: 118, damage: 12, score: 100, color: '#ff2e88' },
  dart: { radius: 11, health: 1, speed: 218, damage: 8, score: 150, color: '#ff9f1c' },
  brute: { radius: 30, health: 14, speed: 62, damage: 22, score: 400, color: '#b967ff' },
  spitter: { radius: 18, health: 5, speed: 92, damage: 10, score: 250, color: '#ff5a7a' },
  splitter: { radius: 20, health: 4, speed: 96, damage: 10, score: 200, color: '#8aff5a' },
  mini: { radius: 9, health: 1, speed: 246, damage: 6, score: 50, color: '#c6ff8a' },
  elite: { radius: 26, health: 10, speed: 74, damage: 18, score: 600, color: '#7a5cff', shield: 6 },
  boss: { radius: 54, health: 60, speed: 50, damage: 26, score: 2500, color: '#ff2040' },
};

// Homing side-missiles, unlocked and stacked by the upgrade draft.
export const MISSILE = {
  interval: 1.15,
  speed: 460,
  turnRate: 5.2,
  damage: 3,
  blastRadius: 74,
  life: 2.6,
};

// Energy shields (elite enemies) come back if left alone for a while.
export const SHIELD = {
  regenDelay: 3.5,
  regenRate: 2.2,
};

export const BOSS = {
  name: 'VOID DREADNOUGHT',
  coreColor: '#ffd319',
  stalkRange: 255,
  stalkTime: 1.5,
  barrageOrbs: 9,
  barrageHalfAngle: 0.55,
  barrageVolleys: 2,
  barrageGap: 0.45,
  telegraphTime: 0.5,
  chargeSpeed: 545,
  chargeTime: 0.55,
};

export const PICKUP_TYPES = {
  heal: { radius: 12, color: '#3dff7c', lifetime: 11 },
  spread: { radius: 12, color: '#ffb347', lifetime: 11 },
  shield: { radius: 12, color: '#40e0ff', lifetime: 11 },
};

export const WAVE = {
  firstCount: 6,
  countGrowth: 3,
  spawnGap: 0.85,
  betweenWaves: 3.2,
  healthGrowth: 0.16,
  speedGrowth: 0.045,
};
