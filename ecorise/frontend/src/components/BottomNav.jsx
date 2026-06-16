/* EcoRise — Bottom navigation bar with FAB */
import React from 'react';
import Icon from './Icon';

const NAV = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'feed', label: 'Feed', icon: 'feed' },
  { key: 'quests', label: 'Quests', icon: 'bolt' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export default function BottomNav({ screen, go, onFab }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* FAB */}
      <button onClick={onFab} className="pulse-green" aria-label="Log an eco action" style={{
        position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
        width: 64, height: 64, borderRadius: '50%', border: '3px solid var(--navy-900)', cursor: 'pointer',
        background: 'linear-gradient(160deg,var(--green-2),var(--green) 55%,var(--green-d))',
        boxShadow: '0 14px 34px rgba(43,255,156,.5), inset 0 2px 0 rgba(255,255,255,.5), inset 0 -3px 8px rgba(0,90,55,.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="plus" size={30} color="#042116" strokeWidth={3} />
      </button>
      <div className="nav">
        {NAV.map((n, i) => (
          <React.Fragment key={n.key}>
            {i === 2 && <div style={{ width: 56, flexShrink: 0 }} />}
            <button className={`nav-item ${screen === n.key ? 'active' : ''}`} onClick={() => go(n.key)}>
              <Icon name={n.icon} size={24} color={screen === n.key ? 'var(--green)' : 'var(--text-dim)'} />
              {n.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
