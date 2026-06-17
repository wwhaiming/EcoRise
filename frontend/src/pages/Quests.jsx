/* GeoRise — Quests page (dedicated tab).
 *
 * Daily quests are AI-generated per user and the 2x bonus is granted ONLY by
 * logging a verified photo action — so this page leans into the AI + anti-cheat
 * story that judges care about, not just a checklist.
 */
import Icon from '../components/Icon';

const QUEST_ICONS = { transportation: 'bike', waste: 'drop', energy: 'bolt', food: 'leaf', nature: 'trash', community: 'users' };
const QUEST_COLORS = { transportation: 'var(--green)', waste: 'var(--blue)', energy: 'var(--yellow)', food: 'var(--green-2)', nature: 'var(--green-d)', community: 'var(--lime)' };

function QuestCard({ q, ctx }) {
  const done = q.progress >= q.goal;
  const prog = q.goal > 0 ? Math.min(100, (q.progress / q.goal) * 100) : 0;
  const icon = QUEST_ICONS[q.action_type] || 'star';
  const color = QUEST_COLORS[q.action_type] || 'var(--green)';

  return (
    <div className="card" style={{
      padding: 16, position: 'relative', overflow: 'hidden',
      border: done ? '1.5px solid rgba(46,125,79,.38)' : '1px solid rgba(45,91,57,.10)',
      boxShadow: done ? '0 14px 30px rgba(30,91,57,.18)' : '0 12px 28px rgba(30,91,57,.10)',
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
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(30,91,57,.22)', flexShrink: 0 }}>
            <Icon name="check" size={18} color="#fff" strokeWidth={3} />
          </span>
        )}
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="bar" style={{ flex: 1 }}><i style={{ width: prog + '%' }} /></div>
        <span className="dim" style={{ fontSize: 12.5, fontWeight: 800, minWidth: 32, textAlign: 'right' }}>{q.progress}/{q.goal}</span>
      </div>
      {!done && (
        <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 12 }} onClick={ctx.openLog}>
          <Icon name="camera" size={16} /> Log a photo to progress
        </button>
      )}
    </div>
  );
}

export default function Quests({ ctx }) {
  const quests = ctx.quests || [];
  const done = quests.filter(q => q.progress >= q.goal).length;
  const pct = quests.length ? Math.round((done / quests.length) * 100) : 0;

  return (
    <div className="screen-in">
      <div style={{ padding: '18px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--yellow)' }}>Double points all day</div>
          <div className="h1" style={{ fontSize: 27 }}>Daily Quests</div>
        </div>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--yellow)', background: 'rgba(255,210,63,.12)', padding: '6px 13px', borderRadius: 9999 }}>{done}/{quests.length}</span>
      </div>

      {/* AI banner */}
      <div style={{ padding: '8px 16px 0' }}>
        <div className="card" style={{ padding: 15, display: 'flex', gap: 12, alignItems: 'flex-start', border: '1px solid rgba(46,125,79,.18)', background: 'radial-gradient(180px 80px at 90% -10%, rgba(117,183,123,.16), transparent), var(--navy-800)' }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(46,125,79,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkle" size={22} color="var(--green)" />
          </span>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 4 }}>AI-personalized · refreshes daily</div>
            <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.45, color: 'var(--text)' }}>
              These quests are generated for you by AI. The 2× bonus only unlocks when the AI verifies a matching photo — you can&rsquo;t mark them done by hand.
            </div>
          </div>
        </div>
      </div>

      {/* progress strip */}
      <div style={{ padding: '14px 16px 0' }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="muted" style={{ fontWeight: 800, fontSize: 13.5 }}>Today&rsquo;s progress</span>
            <span className="dim" style={{ fontWeight: 800, fontSize: 13 }}>{pct}%</span>
          </div>
          <div className="bar"><i style={{ width: pct + '%' }} /></div>
        </div>
      </div>

      {/* quest list */}
      <div style={{ padding: '16px 16px 0', display: 'grid', gap: 12 }}>
        {quests.length === 0 ? (
          <div className="card" style={{ padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🎯</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 17 }}>No quests yet</div>
            <div className="dim" style={{ fontWeight: 700, fontSize: 13.5, marginTop: 6 }}>Your AI quests load when you join a board.</div>
          </div>
        ) : quests.map(q => <QuestCard key={q.id} q={q} ctx={ctx} />)}
      </div>

      <div style={{ height: 110 }} />
    </div>
  );
}
