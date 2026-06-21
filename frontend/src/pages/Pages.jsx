/* EcoRise — Feed, Quests, Profile, Leaderboard, Organizer pages */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Podium from '../components/Podium';
import { PointsChip, RankBadge, Streak, Switch } from '../components/UI';
import { ResetTimer } from '../components/Shared';
import api from '../utils/api';

function nowMs() {
  return Date.now();
}

// ── mention renderer ──
function mention(text) {
  if (!text) return text;
  return text.split(/(@[\w.]+)/g).map((t, i) =>
    t.startsWith('@') ? <span key={i} style={{ color: 'var(--green)', fontWeight: 700 }}>{t}</span> : t);
}

function copyInvite(code, ctx) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(code || '').then(() => ctx.showToast('Invite code copied!')).catch(() => ctx.showToast(code));
  } else {
    ctx.showToast(code);
  }
}

// ── inline comments ──
function CommentSection({ postId, ctx }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    api.getComments(postId)
      .then(d => { if (live) setComments(d.comments || []); })
      .catch(() => { /* comments are optional in offline demo mode */ })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [postId]);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    try {
      const c = await api.commentPost(postId, t);
      setComments(prev => [...prev, { id: c.id, text: t, user_name: c.user_name || 'You', created_at: c.created_at }]);
      ctx.incrementCommentCount?.(postId);   // keep the feed card's count in sync
    } catch (err) {
      ctx.showToast(err.message || 'Could not post comment');
    }
  };

  return (
    <div style={{ padding: '0 14px 14px', display: 'grid', gap: 10 }}>
      {loading ? (
        <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>Loading comments…</div>
      ) : comments.length === 0 ? (
        <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>No comments yet. Be the first.</div>
      ) : comments.map(c => (
        <div key={c.id} style={{ fontSize: 13.5 }}>
          <span style={{ fontWeight: 800, color: 'var(--text)' }}>{c.user_name || c.user_handle || 'User'}</span>{' '}
          <span className="muted" style={{ fontWeight: 600 }}>{mention(c.text)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="field" style={{ flex: 1 }} placeholder="Add a comment…" value={text}
          onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} aria-label="Add a comment" />
        <button className="btn btn-primary" style={{ padding: '0 16px' }} onClick={submit}>Post</button>
      </div>
    </div>
  );
}

/* ============================================================
   FEED
   ============================================================ */
// Static action-type theming for feed cards. Module-scoped so it isn't reallocated
// on every render of every card.
const FEED_THEME = {
  transport: { c: '#2E7D4F', c2: '#75B77B', icon: 'bike' },
  waste:     { c: '#5D8F86', c2: '#8FB8B0', icon: 'drop' },
  food:      { c: '#75B77B', c2: '#AFCB85', icon: 'leaf' },
  cleanup:   { c: '#B66F4D', c2: '#C6A35A', icon: 'trash' },
  nature:    { c: '#2E7D4F', c2: '#AFCB85', icon: 'leaf' },
  energy:    { c: '#C6A35A', c2: '#AFCB85', icon: 'bolt' },
  community: { c: '#6F8F72', c2: '#5D8F86', icon: 'users' },
};

// Topical photo keywords per feed theme. loremflickr matches the keyword, so a
// transport post always gets a cycling/transit photo — relevance is guaranteed,
// not luck. Multiple keywords per theme add variety across posts.
const FEED_PHOTO_KW = {
  transport: ['bicycle', 'cycling', 'commuter,bus'],
  waste:     ['recycling', 'compost', 'reusable,bottle'],
  food:      ['vegetables', 'salad', 'farmers,market'],
  cleanup:   ['volunteer,cleanup', 'litter,cleanup', 'beach,cleanup'],
  nature:    ['forest', 'trees', 'garden'],
  energy:    ['solar,panel', 'wind,turbine', 'lightbulb'],
  community: ['volunteer', 'community,garden', 'students'],
};

// Stable per-post topical photo. Deterministic: the same post id maps to the same
// keyword AND the same `lock` seed, so the image never changes between re-renders
// (no flicker). If the fetch ever fails, FeedCard's onError falls back to a gradient.
function feedPhoto(post, themeKey) {
  const pool = FEED_PHOTO_KW[themeKey] || FEED_PHOTO_KW.nature;
  const id = String(post.id || post.action_desc || 'x');
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const kw = pool[h % pool.length];
  const lock = (h % 9973) + 1; // stable, non-zero seed
  return `https://loremflickr.com/800/480/${kw}?lock=${lock}`;
}

function FeedCard({ post, ctx }) {
  const [menu, setMenu] = useState(false);
  const [showC, setShowC] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const ago = (() => {
    if (!post.created_at) return '';
    const ts = post.created_at.endsWith('Z') ? post.created_at : post.created_at + 'Z';
    const mins = Math.round((nowMs() - new Date(ts).getTime()) / 60000);
    return mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 1440)}d`;
  })();

  return (
    <div className="card" style={{ overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px' }}>
        <Avatar src={post.user_avatar} name={post.user_name || 'User'} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15 }}>{post.user_name || 'User'}</div>
          <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>{post.user_handle} · {ago}</div>
        </div>
        <button className="btn btn-ghost" style={{ padding: 6 }} aria-label="Post options" onClick={() => setMenu(!menu)}><Icon name="dots" size={22} /></button>
        {menu && (
          <div style={{ position: 'absolute', top: 48, right: 14, zIndex: 10, background: 'var(--navy-800)', borderRadius: 14, padding: 6, boxShadow: '0 12px 30px rgba(30,91,57,.18)', border: '1px solid rgba(45,91,57,.12)' }}>
            <button className="btn btn-ghost" style={{ color: 'var(--coral)', fontSize: 14, padding: '8px 14px', fontFamily: 'var(--body)', fontWeight: 800 }} onClick={() => { setMenu(false); ctx.reportPost(post.id); }}>
              <Icon name="x" size={16} color="var(--coral)" /> Report post
            </button>
          </div>
        )}
      </div>
      {/* photo, or a designed action-typed gradient when there's no image */}
      {(() => {
        const t = (post.action_type || '').toLowerCase();
        const key = Object.keys(FEED_THEME).find(k => t.includes(k)) || 'nature';
        const th = FEED_THEME[key];
        // Use the post's own image if it has one, else a topical photo by theme.
        const photo = (post.image && (post.image.startsWith('data:') || post.image.startsWith('http')))
          ? post.image : feedPhoto(post, key);
        const hasPhoto = !imgErr && !!photo;
        return (
          <div style={{
            position: 'relative', height: hasPhoto ? 230 : 168, overflow: 'hidden',
            display: 'flex', alignItems: 'flex-end', padding: 14,
            background: hasPhoto ? undefined
              : `radial-gradient(130% 120% at 86% -12%, ${th.c}33, transparent 55%), radial-gradient(110% 110% at 0% 120%, ${th.c2}28, transparent 55%), linear-gradient(150deg, #f7faf5, #dde8de)`,
          }}>
            {hasPhoto && <img src={photo} alt={post.action_desc || 'Eco action'} loading="lazy" onError={() => setImgErr(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            {!hasPhoto && <Icon name={th.icon} size={158} color={th.c} strokeWidth={1.4} style={{ position: 'absolute', right: -16, bottom: -26, opacity: .16, transform: 'rotate(-8deg)' }} />}
            <div style={{ position: 'absolute', inset: 0, background: hasPhoto ? 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,.5))' : 'linear-gradient(180deg, transparent 45%, rgba(255,255,255,.66))' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span className="chip" style={{ background: hasPhoto ? 'rgba(0,0,0,.4)' : 'rgba(255,255,255,.72)', color: hasPhoto ? '#fff' : 'var(--text)', backdropFilter: 'blur(6px)', fontSize: 12, boxShadow: `inset 0 0 0 1px ${th.c}55` }}>
                <Icon name={th.icon} size={13} color={th.c} /> {post.action_type}
              </span>
              <PointsChip pts={post.points} />
            </div>
          </div>
        );
      })()}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15.5, marginBottom: 6 }}>{post.action_desc}</div>
        {post.caption && <div className="muted" style={{ fontSize: 14, lineHeight: 1.45, fontWeight: 600 }}>{mention(post.caption)}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span className="chip chip-dim" style={{ fontSize: 11.5 }}><Icon name="leaf" size={12} color="var(--green)" /> {post.co2_saved || 0} kg CO₂ saved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(45,91,57,.10)' }}>
          <button className="btn btn-ghost" style={{ padding: 0, gap: 7, color: post.liked ? 'var(--coral)' : 'var(--text-muted)', fontFamily: 'var(--body)', fontWeight: 800, fontSize: 14 }} aria-label={post.liked ? 'Unlike' : 'Like'} onClick={() => ctx.toggleLike(post.id)}>
            <Icon name="heart" size={22} color={post.liked ? 'var(--coral)' : 'var(--text-muted)'} fill={post.liked} /> {post.like_count || 0}
          </button>
          <button className="btn btn-ghost" style={{ padding: 0, gap: 7, color: 'var(--text-muted)', fontFamily: 'var(--body)', fontWeight: 800, fontSize: 14 }} aria-expanded={showC} aria-label="Toggle comments" onClick={() => setShowC(s => !s)}>
            <Icon name="chat" size={21} /> {post.comment_count || 0}
          </button>
          <button className="btn btn-ghost" style={{ padding: 0, marginLeft: 'auto', color: 'var(--text-muted)' }} aria-label="Share" onClick={() => ctx.showToast('Shared!')}>
            <Icon name="share" size={19} />
          </button>
        </div>
      </div>
      {showC && <CommentSection postId={post.id} ctx={ctx} />}
    </div>
  );
}

