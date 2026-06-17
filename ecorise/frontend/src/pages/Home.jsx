/* EcoRise — Home / Dashboard page */
import React, { useRef, useState } from 'react';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import { RankBadge, Streak, METAL } from '../components/UI';

// Curated climate / CO2 facts (approximate, commonly-cited figures).
const CLIMATE_FACTS = [
  'Transportation is ~29% of U.S. greenhouse-gas emissions — the single largest source.',
  'One tree absorbs roughly 21 kg of CO₂ per year.',
  'Producing 1 kg of beef emits ~60 kg of CO₂ — about 10× a plant-based meal.',
  'A reusable bottle can prevent ~150 single-use plastic bottles a year.',
  'Biking 10 miles instead of driving saves about 4 kg of CO₂.',
  'Food waste causes ~8% of global greenhouse-gas emissions.',
  'Air-drying one load of laundry saves ~1 kg of CO₂ vs. a dryer.',
  'LED bulbs use ~75% less energy and last ~25× longer than incandescent.',
  'Recycling one aluminum can saves enough energy to run a TV for ~3 hours.',
  'Skipping meat one day a week ~= taking your car off the road for a month each year.',
];

function ClimateFact() {
  const [i, setI] = useState(() => Math.floor(Math.random() * CLIMATE_FACTS.length));
  return (
    <button onClick={() => setI((i + 1) % CLIMATE_FACTS.length)} aria-label="Show another climate fact"
      style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(0,230,118,.25)', borderRadius: 18,
        padding: 16, background: 'radial-gradient(180px 80px at 90% -10%, rgba(0,230,118,.16), transparent), var(--navy-800)',
        display: 'flex', gap: 13, alignItems: 'flex-start' }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(0,230,118,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="leaf" size={22} color="var(--green)" />
      </span>
      <div style={{ flex: 1 }}>
        <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 4 }}>Did you know? · tap for another</div>
        <div className="muted" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: '#fff' }}>{CLIMATE_FACTS[i]}</div>
      </div>
    </button>
  );
}

function QuestCard({ q, ctx }) {
  const done = q.progress >= q.goal;
  const prog = q.goal > 0 ? Math.min(100, (q.progress / q.goal) * 100) : 0;
  const QUEST_ICONS = { transportation: 'bike', waste: 'drop', energy: 'bolt', food: 'leaf', nature: 'trash', community: 'users' };
  const QUEST_COLORS = { transportation: '#00E676', waste: '#38BDF8', energy: '#FFD23F', food: '#1AF08A', nature: '#FF6B6B', community: '#7C4DFF' };
  const icon = QUEST_ICONS[q.action_type] || 'star';
  const color = QUEST_COLORS[q.action_type] || '#00E676';

  return (
    <div className="card" style={{
      padding: 16, position: 'relative', overflow: 'hidden',
      border: done ? '1.5px solid rgba(0,230,118,.5)' : '1px solid rgba(255,255,255,.05)',
      boxShadow: done ? '0 10px 30px rgba(0,0,0,.3), 0 0 30px rgba(0,230,118,.2)' : '0 12px 30px rgba(0,0,0,.32)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
        <span style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={24} color={color} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16.5 }}>{q.title}</span>
            <span className="chip chip-2x" style={{ fontSize: 12, padding: '3px 9px' }}>2× {q.points_base}</span>
          </div>
          <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{q.description}</div>
        </div>
        {done && (
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,230,118,.6)', flexShrink: 0 }}>
            <Icon name="check" size={18} color="#06281A" strokeWidth={3} />
          </span>
        )}
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="bar" style={{ flex: 1 }}><i style={{ width: prog + '%' }} /></div>
        <span className="dim" style={{ fontSize: 12.5, fontWeight: 800, minWidth: 32, textAlign: 'right' }}>{q.progress}/{q.goal}</span>
      </div>
      {!done && (
        <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 12 }} onClick={ctx.openLog}>
          <Icon name="camera" size={16} /> Log to progress
        </button>
      )}
    </div>
  );
}

