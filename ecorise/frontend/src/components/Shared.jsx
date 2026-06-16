/* EcoRise — Sheet, UploadFrame, LogoMark, Wordmark, Orbs, ResetTimer */
import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

// ── Photo source picker (native iOS-style: Take Photo / Library / Files) ──
// On iOS each <input> opens the matching native sheet; on desktop it opens the
// file dialog. capture="environment" jumps straight to the camera on mobile.
function PhotoRow({ icon, label, sub, accent, onClick }) {
  return (
    <button onClick={onClick} className="card" style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', border: 'none',
    }}>
      <span style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: `${accent}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={accent} />
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: '#fff' }}>{label}</span>
        <span className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>{sub}</span>
      </span>
      <Icon name="chevR" size={18} color="var(--text-dim)" />
    </button>
  );
}

export function PhotoSources({ open, onClose, onFile, accent = 'var(--green)' }) {
  const camRef = useRef(null), libRef = useRef(null), fileRef = useRef(null);
  if (!open) return null;

  const handle = (e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; onClose(); };
  const pick = (ref) => ref.current && ref.current.click();

  return (
    <>
      <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handle} />
      <input ref={libRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handle} />
      <input ref={fileRef} type="file" accept="image/*,.heic,.heif" style={{ display: 'none' }} onChange={handle} />
      <div className="scrim" style={{ zIndex: 90 }} onClick={onClose} />
      <div className="screen-in" style={{
        position: 'absolute', left: 12, right: 12, bottom: 12, zIndex: 95,
        display: 'grid', gap: 8, padding: 10, borderRadius: 22,
        background: 'linear-gradient(180deg,var(--navy-800),var(--navy-900))', border: `1px solid ${accent}33`,
        boxShadow: '0 -16px 50px rgba(0,0,0,.6)',
      }}>
        <div className="eyebrow" style={{ color: accent, padding: '6px 8px 2px' }}>Add a photo</div>
        <PhotoRow accent={accent} icon="camera" label="Take Photo" sub="Use your camera" onClick={() => pick(camRef)} />
        <PhotoRow accent={accent} icon="image"  label="Photo Library" sub="Pick an existing photo" onClick={() => pick(libRef)} />
        <PhotoRow accent={accent} icon="folder" label="Choose File" sub="Browse files / iCloud Drive" onClick={() => pick(fileRef)} />
        <button className="btn btn-secondary btn-block" style={{ marginTop: 2 }} onClick={onClose}>Cancel</button>
      </div>
    </>
  );
}

// ── Sheet (modal overlay) ──
export function Sheet({ title, children, onClose, accent = 'var(--green)' }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-grip" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 10px', flexShrink: 0 }}>
          <span className="h2" style={{ color: accent }}>{title}</span>
          <button className="btn btn-secondary btn-sm" style={{ padding: 8 }} onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="scroll">{children}</div>
      </div>
    </>
  );
}

// ── Upload frame (3 phases: capture → analyzing → result) ──
export function UploadFrame({ phase, label, accent = 'var(--green)', onCapture }) {
  return (
    <div onClick={phase === 'capture' ? onCapture : undefined} style={{
      position: 'relative', height: 200, borderRadius: 22, overflow: 'hidden', cursor: phase === 'capture' ? 'pointer' : 'default',
      background: phase === 'capture' ? 'var(--navy-800)' : 'linear-gradient(135deg,#0e7a4f,#11b06f)',
      border: phase === 'capture' ? '2px dashed var(--navy-500)' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10,
    }}>
      {phase === 'capture' && (
        <>
          <span style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,230,118,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="camera" size={30} color={accent} />
          </span>
          <span className="muted" style={{ fontWeight: 700, fontSize: 14 }}>{label}</span>
        </>
      )}
      {phase === 'analyzing' && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0e7a4f,#11b06f)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: accent, boxShadow: `0 0 18px ${accent}`, animation: 'scanline 1.2s ease-in-out infinite' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,.45)', padding: '10px 18px', borderRadius: 9999, backdropFilter: 'blur(6px)' }}>
            <Icon name="sparkle" size={20} color="#fff" />
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, color: '#fff' }}>Analyzing photo…</span>
          </div>
        </>
      )}
      {phase === 'result' && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,.45)', padding: '8px 14px', borderRadius: 9999, backdropFilter: 'blur(6px)' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={14} color="#06281A" strokeWidth={3} /></span>
          <span style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>AI verified</span>
        </div>
      )}
    </div>
  );
}

// ── Logo mark (leaf + spark SVG) ──
export function LogoMark({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="lgM" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1AF08A" /><stop offset="1" stopColor="#00C766" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="#13132A" stroke="rgba(0,230,118,.35)" strokeWidth="1.5" />
      <path d="M20 44c0-15 10-23 24-24-1 15-9 23-24 24Z" fill="url(#lgM)" />
      <path d="M20 44c3.5-8 8.5-12 15-15" stroke="#06281A" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
      <path d="M40 16l2.4 6.6L49 25l-6.6 2.4L40 34l-2.4-6.6L31 25l6.6-2.4L40 16Z" fill="#FFD23F" />
    </svg>
  );
}

// ── Wordmark ──
export function Wordmark({ size = 26, color = '#fff' }) {
  return (
    <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: size, letterSpacing: '-.5px', color, lineHeight: 1 }}>
      Eco<span style={{ color: 'var(--green)' }}>Rise</span>
    </span>
  );
}

// ── Animated orbs backdrop ──
export function Orbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="floaty" style={{ position: 'absolute', top: -40, left: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,#7C4DFF,transparent 70%)', opacity: .5, filter: 'blur(8px)' }} />
      <div className="floaty" style={{ position: 'absolute', bottom: 40, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,#00E676,transparent 70%)', opacity: .35, filter: 'blur(8px)', animationDelay: '1.2s' }} />
      <div className="floaty" style={{ position: 'absolute', top: '38%', right: -30, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle,#FF6B6B,transparent 70%)', opacity: .3, filter: 'blur(6px)', animationDelay: '.6s' }} />
    </div>
  );
}

// ── Reset Timer ──
export function useCountdown(targetMs) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  let d = Math.max(0, targetMs - now);
  const days = Math.floor(d / 86400000); d -= days * 86400000;
  const hrs = Math.floor(d / 3600000); d -= hrs * 3600000;
  const mins = Math.floor(d / 60000); d -= mins * 60000;
  const secs = Math.floor(d / 1000);
  return { days, hrs, mins, secs };
}

export function ResetTimer({ target }) {
  const { days, hrs, mins, secs } = useCountdown(target);
  const cell = (v, l) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
      <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{String(v).padStart(2, '0')}</span>
      <span className="dim" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>{l}</span>
    </div>
  );
  const sep = <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--display)', fontSize: 20, paddingBottom: 12 }}>:</span>;
  return (
    <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="eyebrow" style={{ color: 'var(--coral)' }}>Resets in</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
        {cell(days, 'days')}{sep}{cell(hrs, 'hrs')}{sep}{cell(mins, 'min')}{sep}{cell(secs, 'sec')}
      </div>
    </div>
  );
}