export function Feed({ ctx }) {
  return (
    <div className="screen-in">
      <div style={{ padding: '16px 18px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="h1" style={{ fontSize: 27 }}>Feed</div>
        <button className="btn btn-primary btn-sm" onClick={ctx.openLog}><Icon name="plus" size={18} color="#fff" strokeWidth={3} /> Post</button>
      </div>
      <div style={{ padding: '8px 16px 16px', display: 'grid', gap: 16 }}>
        {(ctx.posts || []).length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 18 }}>No posts yet</div>
            <div className="dim" style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>Be the first to log an eco action!</div>
          </div>
        )}
        {(ctx.posts || []).map(p => <FeedCard key={p.id} post={p} ctx={ctx} />)}
      </div>
    </div>
  );
}



/* ============================================================
   LEADERBOARD
   ============================================================ */
export function Leaderboard({ ctx, isCombined }) {
  const { members, bump, resetTarget, leaderboard } = ctx;
  const [metric, setMetric] = useState('points');
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleJoin = async (e) => {
    e?.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    try {
      await ctx.joinBoardByCode(code);
      setJoinCode('');
    } catch (err) {
      ctx.showToast(err.message || 'Could not join');
    } finally {
      setJoining(false);
    }
  };
  const ranked = metric === 'co2'
    ? [...members].sort((a, b) => (b.co2 || 0) - (a.co2 || 0)).map((m, i) => ({ ...m, rank: i + 1 }))
    : members;
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 5);
  const more = ranked.slice(5);
  const teamCo2 = Math.round(members.reduce((s, m) => s + (m.co2 || 0), 0) * 10) / 10;

  const content = (
    <>
      <div style={{ padding: '18px 18px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>{leaderboard?.name || 'EcoRise'}</div>
          <div className="h1" style={{ fontSize: 27 }}>Leaderboard</div>
        </div>
        {ctx.user?.id && ctx.leaderboard?.organizer_id === ctx.user.id && (
          <button className="btn btn-secondary btn-sm" aria-label="Board settings" onClick={() => ctx.go('organizer')} style={{ padding: 10 }}>
            <Icon name="settings" size={20} />
          </button>
        )}
      </div>

      {/* team impact: the board's total verified CO2e avoided — ties the leaderboard to the school's hidden footprint */}
      <div style={{ padding: '8px 16px 0' }}>
        <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(46,125,79,.18)' }}>
          <span style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(46,125,79,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="leaf" size={22} color="var(--green)" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ color: 'var(--green)' }}>Team impact · this season</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>{teamCo2} kg CO₂e avoided together</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Verified across {members.length} member{members.length !== 1 ? 's' : ''}</div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} aria-label="Footprint coach" onClick={() => ctx.go('learning')}><Icon name="sparkle" size={18} color="var(--green)" /></button>
        </div>
      </div>

      {/* rank metric toggle: points (engagement) vs CO2e avoided (real, deterministic impact) */}
      <div style={{ padding: '10px 16px 0' }}>
        <div style={{ display: 'flex', gap: 6, background: 'var(--navy-800)', padding: 5, borderRadius: 9999 }}>
          {[['points', 'Points'], ['co2', 'CO₂e avoided']].map(([k, l]) => (
            <button key={k} onClick={() => setMetric(k)} className="btn btn-sm" style={{
              flex: 1, fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14,
              background: metric === k ? 'linear-gradient(180deg,var(--navy-800),var(--navy-700))' : 'transparent',
              color: metric === k ? 'var(--green-d)' : 'var(--text-dim)', boxShadow: metric === k ? '0 4px 12px rgba(30,91,57,.12)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 16px 0' }}>
        <Podium top3={top3} variant={ctx.podiumVariant || 'cards'} bump={bump} metric={metric} />
      </div>

      <div style={{ padding: '14px 16px 0', display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <ResetTimer target={resetTarget} />

        {leaderboard?.prize && (
          <div className="card card-glow" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, background: 'radial-gradient(160px 90px at 16% -10%, rgba(198,163,90,.18), transparent), linear-gradient(180deg,var(--navy-800),var(--navy-700))' }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: 'linear-gradient(180deg,var(--yellow),#B89240)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(111,77,52,.18)', flexShrink: 0 }}>
              <Icon name="gift" size={28} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ color: 'var(--yellow)' }}>This season&rsquo;s prize</div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 17 }}>{leaderboard.prize}</div>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 6 }}>
          {[...rest, ...(showAll ? more : [])].map((p, i, arr) => (
            <div key={p.user_id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 16,
              background: p.isYou ? 'linear-gradient(90deg, rgba(46,125,79,.12), rgba(46,125,79,.03))' : 'transparent',
              boxShadow: p.isYou ? 'inset 0 0 0 1.5px rgba(46,125,79,.24)' : 'none',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(45,91,57,.10)' : 'none',
            }}>
              <RankBadge rank={p.rank} />
              <Avatar src={p.avatar} name={p.name} size={42} ring={p.isYou ? 'var(--green)' : undefined} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  {p.isYou && <span className="chip chip-green" style={{ padding: '2px 8px', fontSize: 11 }}>YOU</span>}
                </div>
                <Streak n={p.streak || 0} size={12} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={bump === p.user_id ? 'count-flash' : ''} style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16 }}>{metric === 'co2' ? (p.co2 || 0) : (p.points || 0).toLocaleString()}</div>
                <div className="dim" style={{ fontSize: 10, fontWeight: 800, letterSpacing: .5 }}>{metric === 'co2' ? 'KG' : 'PTS'}</div>
              </div>
            </div>
          ))}
          {more.length > 0 && (
            <button className="btn btn-ghost btn-sm btn-block" style={{ margin: '6px 0 2px', color: 'var(--green)', fontWeight: 700 }} onClick={() => setShowAll(s => !s)}>
              {showAll ? 'Show less' : `See all ${members.length} members`}
            </button>
          )}
        </div>

        <button className="btn btn-purple btn-block" onClick={() => copyInvite(leaderboard?.invite_code, ctx)}>
          <Icon name="share" size={19} color="#fff" /> Invite friends
        </button>

        <form onSubmit={handleJoin} style={{ display: 'flex', gap: 8 }}>
          <input
            className="field"
            placeholder="Invite code…"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            style={{ flex: 1 }}
            required
          />
          <button className="btn btn-primary" type="submit" disabled={joining} style={{ padding: '0 18px' }}>
            {joining ? 'Joining…' : 'Join'}
          </button>
        </form>
      </div>
    </>
  );

  return isCombined ? (
    // position+low zIndex traps this subtree's backdrop-filter cards in their own
    // stacking context BELOW the Home header (zIndex 100), so the notifications
    // dropdown renders on top instead of behind these cards (Chromium backdrop-filter quirk).
    <div style={{ paddingBottom: 12, position: 'relative', zIndex: 1 }}>{content}</div>
  ) : (
    <div className="screen-in" style={{ paddingBottom: 24 }}>
      {content}
    </div>
  );
}

