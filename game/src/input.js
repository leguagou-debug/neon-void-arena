// Neon Void Arena - keyboard and mouse input.
// WASD or the arrow keys move, the mouse aims, holding the mouse button
// (or Space) fires, Shift or the right mouse button dashes, P pauses,
// M mutes and Enter starts or restarts.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouseX = 640;
    this.mouseY = 200;
    this.mouseDown = false;
    this.dashQueued = false;
    this.pauseQueued = false;
    this.confirmQueued = false;
    this.choiceQueued = null;
    this.clickQueued = null;
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
      if (key === 'shift') this.dashQueued = true;
      if (key === 'p' || key === 'escape') this.pauseQueued = true;
      if (key === 'enter') this.confirmQueued = true;
      if (key === '1' || key === '2' || key === '3') this.choiceQueued = Number(key) - 1;
      this.keys.add(key);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    canvas.addEventListener('mousemove', (event) => {
      const point = this.toCanvas(event);
      this.mouseX = point.x;
      this.mouseY = point.y;
    });
    canvas.addEventListener('mousedown', (event) => {
      if (event.button === 2) this.dashQueued = true;
      else this.mouseDown = true;
      this.confirmQueued = true;
      this.clickQueued = this.toCanvas(event);
    });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  toCanvas(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * this.canvas.height,
    };
  }

  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length, moving: x !== 0 || y !== 0 };
  }

  firing() {
    return this.mouseDown || this.keys.has(' ');
  }

  takeDash() {
    const queued = this.dashQueued;
    this.dashQueued = false;
    return queued;
  }

  takePause() {
    const queued = this.pauseQueued;
    this.pauseQueued = false;
    return queued;
  }

  takeConfirm() {
    const queued = this.confirmQueued;
    this.confirmQueued = false;
    return queued;
  }

  // Upgrade draft answers: a number key (card index) or a click point
  // that main.js maps back to a card with the shared card geometry.
  takeChoice() {
    const queued = this.choiceQueued;
    this.choiceQueued = null;
    return queued;
  }

  takeClick() {
    const queued = this.clickQueued;
    this.clickQueued = null;
    return queued;
  }
}
