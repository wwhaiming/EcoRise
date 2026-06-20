/* EcoRise — Learning hub (unified AI Coach & Research Library) */
import { useState } from 'react';
import Icon from '../components/Icon';
import Coach from './Coach';
import Research from './Research';
import Insights from '../components/Insights';

export default function Learning({ ctx }) {
  const [subTab, setSubTab] = useState('coach'); // 'coach' | 'research' | 'insights'

  return (
    <div className="screen-in">
      {/* Unified header */}
      <div style={{ padding: '8px 18px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(46,125,79,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkle" size={22} color="var(--green)" />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 19, lineHeight: 1 }}>Learning</div>
        </div>
      </div>

      {/* Sub-tab Toggle Pill */}
      <div style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', gap: 6, background: 'var(--navy-800)', padding: 5, borderRadius: 9999 }}>
          {[['coach', 'AI Coach'], ['research', 'Research Library'], ['insights', 'AI Insights']].map(([k, l]) => (
            <button key={k} onClick={() => setSubTab(k)} className="btn btn-sm" style={{
              flex: 1, fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14,
              background: subTab === k ? 'linear-gradient(180deg,var(--navy-800),var(--navy-700))' : 'transparent',
              color: subTab === k ? 'var(--green-d)' : 'var(--text-dim)', boxShadow: subTab === k ? '0 4px 12px rgba(30,91,57,.12)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Conditional Content Rendering */}
      {subTab === 'coach' ? (
        <Coach ctx={ctx} isCombined={true} />
      ) : subTab === 'research' ? (
        <Research ctx={ctx} isCombined={true} />
      ) : (
        <Insights leaderboardId={ctx.leaderboardId} showToast={ctx.showToast} />
      )}
    </div>
  );
}
