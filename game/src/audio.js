// Neon Void Arena - synthesized sound effects with the Web Audio API.
// No audio files are shipped: every blip is an oscillator shaped in code,
// which keeps the game fully offline and tiny.

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    this.context = new AudioCtor();
  }

  tone(frequency, duration, type, volume, slideTo) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(this.context.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  shoot() { this.tone(880, 0.07, 'square', 0.05, 320); }
  enemyHit() { this.tone(220, 0.06, 'sawtooth', 0.06, 140); }
  explosion() { this.tone(160, 0.28, 'sawtooth', 0.14, 38); }
  playerHurt() { this.tone(110, 0.22, 'triangle', 0.18, 55); }
  pickup() { this.tone(620, 0.14, 'sine', 0.12, 1240); }
  waveStart() { this.tone(392, 0.16, 'square', 0.09, 784); }
  bossSpawn() { this.tone(196, 0.45, 'sawtooth', 0.13, 49); }
  bossAttack() { this.tone(92, 0.3, 'sawtooth', 0.15, 44); }
  dash() { this.tone(300, 0.12, 'sine', 0.08, 900); }
  draftOpen() { this.tone(523, 0.18, 'square', 0.08, 1046); }
  upgrade() { this.tone(659, 0.22, 'sine', 0.12, 1318); }
  missile() { this.tone(240, 0.16, 'sawtooth', 0.05, 720); }
  gameOver() { this.tone(440, 0.7, 'triangle', 0.14, 55); }
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}
