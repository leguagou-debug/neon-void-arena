// Neon Void Arena - the things that live in the arena: the player ship,
// bullets, enemy ships, plasma orbs, pickups and particle sparks.
// These are plain data objects; world.js moves them and render.js draws
// them, so the simulation never touches the canvas.

import { ENEMY_TYPES, PLAYER } from './config.js';

let nextId = 1;

export function createPlayer(x, y) {
  return {
    x, y,
    vx: 0, vy: 0,
    radius: PLAYER.radius,
    health: PLAYER.maxHealth,
    maxHealth: PLAYER.maxHealth,
    aimAngle: -Math.PI / 2,
    fireTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashAngle: 0,
    invulnerableTimer: 0,
    shieldTimer: 0,
    spreadTimer: 0,
    alive: true,
  };
}

export function createBullet(x, y, angle, fromPlayer, damage = 1, pierce = 0) {
  const speed = fromPlayer ? PLAYER.bulletSpeed : 330;
  return {
    id: nextId++, x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: fromPlayer ? PLAYER.bulletRadius : 6,
    fromPlayer,
    // Player bullets carry the build's damage and may punch through a
    // number of extra enemies; hitIds stops a piercing bullet from
    // striking the same enemy twice.
    damage,
    pierce,
    hitIds: null,
    alive: true,
  };
}

// A homing seeker missile from the upgrade draft: it steers toward the
// nearest enemy and detonates in a small blast when it arrives.
export function createMissile(x, y, angle) {
  return {
    id: nextId++, x, y,
    angle,
    radius: 6,
    life: 2.6,
    trailTimer: 0,
    alive: true,
  };
}

export function createEnemy(kind, x, y, waveScale) {
  const base = ENEMY_TYPES[kind];
  return {
    id: nextId++, kind, x, y,
    vx: 0, vy: 0,
    radius: base.radius,
    health: Math.round(base.health * waveScale.health),
    maxHealth: Math.round(base.health * waveScale.health),
    speed: base.speed * waveScale.speed,
    damage: base.damage,
    score: base.score,
    color: base.color,
    shootTimer: 1.4 + (nextId % 7) * 0.23,
    wobblePhase: (nextId * 0.71) % (Math.PI * 2),
    flashTimer: 0,
    // Energy shield (elites only): absorbs damage before the hull does
    // and regenerates after a few untouched seconds.
    shield: base.shield ? Math.round(base.shield * waveScale.health) : 0,
    maxShield: base.shield ? Math.round(base.shield * waveScale.health) : 0,
    shieldRegenTimer: 0,
    // Boss-only state machine fields (unused by ordinary enemies):
    // stalk -> barrage (fan of orbs) or telegraph -> charge, on a loop.
    state: 'stalk',
    stateTimer: 2.0,
    volleysLeft: 0,
    attackCount: 0,
    chargeAngle: 0,
    rotation: 0,
    alive: true,
  };
}

export function createPickup(kind, x, y) {
  return { id: nextId++, kind, x, y, radius: 12, age: 0, alive: true };
}

// An expanding ring left by a heavy death or a missile blast.
export function createShockwave(x, y, color, maxRadius) {
  return { x, y, color, radius: 6, maxRadius, life: 0.38, maxLife: 0.38, alive: true };
}

// A floating score popup that rises and fades where an enemy fell.
export function createFloater(x, y, text, color) {
  return { x, y, text, color, life: 0.9, maxLife: 0.9, alive: true };
}

export function createParticle(x, y, angle, speed, color, life, size) {
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    color, life, maxLife: life, size,
    alive: true,
  };
}

export function burst(particles, random, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2;
    const velocity = speed * (0.25 + random() * 0.95);
    particles.push(createParticle(x, y, angle, velocity, color, 0.35 + random() * 0.5, 1.6 + random() * 2.6));
  }
}
