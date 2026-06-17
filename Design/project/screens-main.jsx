/* EcoRise — Home / Feed / Quests / Profile */

function playerById(players, id) { return players.find(p => p.id === id); }

function mention(text) {
  return text.split(/(@[\w.]+)/g).map((t, i) =>
    t.startsWith('@') ? <span key={i} style={{ color: 'var(--green)', fontWeight: 700 }}>{t}</span> : t);
}

/* ============================================================
   HOME / DASHBOARD
   ============================================================ */
function HomeScreen({ ctx }) {
  const you = ctx.you;
  const players = ctx.players;
  const top3 = players.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]];
  const ranks = [2, 1, 3];
  const nextRankPts = you.rank > 1 ? players[you.rank - 2].pts : you.pts;
  const gap = Math.max(0, nextRankPts - you.pts);
  const prog = you.rank > 1 ? Math.min(100, (you.pts / nextRankPts) * 100) : 100;

  return (
    <div className="screen-in">
      {/* header */}
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar src={you.img} name={you.name} size={46} ring="var(--green)" />
        <div style={{ flex: 1 }}>
          <div className="dim" style={{ fontWeight: 700, fontSize: 13 }}>Good morning,</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 18, lineHeight: 1 }}>Eco Champion 🌍</div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ padding: 10, position: 'relative' }} onClick={() => ctx.showToast('No new notifications')}>
          <Icon name="bell" size={20} />
          <span style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', boxShadow: '0 0 8px var(--coral)' }} />
        </button>
      </div>

      {/* hero stat card */}
      <div style={{ padding: '8px 16px 0' }}>
        <div className="card card-glow" style={{ padding: 18, background: 'radial-gradient(200px 120px at 85% -20%, rgba(0,230,118,.22), transparent), linear-gradient(180deg,var(--navy-700),var(--navy-800))' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 4 }}>Your points</div>
              <div className={ctx.bump === 'you' ? 'count-flash' : ''} style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 46, lineHeight: 1, letterSpacing: '-1px' }}>
                {you.pts.toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.06)', padding: '6px 12px', borderRadius: 9999 }}>
                <Icon name="trophy" size={16} color="var(--yellow)" />
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16 }}>#{you.rank}</span>
              </div>
              <Streak n={you.streak} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{gap > 0 ? `${gap} pts to rank #${you.rank - 1}` : 'You\u2019re #1 — defend it!'}</span>
              <span className="dim" style={{ fontSize: 13, fontWeight: 700 }}>{Math.round(prog)}%</span>
            </div>
            <div className="bar"><i style={{ width: prog + '%' }} /></div>
          </div>
        </div>
      </div>

      {/* leaderboard widget */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="h2">Top of the board</div>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--green)', padding: 4 }} onClick={() => ctx.go('leaderboard')}>See all</button>
        </div>

        {/* mini podium */}
        <div className="card" style={{ padding: '10px 8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
            {order.map((p, i) => {
              const r = ranks[i], m = METAL[r], first = r === 1;
              return (
                <div key={p.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: `risePodium .5s cubic-bezier(.2,.8,.2,1) ${i * .1}s both` }}>
                  <div style={{ position: 'relative' }} className={ctx.bump === p.id ? 'pop-in' : ''}>
                    {first && <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>👑</div>}
                    <Avatar src={p.img} name={p.name} size={first ? 56 : 46} ring={m.a} glow style={{ boxShadow: `0 0 16px ${m.glow}` }} />
                    <span className="rankbadge" style={{ position: 'absolute', bottom: -6, right: -6, minWidth: 22, height: 22, fontSize: 12, background: `linear-gradient(180deg,${m.a},${m.b})`, color: m.ink, border: '2px solid var(--navy-800)' }}>{r}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 12.5, marginTop: 8 }}>{p.name.split(' ')[0]}</div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: m.a }}>{p.pts.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
          {/* rows 4-5 */}
          {players.slice(3, 5).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 8px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
              <RankBadge rank={p.rank} style={{ minWidth: 26, height: 26, fontSize: 13 }} />
              <Avatar src={p.img} name={p.name} size={34} ring={p.isYou ? 'var(--green)' : undefined} />
              <span style={{ flex: 1, fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14 }}>{p.name}{p.isYou && <span className="chip chip-green" style={{ padding: '1px 7px', fontSize: 10, marginLeft: 6 }}>YOU</span>}</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--text-muted)' }}>{p.pts.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* quick actions */}
      <div style={{ padding: '18px 16px 0' }}>
        <div className="h2" style={{ marginBottom: 10 }}>Quick actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={() => ctx.openTrash()} className="card" style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,107,107,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={22} color="var(--coral)" /></span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, color: '#fff' }}>Trash Spotter</span>
            <span className="dim" style={{ fontSize: 12, fontWeight: 700 }}>Report litter near you</span>
          </button>
          <button onClick={() => ctx.go('quests')} className="card" style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,210,63,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bolt" size={22} color="var(--yellow)" /></span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, color: '#fff' }}>Daily quests</span>
            <span className="dim" style={{ fontSize: 12, fontWeight: 700 }}>{ctx.quests.filter(q => q.done >= q.goal).length}/{ctx.quests.length} done · 2× points</span>
          </button>
        </div>
      </div>

      <div style={{ height: 96 }} />
    </div>
  );
}

