/* EcoRise — Setup Board screen (Create or Join leaderboard, shown after signup) */
import { useState } from 'react';
import Icon from '../components/Icon';
import { LogoMark, Wordmark, Orbs } from '../components/Shared';
import api from '../utils/api';

export default function SetupBoard({ ctx, onComplete }) {
  const [tab, setTab] = useState('join'); // 'create' or 'join'

  // Create state
  const [name, setName] = useState('');
  const [resetInterval, setResetInterval] = useState('weekly');
  const [prize, setPrize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Join state
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async (e) => {
    e?.preventDefault();
    const boardName = name.trim();
    if (!boardName) return;
    setLoading(true);
    setError('');
    try {
      const board = await api.createLeaderboard({
        name: boardName,
        resetInterval,
        prize: prize.trim(),
        includeSelf: true,
      });
      ctx.showToast(`"${board.name}" created!`);
      ctx.onBoardCreated(board);
      onComplete();
    } catch (err) {
      setError(err.message || 'Could not create leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e?.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      await ctx.joinBoardByCode(code);
      onComplete();
    } catch (err) {
      setError(err.message || 'Could not join leaderboard. Check invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-in" style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', padding: '52px 26px 30px' }}>
      <Orbs />

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Wordmark size={22} />
        <button className="btn btn-ghost btn-sm" onClick={ctx.logout}>Log out</button>
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><LogoMark size={56} /></div>
        <div className="h1" style={{ textAlign: 'center', fontSize: 26, marginBottom: 6 }}>Set up your leaderboard</div>
        <p className="muted" style={{ textAlign: 'center', fontWeight: 600, marginBottom: 26, fontSize: 14.5 }}>
          Create a new board to invite friends, or join an existing board.
        </p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--navy-800)', padding: 5, borderRadius: 9999, marginBottom: 20 }}>
          {[['join', 'Join Board'], ['create', 'Create Board']].map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setError(''); }} className="btn btn-sm" style={{
              flex: 1, fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13.5,
              background: tab === k ? 'linear-gradient(180deg,var(--navy-600),var(--navy-700))' : 'transparent',
              color: 'var(--green-d)', boxShadow: tab === k ? '0 4px 12px rgba(0,0,0,.3)' : 'none',
              padding: '10px 4px',
            }}>{l}</button>
          ))}
        </div>

        {tab === 'join' ? (
          <form onSubmit={handleJoin} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Invite Code</label>
              <input
                className="field"
                type="text"
                placeholder="e.g. GRNFLD-7K2"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            {error && <div style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 13.5, textAlign: 'center' }}>{error}</div>}
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? 'Joining...' : 'Join Leaderboard'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Leaderboard Name</label>
              <input
                className="field"
                type="text"
                placeholder="e.g. Greenfield High"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Reset Interval</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {['daily', 'weekly', 'monthly'].map(o => (
                  <button key={o} type="button" onClick={() => setResetInterval(o)} className="btn btn-sm" style={{
                    fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, padding: '10px 4px', textTransform: 'capitalize',
                    background: resetInterval === o ? 'linear-gradient(180deg,var(--green-2),var(--green))' : 'var(--navy-800)',
                    color: resetInterval === o ? '#06281A' : 'var(--text-muted)',
                    boxShadow: resetInterval === o ? '0 6px 16px rgba(46,125,79,.3)' : 'inset 0 0 0 1.5px var(--navy-500)',
                  }}>{o}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Seasonal Prize <span className="dim">(optional)</span></label>
              <input
                className="field"
                type="text"
                placeholder="e.g. Gift Card"
                value={prize}
                onChange={e => setPrize(e.target.value)}
              />
            </div>

            {error && <div style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 13.5, textAlign: 'center' }}>{error}</div>}
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Leaderboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
