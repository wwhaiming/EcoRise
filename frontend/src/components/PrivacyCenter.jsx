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

function Select({ value, onChange, options }) {
  return (
    <select className="field" value={value} onChange={e => onChange(e.target.value)} style={{ marginTop: 6 }}>
      {Object.entries(options).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
    </select>
  );
}

export default function PrivacyCenter({ ctx }) {
  const { leaderboardId, leaderboard, user, showToast } = ctx;
  const isOrganizer = leaderboard && user && leaderboard.organizer_id === user.id;

  const [policy, setPolicy] = useState(null);
  const [consent, setConsent] = useState(null);   // { board, consent, satisfied }
  const [vault, setVault] = useState([]);
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
        api.getConsentVault(leaderboardId).then(r => setVault(r.vault || [])).catch(() => {});
      }
    }
  }, [leaderboardId, isOrganizer]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDocumentUpload = async (targetUserId, status, file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('leaderboardId', leaderboardId);
      fd.append('userId', targetUserId);
      fd.append('status', status || 'attested');
      fd.append('method', 'Signed consent slip');
      fd.append('document', file);

      await api.setConsent(fd);
      showToast('Signed consent slip uploaded successfully');
      refresh();
    } catch (e) {
      showToast(e.message || 'Could not upload consent slip');
    }
  };

  const updateMemberConsent = async (targetUserId, status, method = '') => {
    try {
      await api.setConsent({
        leaderboardId,
        userId: targetUserId,
        status,
        method: method || (status === 'granted' ? 'Parent Consent' : status === 'attested' ? 'Teacher Attested' : 'Revoked')
      });
      showToast('Consent status updated');
      refresh();
    } catch (e) {
      showToast(e.message || 'Could not update consent status');
    }
  };

  const downloadDocument = async (targetUserId, documentName) => {
    try {
      const { documentData } = await api.getConsentDocument(leaderboardId, targetUserId);
      const a = document.createElement('a');
      a.href = documentData;
      a.download = documentName || 'consent-slip';
      a.click();
    } catch (e) {
      showToast(e.message || 'Could not download consent slip');
    }
  };

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
              {consent.consent?.document_name && (
                <button onClick={() => downloadDocument(user.id, consent.consent.document_name)} className="btn-link" style={{ fontSize: 11, color: 'var(--green)', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}>
                  📄 {consent.consent.document_name}
                </button>
              )}
            </div>
            {!consent.satisfied && consent.board.consentMode === 'classroom' && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-primary btn-sm btn-block" onClick={selfAttest}>
                  I have permission — record my consent
                </button>
                <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--grey)' }}>— OR —</div>
                <label className="btn btn-secondary btn-sm btn-block" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', margin: 0 }}>
                  <Icon name="share" size={14} /> Upload signed parent slip
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => handleDocumentUpload(user.id, 'attested', e.target.files[0])}
                  />
                </label>
              </div>
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

        {/* Legal Document Vault (Organizer only) */}
        {isOrganizer && (
          <Section icon="file" title="Legal Document Vault" tint="var(--green)">
            <div className="dim" style={{ fontSize: 12.5, fontWeight: 650, marginBottom: 10 }}>
              Collect and store signed classroom/parent consent forms (PDF or images) for student roster compliance.
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
              {vault.length === 0 ? (
                <div className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>No members found on this board.</div>
              ) : vault.map(m => (
                <div key={m.user_id} style={{ padding: 12, borderRadius: 12, background: 'var(--navy-800)', border: '1px solid rgba(45,91,57,.10)' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {m.name} <span className="muted" style={{ fontSize: 11.5 }}>({m.role})</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="chip" style={{
                      fontSize: 10.5,
                      background: m.consent_status === 'granted' ? 'rgba(46,125,79,.14)' :
                                  m.consent_status === 'attested' ? 'rgba(46,125,79,.08)' :
                                  'rgba(182,111,77,.16)',
                      color: m.consent_status === 'granted' || m.consent_status === 'attested' ? 'var(--green-d)' : 'var(--coral-d)'
                    }}>
                      {m.consent_status === 'granted' ? 'Parent Granted' :
                       m.consent_status === 'attested' ? 'Teacher Attested' : 'Needs Consent'}
                    </span>
                    {m.has_document ? (
                      <button onClick={() => downloadDocument(m.user_id, m.document_name)} className="btn-link" style={{ fontSize: 11, color: 'var(--green)', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}>
                        📄 {m.document_name || 'View Slip'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--coral-d)' }}>⚠️ No slip uploaded</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => updateMemberConsent(m.user_id, 'granted')}>Grant Parent</button>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => updateMemberConsent(m.user_id, 'attested')}>Attest Class</button>
                    {m.consent_status !== 'none' && m.consent_status !== 'revoked' && (
                      <button className="btn btn-sm" style={{ padding: '4px 8px', fontSize: 11, color: 'var(--coral-d)', background: 'rgba(182,111,77,.10)' }} onClick={() => updateMemberConsent(m.user_id, 'revoked')}>Revoke</button>
                    )}
                    <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 8px', fontSize: 11, margin: 0 }}>
                      <Icon name="share" size={11} /> Upload Slip
                      <input
                        type="file"
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => handleDocumentUpload(m.user_id, m.consent_status === 'granted' ? 'granted' : 'attested', e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
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
                  {m.confusion && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <div className="dim" style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 4 }}>Detailed Validation Confusion Matrix (argmax):</div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 1,
                        background: 'rgba(45,91,57,.15)',
                        border: '1px solid rgba(45,91,57,.2)',
                        borderRadius: 6,
                        overflow: 'hidden',
                        maxWidth: 280,
                        fontSize: 11.5
                      }}>
                        <div style={{ background: 'var(--navy-700)', padding: '4px 6px', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Actual \ Pred</div>
                        <div style={{ background: 'var(--navy-700)', padding: '4px 6px', fontWeight: 700, textAlign: 'center', color: 'var(--text-dim)' }}>Not Litter</div>
                        <div style={{ background: 'var(--navy-700)', padding: '4px 6px', fontWeight: 700, textAlign: 'center', color: 'var(--text-dim)' }}>Litter</div>

                        <div style={{ background: 'var(--navy-700)', padding: '4px 6px', fontWeight: 700, color: 'var(--text-dim)' }}>Not Litter</div>
                        <div style={{ background: 'var(--navy-800)', padding: '4px 6px', textAlign: 'center', color: 'var(--green-d)', fontWeight: 800 }}>{m.confusion.tn} <span style={{ fontSize: 8.5, fontWeight: 600 }}>(TN)</span></div>
                        <div style={{ background: 'var(--navy-800)', padding: '4px 6px', textAlign: 'center', color: 'var(--coral-d)' }}>{m.confusion.fp} <span style={{ fontSize: 8.5, fontWeight: 600 }}>(FP)</span></div>

                        <div style={{ background: 'var(--navy-700)', padding: '4px 6px', fontWeight: 700, color: 'var(--text-dim)' }}>Litter</div>
                        <div style={{ background: 'var(--navy-800)', padding: '4px 6px', textAlign: 'center', color: 'var(--coral-d)' }}>{m.confusion.fn} <span style={{ fontSize: 8.5, fontWeight: 600 }}>(FN)</span></div>
                        <div style={{ background: 'var(--navy-800)', padding: '4px 6px', textAlign: 'center', color: 'var(--green-d)', fontWeight: 800 }}>{m.confusion.tp} <span style={{ fontSize: 8.5, fontWeight: 600 }}>(TP)</span></div>
                      </div>
                    </div>
                  )}
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
