/* EcoRise — Log Action / Trash Spotter sheets + Organizer screen */

function Switch({ on, onChange, color = 'var(--green)' }) {
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

function UploadFrame({ phase, label, accent = 'var(--green)' }) {
  return (
    <div style={{
      position: 'relative', height: 200, borderRadius: 22, overflow: 'hidden',
      background: phase === 'capture' ? 'var(--navy-800)' : `linear-gradient(135deg,#0e7a4f,#11b06f)`,
      border: phase === 'capture' ? '2px dashed var(--navy-500)' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10,
    }}>
      {phase === 'capture' && (
        <React.Fragment>
          <span style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,230,118,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="camera" size={30} color={accent} />
          </span>
          <span className="muted" style={{ fontWeight: 700, fontSize: 14 }}>{label}</span>
        </React.Fragment>
      )}
      {phase === 'analyzing' && (
        <React.Fragment>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0e7a4f,#11b06f)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: accent, boxShadow: `0 0 18px ${accent}`, animation: 'scanline 1.2s ease-in-out infinite' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,.45)', padding: '10px 18px', borderRadius: 9999, backdropFilter: 'blur(6px)' }}>
            <Icon name="sparkle" size={20} color="#fff" />
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, color: '#fff' }}>Analyzing photo…</span>
          </div>
        </React.Fragment>
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

/* ---------- LOG ECO ACTION ---------- */
function LogActionSheet({ ctx }) {
  const [phase, setPhase] = React.useState('capture');
  const [det, setDet] = React.useState(ctx.ai[0]);
  const [miles, setMiles] = React.useState(6);

  const capture = () => {
    setPhase('analyzing');
    setTimeout(() => setPhase('result'), 1300);
  };
  const co2 = det.needsMiles ? +(miles * det.factor).toFixed(1) : det.co2;
  const pts = det.needsMiles ? Math.max(10, Math.round(co2 * 25)) : det.pts;

  return (
    <Sheet title="Log an eco action" onClose={ctx.closeModal}>
      <div style={{ padding: '4px 20px 24px', display: 'grid', gap: 16 }}>
        <div onClick={phase === 'capture' ? capture : undefined} style={{ cursor: phase === 'capture' ? 'pointer' : 'default' }}>
          <UploadFrame phase={phase} label="Tap to snap or upload a photo" />
        </div>

        {phase === 'capture' && (
          <div className="muted" style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600 }}>
            Our AI detects the action, estimates CO₂ saved, and awards points automatically.
          </div>
        )}

        {phase === 'result' && (
          <React.Fragment>
            {/* AI result card */}
            <div className="card card-glow pop-in" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon name="sparkle" size={18} color="var(--green)" />
                <span className="eyebrow" style={{ color: 'var(--green)' }}>AI detected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 22 }}>{det.action}</div>
                  <span className="chip chip-purple" style={{ marginTop: 6 }}>{det.cat}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, color: 'var(--green)' }}>{co2} kg</div>
                  <div className="dim" style={{ fontSize: 11, fontWeight: 800 }}>CO₂ SAVED</div>
                </div>
              </div>

              {/* pick another detection */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {ctx.ai.map(a => (
                  <button key={a.action} onClick={() => setDet(a)} className="btn btn-sm" style={{
                    fontFamily: 'var(--body)', fontWeight: 800, fontSize: 12.5, padding: '7px 12px',
                    background: a.action === det.action ? 'rgba(0,230,118,.16)' : 'rgba(255,255,255,.05)',
                    color: a.action === det.action ? 'var(--green)' : 'var(--text-muted)',
                    boxShadow: a.action === det.action ? 'inset 0 0 0 1.5px rgba(0,230,118,.5)' : 'none',
                  }}>{a.action}</button>
                ))}
              </div>
            </div>

            {/* miles follow-up */}
            {det.needsMiles && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16 }}>How many {det.unit}?</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, color: 'var(--green)' }}>{miles} mi</span>
                </div>
                <input type="range" min="1" max="20" value={miles} onChange={e => setMiles(+e.target.value)}
                  style={{ width: '100%', accentColor: '#00E676' }} />
                <div className="dim" style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Drag to match your trip distance</div>
              </div>
            )}

            {/* points summary + confirm */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px' }}>
              <span className="muted" style={{ fontWeight: 700 }}>You&rsquo;ll earn</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 26, color: 'var(--green)' }}>+{pts} pts</span>
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => ctx.confirmAction(pts, det.action, det.cat)}>
              Post & earn points
            </button>
          </React.Fragment>
        )}
      </div>
    </Sheet>
  );
}

