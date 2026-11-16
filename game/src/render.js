// Neon Void Arena - all drawing. A dark void, a glowing grid, neon ships
// drawn with shadow blur, particles, and the screens layered on top:
// title, HUD, wave banners, pause, and the game-over results panel.
// The renderer only reads the world; it never changes it.

import { ARENA, BOSS, COLORS, PLAYER } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function glowCircle(ctx, x, y, radius, color) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGrid(ctx, time) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  const pulse = 0.5 + Math.sin(time * 1.4) * 0.12;
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = ARENA.wall; x <= ARENA.width - ARENA.wall; x += 52) {
    ctx.moveTo(x, ARENA.wall);
    ctx.lineTo(x, ARENA.height - ARENA.wall);
  }
  for (let y = ARENA.wall; y <= ARENA.height - ARENA.wall; y += 52) {
    ctx.moveTo(ARENA.wall, y);
    ctx.lineTo(ARENA.width - ARENA.wall, y);
  }
  ctx.stroke();
  ctx.strokeStyle = `rgba(255, 43, 214, ${0.1 * pulse + 0.05})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ff2bd6';
  ctx.shadowBlur = 16;
  ctx.strokeRect(ARENA.wall, ARENA.wall, ARENA.width - ARENA.wall * 2, ARENA.height - ARENA.wall * 2);
  ctx.shadowBlur = 0;
}

function drawPlayer(ctx, player, time) {
  if (!player.alive) return;
  if (player.invulnerableTimer > 0 && Math.floor(time * 18) % 2 === 0 && player.dashTimer <= 0) return;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.aimAngle);
  ctx.shadowColor = COLORS.player;
  ctx.shadowBlur = 22;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-13, -12);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-13, 12);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.playerCore;
  ctx.beginPath();
  ctx.arc(2, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.shieldTimer > 0) {
    ctx.save();
    ctx.strokeStyle = COLORS.shield;
    ctx.globalAlpha = 0.65 + Math.sin(time * 6) * 0.2;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.shield;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawEnemy(ctx, enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  // Ordinary enemies flash white when hit; the boss only pales to a
  // lighter crimson so its colour identity survives its own barrage.
  const color = enemy.flashTimer > 0
    ? (enemy.kind === 'boss' ? '#ff7285' : '#ffffff')
    : enemy.color;
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  if (enemy.kind === 'chaser') {
    ctx.rotate(Math.atan2(enemy.vy, enemy.vx) || 0);
    ctx.beginPath();
    ctx.moveTo(17, 0); ctx.lineTo(-13, -12); ctx.lineTo(-13, 12); ctx.closePath(); ctx.fill();
  } else if (enemy.kind === 'dart') {
    ctx.beginPath();
    ctx.moveTo(13, 0); ctx.lineTo(-10, -7); ctx.lineTo(-10, 7); ctx.closePath(); ctx.fill();
  } else if (enemy.kind === 'brute') {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2 + enemy.wobblePhase;
      const px = Math.cos(angle) * enemy.radius;
      const py = Math.sin(angle) * enemy.radius;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  } else if (enemy.kind === 'boss') {
    // The Void Dreadnought: a rotating ring of twelve spikes around a
    // counter-rotating hull, with a burning gold core. Nothing else in
    // the arena looks remotely like it.
    ctx.save();
    ctx.rotate(enemy.rotation || 0);
    ctx.beginPath();
    const spikes = 12;
    for (let i = 0; i < spikes; i += 1) {
      const angle = (i / spikes) * Math.PI * 2;
      const midAngle = angle + Math.PI / spikes;
      const tipX = Math.cos(angle) * (enemy.radius + 14);
      const tipY = Math.sin(angle) * (enemy.radius + 14);
      const baseX = Math.cos(midAngle) * enemy.radius;
      const baseY = Math.sin(midAngle) * enemy.radius;
      if (i === 0) ctx.moveTo(tipX, tipY); else ctx.lineTo(tipX, tipY);
      ctx.lineTo(baseX, baseY);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(-(enemy.rotation || 0) * 1.6);
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const px = Math.cos(angle) * enemy.radius * 0.66;
      const py = Math.sin(angle) * enemy.radius * 0.66;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2b0018';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.4, 0, Math.PI * 2); ctx.fill();
    glowCircle(ctx, 0, 0, enemy.radius * 0.24, '#ffd319');
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b0018';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.45, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (enemy.maxHealth > 3 && enemy.health < enemy.maxHealth) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 12, enemy.radius * 2, 4);
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 12, enemy.radius * 2 * (enemy.health / enemy.maxHealth), 4);
  }
}

function drawPickup(ctx, pickup, time) {
  const bob = Math.sin(time * 4 + pickup.x) * 3;
  const y = pickup.y + bob;
  const labels = { heal: '+', spread: 'W', shield: 'O' };
  const colors = { heal: '#3dff7c', spread: '#ffb347', shield: '#40e0ff' };
  glowCircle(ctx, pickup.x, y, 7, colors[pickup.kind]);
  ctx.save();
  ctx.strokeStyle = colors[pickup.kind];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pickup.x, y, pickup.radius + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(labels[pickup.kind], pickup.x, y - 18);
  ctx.restore();
}

function drawWorld(ctx, world) {
  drawGrid(ctx, world.time);
  for (const pickup of world.pickups) drawPickup(ctx, pickup, world.time);
  for (const particle of world.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    ctx.restore();
  }
  for (const bullet of world.bullets) {
    glowCircle(ctx, bullet.x, bullet.y, bullet.radius, bullet.fromPlayer ? COLORS.bullet : COLORS.enemyBullet);
  }
  for (const enemy of world.enemies) {
    enemy.vx = world.player.x - enemy.x;
    enemy.vy = world.player.y - enemy.y;
    drawEnemy(ctx, enemy);
  }
  drawPlayer(ctx, world.player, world.time);
  // Aim reticle.
  ctx.save();
  ctx.strokeStyle = 'rgba(63, 251, 224, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(world.player.x + Math.cos(world.player.aimAngle) * 130, world.player.y + Math.sin(world.player.aimAngle) * 130, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx, world, best) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`SCORE ${world.score.toLocaleString()}`, 44, 62);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dimText;
  ctx.fillText(`BEST ${Math.max(best, world.score).toLocaleString()}`, 44, 86);
  ctx.fillText(`COMBO x${world.combo.toFixed(2).replace(/\.?0+$/, '')}`, 44, 110);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`WAVE ${Math.max(1, world.wave)}`, ARENA.width / 2, 62);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dimText;
  ctx.fillText(`HOSTILES ${world.enemies.length + world.spawnQueue.length}`, ARENA.width / 2, 86);

  // Boss health bar, top centre, shown while the Dreadnought lives.
  const boss = world.enemies.find((enemy) => enemy.kind === 'boss');
  if (boss) {
    const bossBarWidth = 560;
    const bossBarX = (ARENA.width - bossBarWidth) / 2;
    ctx.fillStyle = '#ff2040';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.shadowColor = '#ff2040';
    ctx.shadowBlur = 10;
    ctx.fillText(BOSS.name, ARENA.width / 2, 108);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(bossBarX, 116, bossBarWidth, 12);
    ctx.fillStyle = '#ff2040';
    ctx.shadowColor = '#ff2040';
    ctx.shadowBlur = 12;
    ctx.fillRect(bossBarX, 116, bossBarWidth * Math.max(0, boss.health / boss.maxHealth), 12);
    ctx.shadowBlur = 0;
  }

  // Health bar, top right.
  const barWidth = 240;
  const healthRatio = world.player.health / PLAYER.maxHealth;
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('HULL', ARENA.width - 44, 52);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(ARENA.width - 44 - barWidth, 60, barWidth, 14);
  ctx.fillStyle = healthRatio > 0.35 ? '#3dff7c' : '#ff2e88';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 10;
  ctx.fillRect(ARENA.width - 44 - barWidth, 60, barWidth * healthRatio, 14);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.dimText;
  ctx.font = '14px system-ui, sans-serif';
  const extras = [];
  if (world.player.spreadTimer > 0) extras.push(`TRIPLE SHOT ${Math.ceil(world.player.spreadTimer)}s`);
  if (world.player.shieldTimer > 0) extras.push(`SHIELD ${Math.ceil(world.player.shieldTimer)}s`);
  if (world.player.dashCooldown <= 0) extras.push('DASH READY');
  ctx.fillText(extras.join('   '), ARENA.width - 44, 96);
  ctx.restore();
}

function centredPanel(ctx, width, height) {
  const x = (ARENA.width - width) / 2;
  const y = (ARENA.height - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(5, 3, 24, 0.82)';
  ctx.strokeStyle = '#ff2bd6';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ff2bd6';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 18);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  return { x, y };
}

export function render(ctx, world, screen, best) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawWorld(ctx, world);
  ctx.restore();

  if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(ctx, world, best);
  if (screen === SCREEN_PLAY && world.waveBannerTimer > 0 && world.wave > 0) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(1, world.waveBannerTimer);
    ctx.fillStyle = '#ffe95a';
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.shadowColor = '#ffb347';
    ctx.shadowBlur = 26;
    ctx.fillText(`WAVE ${world.wave}`, ARENA.width / 2, 190);
    ctx.restore();
  }

  if (screen === SCREEN_TITLE) {
    drawHud(ctx, world, best);
    const panel = centredPanel(ctx, 700, 430);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3ffbe0';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.shadowColor = '#3ffbe0';
    ctx.shadowBlur = 30;
    ctx.fillText('NEON VOID', ARENA.width / 2, panel.y + 92);
    ctx.fillStyle = '#ff2bd6';
    ctx.shadowColor = '#ff2bd6';
    ctx.fillText('ARENA', ARENA.width / 2, panel.y + 158);
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.text;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Survive the waves. Chain kills to raise your combo.', ARENA.width / 2, panel.y + 208);
    ctx.fillStyle = COLORS.dimText;
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText('WASD / Arrows - move      Mouse - aim      Hold click / Space - fire', ARENA.width / 2, panel.y + 252);
    ctx.fillText('Shift / Right click - dash      P - pause      M - mute', ARENA.width / 2, panel.y + 280);
    ctx.fillText('Grab + hull, W triple shot and O shield drops from fallen brutes.', ARENA.width / 2, panel.y + 308);
    ctx.fillStyle = '#ff2040';
    ctx.fillText('Every 5th wave the VOID DREADNOUGHT comes for you.', ARENA.width / 2, panel.y + 334);
    ctx.fillStyle = '#ffe95a';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS ENTER TO LAUNCH', ARENA.width / 2, panel.y + 362);
    ctx.fillStyle = COLORS.dimText;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(`BEST SCORE ${best.toLocaleString()}`, ARENA.width / 2, panel.y + 396);
    ctx.restore();
  }

  if (screen === SCREEN_PAUSED) {
    const panel = centredPanel(ctx, 420, 210);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.fillText('PAUSED', ARENA.width / 2, panel.y + 88);
    ctx.fillStyle = COLORS.dimText;
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText('Press P to resume', ARENA.width / 2, panel.y + 132);
    ctx.fillText(`Score ${world.score.toLocaleString()} - Wave ${world.wave}`, ARENA.width / 2, panel.y + 162);
    ctx.restore();
  }

  if (screen === SCREEN_OVER) {
    drawHud(ctx, world, best);
    const panel = centredPanel(ctx, 620, 440);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff2e88';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = 26;
    ctx.fillText('VOID CLAIMED YOU', ARENA.width / 2, panel.y + 86);
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.text;
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(`FINAL SCORE  ${world.score.toLocaleString()}`, ARENA.width / 2, panel.y + 148);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = COLORS.dimText;
    ctx.fillText(`Waves survived  ${world.wave}`, ARENA.width / 2, panel.y + 196);
    ctx.fillText(`Kills  ${world.kills}`, ARENA.width / 2, panel.y + 228);
    ctx.fillText(`Accuracy  ${world.accuracy()}%`, ARENA.width / 2, panel.y + 260);
    ctx.fillText(`Best  ${Math.max(best, world.score).toLocaleString()}`, ARENA.width / 2, panel.y + 292);
    ctx.fillStyle = '#ffe95a';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS ENTER TO RETRY', ARENA.width / 2, panel.y + 356);
    ctx.restore();
  }
}