/* ============================================================
   PROFILE
   ============================================================ */
function BugReportSheet({ user, onClose }) {
  const [desc, setDesc] = useState('');

  const submit = () => {
    const subject = encodeURIComponent('EcoRise Bug Report');
    const body = encodeURIComponent(
      `Bug description:\n${desc}\n\n---\nUser: ${user?.name || 'unknown'} (${user?.handle || ''})\nApp: EcoRise`
    );
    window.open(`mailto:gapfhog@gmail.com?subject=${subject}&body=${body}`, '_blank');
    onClose();
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 9990, background: 'rgba(12,17,14,.5)', backdropFilter: 'blur(2px)' }} />
      <div role="dialog" aria-modal="true" aria-label="Report a bug" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 9991, background: 'var(--navy-900)', borderRadius: '22px 22px 0 0', padding: '20px 20px calc(24px + env(safe-area-inset-bottom))', boxShadow: '0 -12px 40px rgba(30,91,57,.18)', display: 'grid', gap: 14 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(45,91,57,.18)', margin: '0 auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(193,99,66,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="flag" size={20} color="var(--coral)" />
          </span>
          <div>
            <div className="h2" style={{ fontSize: 17, marginBottom: 1 }}>Report a bug</div>
            <div className="dim" style={{ fontSize: 12.5, fontWeight: 600 }}>Sent to the EcoRise team</div>
          </div>
        </div>
        <textarea
          className="field"
          rows={4}
          placeholder="Describe what happened and how to reproduce it…"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          style={{ resize: 'none', fontSize: 14 }}
          aria-label="Bug description"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="btn btn-secondary btn-block" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-block" onClick={submit} disabled={!desc.trim()}>Send report</button>
        </div>
      </div>
    </>,
    document.querySelector('.app') || document.body
  );
}

