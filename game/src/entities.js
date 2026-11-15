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

export function createBullet(x, y, angle, fromPlayer) {
  const speed = fromPlayer ? PLAYER.bulletSpeed : 330;
  return {
    id: nextId++, x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: fromPlayer ? PLAYER.bulletRadius : 6,
    fromPlayer,
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
    alive: true,
  };
}

export function createPickup(kind, x, y) {
  return { id: nextId++, kind, x, y, radius: 12, age: 0, alive: true };
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
