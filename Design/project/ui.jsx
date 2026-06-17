/* EcoRise — shared UI components. Exports to window. */

/* ---------- Icon set (24×24 stroke) ---------- */
const ICONS = {
  home:  'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  feed:  'M4 5h16M4 12h16M4 19h10',
  grid:  'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  trophy:'M7 4h10v3a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 14h6M8 20h8M12 14v6',
  user:  'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5',
  plus:  'M12 5v14M5 12h14',
  camera:'M4 8h3l1.5-2.2h7L17 8h3v11H4zM12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z',
  bike:  'M6.5 18.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17.5 18.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM6.5 15h6l3.5-7M10 8h4M14 8l3.5 7',
  leaf:  'M5 19c0-9 6-14 14-14 0 9-5 14-14 14ZM5 19c2-5 5-7 9-9',
  drop:  'M12 4s6 6.5 6 10.5a6 6 0 0 1-12 0C6 10.5 12 4 12 4Z',
  trash: 'M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13',
  users: 'M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20c0-3 2.7-5 6-5s6 2 6 5M16 5.5a3.5 3.5 0 0 1 0 7M17 15c2.5.4 4 2.2 4 5',
  fire:  'M12 3c1 3-1.5 4-1.5 6.5A2.5 2.5 0 0 0 13 12c.5-1 .3-2 .3-2 1.7 1 2.7 2.8 2.7 4.8a6 6 0 1 1-11.6-2C5.5 9 9 8 9 4.5c1.2.7 2.3 1.4 3 2.5',
  heart: 'M12 20.3 4.2 13C1.5 10.3 2.6 6 6 5.2c2-.5 3.8.7 6 3 2.2-2.3 4-3.5 6-3 3.4.8 4.5 5.1 1.8 7.8L12 20.3Z',
  heartFull: 'M12 20.3 4.2 13C1.5 10.3 2.6 6 6 5.2c2-.5 3.8.7 6 3 2.2-2.3 4-3.5 6-3 3.4.8 4.5 5.1 1.8 7.8L12 20.3Z',
  chat:  'M5 5h14v10H9l-4 4V5Z',
  dots:  'M5 12h.01M12 12h.01M19 12h.01',
  check: 'M5 12.5 10 17 19 6.5',
  pin:   'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  bell:  'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 19a2 2 0 0 0 4 0',
  gift:  'M4 11h16v9H4zM4 7h16v4H4zM12 7v13M12 7S10.5 3 8 4s.5 3 4 3ZM12 7s1.5-4 4-3-.5 3-4 3Z',
  share: 'M16 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  settings:'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 13.5l1.5 1.2-1.5 2.6-1.9-.6a6 6 0 0 1-1.5.9l-.4 2h-3l-.4-2a6 6 0 0 1-1.5-.9l-1.9.6-1.5-2.6 1.5-1.2a6 6 0 0 1 0-3L3.3 9.3l1.5-2.6 1.9.6a6 6 0 0 1 1.5-.9l.4-2h3l.4 2a6 6 0 0 1 1.5.9l1.9-.6 1.5 2.6-1.5 1.2a6 6 0 0 1 0 3Z',
  x:     'M6 6l12 12M18 6 6 18',
  chevR: 'M9 5l7 7-7 7',
  chevL: 'M15 5l-7 7 7 7',
  sparkle:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
  mail:  'M4 6h16v12H4zM4 7l8 6 8-6',
  google:'',
  scan:  'M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3M4 12h16',
  flame: 'M12 3c1 3-1.5 4-1.5 6.5A2.5 2.5 0 0 0 13 12c.5-1 .3-2 .3-2 1.7 1 2.7 2.8 2.7 4.8a6 6 0 1 1-11.6-2C5.5 9 9 8 9 4.5c1.2.7 2.3 1.4 3 2.5',
  star:  'M12 3.5l2.5 5.6 6.1.6-4.6 4 1.4 6-5.4-3.2L6.6 19.7l1.4-6-4.6-4 6.1-.6L12 3.5Z',
  arrowR:'M5 12h14M13 6l6 6-6 6',
  bolt:  'M13 3 4 14h6l-1 7 9-11h-6l1-7Z',
};