export function Profile({ ctx }) {
  const { user, members } = ctx;
  const [bugOpen, setBugOpen] = useState(false);
  const you = members.find(m => m.isYou) || { points: 0, rank: 0, streak: 0 };
  const stats = [
    { label: 'Points', value: (you.points || 0).toLocaleString(), color: 'var(--green)' },
    { label: 'Rank', value: '#' + (you.rank || '-'), color: 'var(--yellow)' },
    { label: 'Day streak', value: you.streak || 0, color: 'var(--coral)' },
    { label: 'CO₂ saved', value: (user.co2Saved || 0) + ' kg', color: 'var(--blue)' },
  ];
  const BADGE_MAP = {
    first_action: { icon: 'star', c: '#2E7D4F', t: 'Starter' },
    seven_day_streak: { icon: 'flame', c: '#FF8A4B', t: 'On Fire' },
    trash_hero: { icon: 'trash', c: '#B66F4D', t: 'Spotter' },
    top_three: { icon: 'trophy', c: '#C6A35A', t: 'Podium' },
    ten_actions: { icon: 'bolt', c: '#5D8F86', t: 'Veteran' },
  };
  // Show only badges the user has actually earned (no decorative defaults).
  const displayBadges = (user.badges || []).map(b => BADGE_MAP[b.badge_type || b] || { icon: 'star', c: '#5D8F86', t: 'Badge' });

  return (
    <div className="screen-in">
      <div style={{ padding: '20px 18px 6px', textAlign: 'center', position: 'relative' }}>
        <button className="btn btn-secondary btn-sm" style={{ position: 'absolute', top: 16, right: 18, padding: 10 }} aria-label="Privacy & data" onClick={() => ctx.go('privacy')}>
          <Icon name="settings" size={20} />
        </button>
        <Avatar src={user.avatar} name={user.name} size={92} ring="var(--green)" glow style={{ margin: '0 auto 12px' }} />
        <div className="h1" style={{ fontSize: 24 }}>{user.name}</div>
        <div className="dim" style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{user.handle}</div>
      </div>
      <div style={{ padding: '14px 16px 0' }}>
        <div className="card" style={{ padding: 6, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '12px 4px', borderRight: i < 3 ? '1px solid rgba(45,91,57,.10)' : 'none' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, color: s.color }}>{s.value}</div>
              <div className="dim" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .3, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '18px 16px 0' }}>
        <div className="h2" style={{ marginBottom: 10 }}>Badges earned</div>
        {displayBadges.length === 0 ? (
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div className="dim" style={{ fontWeight: 700, fontSize: 13.5 }}>No badges yet — log eco actions to earn your first one.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {displayBadges.map((b, i) => (
              <div key={i} className="card" style={{ padding: '14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 44, height: 44, borderRadius: '50%', background: `${b.c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${b.c}33` }}><Icon name={b.icon} size={22} color={b.c} /></span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>{b.t}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '18px 16px 16px', display: 'grid', gap: 12 }}>
        <button className="btn btn-primary btn-block" onClick={() => ctx.go('home')}><Icon name="trophy" size={18} color="#fff" /> View leaderboard</button>
        <button className="btn btn-purple btn-block" onClick={() => ctx.go('organizer')}><Icon name="plus" size={18} color="#fff" strokeWidth={3} /> Create a leaderboard</button>
        <button className="btn btn-secondary btn-block" onClick={() => ctx.go('privacy')}><Icon name="check" size={18} /> Privacy &amp; data</button>
        <button className="btn btn-secondary btn-block" onClick={() => setBugOpen(true)}><Icon name="flag" size={18} color="var(--coral)" /> Report a bug</button>
        <button className="btn btn-secondary btn-block" onClick={ctx.logout}>Log out</button>
      </div>
      {bugOpen && <BugReportSheet user={user} onClose={() => setBugOpen(false)} />}
    </div>
  );
}

/* ============================================================
   ORGANIZER
   ============================================================ */
export function Organizer({ ctx }) {
  const [name, setName] = useState(ctx.leaderboard?.name || 'My EcoRise Board');
  const [interval, setInterval_] = useState(ctx.leaderboard?.reset_interval || 'weekly');
  const [prizeOn, setPrizeOn] = useState(true);
  const [prize, setPrize] = useState(ctx.leaderboard?.prize || '');
  const [includeSelf, setIncludeSelf] = useState(true);
  const [tab, setTab] = useState('settings');

  const reports = (ctx.posts || []).filter(p => p.reported > 0);

  const isOrganizer = ctx.user?.id && ctx.leaderboard?.organizer_id === ctx.user.id;
  if (!isOrganizer) {
    return (
      <div className="screen-in" style={{ paddingBottom: 16 }}>
        <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} aria-label="Back" onClick={() => ctx.go('home')}><Icon name="chevL" size={20} /></button>
          <div className="h1" style={{ fontSize: 24 }}>Manage board</div>
        </div>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div className="dim" style={{ fontWeight: 700, fontSize: 15 }}>Only the board organizer can manage settings.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-in" style={{ paddingBottom: 16 }}>
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} aria-label="Back" onClick={() => ctx.go('home')}><Icon name="chevL" size={20} /></button>
        <div>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>Organizer</div>
          <div className="h1" style={{ fontSize: 24 }}>Manage board</div>
        </div>
      </div>

      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ display: 'flex', gap: 6, background: 'var(--navy-800)', padding: 5, borderRadius: 9999 }}>
          {[['settings', 'Settings'], ['moderation', `Reports${reports.length ? ' · ' + reports.length : ''}`]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="btn btn-sm" style={{
              flex: 1, fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14,
              background: tab === k ? 'linear-gradient(180deg,var(--navy-800),var(--navy-700))' : 'transparent',
              color: tab === k ? 'var(--green-d)' : 'var(--text-dim)', boxShadow: tab === k ? '0 4px 12px rgba(30,91,57,.12)' : 'none',
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {['daily', 'weekly', 'monthly'].map(o => (
                <button key={o} onClick={() => setInterval_(o)} className="btn btn-sm" style={{
                  fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, padding: '11px 4px', textTransform: 'capitalize',
                  background: interval === o ? 'linear-gradient(180deg,var(--green-2),var(--green))' : 'var(--navy-800)',
                  color: interval === o ? '#fff' : 'var(--text-muted)',
                  boxShadow: interval === o ? '0 8px 16px rgba(30,91,57,.18)' : 'inset 0 0 0 1.5px var(--navy-500)',
                }}>{o}</button>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(198,163,90,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="gift" size={20} color="var(--yellow)" /></span>
                <div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15.5 }}>Offer a prize</div>
                  <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>Shown on the leaderboard</div>
                </div>
              </div>
              <Switch on={prizeOn} onChange={setPrizeOn} color="var(--green)" label="Offer a prize" />
            </div>
            {prizeOn && <input className="field" style={{ marginTop: 12 }} value={prize} onChange={e => setPrize(e.target.value)} placeholder="Describe the prize" />}
          </div>
          <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(46,125,79,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={20} color="var(--green)" /></span>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15.5 }}>Include myself</div>
                <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>Compete alongside members</div>
              </div>
            </div>
            <Switch on={includeSelf} onChange={setIncludeSelf} label="Include myself" />
          </div>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Invite code</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="field" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)', fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>{ctx.leaderboard?.invite_code || 'INVITE'}</div>
              <button className="btn btn-primary" style={{ padding: '0 18px' }} aria-label="Copy invite code" onClick={() => copyInvite(ctx.leaderboard?.invite_code, ctx)}><Icon name="copy" size={18} color="#fff" /></button>
            </div>
          </div>
          <button className="btn btn-purple btn-block btn-lg" onClick={async () => {
            await ctx.updateLeaderboard({ name, resetInterval: interval, prize: prizeOn ? prize : '', includeSelf });
            ctx.showToast('Leaderboard saved!');
            ctx.go('home');
          }}>Save changes</button>
        </div>
      )}

      {tab === 'moderation' && (
        <div style={{ padding: '16px 16px 0', display: 'grid', gap: 14 }}>
          {reports.length === 0 && (
            <div className="card" style={{ padding: 30, textAlign: 'center' }}>
              <span style={{ fontSize: 34 }}>✨</span>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 17, marginTop: 8 }}>All clear!</div>
              <div className="dim" style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>No reports in the queue.</div>
            </div>
          )}
          {reports.map(r => (
            <div key={r.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: 14, background: r.image?.startsWith('data:') ? `url(${r.image}) center/cover` : 'linear-gradient(135deg,var(--green-d),var(--green))', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14 }}>{r.user_name}</div>
                  <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>{r.action_desc}</div>
                  <span className="chip" style={{ marginTop: 6, background: 'rgba(255,107,107,.16)', color: 'var(--coral-2)', fontSize: 11.5 }}><Icon name="bell" size={12} color="var(--coral-2)" /> Reported</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => ctx.keepPost(r.id)}>Keep</button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => ctx.deletePost(r.id)}><Icon name="trash" size={16} color="#fff" /> Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
