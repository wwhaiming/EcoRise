/* EcoRise — Small UI components: PointsChip, RankBadge, Streak, Toast, Switch */
import React from 'react';
import Icon from './Icon';

// ── Metal colors for podium ranks ──
export const METAL = {
  1: { a: '#EBD08C', b: '#C49A45', glow: 'rgba(227,193,115,.30)', ink: '#3a2c08', label: '1st' },
  2: { a: '#DDE6E2', b: '#98A8A0', glow: 'rgba(180,195,188,.28)', ink: '#2c3833', label: '2nd' },
  3: { a: '#E0AE82', b: '#B0703F', glow: 'rgba(214,154,107,.28)', ink: '#3d260f', label: '3rd' },
};

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
    <span className="rankbadge" style={{ background: 'rgba(255,255,255,.07)', color: 'var(--text-muted)', ...style }}>{rank}</span>
  );
}

// ── Streak Flame ──
export function Streak({ n, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#FF8A4B', fontFamily: 'var(--display)', fontWeight: 600, fontSize: size }}>
      <Icon name="flame" size={size + 3} color="#FF8A4B" /> {n}
    </span>
  );
}

// ── Toast ──
export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 96, transform: 'translateX(-50%)',
      zIndex: 80, display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(12,24,19,.92)', backdropFilter: 'blur(14px) saturate(160%)',
      border: '1px solid rgba(43,255,156,.4)', boxShadow: '0 14px 34px rgba(0,0,0,.55), 0 0 34px rgba(43,255,156,.22)',
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

// ── Switch toggle ──
export function Switch({ on, onChange, color = 'var(--green)' }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 52, height: 30, borderRadius: 9999, border: 'none', cursor: 'pointer', padding: 3,
      background: on ? color : 'rgba(255,255,255,.14)', transition: 'background .2s', flexShrink: 0,
      boxShadow: on ? `0 0 16px ${color}66` : 'none', position: 'relative',
    }}>
      <span style={{ display: 'block', width: 24, height: 24, borderRadius: '50%', background: '#fff', transform: on ? 'translateX(22px)' : 'translateX(0)', transition: 'transform .22s cubic-bezier(.2,.8,.2,1.2)', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }} />
    </button>
  );
}
