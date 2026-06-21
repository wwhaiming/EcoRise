/* EcoRise — Small UI components: PointsChip, RankBadge, Streak, Toast, Switch, HelpTip */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { METAL } from './constants';

// ── Help Tip (? button → bottom sheet) ──
export function HelpTip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ display: 'inline-flex', verticalAlign: 'middle', flexShrink: 0 }}>
      <button type="button" onClick={e => { e.stopPropagation(); setOpen(true); }} aria-label="More info"
        style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid rgba(45,91,57,.28)', background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
        ?
      </button>
      {open && createPortal(
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 9990, background: 'rgba(12,17,14,.5)', backdropFilter: 'blur(2px)' }} />
          <div role="dialog" aria-modal="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 9991, background: 'var(--navy-900)', borderRadius: '22px 22px 0 0', padding: '20px 20px calc(24px + env(safe-area-inset-bottom))', boxShadow: '0 -12px 40px rgba(30,91,57,.18)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(45,91,57,.18)', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.55 }}>{text}</div>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-block btn-sm" style={{ marginTop: 16 }}>Got it</button>
          </div>
        </>,
        document.querySelector('.app') || document.body
      )}
    </span>
  );
}

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
      /* Center with auto-margins, NOT translateX(-50%): the popIn keyframe animates
         `transform`, which would clobber a centering transform and shove the toast
         off the right frame edge. Auto-margins leave transform free for the animation. */
      position: 'absolute', left: 16, right: 16, bottom: 96,
      marginInline: 'auto', width: 'fit-content', maxWidth: 'calc(100% - 32px)',
      zIndex: 80, display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(14px) saturate(140%)',
      border: '1px solid rgba(45,91,57,.16)', boxShadow: '0 14px 34px rgba(30,91,57,.20)',
      borderRadius: 18, padding: '12px 20px', textAlign: 'center',
      animation: 'popIn .4s cubic-bezier(.2,.8,.2,1.2) both',
    }}>
      <span style={{ display: 'inline-flex', width: 26, height: 26, borderRadius: '50%', background: 'var(--green)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="check" size={16} color="#fff" strokeWidth={3} />
      </span>
      <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, wordBreak: 'break-word' }}>{toast}</span>
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
