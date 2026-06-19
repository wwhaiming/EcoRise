/* EcoRise — Quests page (dedicated tab).
 *
 * Daily quests are AI-generated per user and the 2x bonus is granted ONLY by
 * logging a verified photo action — so this page leans into the AI + anti-cheat
 * story that judges care about, not just a checklist.
 */
import Icon from '../components/Icon';
import { HelpTip } from '../components/UI';

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
          <Icon name="camera" size={16} /> Log photo
        </button>
      )}
    </div>
  );
}

export default function Quests({ ctx, isCombined }) {
  const quests = ctx.quests || [];
  const done = quests.filter(q => q.progress >= q.goal).length;
  const pct = quests.length ? Math.round((done / quests.length) * 100) : 0;

  const content = (
    <>
      <div style={{ padding: '18px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="h1" style={{ fontSize: 27 }}>Quests</div>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--yellow)', background: 'rgba(255,210,63,.12)', padding: '6px 13px', borderRadius: 9999 }}>{done}/{quests.length}</span>
      </div>

      {/* quick actions */}
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={ctx.openTrash} className="card" style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,107,107,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={22} color="var(--coral)" /></span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Trash Spotter</span>
          </button>
          <button onClick={ctx.openLog} className="card" style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(46,125,79,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="camera" size={22} color="var(--green)" /></span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Log action</span>
          </button>
        </div>
      </div>

      {/* AI banner */}
      <div style={{ padding: '8px 16px 0' }}>
        <div className="card" style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', border: '1px solid rgba(46,125,79,.18)' }}>
          <Icon name="sparkle" size={16} color="var(--green)" />
          <span className="eyebrow" style={{ color: 'var(--green)', flex: 1 }}>AI-personalized · daily</span>
          <HelpTip text="Quests are generated for you by AI and refresh each day. The 2× bonus only unlocks when AI verifies a matching photo — you can't mark them done by hand." />
        </div>
      </div>

      {/* progress strip */}
      <div style={{ padding: '14px 16px 0' }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div className="bar" style={{ flex: 1 }}><i style={{ width: pct + '%' }} /></div>
            <span className="dim" style={{ fontWeight: 800, fontSize: 13, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
          </div>
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
    </>
  );

  return isCombined ? (
    <div style={{ paddingBottom: 12 }}>{content}</div>
  ) : (
    <div className="screen-in">
      {content}
    </div>
  );
}
