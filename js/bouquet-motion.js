/* =========================================================
   LOVE QUEST — BOUQUET SCROLL MOTION
   SVG + CSS + JS, sem bibliotecas adicionais.
   O movimento é ligado ao progresso do scroll e é reversível.
   ========================================================= */
(() => {
  'use strict';

  const root = document.getElementById('bouquet-motion');
  const stage = document.getElementById('bouquet-stage');
  const bouquet = document.getElementById('bouquet-svg');
  const ribbon = document.getElementById('bouquet-ribbon');
  const flowersLayer = document.getElementById('bouquet-detached');
  const petalsLayer = document.getElementById('bouquet-petals');

  if (!root || !stage || !bouquet || !flowersLayer || !petalsLayer) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return;

  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Cada flor começa a se desprender em um trecho diferente do scroll.
  const flowerPaths = [
    { x: 37, y: 30, tx: -26, ty: -21, rot: -150, scale: 1.00, delay: .08 },
    { x: 51, y: 22, tx: 25, ty: -27, rot: 130, scale: 1.02, delay: .15 },
    { x: 64, y: 33, tx: 30, ty: 6, rot: 180, scale: .90, delay: .23 },
    { x: 45, y: 42, tx: -31, ty: 18, rot: -205, scale: .82, delay: .31 },
    { x: 57, y: 42, tx: 22, ty: 28, rot: 235, scale: .72, delay: .39 }
  ];

  const detached = flowerPaths.map((cfg, i) => {
    const el = document.createElement('div');
    el.className = `bouquet-detached-flower bouquet-detached-flower-${i + 1}`;
    el.innerHTML = `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <radialGradient id="bdg-${i}" cx="36%" cy="30%">
            <stop offset="0" stop-color="#fff8f2"/>
            <stop offset=".28" stop-color="#f2b8b5"/>
            <stop offset=".66" stop-color="#a93548"/>
            <stop offset="1" stop-color="#4b101c"/>
          </radialGradient>
        </defs>
        <g transform="translate(50 50)">
          <ellipse rx="42" ry="31" transform="rotate(0)" fill="url(#bdg-${i})"/>
          <ellipse rx="42" ry="31" transform="rotate(72)" fill="url(#bdg-${i})" opacity=".94"/>
          <ellipse rx="42" ry="31" transform="rotate(144)" fill="url(#bdg-${i})" opacity=".90"/>
          <ellipse rx="42" ry="31" transform="rotate(216)" fill="url(#bdg-${i})" opacity=".86"/>
          <ellipse rx="42" ry="31" transform="rotate(288)" fill="url(#bdg-${i})" opacity=".82"/>
          <circle r="24" fill="none" stroke="#f9d3cc" stroke-width="6" opacity=".72"/>
          <circle r="12" fill="none" stroke="#7a1e30" stroke-width="6"/>
          <circle r="4.5" fill="#3d1019"/>
        </g>
      </svg>`;
    flowersLayer.appendChild(el);
    return { ...cfg, el };
  });

  const petalPalette = ['#f5c8c5', '#d97c86', '#a73547', '#f8e3d9', '#8c2638'];
  const petals = Array.from({ length: 34 }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'bouquet-petal';
    const angle = Math.random() * Math.PI * 2;
    const radius = 14 + Math.random() * 26;
    const startX = window.innerWidth * (.25 + Math.random() * .18) + Math.cos(angle) * radius;
    const startY = window.innerHeight * (.30 + Math.random() * .20) + Math.sin(angle) * radius;
    const driftX = (Math.random() - .5) * window.innerWidth * 1.15;
    const driftY = window.innerHeight * (.35 + Math.random() * .85);
    const spin = -520 + Math.random() * 1040;
    const size = 8 + Math.random() * 16;
    el.style.width = `${size}px`;
    el.style.height = `${size * 1.45}px`;
    el.innerHTML = `<svg viewBox="0 0 40 58" aria-hidden="true"><path d="M20 2C34 12 39 28 20 56 1 28 6 12 20 2Z" fill="${petalPalette[i % petalPalette.length]}"/></svg>`;
    petalsLayer.appendChild(el);
    return { el, startX, startY, driftX, driftY, spin, phase: Math.random() * Math.PI * 2, depth: .65 + Math.random() * .65, delay: .16 + Math.random() * .32 };
  });

  let target = 0;
  let current = 0;
  let ticking = false;

  function readScroll() {
    const y = window.scrollY || window.pageYOffset || 0;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    // A experiência principal acontece no primeiro ~55% da página, mas continua reversível.
    target = clamp((y - 30) / Math.max(900, max * .58));
    root.classList.toggle('is-active', target > .005);
    if (!ticking) {
      requestAnimationFrame(() => {
        ticking = false;
        readScroll();
      });
      ticking = true;
    }
  }

  function render() {
    current = lerp(current, target, .085);
    const p = ease(current);
    const mobile = window.innerWidth < 769;

    const stageX = lerp(0, mobile ? -24 : -78, p);
    const stageY = lerp(0, mobile ? 72 : 118, p);
    const stageRot = lerp(-3, -15, p);
    const stageScale = lerp(1, mobile ? .70 : .78, p);

    stage.style.transform = `translate3d(${stageX}px,${stageY}px,0) rotate(${stageRot}deg) scale(${stageScale})`;
    stage.style.opacity = String(lerp(1, .035, Math.max(0, p - .18) / .82));

    // O laço solta-se antes das flores.
    if (ribbon) {
      const rp = ease(clamp((p - .10) / .55));
      ribbon.style.transform = `translate3d(${lerp(0, -135, rp)}px,${lerp(0, 155, rp)}px) rotate(${lerp(0, -32, rp)}deg) scale(${lerp(1, .82, rp)})`;
      ribbon.style.opacity = String(lerp(1, 0, rp));
    }

    detached.forEach((f, i) => {
      const local = ease(clamp((p - f.delay) / (.78 - f.delay)));
      const wobble = Math.sin(p * 11 + i * 1.7) * (mobile ? 7 : 12);
      const x = lerp(f.x, f.x + f.tx, local);
      const y = lerp(f.y, f.y + f.ty, local);
      const px = x / 100 * stage.clientWidth;
      const py = y / 100 * stage.clientHeight;
      const tx = lerp(px, px + f.tx / 100 * window.innerWidth, local) + wobble;
      const ty = lerp(py, py + f.ty / 100 * window.innerHeight, local);
      const rot = f.rot * local + wobble * 2;
      const opacity = clamp((p - f.delay) * 5.5);
      f.el.style.opacity = String(opacity);
      f.el.style.transform = `translate3d(${tx}px,${ty}px,0) rotate(${rot}deg) scale(${lerp(f.scale, .72, local)})`;
    });

    petals.forEach((pt, i) => {
      const local = ease(clamp((p - pt.delay) / (.98 - pt.delay)));
      const wind = Math.sin(p * 10 + pt.phase) * (mobile ? 18 : 30);
      const x = pt.startX + pt.driftX * local + wind;
      const y = pt.startY + pt.driftY * local;
      const rot = pt.spin * local + Math.sin(p * 7 + i) * 18;
      pt.el.style.opacity = String(clamp(local * 4.2) * .92);
      pt.el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${pt.depth})`;
    });

    requestAnimationFrame(render);
  }

  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', readScroll, { passive: true });
  readScroll();
  render();
})();
