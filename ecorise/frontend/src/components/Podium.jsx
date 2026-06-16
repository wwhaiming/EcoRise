/* EcoRise — Podium component (3 variants: Cards, Stand, Medals) */
import React from 'react';
import Avatar from './Avatar';
import { RankBadge, METAL } from './UI';

/* ---------- Podium: CARDS ---------- */
function PodiumCards({ top3, bump }) {
  const order = [top3[1], top3[0], top3[2]];
  const ranks = [2, 1, 3];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, padding: '20px 4px 4px' }}>
      {order.map((p, i) => {
        const r = ranks[i], m = METAL[r], first = r === 1;
        const key = p.user_id || p.id || i;
        return (
          <div key={key} style={{ flex: first ? 1.15 : 1, animation: `risePodium .6s cubic-bezier(.2,.8,.2,1) ${i * .12}s both` }}>
            <div className="card" style={{
              padding: first ? '16px 10px 14px' : '14px 8px 12px', textAlign: 'center', position: 'relative',
              border: `1.5px solid ${m.b}66`, boxShadow: `0 14px 34px rgba(0,0,0,.4), 0 0 34px ${m.glow}`,
              background: `radial-gradient(120px 80px at 50% -10%, ${m.a}22, transparent), linear-gradient(180deg,var(--navy-700),var(--navy-800))`,
            }}>
              <div style={{ position: 'relative', display: 'inline-block', marginTop: first ? -34 : -28 }} className={bump === (p.user_id || p.id) ? 'pop-in' : ''}>
                <Avatar src={p.avatar || p.img} name={p.name} size={first ? 70 : 56} ring={m.a} glow style={{ boxShadow: `0 0 22px ${m.glow}` }} />
              </div>
              <div style={{ marginTop: 8, fontFamily: 'var(--display)', fontWeight: 600, fontSize: first ? 15 : 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: first ? 24 : 20, color: m.a, marginTop: 2 }}>{(p.points ?? p.pts ?? 0).toLocaleString()}</div>
              <div className="dim" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .5 }}>POINTS</div>
              <div style={{ marginTop: 8 }}><RankBadge rank={r} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Podium: 3D STAND ---------- */
function PodiumStand({ top3, bump }) {
  const order = [top3[1], top3[0], top3[2]];
  const ranks = [2, 1, 3];
  const heights = { 1: 118, 2: 84, 3: 66 };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, padding: '34px 6px 0' }}>
      {order.map((p, i) => {
        const r = ranks[i], m = METAL[r], first = r === 1;
        const key = p.user_id || p.id || i;
        return (
          <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: `risePodium .6s cubic-bezier(.2,.8,.2,1) ${i * .12}s both` }}>
            <div className={bump === (p.user_id || p.id) ? 'pop-in' : ''} style={{ position: 'relative', marginBottom: 10 }}>
              <Avatar src={p.avatar || p.img} name={p.name} size={first ? 64 : 52} ring={m.a} glow style={{ boxShadow: `0 0 22px ${m.glow}` }} />
            </div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, marginBottom: 2, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name.split(' ')[0]}</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: m.a, marginBottom: 8 }}>{(p.points ?? p.pts ?? 0).toLocaleString()}</div>
            <div style={{ width: '100%', height: heights[r], position: 'relative', borderRadius: '8px 8px 0 0', overflow: 'hidden',
              background: `linear-gradient(180deg, ${m.a}, ${m.b})`, boxShadow: `0 -6px 26px ${m.glow}, inset 0 2px 0 rgba(255,255,255,.5)` }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.25), transparent 30%)' }} />
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--display)', fontWeight: 700, fontSize: first ? 40 : 30, color: m.ink, opacity: .9 }}>{r}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Podium: MEDALS ---------- */
function PodiumMedals({ top3, bump }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '6px 2px' }}>
      {top3.map((p, i) => {
        const r = i + 1, m = METAL[r];
        const key = p.user_id || p.id || i;
        return (
          <div key={key} className={bump === (p.user_id || p.id) ? 'pop-in' : ''} style={{ animation: `risePodium .5s cubic-bezier(.2,.8,.2,1) ${i * .1}s both` }}>
            <div className="card" style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
              border: `1.5px solid ${m.b}66`, boxShadow: `0 10px 26px rgba(0,0,0,.36), 0 0 26px ${m.glow}`,
              background: `linear-gradient(90deg, ${m.a}1a, transparent 40%), linear-gradient(180deg,var(--navy-700),var(--navy-800))`,
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `linear-gradient(180deg, ${m.a}, ${m.b})`, boxShadow: `0 4px 14px ${m.glow}, inset 0 2px 0 rgba(255,255,255,.6)`,
                  fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, color: m.ink }}>{r}</div>
              </div>
              <Avatar src={p.avatar || p.img} name={p.name} size={48} ring={m.a} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>{m.label} place · {p.handle}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, color: m.a }}>{(p.points ?? p.pts ?? 0).toLocaleString()}</div>
                <div className="dim" style={{ fontSize: 10, fontWeight: 800, letterSpacing: .5 }}>PTS</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Podium({ top3, variant = 'cards', bump }) {
  if (!top3 || top3.length < 3) return null;
  if (variant === 'stand') return <PodiumStand top3={top3} bump={bump} />;
  if (variant === 'medals') return <PodiumMedals top3={top3} bump={bump} />;
  return <PodiumCards top3={top3} bump={bump} />;
}
