/* EcoRise — Bottom navigation bar with FAB */
import React from 'react';
import Icon from './Icon';

const NAV = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'feed', label: 'Feed', icon: 'feed' },
  { key: 'leaderboard', label: 'Ranks', icon: 'trophy' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export default function BottomNav({ screen, go, onFab }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* FAB */}
      <button onClick={onFab} className="pulse-green" style={{
        position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
        width: 60, height: 60, borderRadius: '50%', border: '3px solid var(--navy-900)', cursor: 'pointer',
        background: 'linear-gradient(180deg,var(--green-2),var(--green))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="plus" size={30} color="#06281A" strokeWidth={3} />
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