function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 2, fill = false, style }) {
  if (name === 'google') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5Z"/>
        <path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10 10 0 0 0 12 22Z"/>
        <path fill="#FBBC05" d="M6.2 13.6a6 6 0 0 1 0-3.8V7.1H2.7a10 10 0 0 0 0 9l3.5-2.5Z"/>
        <path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 2.7 7.1l3.5 2.7C7 7.7 9.3 5.9 12 5.9Z"/>
      </svg>
    );
  }
  const filled = fill && ICONS[name + 'Full'];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <path d={filled ? ICONS[name + 'Full'] : ICONS[name]} stroke={fill && ICONS[name+'Full'] ? 'none' : color}
        fill={fill && ICONS[name+'Full'] ? color : 'none'}
        strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Avatar (photo + initials fallback + optional ring) ---------- */
function Avatar({ src, name = '?', size = 44, ring, glow, style }) {
  const [err, setErr] = React.useState(false);
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const border = ring ? `2.5px solid ${ring}` : 'none';
  const box = glow ? `0 0 16px ${ring || 'rgba(0,230,118,.5)'}` : 'none';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border, boxShadow: box, overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(135deg,#3C3C68,#232342)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      {!err
        ? <img src={src} alt="" onError={() => setErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: size * .38, color: '#fff' }}>{initials}</span>}
    </div>
  );
}

/* ---------- Points chip ---------- */
function PointsChip({ pts, variant = 'green', prefix = '+', suffix = 'pts', style }) {
  return (
    <span className={`chip chip-${variant}`} style={style}>
      {variant === '2x' && <Icon name="bolt" size={13} color="#1a1304" />}
      {prefix}{pts.toLocaleString()} {suffix}
    </span>
  );
}

/* ---------- Rank badge ---------- */
function RankBadge({ rank, style }) {
  const metal = rank === 1 ? ['#FFE066', '#E0A92E', '#5a4410']
    : rank === 2 ? ['#EAF1FB', '#9AAAC4', '#33405a']
    : rank === 3 ? ['#FBC08A', '#C26E38', '#5a3013']
    : null;
  if (metal) {
    return (
      <span className="rankbadge" style={{
        background: `linear-gradient(180deg, ${metal[0]}, ${metal[1]})`,
        color: metal[2], boxShadow: `0 4px 12px ${metal[1]}66, inset 0 1px 0 rgba(255,255,255,.6)`, ...style,
      }}>{rank}</span>
    );
  }
  return (
    <span className="rankbadge" style={{ background: 'rgba(255,255,255,.07)', color: 'var(--text-muted)', ...style }}>{rank}</span>
  );
}

/* ---------- Streak flame ---------- */
function Streak({ n, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#FF8A4B', fontFamily: 'var(--display)', fontWeight: 600, fontSize: size }}>
      <Icon name="flame" size={size + 3} color="#FF8A4B" /> {n}
    </span>
  );
}

/* ---------- Confetti (canvas burst) ---------- */
function fireConfetti(host, opts = {}) {
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

/* ---------- Toast ---------- */
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 96, transform: 'translateX(-50%)',
      zIndex: 80, display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(20,20,40,.95)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0,230,118,.4)', boxShadow: '0 12px 30px rgba(0,0,0,.5), 0 0 30px rgba(0,230,118,.2)',
      borderRadius: 9999, padding: '12px 20px', whiteSpace: 'nowrap',
      animation: 'popIn .4s cubic-bezier(.2,.8,.2,1.2) both', maxWidth: '88%',
    }}>
      <span style={{ display: 'inline-flex', width: 26, height: 26, borderRadius: '50%', background: 'var(--green)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={16} color="#06281A" strokeWidth={3} />
      </span>
      <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15 }}>{toast}</span>
    </div>
  );
}

Object.assign(window, { Icon, Avatar, PointsChip, RankBadge, Streak, fireConfetti, Toast });
