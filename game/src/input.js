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
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
      if (key === 'shift') this.dashQueued = true;
      if (key === 'p' || key === 'escape') this.pauseQueued = true;
      if (key === 'enter') this.confirmQueued = true;
      this.keys.add(key);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', (event) => {
      if (event.button === 2) this.dashQueued = true;
      else this.mouseDown = true;
      this.confirmQueued = true;
    });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
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
}