/* ---------- TRASH SPOTTER ---------- */
function TrashSpotterSheet({ ctx }) {
  const [phase, setPhase] = React.useState('capture');
  const [loc, setLoc] = React.useState('');
  const severity = 7;
  const pts = 35 + severity * 5;
  const sevColor = severity >= 7 ? 'var(--coral)' : severity >= 4 ? 'var(--yellow)' : 'var(--green)';

  const capture = () => { setPhase('analyzing'); setTimeout(() => setPhase('result'), 1300); };

  return (
    <Sheet title="Trash Spotter" onClose={ctx.closeModal} accent="var(--coral)">
      <div style={{ padding: '4px 20px 24px', display: 'grid', gap: 16 }}>
        <div onClick={phase === 'capture' ? capture : undefined} style={{ cursor: phase === 'capture' ? 'pointer' : 'default' }}>
          <UploadFrame phase={phase} label="Photograph the litter or hotspot" accent="var(--coral)" />
        </div>
        {phase === 'capture' && (
          <div className="muted" style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600 }}>
            Spot litter in your area? Snap it. Our AI rates severity and turns cleanup into points.
          </div>
        )}
        {phase === 'result' && (
          <React.Fragment>
            <div className="card pop-in" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="eyebrow" style={{ color: sevColor }}>AI severity rating</span>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, color: sevColor }}>{severity}<span className="dim" style={{ fontSize: 14 }}>/10</span></span>
              </div>
              <div style={{ height: 14, borderRadius: 9999, background: 'rgba(255,255,255,.08)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#00E676,#FFD23F,#FF6B6B)', opacity: .25 }} />
                <div style={{ height: '100%', width: severity * 10 + '%', borderRadius: 9999, background: 'linear-gradient(90deg,#FFD23F,#FF6B6B)', boxShadow: `0 0 16px ${sevColor}`, transition: 'width .6s' }} />
              </div>
              <div className="muted" style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>High-priority hotspot — worth reporting to campus grounds.</div>
            </div>

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}><Icon name="pin" size={13} color="var(--coral)" style={{ verticalAlign: -2 }} /> Location tag</label>
              <input className="field" placeholder="e.g. Riverside Park, north entrance" value={loc} onChange={e => setLoc(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="muted" style={{ fontWeight: 700 }}>Reward</span>
              <PointsChip pts={pts} variant="green" />
            </div>
            <button className="btn btn-danger btn-block btn-lg" onClick={() => ctx.confirmAction(pts, 'Trash report', 'Cleanup')}>
              <Icon name="pin" size={18} color="#fff" /> Report & earn {pts} pts
            </button>
          </React.Fragment>
        )}
      </div>
    </Sheet>
  );
}

/* ---------- Generic Sheet wrapper ---------- */
function Sheet({ title, children, onClose, accent = 'var(--green)' }) {
  return (
    <React.Fragment>
      <div className="scrim" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-grip" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 10px', flexShrink: 0 }}>
          <span className="h2" style={{ color: accent }}>{title}</span>
          <button className="btn btn-secondary btn-sm" style={{ padding: 8 }} onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="scroll">{children}</div>
      </div>
    </React.Fragment>
  );
}

