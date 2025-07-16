class Spoiler {
  static instances = [];

  /**
   * @param {HTMLElement} inner - .spoiler__inner
   */
  constructor(inner) {
    this.inner     = inner;
    this.root      = inner.closest('.spoiler');
    this.canvas    = inner.querySelector('.spoiler__canvas');
    this.contentEl = inner.querySelector('.spoiler__content');
    this.ctx       = this.canvas.getContext('2d');
    this.particles = [];
    this.isRevealed = false;
    this.animationFrame = null;

    const ds = this.root.dataset;
    this.fixedCount = ds.particlesCount ? parseInt(ds.particlesCount) : null;
    this.density    = parseFloat(ds.particlesDensity)  || 0.04;
    this.minSize    = parseFloat(ds.particlesMinSize)  || 0.8;
    this.maxSize    = parseFloat(ds.particlesMaxSize)  || 1.6;

    this.root.setAttribute('role', 'button');
    this.root.setAttribute('tabindex', '0');
    this.root.setAttribute('aria-expanded', 'false');

    this.renderText();
    this.setupObserver();
    this.bindEvents();

    Spoiler.instances.push(this);
  }

  renderText() {
    const txt = this.root.dataset.text?.trim() || '';
    const isHTML = /<[^>]+>/.test(txt);
    if (isHTML) this.contentEl.innerHTML = txt;
    else        this.contentEl.textContent = txt;
  }

  setupObserver() {
    this.ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      this.initCanvas(width, height);
      this.generateParticles(width, height);
      this.animate();
    });
    this.ro.observe(this.inner);
  }

  initCanvas(w, h) {
    const cw = Math.floor(w), ch = Math.floor(h);
    this.canvas.width  = cw;
    this.canvas.height = ch;
    this.canvas.style.width  = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
  }

  generateParticles(w, h) {
    let count;
    if (this.fixedCount !== null) {
      count = this.fixedCount;
    } else {
      count = Math.ceil(w * h * this.density);
    }
    const MAX = 5000;
    if (count > MAX) count = MAX;

    this.particles = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * (this.maxSize - this.minSize) + this.minSize;
      this.particles.push({
        x:      Math.random() * w,
        y:      Math.random() * h,
        size,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: (Math.random() - 0.5) * 0.6
      });
    }
  }

  animate() {
    if (this.isRevealed) return;
    const { ctx, canvas, particles } = this;
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#aaa';
    particles.forEach(p => {
      p.x += p.speedX; p.y += p.speedY;
      if (p.x < 0)            p.x = canvas.width;
      else if (p.x > canvas.width)  p.x = 0;
      if (p.y < 0)            p.y = canvas.height;
      else if (p.y > canvas.height) p.y = 0;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  reveal() {
    if (this.isRevealed) return;
    this.isRevealed = true;
    this.root.classList.add('spoiler--revealed');
    this.root.setAttribute('aria-expanded','true');
    this.stopAnimation();
  }

  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  bindEvents() {
    this.root.addEventListener('click', () => Spoiler.revealAll());
    this.root.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        Spoiler.revealAll();
      }
    });
  }

  static revealAll() {
    Spoiler.instances.forEach(inst => inst.reveal());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.spoiler__inner').forEach(inner => {
    new Spoiler(inner);
  });
});