/* EcoRise — Podium component (3 variants: Cards, Stand, Medals) with empty state placeholders */
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
        const key = p ? (p.user_id || p.id || `pos-${r}`) : `empty-${r}`;
        return (
          <div key={key} style={{ flex: first ? 1.15 : 1, animation: `risePodium .6s cubic-bezier(.2,.8,.2,1) ${i * .12}s both` }}>
            <div className="card" style={{
              padding: first ? '16px 10px 14px' : '14px 8px 12px', textAlign: 'center', position: 'relative',
              border: p ? `1.5px solid ${m.b}66` : '1.5px dashed rgba(255,255,255,.12)',
              boxShadow: p ? `0 14px 34px rgba(0,0,0,.4), 0 0 34px ${m.glow}` : 'none',
              background: p ? `radial-gradient(120px 80px at 50% -10%, ${m.a}22, transparent), linear-gradient(180deg,var(--navy-700),var(--navy-800))` : 'rgba(255,255,255,.01)',
              opacity: p ? 1 : 0.45,
            }}>
              {p ? (
                <>
                  <div style={{ position: 'relative', display: 'inline-block', marginTop: first ? -34 : -28 }} className={bump === (p.user_id || p.id) ? 'pop-in' : ''}>
                    {first && <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 24 }}>👑</div>}
                    <Avatar src={p.avatar || p.img} name={p.name} size={first ? 70 : 56} ring={m.a} glow style={{ boxShadow: `0 0 22px ${m.glow}` }} />
                  </div>
                  <div style={{ marginTop: 8, fontFamily: 'var(--display)', fontWeight: 600, fontSize: first ? 15 : 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: first ? 24 : 20, color: m.a, marginTop: 2 }}>{(p.points ?? p.pts ?? 0).toLocaleString()}</div>
                  <div className="dim" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .5 }}>POINTS</div>
                </>
              ) : (
                <>
                  <div style={{ position: 'relative', display: 'inline-block', marginTop: first ? -34 : -28 }}>
                    <div style={{
                      width: first ? 70 : 56, height: first ? 70 : 56, borderRadius: '50%',
                      border: '2px dashed rgba(255,255,255,.2)', background: 'rgba(255,255,255,.03)',
                      margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--display)', fontSize: 16, color: 'var(--text-dim)', fontWeight: 700
                    }}>
                      ?
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontFamily: 'var(--display)', fontWeight: 600, fontSize: first ? 15 : 13.5, color: 'var(--text-dim)' }}>Empty</div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: first ? 24 : 20, color: 'rgba(255,255,255,.15)', marginTop: 2 }}>-</div>
                  <div className="dim" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .5 }}>POINTS</div>
                </>
              )}
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
        const key = p ? (p.user_id || p.id || `pos-${r}`) : `empty-${r}`;
        return (
          <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: `risePodium .6s cubic-bezier(.2,.8,.2,1) ${i * .12}s both`, opacity: p ? 1 : 0.5 }}>
            <div className={p && bump === (p.user_id || p.id) ? 'pop-in' : ''} style={{ position: 'relative', marginBottom: 10 }}>
              {first && <div style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontSize: 26 }}>👑</div>}
              {p ? (
                <Avatar src={p.avatar || p.img} name={p.name} size={first ? 64 : 52} ring={m.a} glow style={{ boxShadow: `0 0 22px ${m.glow}` }} />
              ) : (
                <div style={{
                  width: first ? 64 : 52, height: first ? 64 : 52, borderRadius: '50%',
                  border: '2px dashed rgba(255,255,255,.2)', background: 'rgba(255,255,255,.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--display)', fontSize: 14, color: 'var(--text-dim)', fontWeight: 700
                }}>
                  ?
                </div>
              )}
            </div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, marginBottom: 2, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: p ? 'inherit' : 'var(--text-dim)' }}>
              {p ? p.name.split(' ')[0] : 'Empty'}
            </div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: p ? m.a : 'rgba(255,255,255,.15)', marginBottom: 8 }}>
              {p ? (p.points ?? p.pts ?? 0).toLocaleString() : '-'}
            </div>
            <div style={{
              width: '100%', height: heights[r], position: 'relative', borderRadius: '8px 8px 0 0', overflow: 'hidden',
              background: p ? `linear-gradient(180deg, ${m.a}, ${m.b})` : 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02))',
              border: p ? 'none' : '1px dashed rgba(255,255,255,.12)',
              borderBottom: 'none',
              boxShadow: p ? `0 -6px 26px ${m.glow}, inset 0 2px 0 rgba(255,255,255,.5)` : 'none'
            }}>
              {p && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.25), transparent 30%)' }} />}
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--display)', fontWeight: 700, fontSize: first ? 40 : 30, color: p ? m.ink : 'rgba(255,255,255,.1)', opacity: p ? 0.9 : 0.3 }}>{r}</div>
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
        const key = p ? (p.user_id || p.id || `pos-${r}`) : `empty-${r}`;
        return (
          <div key={key} className={p && bump === (p.user_id || p.id) ? 'pop-in' : ''} style={{ animation: `risePodium .5s cubic-bezier(.2,.8,.2,1) ${i * .1}s both`, opacity: p ? 1 : 0.55 }}>
            <div className="card" style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
              border: p ? `1.5px solid ${m.b}66` : '1.5px dashed rgba(255,255,255,.12)',
              boxShadow: p ? `0 10px 26px rgba(0,0,0,.36), 0 0 26px ${m.glow}` : 'none',
              background: p ? `linear-gradient(90deg, ${m.a}1a, transparent 40%), linear-gradient(180deg,var(--navy-700),var(--navy-800))` : 'rgba(255,255,255,.01)',
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: p ? `linear-gradient(180deg, ${m.a}, ${m.b})` : 'rgba(255,255,255,.04)',
                  boxShadow: p ? `0 4px 14px ${m.glow}, inset 0 2px 0 rgba(255,255,255,.6)` : 'none',
                  fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, color: p ? m.ink : 'rgba(255,255,255,.2)',
                  border: p ? 'none' : '1px dashed rgba(255,255,255,.2)'
                }}>{r}</div>
              </div>
              {p ? (
                <>
                  <Avatar src={p.avatar || p.img} name={p.name} size={48} ring={m.a} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>{m.label} place · {p.handle}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, color: m.a }}>{(p.points ?? p.pts ?? 0).toLocaleString()}</div>
                    <div className="dim" style={{ fontSize: 10, fontWeight: 800, letterSpacing: .5 }}>PTS</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: '2px dashed rgba(255,255,255,.15)', background: 'rgba(255,255,255,.02)',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--display)', fontSize: 14, color: 'var(--text-dim)', fontWeight: 700
                  }}>
                    ?
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16, color: 'var(--text-dim)' }}>Empty Position</div>
                    <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>{m.label} place</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, color: 'rgba(255,255,255,.15)' }}>-</div>
                    <div className="dim" style={{ fontSize: 10, fontWeight: 800, letterSpacing: .5 }}>PTS</div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Podium({ top3, variant = 'cards', bump }) {
  if (!top3) return null;
  // Always pad top3 to be exactly 3 elements
  const paddedTop3 = [
    top3[0] || null,
    top3[1] || null,
    top3[2] || null
  ];
  if (variant === 'stand') return <PodiumStand top3={paddedTop3} bump={bump} />;
  if (variant === 'medals') return <PodiumMedals top3={paddedTop3} bump={bump} />;
  return <PodiumCards top3={paddedTop3} bump={bump} />;
}