/* ---------- ORGANIZER / CREATE LEADERBOARD ---------- */
function OrganizerScreen({ ctx }) {
  const [name, setName] = React.useState('Greenfield High Spring Challenge');
  const [interval, setInterval] = React.useState('weekly');
  const [prizeOn, setPrizeOn] = React.useState(true);
  const [prize, setPrize] = React.useState('$250 campus store + a tree planted');
  const [includeSelf, setIncludeSelf] = React.useState(true);
  const [tab, setTab] = React.useState('settings');

  const reports = [
    { id: 'r1', user: 'kai', reason: 'Spam / not an eco action', post: 'Check out my new sneakers 👟', img: 'linear-gradient(135deg,#5b21b6,#7C4DFF)' },
    { id: 'r2', user: 'zoe', reason: 'Misleading photo', post: 'Planted 40 trees this morning', img: 'linear-gradient(135deg,#7c5c1e,#caa14a)' },
  ];
  const [queue, setQueue] = React.useState(reports);
  const resolve = (id, kept) => { setQueue(q => q.filter(r => r.id !== id)); ctx.showToast(kept ? 'Post kept' : 'Post removed'); };

  return (
    <div className="screen-in" style={{ paddingBottom: 110 }}>
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} onClick={() => ctx.go('leaderboard')}><Icon name="chevL" size={20} /></button>
        <div>
          <div className="eyebrow" style={{ color: 'var(--purple-2)' }}>Organizer</div>
          <div className="h1" style={{ fontSize: 24 }}>Manage board</div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ display: 'flex', gap: 6, background: 'var(--navy-800)', padding: 5, borderRadius: 9999 }}>
          {[['settings', 'Settings'], ['moderation', `Reports${queue.length ? ' · ' + queue.length : ''}`]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="btn btn-sm" style={{
              flex: 1, fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14,
              background: tab === k ? 'linear-gradient(180deg,var(--navy-600),var(--navy-700))' : 'transparent',
              color: tab === k ? '#fff' : 'var(--text-dim)', boxShadow: tab === k ? '0 4px 12px rgba(0,0,0,.3)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {tab === 'settings' && (
        <div style={{ padding: '16px 16px 0', display: 'grid', gap: 16 }}>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Leaderboard name</label>
            <input className="field" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Reset interval</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
              {['daily', 'weekly', 'monthly', 'custom'].map(o => (
                <button key={o} onClick={() => setInterval(o)} className="btn btn-sm" style={{
                  fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, padding: '11px 4px', textTransform: 'capitalize',
                  background: interval === o ? 'linear-gradient(180deg,var(--green-2),var(--green))' : 'var(--navy-800)',
                  color: interval === o ? '#06281A' : 'var(--text-muted)',
                  boxShadow: interval === o ? '0 6px 16px rgba(0,230,118,.35)' : 'inset 0 0 0 1.5px var(--navy-500)',
                }}>{o}</button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(124,77,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="gift" size={20} color="var(--purple-2)" /></span>
                <div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15.5 }}>Offer a prize</div>
                  <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>Shown on the leaderboard</div>
                </div>
              </div>
              <Switch on={prizeOn} onChange={setPrizeOn} color="var(--purple)" />
            </div>
            {prizeOn && <input className="field" style={{ marginTop: 12 }} value={prize} onChange={e => setPrize(e.target.value)} placeholder="Describe the prize" />}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(0,230,118,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={20} color="var(--green)" /></span>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15.5 }}>Include myself</div>
                <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>Compete alongside members</div>
              </div>
            </div>
            <Switch on={includeSelf} onChange={setIncludeSelf} />
          </div>

          {/* invite link generator */}
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Invite link</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="field" style={{ flex: 1, display: 'flex', alignItems: 'center', color: 'var(--green)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>ecorise.app/j/GRNFLD-7K2</div>
              <button className="btn btn-primary" style={{ padding: '0 18px' }} onClick={() => ctx.showToast('Invite link copied!')}><Icon name="share" size={18} color="#06281A" /></button>
            </div>
          </div>

          <button className="btn btn-purple btn-block btn-lg" onClick={() => { ctx.showToast('Leaderboard saved!'); ctx.go('leaderboard'); }}>Save changes</button>
        </div>
      )}

      {tab === 'moderation' && (
        <div style={{ padding: '16px 16px 0', display: 'grid', gap: 14 }}>
          {queue.length === 0 && (
            <div className="card" style={{ padding: 30, textAlign: 'center' }}>
              <span style={{ fontSize: 34 }}>✨</span>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 17, marginTop: 8 }}>All clear!</div>
              <div className="dim" style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>No reports in the queue.</div>
            </div>
          )}
          {queue.map(r => {
            const u = ctx.players.find(p => p.id === r.user) || ctx.players[0];
            return (
              <div key={r.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 14, background: r.img, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar src={u.img} name={u.name} size={22} />
                      <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>{r.post}</div>
                    <span className="chip" style={{ marginTop: 6, background: 'rgba(255,107,107,.16)', color: 'var(--coral-2)', fontSize: 11.5 }}><Icon name="bell" size={12} color="var(--coral-2)" /> {r.reason}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => resolve(r.id, true)}>Keep</button>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => resolve(r.id, false)}><Icon name="trash" size={16} color="#fff" /> Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Switch, LogActionSheet, TrashSpotterSheet, OrganizerScreen, Sheet, UploadFrame });
