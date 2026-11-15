// Neon Void Arena - the simulation. Owns the player, enemies, bullets,
// pickups and particles, advances them one fixed step at a time, resolves
// collisions, tracks score, combo, kills and the wave cycle, and reports
// events so main.js can play sounds without the simulation knowing about
// audio at all.

import { ARENA, PLAYER, WAVE } from './config.js';
import { burst, createBullet, createEnemy, createPickup, createPlayer } from './entities.js';
import { spawnPoint, waveComposition, waveScale } from './waves.js';

export const EVENT = {
  shoot: 'shoot',
  explosion: 'explosion',
  enemyHit: 'enemyHit',
  playerHurt: 'playerHurt',
  pickup: 'pickup',
  waveStart: 'waveStart',
  dash: 'dash',
  gameOver: 'gameOver',
};

function clampToArena(entity) {
  entity.x = Math.min(ARENA.width - ARENA.wall - entity.radius, Math.max(ARENA.wall + entity.radius, entity.x));
  entity.y = Math.min(ARENA.height - ARENA.wall - entity.radius, Math.max(ARENA.wall + entity.radius, entity.y));
}

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export class World {
  constructor(random) {
    this.random = random;
    this.reset();
  }

  reset() {
    this.player = createPlayer(ARENA.width / 2, ARENA.height / 2);
    this.enemies = [];
    this.bullets = [];
    this.pickups = [];
    this.particles = [];
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.kills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.wave = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.betweenTimer = 1.1;
    this.waveBannerTimer = 0;
    this.shake = 0;
    this.time = 0;
    this.over = false;
  }

  startNextWave(events) {
    this.wave += 1;
    this.spawnQueue = waveComposition(this.wave, this.random);
    this.spawnTimer = 0.2;
    this.waveBannerTimer = 2.1;
    events.push(EVENT.waveStart);
  }

  fireBullet(angle) {
    const player = this.player;
    const muzzleX = player.x + Math.cos(angle) * (player.radius + 8);
    const muzzleY = player.y + Math.sin(angle) * (player.radius + 8);
    this.bullets.push(createBullet(muzzleX, muzzleY, angle, true));
    this.shotsFired += 1;
  }

  tryShoot(events) {
    const player = this.player;
    if (player.fireTimer > 0) return;
    player.fireTimer = PLAYER.fireInterval;
    this.fireBullet(player.aimAngle);
    if (player.spreadTimer > 0) {
      this.fireBullet(player.aimAngle - 0.16);
      this.fireBullet(player.aimAngle + 0.16);
      this.shotsFired -= 2; // the side pellets are one trigger pull, for accuracy stats
    }
    events.push(EVENT.shoot);
  }

  tryDash(move, events) {
    const player = this.player;
    if (player.dashCooldown > 0 || player.dashTimer > 0) return;
    const angle = move.moving ? Math.atan2(move.y, move.x) : player.aimAngle;
    player.dashAngle = angle;
    player.dashTimer = PLAYER.dashTime;
    player.dashCooldown = PLAYER.dashCooldown;
    burst(this.particles, this.random, player.x, player.y, '#3ffbe0', 10, 170);
    events.push(EVENT.dash);
  }

  hurtPlayer(damage, events) {
    const player = this.player;
    if (player.invulnerableTimer > 0 || player.dashTimer > 0 || !player.alive) return;
    if (player.shieldTimer > 0) {
      player.shieldTimer = 0;
      player.invulnerableTimer = PLAYER.invulnerableAfterHit;
      burst(this.particles, this.random, player.x, player.y, '#40e0ff', 16, 240);
      return;
    }
    player.health -= damage;
    player.invulnerableTimer = PLAYER.invulnerableAfterHit;
    this.shake = Math.max(this.shake, 9);
    this.combo = 1;
    this.comboTimer = 0;
    burst(this.particles, this.random, player.x, player.y, '#ff2e88', 14, 230);
    events.push(EVENT.playerHurt);
    if (player.health <= 0) {
      player.health = 0;
      player.alive = false;
      this.over = true;
      this.shake = 18;
      burst(this.particles, this.random, player.x, player.y, '#3ffbe0', 46, 340);
      burst(this.particles, this.random, player.x, player.y, '#ffe95a', 30, 260);
      events.push(EVENT.gameOver);
    }
  }

  killEnemy(enemy, events) {
    enemy.alive = false;
    this.kills += 1;
    this.comboTimer = 2.6;
    this.combo = Math.min(8, this.combo + 0.25);
    this.score += Math.round(enemy.score * this.combo);
    this.shake = Math.max(this.shake, enemy.kind === 'brute' ? 11 : 5);
    burst(this.particles, this.random, enemy.x, enemy.y, enemy.color, enemy.kind === 'brute' ? 34 : 16, 260);
    events.push(EVENT.explosion);
    const dropRoll = this.random();
    if (enemy.kind === 'brute' || dropRoll < 0.07) {
      const kind = dropRoll < 0.03 ? 'heal' : dropRoll < 0.055 ? 'spread' : 'shield';
      this.pickups.push(createPickup(enemy.kind === 'brute' ? 'heal' : kind, enemy.x, enemy.y));
    }
  }

  applyPickup(pickup, events) {
    const player = this.player;
    if (pickup.kind === 'heal') player.health = Math.min(PLAYER.maxHealth, player.health + 26);
    if (pickup.kind === 'spread') player.spreadTimer = 9;
    if (pickup.kind === 'shield') player.shieldTimer = 12;
    burst(this.particles, this.random, pickup.x, pickup.y, '#ffffff', 12, 180);
    events.push(EVENT.pickup);
  }

  step(dt, control, events) {
    this.time += dt;
    const player = this.player;

    // Wave cycle: spawn the queue, wait for a clear arena, count down, repeat.
    if (!this.over) {
      if (this.spawnQueue.length > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnTimer = WAVE.spawnGap;
          const kind = this.spawnQueue.shift();
          const point = spawnPoint(this.random);
          this.enemies.push(createEnemy(kind, point.x, point.y, waveScale(this.wave)));
        }
      } else if (this.enemies.length === 0) {
        this.betweenTimer -= dt;
        if (this.betweenTimer <= 0) {
          this.betweenTimer = WAVE.betweenWaves;
          this.startNextWave(events);
        }
      }
    }
    if (this.waveBannerTimer > 0) this.waveBannerTimer -= dt;

    // Player movement, dash and weapons.
    if (player.alive) {
      player.aimAngle = Math.atan2(control.aimY - player.y, control.aimX - player.x);
      player.fireTimer -= dt;
      player.dashCooldown -= dt;
      player.invulnerableTimer -= dt;
      player.shieldTimer = Math.max(0, player.shieldTimer - dt);
      player.spreadTimer = Math.max(0, player.spreadTimer - dt);
      if (control.dash) this.tryDash(control.move, events);
      if (player.dashTimer > 0) {
        player.dashTimer -= dt;
        player.x += Math.cos(player.dashAngle) * PLAYER.dashSpeed * dt;
        player.y += Math.sin(player.dashAngle) * PLAYER.dashSpeed * dt;
      } else {
        player.x += control.move.x * PLAYER.speed * dt;
        player.y += control.move.y * PLAYER.speed * dt;
      }
      clampToArena(player);
      if (control.firing) this.tryShoot(events);
    }

    // Combo decays if the player stops scoring.
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    this.updateEnemies(dt, events);
    this.updateBullets(dt, events);
    this.updatePickups(dt, events);
    this.updateParticles(dt);
    this.shake = Math.max(0, this.shake - dt * 26);
  }

  updateEnemies(dt, events) {
    const player = this.player;
    for (const enemy of this.enemies) {
      enemy.flashTimer = Math.max(0, enemy.flashTimer - dt);
      const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      let moveAngle = angleToPlayer;
      if (enemy.kind === 'dart') moveAngle += Math.sin(this.time * 5 + enemy.wobblePhase) * 0.55;
      if (enemy.kind === 'spitter') {
        const dist = Math.sqrt(distanceSquared(enemy, player));
        enemy.shootTimer -= dt;
        if (dist < 300) moveAngle += Math.PI; // keep firing distance
        if (enemy.shootTimer <= 0 && dist < 460 && player.alive) {
          enemy.shootTimer = 2.3;
          this.bullets.push(createBullet(enemy.x, enemy.y, angleToPlayer, false));
        }
      }
      enemy.x += Math.cos(moveAngle) * enemy.speed * dt;
      enemy.y += Math.sin(moveAngle) * enemy.speed * dt;
      clampToArena(enemy);
      if (player.alive && distanceSquared(enemy, player) < (enemy.radius + player.radius) ** 2) {
        this.hurtPlayer(enemy.damage, events);
        if (enemy.kind !== 'brute') enemy.alive = false;
        burst(this.particles, this.random, enemy.x, enemy.y, enemy.color, 10, 200);
      }
    }
    this.enemies = this.enemies.filter((enemy) => enemy.alive);
  }

  updateBullets(dt, events) {
    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.x < ARENA.wall || bullet.x > ARENA.width - ARENA.wall || bullet.y < ARENA.wall || bullet.y > ARENA.height - ARENA.wall) {
        bullet.alive = false;
        continue;
      }
      if (bullet.fromPlayer) {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          if (distanceSquared(bullet, enemy) < (bullet.radius + enemy.radius) ** 2) {
            bullet.alive = false;
            this.shotsHit += 1;
            enemy.health -= 1;
            enemy.flashTimer = 0.09;
            events.push(EVENT.enemyHit);
            if (enemy.health <= 0) this.killEnemy(enemy, events);
            break;
          }
        }
      } else if (this.player.alive && distanceSquared(bullet, this.player) < (bullet.radius + this.player.radius) ** 2) {
        bullet.alive = false;
        this.hurtPlayer(9, events);
      }
    }
    this.bullets = this.bullets.filter((bullet) => bullet.alive);
    this.enemies = this.enemies.filter((enemy) => enemy.alive);
  }

  updatePickups(dt, events) {
    for (const pickup of this.pickups) {
      pickup.age += dt;
      if (pickup.age > 11) pickup.alive = false;
      if (this.player.alive && distanceSquared(pickup, this.player) < (pickup.radius + this.player.radius + 6) ** 2) {
        pickup.alive = false;
        this.applyPickup(pickup, events);
      }
    }
    this.pickups = this.pickups.filter((pickup) => pickup.alive);
  }

  updateParticles(dt) {
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      if (particle.life <= 0) particle.alive = false;
    }
    this.particles = this.particles.filter((particle) => particle.alive);
  }

  accuracy() {
    if (this.shotsFired === 0) return 0;
    return Math.round((this.shotsHit / this.shotsFired) * 100);
  }
}
