// Neon Void Arena - the simulation. Owns the player, enemies, bullets,
// pickups and particles, advances them one fixed step at a time, resolves
// collisions, tracks score, combo, kills and the wave cycle, and reports
// events so main.js can play sounds without the simulation knowing about
// audio at all.

import { ARENA, BOSS, MISSILE, PLAYER, SHIELD, WAVE } from './config.js';
import {
  burst, createBullet, createEnemy, createFloater, createMissile,
  createParticle, createPickup, createPlayer, createShockwave,
} from './entities.js';
import { draftChoices, emptyBuild } from './upgrades.js';
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
  bossSpawn: 'bossSpawn',
  bossAttack: 'bossAttack',
  draftOpen: 'draftOpen',
  upgrade: 'upgrade',
  missile: 'missile',
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
    this.missiles = [];
    this.pickups = [];
    this.particles = [];
    this.shockwaves = [];
    this.floaters = [];
    this.pendingSpawns = [];
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
    // Upgrade draft state: after each cleared wave the simulation
    // freezes in the 'draft' phase until applyChoice() is called.
    this.build = emptyBuild();
    this.phase = 'combat';
    this.choices = null;
    this.draftServed = false;
    this.missileTimer = 0.6;
    this.trailTimer = 0;
  }

  // Derived weapon stats: the upgrade build, counted in one place.
  bulletDamage() { return 1 + this.build.damage; }
  fireInterval() { return PLAYER.fireInterval * (0.84 ** this.build.rapid); }
  pelletCount() { return 1 + this.build.multishot; }
  pierceCount() { return this.build.pierce; }
  moveSpeed() { return PLAYER.speed * (1.09 ** this.build.velocity); }

  startNextWave(events) {
    this.wave += 1;
    this.spawnQueue = waveComposition(this.wave, this.random);
    this.spawnTimer = 0.2;
    this.waveBannerTimer = 2.1;
    this.draftServed = false;
    events.push(EVENT.waveStart);
  }

  // The player picks one of the three drafted upgrades: the build
  // grows, the arena unfreezes and the next wave follows shortly.
  applyChoice(index, events) {
    if (this.phase !== 'draft' || !this.choices) return;
    const choice = this.choices[index];
    if (!choice) return;
    if (choice.id === 'repair') {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
    } else if (choice.id === 'cache') {
      this.score += 750;
    } else {
      this.build[choice.id] += 1;
      if (choice.id === 'hull') {
        this.player.maxHealth += 25;
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
      }
    }
    this.choices = null;
    this.phase = 'combat';
    this.betweenTimer = 1.0;
    burst(this.particles, this.random, this.player.x, this.player.y, choice.color, 22, 240);
    events.push(EVENT.upgrade);
  }

  fireBullet(angle) {
    const player = this.player;
    const muzzleX = player.x + Math.cos(angle) * (player.radius + 8);
    const muzzleY = player.y + Math.sin(angle) * (player.radius + 8);
    this.bullets.push(createBullet(muzzleX, muzzleY, angle, true, this.bulletDamage(), this.pierceCount()));
  }

  tryShoot(events) {
    const player = this.player;
    if (player.fireTimer > 0) return;
    player.fireTimer = this.fireInterval();
    // The volley is a fan: one centre bullet plus the Split Cannon's
    // extra pellets, and the triple-shot pickup widens it further.
    const pellets = this.pelletCount() + (player.spreadTimer > 0 ? 2 : 0);
    for (let i = 0; i < pellets; i += 1) {
      this.fireBullet(player.aimAngle + (i - (pellets - 1) / 2) * 0.15);
    }
    this.shotsFired += 1; // one trigger pull per volley, for accuracy stats
    events.push(EVENT.shoot);
  }

  launchMissiles(events) {
    const player = this.player;
    for (let i = 0; i < this.build.missiles; i += 1) {
      const side = i % 2 === 0 ? 1 : -1;
      const angle = player.aimAngle + side * (0.7 + Math.floor(i / 2) * 0.35);
      this.missiles.push(createMissile(player.x, player.y, angle));
    }
    events.push(EVENT.missile);
  }

  explodeMissile(missile, events) {
    if (!missile.alive) return;
    missile.alive = false;
    this.shockwaves.push(createShockwave(missile.x, missile.y, '#ff5a7a', MISSILE.blastRadius));
    burst(this.particles, this.random, missile.x, missile.y, '#ff5a7a', 14, 220);
    burst(this.particles, this.random, missile.x, missile.y, '#ffe95a', 8, 160);
    for (const enemy of [...this.enemies]) {
      if (enemy.alive && distanceSquared(missile, enemy) < (MISSILE.blastRadius + enemy.radius) ** 2) {
        this.damageEnemy(enemy, MISSILE.damage, events);
      }
    }
    events.push(EVENT.explosion);
  }

  updateMissiles(dt, events) {
    for (const missile of this.missiles) {
      missile.life -= dt;
      let target = null;
      let bestDistance = Infinity;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const d = distanceSquared(missile, enemy);
        if (d < bestDistance) { bestDistance = d; target = enemy; }
      }
      if (target) {
        const desired = Math.atan2(target.y - missile.y, target.x - missile.x);
        let diff = desired - missile.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = MISSILE.turnRate * dt;
        missile.angle += Math.max(-turn, Math.min(turn, diff));
        if (bestDistance < (target.radius + 12) ** 2) {
          this.explodeMissile(missile, events);
          continue;
        }
      }
      missile.x += Math.cos(missile.angle) * MISSILE.speed * dt;
      missile.y += Math.sin(missile.angle) * MISSILE.speed * dt;
      missile.trailTimer -= dt;
      if (missile.trailTimer <= 0) {
        missile.trailTimer = 0.03;
        this.particles.push(createParticle(missile.x, missile.y, missile.angle + Math.PI, 20, '#ff5a7a', 0.3, 2.4));
      }
      if (missile.life <= 0
        || missile.x < ARENA.wall || missile.x > ARENA.width - ARENA.wall
        || missile.y < ARENA.wall || missile.y > ARENA.height - ARENA.wall) {
        this.explodeMissile(missile, events);
      }
    }
    this.missiles = this.missiles.filter((missile) => missile.alive);
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

  // One damage path for bullets and missile blasts alike: an elite's
  // shield drinks the damage first and only the overflow reaches hull.
  damageEnemy(enemy, amount, events) {
    let remaining = amount;
    if (enemy.shield > 0) {
      const absorbed = Math.min(enemy.shield, remaining);
      enemy.shield -= absorbed;
      remaining -= absorbed;
      enemy.shieldRegenTimer = SHIELD.regenDelay;
      burst(this.particles, this.random, enemy.x, enemy.y, '#40e0ff', 4, 160);
    }
    if (remaining > 0) enemy.health -= remaining;
    enemy.flashTimer = 0.09;
    events.push(EVENT.enemyHit);
    if (enemy.health <= 0 && enemy.alive) this.killEnemy(enemy, events);
  }

  killEnemy(enemy, events) {
    enemy.alive = false;
    this.kills += 1;
    this.comboTimer = 2.6;
    this.combo = Math.min(8, this.combo + 0.25);
    const gained = Math.round(enemy.score * this.combo);
    this.score += gained;
    this.floaters.push(createFloater(enemy.x, enemy.y - enemy.radius - 8, `+${gained}`, enemy.color));
    this.shake = Math.max(this.shake, enemy.kind === 'boss' ? 16 : enemy.kind === 'brute' ? 11 : 5);
    burst(this.particles, this.random, enemy.x, enemy.y, enemy.color, enemy.kind === 'boss' ? 60 : enemy.kind === 'brute' ? 34 : 16, 260);
    if (enemy.kind === 'boss' || enemy.kind === 'brute' || enemy.kind === 'elite') {
      this.shockwaves.push(createShockwave(enemy.x, enemy.y, enemy.color, enemy.kind === 'boss' ? 200 : 115));
    }
    if (enemy.kind === 'splitter') {
      // A destroyed splitter bursts into two minis that rush the player.
      for (let i = 0; i < 2; i += 1) {
        const angle = this.random() * Math.PI * 2;
        this.pendingSpawns.push({
          kind: 'mini',
          x: enemy.x + Math.cos(angle) * 18,
          y: enemy.y + Math.sin(angle) * 18,
        });
      }
    }
    events.push(EVENT.explosion);
    if (enemy.kind === 'boss') {
      // The Dreadnought goes down in a double burst and always pays out
      // two pickups: hull on one side, triple shot on the other.
      burst(this.particles, this.random, enemy.x, enemy.y, BOSS.coreColor, 30, 300);
      this.pickups.push(createPickup('heal', enemy.x - 30, enemy.y));
      this.pickups.push(createPickup('spread', enemy.x + 30, enemy.y));
      return;
    }
    const dropRoll = this.random();
    if (enemy.kind === 'brute' || dropRoll < 0.07) {
      const kind = dropRoll < 0.03 ? 'heal' : dropRoll < 0.055 ? 'spread' : 'shield';
      this.pickups.push(createPickup(enemy.kind === 'brute' ? 'heal' : kind, enemy.x, enemy.y));
    }
  }

  applyPickup(pickup, events) {
    const player = this.player;
    if (pickup.kind === 'heal') player.health = Math.min(player.maxHealth, player.health + 26);
    if (pickup.kind === 'spread') player.spreadTimer = 9;
    if (pickup.kind === 'shield') player.shieldTimer = 12;
    burst(this.particles, this.random, pickup.x, pickup.y, '#ffffff', 12, 180);
    events.push(EVENT.pickup);
  }

  step(dt, control, events) {
    this.time += dt;
    const player = this.player;

    // Wave cycle: spawn the queue, wait for a clear arena, then either
    // open the upgrade draft (once per cleared wave) or count down to
    // the next wave.
    if (!this.over && this.phase === 'combat') {
      if (this.spawnQueue.length > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnTimer = WAVE.spawnGap;
          const kind = this.spawnQueue.shift();
          const point = spawnPoint(this.random);
          this.enemies.push(createEnemy(kind, point.x, point.y, waveScale(this.wave)));
          if (kind === 'boss') events.push(EVENT.bossSpawn);
        }
      } else if (this.enemies.length === 0) {
        if (this.wave >= 1 && !this.draftServed) {
          this.draftServed = true;
          this.phase = 'draft';
          this.choices = draftChoices(this.build, this.random);
          events.push(EVENT.draftOpen);
        } else {
          this.betweenTimer -= dt;
          if (this.betweenTimer <= 0) {
            this.betweenTimer = WAVE.betweenWaves;
            this.startNextWave(events);
          }
        }
      }
    }
    if (this.waveBannerTimer > 0) this.waveBannerTimer -= dt;

    // The draft freezes the fight: only the ambient effects keep moving
    // behind the upgrade cards until the player picks one.
    if (this.phase === 'draft') {
      this.updateParticles(dt);
      this.updateFx(dt);
      this.shake = Math.max(0, this.shake - dt * 26);
      return;
    }

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
        player.x += control.move.x * this.moveSpeed() * dt;
        player.y += control.move.y * this.moveSpeed() * dt;
        // Engine trail: a soft cyan wake streams behind a moving ship.
        if (control.move.moving) {
          this.trailTimer -= dt;
          if (this.trailTimer <= 0) {
            this.trailTimer = 0.028;
            const back = Math.atan2(control.move.y, control.move.x) + Math.PI;
            this.particles.push(createParticle(
              player.x + Math.cos(back) * 14, player.y + Math.sin(back) * 14,
              back, 30, '#3ffbe0', 0.32, 2.2,
            ));
          }
        }
      }
      clampToArena(player);
      if (control.firing) this.tryShoot(events);
      if (this.build.missiles > 0) {
        this.missileTimer -= dt;
        if (this.missileTimer <= 0) {
          this.missileTimer = MISSILE.interval;
          this.launchMissiles(events);
        }
      }
    }

    // Combo decays if the player stops scoring.
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    this.updateEnemies(dt, events);
    this.updateBullets(dt, events);
    this.updateMissiles(dt, events);
    this.updatePickups(dt, events);
    this.updateParticles(dt);
    this.updateFx(dt);
    // Enemies born mid-step (splitter minis) join the arena now, never
    // during a collision loop that is still iterating the enemy list.
    if (this.pendingSpawns.length > 0) {
      const scale = waveScale(this.wave);
      for (const spawn of this.pendingSpawns) {
        const enemy = createEnemy(spawn.kind, spawn.x, spawn.y, scale);
        clampToArena(enemy);
        this.enemies.push(enemy);
      }
      this.pendingSpawns = [];
    }
    this.shake = Math.max(0, this.shake - dt * 26);
  }

  // Shockwaves expand and die; score floaters rise and fade.
  updateFx(dt) {
    for (const wave of this.shockwaves) {
      wave.life -= dt;
      wave.radius += (wave.maxRadius / wave.maxLife) * dt;
      if (wave.life <= 0) wave.alive = false;
    }
    this.shockwaves = this.shockwaves.filter((wave) => wave.alive);
    for (const floater of this.floaters) {
      floater.life -= dt;
      floater.y -= 36 * dt;
      if (floater.life <= 0) floater.alive = false;
    }
    this.floaters = this.floaters.filter((floater) => floater.alive);
  }

  // The Void Dreadnought's brain: it stalks the player at mid range,
  // then alternates two attacks - a fan barrage of plasma orbs and a
  // telegraphed charge straight at the player's position.
  updateBoss(boss, dt, events, angleToPlayer) {
    const player = this.player;
    boss.rotation += dt * 0.85;
    boss.stateTimer -= dt;
    const dist = Math.sqrt(distanceSquared(boss, player));

    if (boss.state === 'stalk') {
      const orbit = dist <= BOSS.stalkRange;
      const moveAngle = orbit ? angleToPlayer + Math.PI / 2 : angleToPlayer;
      const speed = orbit ? boss.speed * 0.55 : boss.speed;
      boss.x += Math.cos(moveAngle) * speed * dt;
      boss.y += Math.sin(moveAngle) * speed * dt;
      if (boss.stateTimer <= 0 && player.alive) {
        boss.attackCount += 1;
        if (boss.attackCount % 2 === 1) {
          boss.state = 'barrage';
          boss.volleysLeft = BOSS.barrageVolleys;
          boss.stateTimer = 0;
        } else {
          boss.state = 'telegraph';
          boss.stateTimer = BOSS.telegraphTime;
        }
      }
      return;
    }

    if (boss.state === 'barrage') {
      if (boss.stateTimer <= 0 && boss.volleysLeft > 0) {
        boss.volleysLeft -= 1;
        boss.stateTimer = BOSS.barrageGap;
        for (let i = 0; i < BOSS.barrageOrbs; i += 1) {
          const offset = BOSS.barrageOrbs === 1 ? 0
            : -BOSS.barrageHalfAngle + (2 * BOSS.barrageHalfAngle * i) / (BOSS.barrageOrbs - 1);
          this.bullets.push(createBullet(boss.x, boss.y, angleToPlayer + offset, false));
        }
        events.push(EVENT.bossAttack);
      }
      if (boss.volleysLeft <= 0 && boss.stateTimer <= 0) {
        boss.state = 'stalk';
        boss.stateTimer = BOSS.stalkTime;
      }
      return;
    }

    if (boss.state === 'telegraph') {
      // It hangs still and flashes: the charge is coming, move!
      boss.flashTimer = 0.06;
      if (boss.stateTimer <= 0) {
        boss.state = 'charge';
        boss.chargeAngle = angleToPlayer;
        boss.stateTimer = BOSS.chargeTime;
        events.push(EVENT.bossAttack);
      }
      return;
    }

    // charge
    boss.x += Math.cos(boss.chargeAngle) * BOSS.chargeSpeed * dt;
    boss.y += Math.sin(boss.chargeAngle) * BOSS.chargeSpeed * dt;
    if (boss.stateTimer <= 0) {
      boss.state = 'stalk';
      boss.stateTimer = BOSS.stalkTime;
    }
  }

  updateEnemies(dt, events) {
    const player = this.player;
    for (const enemy of this.enemies) {
      enemy.flashTimer = Math.max(0, enemy.flashTimer - dt);
      // An untouched elite shield quietly recharges to full.
      if (enemy.maxShield > 0) {
        enemy.shieldRegenTimer -= dt;
        if (enemy.shieldRegenTimer <= 0 && enemy.shield < enemy.maxShield) {
          enemy.shield = Math.min(enemy.maxShield, enemy.shield + SHIELD.regenRate * dt);
        }
      }
      const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      if (enemy.kind === 'boss') {
        this.updateBoss(enemy, dt, events, angleToPlayer);
        clampToArena(enemy);
        if (player.alive && distanceSquared(enemy, player) < (enemy.radius + player.radius) ** 2) {
          this.hurtPlayer(enemy.damage, events);
          burst(this.particles, this.random, enemy.x, enemy.y, enemy.color, 10, 200);
        }
        continue;
      }
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
          if (bullet.hitIds && bullet.hitIds.has(enemy.id)) continue;
          if (distanceSquared(bullet, enemy) < (bullet.radius + enemy.radius) ** 2) {
            this.shotsHit += 1;
            this.damageEnemy(enemy, bullet.damage, events);
            if (bullet.pierce > 0) {
              // Lance rounds punch through and fly on to the next hull.
              bullet.pierce -= 1;
              if (!bullet.hitIds) bullet.hitIds = new Set();
              bullet.hitIds.add(enemy.id);
            } else {
              bullet.alive = false;
            }
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
