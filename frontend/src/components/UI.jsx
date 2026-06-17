/* GeoRise — Small UI components: PointsChip, RankBadge, Streak, Toast, Switch */
import Icon from './Icon';
import { METAL } from './constants';

// ── Points Chip ──
export function PointsChip({ pts, variant = 'green', prefix = '+', suffix = 'pts', style }) {
  return (
    <span className={`chip chip-${variant}`} style={style}>
      {variant === '2x' && <Icon name="bolt" size={13} color="#1a1304" />}
      {prefix}{typeof pts === 'number' ? pts.toLocaleString() : pts} {suffix}
    </span>
  );
}

// ── Rank Badge ──
export function RankBadge({ rank, style }) {
  const metal = METAL[rank];
  if (metal) {
    return (
      <span className="rankbadge" style={{
        background: `linear-gradient(180deg, ${metal.a}, ${metal.b})`,
        color: metal.ink, boxShadow: `0 4px 12px ${metal.b}66, inset 0 1px 0 rgba(255,255,255,.6)`, ...style,
      }}>{rank}</span>
    );
  }
  return (
    <span className="rankbadge" style={{ background: 'rgba(30,91,57,.07)', color: 'var(--text-muted)', ...style }}>{rank}</span>
  );
}

// ── Streak Flame ──
export function Streak({ n, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text)', fontFamily: 'var(--display)', fontWeight: 600, fontSize: size }}>
      <Icon name="flame" size={size + 3} color="var(--coral)" /> {n}
    </span>
  );
}

// ── Toast ──
export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={{
      position: 'absolute', left: '50%', bottom: 96, transform: 'translateX(-50%)',
      zIndex: 80, display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(14px) saturate(140%)',
      border: '1px solid rgba(45,91,57,.16)', boxShadow: '0 14px 34px rgba(30,91,57,.20)',
      borderRadius: 9999, padding: '12px 20px', whiteSpace: 'nowrap',
      animation: 'popIn .4s cubic-bezier(.2,.8,.2,1.2) both', maxWidth: '88%',
    }}>
      <span style={{ display: 'inline-flex', width: 26, height: 26, borderRadius: '50%', background: 'var(--green)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={16} color="#fff" strokeWidth={3} />
      </span>
      <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15 }}>{toast}</span>
    </div>
  );
}

// ── Switch toggle ──
export function Switch({ on, onChange, color = 'var(--green)', label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} style={{
      width: 52, height: 30, borderRadius: 9999, border: 'none', cursor: 'pointer', padding: 3,
      background: on ? color : 'rgba(30,91,57,.14)', transition: 'background .2s', flexShrink: 0,
      boxShadow: on ? '0 8px 18px rgba(30,91,57,.18)' : 'none', position: 'relative',
    }}>
      <span style={{ display: 'block', width: 24, height: 24, borderRadius: '50%', background: '#fff', transform: on ? 'translateX(22px)' : 'translateX(0)', transition: 'transform .22s cubic-bezier(.2,.8,.2,1.2)', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }} />
    </button>
  );
}
