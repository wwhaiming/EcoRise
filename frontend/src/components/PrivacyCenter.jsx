/* EcoRise — Privacy Center (Phase 2).
 *
 * One screen that makes the FERPA/COPPA posture visible and operable:
 *   - your consent state on the active board (self-attest if your class allows it)
 *   - teacher controls: consent mode, image retention, review-before-publish,
 *     the review queue (approve/reject), and the board's audit log
 *   - your data rights: export everything, or delete your account
 *   - the public model/data card (what we run, what we keep, our limits)
 */
import { useState, useEffect, useCallback } from 'react';
import Icon from './Icon';
import api from '../utils/api';

const CONSENT_LABEL = { demo: 'Demo (open)', classroom: 'Classroom (teacher attests)', parent: 'Parent-approved (strict)' };
const RETENTION_LABEL = { minimize: 'Minimize (thumbnail only)', standard: 'Standard (full image)', '24h': 'Auto-delete after 24h', do_not_store: 'Do not store (label only)' };
const DISPLAY_LABEL = { names: 'Show member names', initials: 'Initials only (pseudonymous)' };

function Section({ icon, title, children, tint = 'var(--green)' }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon name={icon} size={16} color={tint} />
        <span className="eyebrow" style={{ color: tint }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function PrivacyCenter({ ctx }) {
  const { leaderboardId, leaderboard, user, showToast } = ctx;
  const isOrganizer = leaderboard && user && leaderboard.organizer_id === user.id;

  const [policy, setPolicy] = useState(null);
  const [consent, setConsent] = useState(null);   // { board, consent, satisfied }
  const [queue, setQueue] = useState([]);
  const [board, setBoard] = useState({ consentMode: leaderboard?.consent_mode || 'classroom', retentionMode: leaderboard?.retention_mode || 'minimize', reviewRequired: !!leaderboard?.review_required, displayMode: leaderboard?.display_mode || 'names' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    api.privacyPolicy().then(setPolicy).catch(() => {});
    if (leaderboardId) {
      api.getConsent(leaderboardId).then(c => { setConsent(c); if (c.board) setBoard(c.board); }).catch(() => {});
      if (isOrganizer) {
        api.reviewQueue(leaderboardId).then(r => setQueue(r.pending || [])).catch(() => {});
      }
    }
  }, [leaderboardId, isOrganizer]);

  useEffect(() => { refresh(); }, [refresh]);

  const selfAttest = async () => {
    try { await api.setConsent({ leaderboardId, status: 'attested' }); showToast('Consent recorded'); refresh(); }
    catch (e) { showToast(e.message || 'Could not record consent'); }
  };

  const saveBoard = async (patch) => {
    const next = { ...board, ...patch };
    setBoard(next);
    try { await api.setBoardPrivacy(leaderboardId, next); showToast('Privacy policy updated'); }
    catch (e) { showToast(e.message || 'Could not update policy'); }
  };

  const review = async (postId, decision) => {
    try {
      const r = await api.reviewPost(postId, { decision });
      showToast(decision === 'approve' ? 'Approved' : `Rejected${r.reversedPoints ? ` · ${r.reversedPoints} pts reversed` : ''}`);
      setQueue(q => q.filter(p => p.id !== postId));
      refresh();
    } catch (e) { showToast(e.message || 'Could not review'); }
  };

  const exportData = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'ecorise-export.json'; a.click();
      URL.revokeObjectURL(url);
      showToast('Your data downloaded');
    } catch (e) { showToast(e.message || 'Export failed'); }
  };

  const doDelete = async () => {
    setBusy(true);
    try { await api.deleteAccount(); showToast('Account deleted'); ctx.logout?.(); }
    catch (e) { showToast(e.message || 'Delete failed'); setBusy(false); }
  };

  const Select = ({ value, onChange, options }) => (
    <select className="field" value={value} onChange={e => onChange(e.target.value)} style={{ marginTop: 6 }}>
      {Object.entries(options).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
    </select>
  );

  return (
    <div className="screen-in" style={{ paddingBottom: 110 }}>
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} aria-label="Back" onClick={() => ctx.go('profile')}><Icon name="chevL" size={20} /></button>
        <div>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>FERPA &amp; COPPA</div>
          <div className="h1" style={{ fontSize: 24 }}>Privacy &amp; data</div>
        </div>
      </div>

      <div style={{ padding: '10px 16px 0', display: 'grid', gap: 14 }}>
        {/* My consent on this board */}
        {consent && consent.board && (
          <Section icon="user" title="Your consent on this board">
            <div className="muted" style={{ fontSize: 13, fontWeight: 650 }}>
              Mode: <b>{CONSENT_LABEL[consent.board.consentMode]}</b>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="chip" style={{ fontSize: 11, background: consent.satisfied ? 'rgba(46,125,79,.14)' : 'rgba(182,111,77,.16)', color: consent.satisfied ? 'var(--green-d)' : 'var(--coral-d)' }}>
                {consent.satisfied ? 'Consent on file' : 'Consent needed'}
              </span>
            </div>
            {!consent.satisfied && consent.board.consentMode === 'classroom' && (
              <button className="btn btn-primary btn-sm btn-block" style={{ marginTop: 10 }} onClick={selfAttest}>
                I have permission — record my consent
              </button>
            )}
            {!consent.satisfied && consent.board.consentMode === 'parent' && (
              <div className="dim" style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>This class needs parent-approved consent. Ask your teacher to record it.</div>
            )}
          </Section>
        )}

        {/* Teacher controls */}
        {isOrganizer && (
          <Section icon="settings" title="Teacher controls (this board)">
            <label className="dim" style={{ fontSize: 11.5, fontWeight: 800 }}>Consent mode</label>
            <Select value={board.consentMode} onChange={v => saveBoard({ consentMode: v })} options={CONSENT_LABEL} />
            <label className="dim" style={{ fontSize: 11.5, fontWeight: 800, display: 'block', marginTop: 12 }}>Image retention</label>
            <Select value={board.retentionMode} onChange={v => saveBoard({ retentionMode: v })} options={RETENTION_LABEL} />
            <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 12 }} onClick={() => saveBoard({ reviewRequired: !board.reviewRequired })}>
              <Icon name={board.reviewRequired ? 'check' : 'x'} size={15} /> Review before publish: {board.reviewRequired ? 'ON' : 'OFF'}
            </button>
            <label className="dim" style={{ fontSize: 11.5, fontWeight: 800, display: 'block', marginTop: 12 }}>Leaderboard display</label>
            <Select value={board.displayMode} onChange={v => saveBoard({ displayMode: v })} options={DISPLAY_LABEL} />
          </Section>
        )}

        {/* Review queue */}
        {isOrganizer && (
          <Section icon="feed" title={`Review queue${queue.length ? ` · ${queue.length}` : ''}`} tint="var(--yellow)">
            {queue.length === 0 ? (
              <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>Nothing waiting for review.</div>
            ) : queue.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(45,91,57,.08)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.user_name} · {p.derived_label || p.action_desc}</div>
                  <div className="dim" style={{ fontSize: 11.5, fontWeight: 700 }}>+{p.points} pts pending</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => review(p.id, 'approve')}>Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => review(p.id, 'reject')}>Reject</button>
              </div>
            ))}
          </Section>
        )}

        {/* Data rights */}
        <Section icon="share" title="Your data" tint="var(--blue)">
          <div className="dim" style={{ fontSize: 12.5, fontWeight: 650, marginBottom: 10 }}>Download everything we hold about you, or delete your account permanently.</div>
          <button className="btn btn-secondary btn-block btn-sm" onClick={exportData}><Icon name="share" size={15} /> Export my data (JSON)</button>
          {!confirmDelete ? (
            <button className="btn btn-block btn-sm" style={{ marginTop: 10, color: 'var(--coral-d)', background: 'rgba(182,111,77,.10)' }} onClick={() => setConfirmDelete(true)}>
              Delete my account
            </button>
          ) : (
            <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: 'rgba(182,111,77,.10)', border: '1px solid rgba(182,111,77,.25)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--coral-d)' }}>This permanently erases your account, posts, and any boards you organize. It cannot be undone.</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={doDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete forever'}</button>
              </div>
            </div>
          )}
        </Section>

        {/* Model / data card */}
        {policy && (
          <Section icon="sparkle" title="How EcoRise uses AI &amp; data" tint="#7C5CBF">
            <div className="dim" style={{ fontSize: 12, fontWeight: 650, lineHeight: 1.45 }}>{policy.responsibleAi}</div>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {(policy.models || []).map((m, i) => (
                <div key={i} style={{ padding: 10, borderRadius: 11, background: 'var(--navy-800)', border: '1px solid rgba(45,91,57,.10)' }}>
                  <div style={{ fontWeight: 800, fontSize: 12.5 }}>{m.name}</div>
                  <div className="muted" style={{ fontSize: 11.5, fontWeight: 600, marginTop: 2 }}>{m.use}</div>
                  {m.metrics && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: 'var(--green-d)' }}>Metrics: {m.metrics}</div>}
                  <div className="dim" style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>Limits: {m.limits}</div>
                </div>
              ))}
            </div>
            <div className="dim" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 10 }}>
              Retention default: {policy.retention?.default}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
