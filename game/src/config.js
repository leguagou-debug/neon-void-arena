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
// slow damage sponges, spitters keep their distance and fire plasma orbs.
export const ENEMY_TYPES = {
  chaser: { radius: 16, health: 3, speed: 118, damage: 12, score: 100, color: '#ff2e88' },
  dart: { radius: 11, health: 1, speed: 218, damage: 8, score: 150, color: '#ff9f1c' },
  brute: { radius: 30, health: 14, speed: 62, damage: 22, score: 400, color: '#b967ff' },
  spitter: { radius: 18, health: 5, speed: 92, damage: 10, score: 250, color: '#ff5a7a' },
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
