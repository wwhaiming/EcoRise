/* EcoRise — Confetti canvas burst */

export function fireConfetti(host, opts = {}) {
  const { count = 90, origin = { x: 0.5, y: 0.4 } } = opts;
  if (!host) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = host.clientWidth, H = host.clientHeight;
  const cv = document.createElement('canvas');
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.cssText = `position:absolute;inset:0;width:${W}px;height:${H}px;pointer-events:none;z-index:99`;
  host.appendChild(cv);
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const colors = ['#00E676', '#7C4DFF', '#FF6B6B', '#FFD23F', '#38BDF8', '#1AF08A'];
  const ox = origin.x * W, oy = origin.y * H;
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 9;
    return {
      x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4,
      g: 0.18 + Math.random() * 0.12, w: 6 + Math.random() * 6, h: 9 + Math.random() * 7,
      rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .35,
      c: colors[(Math.random() * colors.length) | 0], life: 0, max: 80 + Math.random() * 40,
    };
  });
  let raf;
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    parts.forEach(p => {
      if (p.life > p.max) return;
      alive = true;
      p.life++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr;
      const o = Math.max(0, 1 - p.life / p.max);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = o;
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    if (alive) raf = requestAnimationFrame(tick);
    else cv.remove();
  };
  raf = requestAnimationFrame(tick);
}