/* ============================================================
   FEED
   ============================================================ */
function FeedCard({ post, ctx }) {
  const u = playerById(ctx.players, post.user) || ctx.players[0];
  const [menu, setMenu] = React.useState(false);
  const ago = post.mins < 60 ? `${post.mins}m` : `${Math.round(post.mins / 60)}h`;
  return (
    <div className="card" style={{ overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px' }}>
        <Avatar src={u.img} name={u.name} size={40} ring={u.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15 }}>{u.name}</div>
          <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>{u.handle} · {ago}</div>
        </div>
        <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setMenu(!menu)}><Icon name="dots" size={22} /></button>
        {menu && (
          <div style={{ position: 'absolute', top: 48, right: 14, zIndex: 10, background: 'var(--navy-600)', borderRadius: 14, padding: 6, boxShadow: '0 12px 30px rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.08)' }}>
            <button className="btn btn-ghost" style={{ color: 'var(--coral)', fontSize: 14, padding: '8px 14px', fontFamily: 'var(--body)', fontWeight: 800 }} onClick={() => { setMenu(false); ctx.showToast('Post reported to moderators'); }}>
              <Icon name="x" size={16} color="var(--coral)" /> Report post
            </button>
          </div>
        )}
      </div>

      {/* photo */}
      <div style={{ position: 'relative', height: 230, background: post.img, display: 'flex', alignItems: 'flex-end', padding: 14 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,.45))' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span className="chip" style={{ background: 'rgba(0,0,0,.45)', color: '#fff', backdropFilter: 'blur(6px)', fontSize: 12 }}>
            <Icon name="leaf" size={13} color="var(--green-2)" /> {post.tag}
          </span>
          <PointsChip pts={post.pts} />
        </div>
      </div>

      {/* body */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15.5, marginBottom: 6 }}>{post.action}</div>
        <div className="muted" style={{ fontSize: 14, lineHeight: 1.45, fontWeight: 600 }}>{mention(post.caption)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span className="chip chip-dim" style={{ fontSize: 11.5 }}><Icon name="leaf" size={12} color="var(--green)" /> {post.co2} kg CO₂ saved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <button className="btn btn-ghost" style={{ padding: 0, gap: 7, color: post.liked ? 'var(--coral)' : 'var(--text-muted)', fontFamily: 'var(--body)', fontWeight: 800, fontSize: 14 }} onClick={() => ctx.toggleLike(post.id)}>
            <Icon name="heart" size={22} color={post.liked ? 'var(--coral)' : 'var(--text-muted)'} fill={post.liked} /> {post.likes}
          </button>
          <button className="btn btn-ghost" style={{ padding: 0, gap: 7, color: 'var(--text-muted)', fontFamily: 'var(--body)', fontWeight: 800, fontSize: 14 }} onClick={() => ctx.showToast('Comments coming soon')}>
            <Icon name="chat" size={21} /> {post.comments}
          </button>
          <button className="btn btn-ghost" style={{ padding: 0, marginLeft: 'auto', color: 'var(--text-muted)' }} onClick={() => ctx.showToast('Shared!')}>
            <Icon name="share" size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedScreen({ ctx }) {
  return (
    <div className="screen-in">
      <div style={{ padding: '16px 18px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="h1" style={{ fontSize: 27 }}>Feed</div>
        <button className="btn btn-primary btn-sm" onClick={() => ctx.openLog()}><Icon name="plus" size={18} color="#06281A" strokeWidth={3} /> Post</button>
      </div>
      <div style={{ padding: '8px 16px 100px', display: 'grid', gap: 16 }}>
        {ctx.feed.map(p => <FeedCard key={p.id} post={p} ctx={ctx} />)}
      </div>
    </div>
  );
}

/* ============================================================
   QUESTS
   ============================================================ */
function QuestCard({ q, ctx }) {
  const done = q.done >= q.goal;
  const prog = Math.min(100, (q.done / q.goal) * 100);
  return (
    <div className="card" style={{
      padding: 16, position: 'relative', overflow: 'hidden',
      border: done ? '1.5px solid rgba(0,230,118,.5)' : '1px solid rgba(255,255,255,.05)',
      boxShadow: done ? '0 10px 30px rgba(0,0,0,.3), 0 0 30px rgba(0,230,118,.2)' : '0 12px 30px rgba(0,0,0,.32)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
        <span style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: `${q.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={q.icon} size={24} color={q.color} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16.5 }}>{q.title}</span>
            <span className="chip chip-2x" style={{ fontSize: 12, padding: '3px 9px' }}>2× {q.reward}</span>
          </div>
          <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{q.desc}</div>
        </div>
        {done && (
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,230,118,.6)', flexShrink: 0 }}>
            <Icon name="check" size={18} color="#06281A" strokeWidth={3} />
          </span>
        )}
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="bar" style={{ flex: 1 }}><i style={{ width: prog + '%' }} /></div>
        <span className="dim" style={{ fontSize: 12.5, fontWeight: 800, minWidth: 32, textAlign: 'right' }}>{q.done}/{q.goal}</span>
      </div>
      {!done && (
        <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 12 }} onClick={() => ctx.advanceQuest(q.id)}>
          <Icon name="camera" size={16} /> Log to progress
        </button>
      )}
    </div>
  );
}

function QuestsScreen({ ctx }) {
  const doneCount = ctx.quests.filter(q => q.done >= q.goal).length;
  return (
    <div className="screen-in">
      <div style={{ padding: '16px 18px 6px' }}>
        <div className="eyebrow" style={{ color: 'var(--yellow)' }}>Double points all day</div>
        <div className="h1" style={{ fontSize: 27 }}>Daily Quests</div>
      </div>
      <div style={{ padding: '8px 16px 0' }}>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, background: 'radial-gradient(160px 80px at 90% -20%, rgba(255,210,63,.2), transparent), linear-gradient(180deg,var(--navy-700),var(--navy-800))' }}>
          <div style={{ position: 'relative', width: 48, height: 48 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="6" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--yellow)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - doneCount / ctx.quests.length)} style={{ transition: 'stroke-dashoffset .6s' }} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15 }}>{doneCount}/{ctx.quests.length}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16 }}>Keep the streak alive</div>
            <div className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Finish all 5 for a bonus +200 pts</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 16px 100px', display: 'grid', gap: 12 }}>
        {ctx.quests.map(q => <QuestCard key={q.id} q={q} ctx={ctx} />)}
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE
   ============================================================ */
function ProfileScreen({ ctx }) {
  const you = ctx.you;
  const stats = [
    { label: 'Points', value: you.pts.toLocaleString(), color: 'var(--green)' },
    { label: 'Rank', value: '#' + you.rank, color: 'var(--yellow)' },
    { label: 'Day streak', value: you.streak, color: 'var(--coral)' },
    { label: 'CO₂ saved', value: '48 kg', color: 'var(--blue)' },
  ];
  const badges = [
    { icon: 'bike', c: '#00E676', t: 'Commuter' }, { icon: 'drop', c: '#38BDF8', t: 'Hydrated' },
    { icon: 'trash', c: '#FF6B6B', t: 'Spotter' }, { icon: 'flame', c: '#FF8A4B', t: 'On Fire' },
  ];
  return (
    <div className="screen-in">
      <div style={{ padding: '20px 18px 6px', textAlign: 'center', position: 'relative' }}>
        <button className="btn btn-secondary btn-sm" style={{ position: 'absolute', top: 16, right: 18, padding: 10 }} onClick={() => ctx.showToast('Settings')}><Icon name="settings" size={20} /></button>
        <Avatar src={you.img} name={you.name} size={92} ring="var(--green)" glow style={{ margin: '0 auto 12px' }} />
        <div className="h1" style={{ fontSize: 24 }}>{you.name === 'You' ? 'Alex Rivera' : you.name}</div>
        <div className="dim" style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{you.handle} · Greenfield High</div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <div className="card" style={{ padding: 6, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '12px 4px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, color: s.color }}>{s.value}</div>
              <div className="dim" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .3, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '18px 16px 0' }}>
        <div className="h2" style={{ marginBottom: 10 }}>Badges earned</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {badges.map(b => (
            <div key={b.t} className="card" style={{ padding: '14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 44, height: 44, borderRadius: '50%', background: `${b.c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${b.c}33` }}><Icon name={b.icon} size={22} color={b.c} /></span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>{b.t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '18px 16px 100px', display: 'grid', gap: 12 }}>
        <button className="btn btn-purple btn-block" onClick={() => ctx.go('organizer')}><Icon name="plus" size={18} color="#fff" strokeWidth={3} /> Create a leaderboard</button>
        <button className="btn btn-secondary btn-block" onClick={() => ctx.go('onboarding')}>Log out</button>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, FeedScreen, QuestsScreen, ProfileScreen, FeedCard, QuestCard, mention });