export default function Home({ ctx }) {
  const { user, members, quests, go, openTrash, bump, notifications, unreadCount, markNotificationsRead } = ctx;
  const [notifOpen, setNotifOpen] = useState(false);
  const you = members.find(m => m.isYou) || { points: 0, rank: members.length, streak: 0 };
  const top3 = members.slice(0, 3);
  const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const ranks = top3.length >= 3 ? [2, 1, 3] : top3.map((_, i) => i + 1);

  const nextRankPts = you.rank > 1 ? (members[you.rank - 2]?.points || 0) : you.points;
  const gap = Math.max(0, nextRankPts - (you.points || 0));
  const prog = you.rank > 1 && nextRankPts > 0 ? Math.min(100, ((you.points || 0) / nextRankPts) * 100) : 100;
  const doneQuests = (quests || []).filter(q => q.progress >= q.goal).length;

  const questsRef = useRef(null);
  const scrollToQuests = () => {
    if (questsRef.current) {
      questsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="screen-in">
      {/* header */}
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar src={user.avatar} name={user.name} size={46} ring="var(--green)" />
        <div style={{ flex: 1 }}>
          <div className="dim" style={{ fontWeight: 700, fontSize: 13 }}>Good morning,</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 19, lineHeight: 1 }}>{user.name || 'Eco Champion'}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-secondary btn-sm" style={{ padding: 10, position: 'relative' }} aria-label="Notifications" aria-expanded={notifOpen}
            onClick={() => { const opening = !notifOpen; setNotifOpen(opening); if (opening) markNotificationsRead?.(); }}>
            <Icon name="bell" size={20} />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', boxShadow: '0 0 8px var(--coral)' }} />}
          </button>
          {notifOpen && (
            <div role="menu" aria-label="Notifications" style={{ position: 'absolute', top: 46, right: 0, zIndex: 30, width: 260, maxHeight: 320, overflowY: 'auto', background: 'var(--navy-700)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: 8, boxShadow: '0 16px 40px rgba(0,0,0,.5)' }}>
              {(!notifications || notifications.length === 0) ? (
                <div className="dim" style={{ fontWeight: 700, fontSize: 13, padding: 14, textAlign: 'center' }}>No notifications yet</div>
              ) : notifications.map(n => (
                <div key={n.id} style={{ padding: '10px 12px', borderRadius: 11, marginBottom: 2, background: n.read ? 'transparent' : 'rgba(0,230,118,.08)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{n.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* hero stat card */}
      <div style={{ padding: '8px 16px 0' }}>
        <div className="card card-glow" style={{ padding: 18, background: 'radial-gradient(200px 120px at 85% -20%, rgba(0,230,118,.22), transparent), linear-gradient(180deg,var(--navy-700),var(--navy-800))' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 4 }}>Your points</div>
              <div className={bump === 'you' ? 'count-flash' : ''} style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 46, lineHeight: 1, letterSpacing: '-1px' }}>
                {(you.points || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.06)', padding: '6px 12px', borderRadius: 9999 }}>
                <Icon name="trophy" size={16} color="var(--yellow)" />
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16 }}>#{you.rank}</span>
              </div>
              <Streak n={you.streak || 0} />
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

      {/* climate fact */}
      <div style={{ padding: '16px 16px 0' }}><ClimateFact /></div>

      {/* AI Eco Coach entry */}
      <div style={{ padding: '16px 16px 0' }}>
        <button onClick={() => go('coach')} aria-label="Open the AI Eco Coach"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(0,230,118,.3)', borderRadius: 18,
            padding: 16, background: 'radial-gradient(180px 90px at 88% -20%, rgba(0,230,118,.2), transparent), linear-gradient(180deg,var(--navy-700),var(--navy-800))',
            display: 'flex', gap: 13, alignItems: 'center' }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: 'rgba(0,230,118,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkle" size={24} color="var(--green)" />
          </span>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 3 }}>AI Eco Coach · new</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16, color: '#fff' }}>Ask the Eco Coach</div>
            <div className="dim" style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>Cited questions · learn why your actions matter</div>
          </div>
          <span className="dim" style={{ fontSize: 20, fontWeight: 800 }}>→</span>
        </button>
      </div>

      {/* leaderboard widget */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="h2">Top of the board</div>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--green)', padding: 4 }} onClick={() => go('leaderboard')}>See all</button>
        </div>
        <div className="card" style={{ padding: '10px 8px 12px' }}>
          {top3.length >= 3 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
              {order.map((p, i) => {
                const r = ranks[i], m = METAL[r], first = r === 1;
                return (
                  <div key={p.user_id || i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: `risePodium .5s cubic-bezier(.2,.8,.2,1) ${i * .1}s both` }}>
                    <div style={{ position: 'relative' }} className={bump === p.user_id ? 'pop-in' : ''}>
                      <Avatar src={p.avatar} name={p.name} size={first ? 56 : 46} ring={m.a} glow style={{ boxShadow: `0 0 16px ${m.glow}` }} />
                      <span className="rankbadge" style={{ position: 'absolute', bottom: -6, right: -6, minWidth: 22, height: 22, fontSize: 12, background: `linear-gradient(180deg,${m.a},${m.b})`, color: m.ink, border: '2px solid var(--navy-800)' }}>{r}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 12.5, marginTop: 8 }}>{p.name.split(' ')[0]}</div>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: m.a }}>{(p.points || 0).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          )}
          {members.slice(3, 5).map(p => (
            <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 8px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
              <RankBadge rank={p.rank} style={{ minWidth: 26, height: 26, fontSize: 13 }} />
              <Avatar src={p.avatar} name={p.name} size={34} ring={p.isYou ? 'var(--green)' : undefined} />
              <span style={{ flex: 1, fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14 }}>{p.name}{p.isYou && <span className="chip chip-green" style={{ padding: '1px 7px', fontSize: 10, marginLeft: 6 }}>YOU</span>}</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--text-muted)' }}>{(p.points || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* quick actions */}
      <div style={{ padding: '18px 16px 0' }}>
        <div className="h2" style={{ marginBottom: 10 }}>Quick actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={openTrash} className="card" style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,107,107,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={22} color="var(--coral)" /></span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, color: '#fff' }}>Trash Spotter</span>
            <span className="dim" style={{ fontSize: 12, fontWeight: 700 }}>Report litter near you</span>
          </button>
          <button onClick={scrollToQuests} className="card" style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,210,63,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bolt" size={22} color="var(--yellow)" /></span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, color: '#fff' }}>Daily quests</span>
            <span className="dim" style={{ fontSize: 12, fontWeight: 700 }}>{doneQuests}/{(quests || []).length} done · 2× points</span>
          </button>
        </div>
      </div>

      {/* quests section */}
      <div ref={questsRef} style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--yellow)' }}>Double points all day</span>
            <div className="h2" style={{ marginTop: 2 }}>Daily Quests</div>
          </div>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--yellow)', background: 'rgba(255,210,63,.12)', padding: '5px 12px', borderRadius: 9999 }}>{doneQuests}/{(quests || []).length} completed</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {(quests || []).map(q => <QuestCard key={q.id} q={q} ctx={ctx} />)}
        </div>
      </div>

      <div style={{ height: 110 }} />
    </div>
  );
}
