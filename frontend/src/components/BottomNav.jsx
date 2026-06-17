/* GeoRise — Bottom navigation bar with FAB */
import Icon from './Icon';

const NAV = [
  { key: 'coach', label: 'AI', ariaLabel: 'AI Eco Coach', icon: 'sparkle' },
  { key: 'home', label: 'Board', icon: 'home' },
  { key: 'quests', label: 'Quests', icon: 'bolt' },
  { key: 'feed', label: 'Feed', icon: 'feed' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

// Two balanced halves around the centered FAB: 2 tabs left, 3 tabs right.
const LEFT = NAV.slice(0, 2);
const RIGHT = NAV.slice(2);

export default function BottomNav({ screen, go, onFab }) {
  const renderItem = (n) => (
    <button
      key={n.key}
      type="button"
      aria-label={n.ariaLabel || n.label}
      aria-current={screen === n.key ? 'page' : undefined}
      className={`nav-item ${screen === n.key ? 'active' : ''}`}
      onClick={() => go(n.key)}
    >
      <Icon name={n.icon} size={24} color={screen === n.key ? 'var(--green)' : 'var(--text-dim)'} />
      {n.label}
    </button>
  );

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* FAB — centered over the nav slot */}
      <button type="button" onClick={onFab} className="pulse-green" aria-label="Log an eco action" style={{
        position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
        width: 64, height: 64, borderRadius: '50%', border: '3px solid var(--navy-900)', cursor: 'pointer',
        background: 'linear-gradient(160deg,var(--green-2),var(--green) 55%,var(--green-d))',
        boxShadow: '0 16px 30px rgba(30,91,57,.24), inset 0 2px 0 rgba(255,255,255,.5), inset 0 -3px 8px rgba(0,90,55,.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="plus" size={30} color="#fff" strokeWidth={3} />
      </button>
      <div className="nav">
        <div className="nav-group">{LEFT.map(renderItem)}</div>
        <div className="nav-slot" aria-hidden="true" />
        <div className="nav-group">{RIGHT.map(renderItem)}</div>
      </div>
    </div>
  );
}
