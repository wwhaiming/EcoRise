/* EcoRise — Home page (combining Board and Quests) */
import { useState } from 'react';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import { Leaderboard } from './Pages';
import Quests from './Quests';

export default function Home({ ctx }) {
  const { user, notifications, unreadCount, markNotificationsRead } = ctx;
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="screen-in" style={{ paddingBottom: 24 }}>
      {/* Header with welcome and notifications */}
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
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', boxShadow: '0 4px 8px rgba(111,77,52,.22)' }} />}
          </button>
          {notifOpen && (
            <div role="menu" aria-label="Notifications" style={{ position: 'absolute', top: 46, right: 0, zIndex: 30, width: 260, maxHeight: 320, overflowY: 'auto', background: 'var(--navy-800)', border: '1px solid rgba(45,91,57,.12)', borderRadius: 16, padding: 8, boxShadow: '0 16px 40px rgba(30,91,57,.18)' }}>
              {(!notifications || notifications.length === 0) ? (
                <div className="dim" style={{ fontWeight: 700, fontSize: 13, padding: 14, textAlign: 'center' }}>No notifications yet</div>
              ) : notifications.map(n => (
                <div key={n.id} style={{ padding: '10px 12px', borderRadius: 11, marginBottom: 2, background: n.read ? 'transparent' : 'rgba(46,125,79,.08)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{n.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Board (Leaderboard) Section */}
      <Leaderboard ctx={ctx} isCombined={true} />

      {/* School Footprint Insights entry point (Direction B) */}
      <div style={{ padding: '16px 16px 0' }}>
        <button
          onClick={() => ctx.go('footprint')}
          className="card"
          style={{ width: '100%', textAlign: 'left', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid rgba(46,125,79,.22)', cursor: 'pointer', background: 'linear-gradient(135deg,rgba(46,125,79,.07),rgba(46,125,79,.03))' }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(140deg,var(--green-2),var(--green-d))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="sparkle" size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--green)' }}>Direction B · AI Insights</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, marginTop: 1 }}>School Hidden Footprint</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 1 }}>Anomalies · Predictions · Recommendations</div>
          </div>
          <Icon name="home" size={18} color="var(--green-d)" />
        </button>
      </div>

      {/* Visual Section Divider */}
      <div style={{ margin: '28px 16px 14px', borderTop: '2px dashed rgba(46,125,79,.12)', paddingTop: 12 }} />

      {/* Quests Section */}
      <Quests ctx={ctx} isCombined={true} />
    </div>
  );
}
