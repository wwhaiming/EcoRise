/* EcoRise — Leaderboard + animated Podium (3 variants) */

function useCountdown(targetMs) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
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

function ResetTimer({ target }) {
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

const METAL = {
  1: { a: '#FFE066', b: '#E0A92E', glow: 'rgba(255,210,63,.55)', ink: '#5a4410', label: '1st' },
  2: { a: '#EAF1FB', b: '#9AAAC4', glow: 'rgba(200,215,235,.5)', ink: '#33405a', label: '2nd' },
  3: { a: '#FBC08A', b: '#C26E38', glow: 'rgba(232,150,91,.5)', ink: '#5a3013', label: '3rd' },
};

/* ---------- Podium: CARDS ---------- */
function PodiumCards({ top3, bump }) {
  const order = [top3[1], top3[0], top3[2]]; // 2 - 1 - 3
  const ranks = [2, 1, 3];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, padding: '20px 4px 4px' }}>
      {order.map((p, i) => {
        const r = ranks[i], m = METAL[r], first = r === 1;
        return (
          <div key={p.id} style={{ flex: first ? 1.15 : 1, animation: `risePodium .6s cubic-bezier(.2,.8,.2,1) ${i * .12}s both` }}>
            <div className="card" style={{
              padding: first ? '16px 10px 14px' : '14px 8px 12px', textAlign: 'center', position: 'relative',
              border: `1.5px solid ${m.b}66`, boxShadow: `0 14px 34px rgba(0,0,0,.4), 0 0 34px ${m.glow}`,
              background: `radial-gradient(120px 80px at 50% -10%, ${m.a}22, transparent), linear-gradient(180deg,var(--navy-700),var(--navy-800))`,
            }}>
              <div style={{ position: 'relative', display: 'inline-block', marginTop: first ? -34 : -28 }} className={bump === p.id ? 'pop-in' : ''}>
                {first && <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 24 }}>👑</div>}
                <Avatar src={p.img} name={p.name} size={first ? 70 : 56} ring={m.a} glow style={{ boxShadow: `0 0 22px ${m.glow}` }} />
              </div>
              <div style={{ marginTop: 8, fontFamily: 'var(--display)', fontWeight: 600, fontSize: first ? 15 : 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: first ? 24 : 20, color: m.a, marginTop: 2 }}>{p.pts.toLocaleString()}</div>
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
        return (
          <div key={p.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: `risePodium .6s cubic-bezier(.2,.8,.2,1) ${i * .12}s both` }}>
            <div className={bump === p.id ? 'pop-in' : ''} style={{ position: 'relative', marginBottom: 10 }}>
              {first && <div style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontSize: 26 }}>👑</div>}
              <Avatar src={p.img} name={p.name} size={first ? 64 : 52} ring={m.a} glow style={{ boxShadow: `0 0 22px ${m.glow}` }} />
            </div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, marginBottom: 2, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name.split(' ')[0]}</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: m.a, marginBottom: 8 }}>{p.pts.toLocaleString()}</div>
            {/* pedestal */}
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
        return (
          <div key={p.id} className={bump === p.id ? 'pop-in' : ''} style={{ animation: `risePodium .5s cubic-bezier(.2,.8,.2,1) ${i * .1}s both` }}>
            <div className="card" style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
              border: `1.5px solid ${m.b}66`, boxShadow: `0 10px 26px rgba(0,0,0,.36), 0 0 26px ${m.glow}`,
              background: `linear-gradient(90deg, ${m.a}1a, transparent 40%), linear-gradient(180deg,var(--navy-700),var(--navy-800))`,
            }}>
              {/* medal disc */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `linear-gradient(180deg, ${m.a}, ${m.b})`, boxShadow: `0 4px 14px ${m.glow}, inset 0 2px 0 rgba(255,255,255,.6)`,
                  fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, color: m.ink }}>{r}</div>
              </div>
              <Avatar src={p.img} name={p.name} size={48} ring={m.a} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>{m.label} place · {p.handle}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, color: m.a }}>{p.pts.toLocaleString()}</div>
                <div className="dim" style={{ fontSize: 10, fontWeight: 800, letterSpacing: .5 }}>PTS</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Podium({ top3, variant, bump }) {
  if (variant === 'stand') return <PodiumStand top3={top3} bump={bump} />;
  if (variant === 'medals') return <PodiumMedals top3={top3} bump={bump} />;
  return <PodiumCards top3={top3} bump={bump} />;
}

/* ---------- Full Leaderboard screen ---------- */
function LeaderboardScreen({ ctx }) {
  const players = ctx.players;
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="screen-in" style={{ paddingBottom: 24 }}>
      <div style={{ padding: '18px 18px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>Greenfield High</div>
          <div className="h1" style={{ fontSize: 27 }}>Leaderboard</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => ctx.go('organizer')} style={{ padding: 10 }}>
          <Icon name="settings" size={20} />
        </button>
      </div>

      <div style={{ padding: '8px 16px 0' }}>
        <Podium top3={top3} variant={ctx.tweaks.podium} bump={ctx.bump} />
      </div>

      <div style={{ padding: '14px 16px 0', display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <ResetTimer target={ctx.resetTarget} />

        {/* prize */}
        <div className="card card-glow" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, background: 'radial-gradient(160px 90px at 16% -10%, rgba(124,77,255,.25), transparent), linear-gradient(180deg,var(--navy-700),var(--navy-800))' }}>
          <div style={{ width: 50, height: 50, borderRadius: 16, background: 'linear-gradient(180deg,#9D7BFF,#7C4DFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(124,77,255,.5)', flexShrink: 0 }}>
            <Icon name="gift" size={28} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ color: 'var(--purple-2)' }}>This season&rsquo;s prize</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 17 }}>$250 campus store + a tree planted</div>
          </div>
        </div>

        {/* ranked list */}
        <div className="card" style={{ padding: 6 }}>
          {rest.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 16,
              background: p.isYou ? 'linear-gradient(90deg, rgba(0,230,118,.16), rgba(0,230,118,.04))' : 'transparent',
              boxShadow: p.isYou ? 'inset 0 0 0 1.5px rgba(0,230,118,.4)' : 'none',
              borderBottom: i < rest.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
            }}>
              <RankBadge rank={p.rank} />
              <Avatar src={p.img} name={p.name} size={42} ring={p.isYou ? 'var(--green)' : undefined} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  {p.isYou && <span className="chip chip-green" style={{ padding: '2px 8px', fontSize: 11 }}>YOU</span>}
                </div>
                <Streak n={p.streak} size={12} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={`${ctx.bump === p.id ? 'count-flash' : ''}`} style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16 }}>{p.pts.toLocaleString()}</div>
                <div className="dim" style={{ fontSize: 10, fontWeight: 800, letterSpacing: .5 }}>PTS</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-purple btn-block" onClick={() => ctx.showToast('Invite link copied!')}>
          <Icon name="share" size={19} color="#fff" /> Invite friends
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Podium, LeaderboardScreen, ResetTimer, useCountdown, METAL });
