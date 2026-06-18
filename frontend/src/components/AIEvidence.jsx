/* EcoRise — AI Evidence Panel.
 *
 * The centerpiece for an AI hackathon: after EVERY submission the user sees
 * exactly how the model reasoned — what it detected, how confident it was, the
 * CO2 math, the point breakdown, and every anti-fraud gate the action cleared
 * (or why it was rejected). It turns invisible backend AI into the star of the UX.
 *
 * Renders for both eco actions and trash reports, accepted or rejected.
 */
import { useEffect, useRef } from 'react';
import Icon from './Icon';

const CHECK_LABELS = {
  photoRequired: 'Real photo required',
  duplicateScreen: 'Duplicate-photo screen',
  membershipVerified: 'Board membership verified',
  aiVisionGate: 'AI vision gate',
  carbonGrounded: 'Carbon grounded in cited factors',
  fraudScreen: 'Adversarial fraud screen',
  serverScored: 'Points scored server-side',
};

function CheckRow({ label, state }) {
  const ok = state === 'passed' || state === 'verified';
  const na = state === 'n/a';
  const color = na ? 'var(--text-dim)' : ok ? 'var(--green)' : 'var(--coral)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={na ? 'sparkle' : ok ? 'check' : 'x'} size={13} color={color} strokeWidth={3} />
      </span>
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 11.5, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: .3 }}>{na ? 'n/a' : state}</span>
    </div>
  );
}

function ConfidenceRing({ pct, accent }) {
  const r = 26, c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, pct / 100)) * c;
  return (
    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(30,91,57,.12)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dasharray .8s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--text)', lineHeight: 1 }}>{Math.round(pct)}%</span>
        <span className="dim" style={{ fontSize: 8, fontWeight: 800, letterSpacing: .4 }}>CONF</span>
      </div>
    </div>
  );
}

// Grounded carbon: shows the computed kg CO2e, the uncertainty range, the formula,
// and the cited emission-factor source — the answer to "where did that number come from?"
function CarbonCard({ carbon, accent }) {
  if (!carbon) return null;
  const grounded = carbon.method && carbon.method !== 'none';
  const factor = (carbon.factors || [])[0];
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <div className="card" style={{ padding: 14, border: `1px solid ${accent}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="eyebrow" style={{ color: accent }}>Carbon math{grounded ? ' · grounded' : ''}</span>
          {grounded
            ? <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: accent }}>{carbon.kgCO2e} kg CO₂e</span>
            : <span className="dim" style={{ fontSize: 12, fontWeight: 800 }}>not quantified</span>}
        </div>
        {grounded && (
          <div className="dim" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2 }}>
            range {carbon.low}–{carbon.high} kg · uncertainty shown on purpose
          </div>
        )}
        {carbon.formula && (
          <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 8, fontFamily: 'var(--display)' }}>{carbon.formula}</div>
        )}
        {factor && (
          <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 6 }}>
            <span className="dim">Source: </span>
            {factor.sourceUrl
              ? <a href={factor.sourceUrl} target="_blank" rel="noreferrer" style={{ color: accent }}>{factor.source}{factor.sourceYear ? ` (${factor.sourceYear})` : ''}</a>
              : <span>{factor.source}{factor.sourceYear ? ` (${factor.sourceYear})` : ''}</span>}
          </div>
        )}
        {(carbon.assumptions || []).slice(0, 2).map((a, i) => (
          <div key={i} className="dim" style={{ fontSize: 11, fontWeight: 600, marginTop: 4, lineHeight: 1.35 }}>• {a}</div>
        ))}
      </div>
    </div>
  );
}

// The deterministic tools the backend ran — makes the "AI is one component in a
// measured system, it doesn't award points itself" story visible to a judge.
function ToolCalls({ tools, accent }) {
  if (!Array.isArray(tools) || !tools.length) return null;
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <div className="eyebrow" style={{ color: 'var(--text-dim)', marginBottom: 4 }}>AI pipeline · tools run</div>
      <div className="card" style={{ padding: '8px 12px' }}>
        {tools.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
            <Icon name="bolt" size={12} color={accent} />
            <span style={{ fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--text)' }}>{t.tool}</span>
            <span className="dim" style={{ fontWeight: 600, flex: 1, minWidth: 0 }}>— {t.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AIEvidence({ data, onClose }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Accessible modal, MOUNT-ONLY: Escape closes, focus moves into the dialog on open,
  // and focus is restored to the triggering control on close. Deps [] (onClose via ref)
  // so unrelated parent re-renders don't tear down the listener or steal focus.
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, []);
  if (!data) return null;
  const accepted = !!data.accepted;
  const isTrash = data.kind === 'trash';
  const accent = accepted ? 'var(--green)' : 'var(--coral)';
  const integrity = data.integrity || {};
  const checks = integrity.checks || {};
  const carbon = data.carbon || integrity.carbon || null;
  const confPct = Math.round(((integrity.confidence ?? data.confidence ?? 0)) * 100);

  const detectedTitle = isTrash
    ? (accepted ? `Litter detected · severity ${data.severity}/10` : 'No litter detected')
    : (data.aiResult?.specificAction || 'Eco action');
  const detectedType = isTrash ? 'cleanup' : (data.aiResult?.actionType || '');
  const co2 = isTrash ? null : (data.co2Saved ?? data.aiResult?.estimatedCO2Saved ?? 0);

  const breakdown = Array.isArray(data.breakdown) ? data.breakdown : [];
  const bonuses = Array.isArray(data.bonuses) ? data.bonuses : [];
  const rank = data.rankMove;
  const rankUp = rank && rank.afterRank < rank.beforeRank;
  // Demo path (no API key): confidence is not measured, so don't render a 0% ring
  // that contradicts the green "verified" header — show an explicit DEMO badge.
  const isDemo = integrity.source === 'mock' || /demo|mock/i.test(integrity.model || '') || !!data.aiResult?.isMock;

  return (
    <>
      <div className="scrim" onClick={onClose} style={{ zIndex: 60 }} aria-hidden="true" />
      <div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1}
        aria-label={accepted ? 'AI verdict: verified and scored' : 'AI verdict: not verified'}
        style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 70,
        width: 'min(92vw, 420px)', maxHeight: '88vh', overflowY: 'auto', outline: 'none',
        background: 'linear-gradient(180deg,var(--navy-800),var(--navy-900))', borderRadius: 26,
        border: `1px solid ${accent}33`, boxShadow: '0 24px 70px rgba(30,91,57,.24)',
      }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '16px 18px 10px' }}>
          <Icon name="sparkle" size={20} color={accent} />
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ color: accent }}>AI Verdict</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, lineHeight: 1.05 }}>
              {accepted ? 'Verified & scored' : 'Not verified'}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ padding: 8 }} aria-label="Close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        {/* photo + verdict ribbon */}
        {data.photo && (
          <div style={{ position: 'relative', margin: '0 14px', height: 168, borderRadius: 18, overflow: 'hidden' }}>
            <img src={data.photo} alt="Submitted" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 45%,rgba(0,0,0,.6))' }} />
            <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,.5)', padding: '7px 13px', borderRadius: 9999, backdropFilter: 'blur(6px)' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={accepted ? 'check' : 'x'} size={14} color="#fff" strokeWidth={3} />
              </span>
              <span style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>{accepted ? 'AI verified' : 'AI rejected'}</span>
            </div>
            <span className="chip" style={{ position: 'absolute', right: 12, top: 12, background: 'rgba(0,0,0,.5)', color: '#fff', backdropFilter: 'blur(6px)', fontSize: 11.5 }}>
              <Icon name="bolt" size={12} color={accent} /> {integrity.model || 'AI'}
            </span>
          </div>
        )}

        {/* detected + confidence */}
        <div style={{ padding: '14px 16px 6px', display: 'flex', alignItems: 'center', gap: 14 }}>
          {isDemo ? (
            <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 16, border: `1.5px dashed ${accent}66`, background: `${accent}14`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: accent, lineHeight: 1 }}>DEMO</span>
              <span className="dim" style={{ fontSize: 8, fontWeight: 800, marginTop: 2 }}>NO MODEL</span>
            </div>
          ) : (
            <ConfidenceRing pct={confPct} accent={accent} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="dim" style={{ fontSize: 11, fontWeight: 800, letterSpacing: .3 }}>AI DETECTED</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, lineHeight: 1.1 }}>{detectedTitle}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {detectedType && <span className="chip chip-purple" style={{ fontSize: 11.5 }}>{detectedType}</span>}
              {!isTrash && <span className="chip chip-dim" style={{ fontSize: 11.5 }}><Icon name="leaf" size={12} color="var(--green)" /> {co2 > 0 ? `${co2} kg CO₂` : 'CO₂ not estimated'}</span>}
              <span className="chip chip-dim" style={{ fontSize: 11.5 }}>source: {integrity.source || 'ai'}</span>
            </div>
          </div>
        </div>

        {isDemo && (
          <div style={{ padding: '0 16px' }}>
            <div className="dim" style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>
              Demo mode — AI vision disabled (no API key); confidence not measured. Set <code>OPENAI_API_KEY</code> for real scoring.
            </div>
          </div>
        )}

        {/* reason (rejected) or impact summary */}
        {(!accepted || data.aiResult?.environmentalImpactSummary) && (
          <div style={{ padding: '8px 16px 0' }}>
            <div className="card" style={{ padding: 13, border: `1px solid ${accent}33` }}>
              <div className="eyebrow" style={{ color: accent, marginBottom: 4 }}>{accepted ? 'Why it counts' : 'Why the AI said no'}</div>
              <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}>
                {accepted ? (data.aiResult?.environmentalImpactSummary || 'Verified eco action.') : (data.description || 'This photo did not pass the AI gate.')}
              </div>
            </div>
          </div>
        )}

        {/* points + breakdown */}
        {accepted && (
          <div style={{ padding: '14px 16px 0' }}>
            <div className="card card-glow" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: breakdown.length ? 10 : 0 }}>
                <span className="muted" style={{ fontWeight: 800 }}>Points awarded</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {data.multiplier > 1 && <span className="chip chip-2x" style={{ fontSize: 12 }}>×{data.multiplier} total</span>}
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 26, color: 'var(--green)' }}>+{data.points || 0}</span>
                </span>
              </div>
              {breakdown.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', padding: '3px 0' }}>
                  <span>{b.label}</span><span style={{ color: 'var(--text)' }}>+{b.points}</span>
                </div>
              ))}
              {bonuses.map((b, i) => (
                <div key={`bo${i}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: 'var(--yellow)', padding: '3px 0' }}>
                  <span>{b.label}</span><span>×{b.multiplier}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* rank movement */}
        {accepted && rank && (
          <div style={{ padding: '12px 16px 0' }}>
            <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="trophy" size={20} color="var(--yellow)" />
              <span className="muted" style={{ flex: 1, fontWeight: 800, fontSize: 13.5 }}>Leaderboard</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--text-dim)' }}>#{rank.beforeRank}</span>
              <span style={{ color: rankUp ? 'var(--green)' : 'var(--text-dim)', fontWeight: 900 }}>{rankUp ? '▲' : '→'}</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: rankUp ? 'var(--green)' : 'var(--text)' }}>#{rank.afterRank}</span>
            </div>
          </div>
        )}

        {/* grounded carbon math + the deterministic tool pipeline */}
        {!isTrash && accepted && <CarbonCard carbon={carbon} accent={accent} />}
        <ToolCalls tools={integrity.toolCalls} accent={accent} />

        {/* integrity checklist */}
        <div style={{ padding: '14px 16px 4px' }}>
          <div className="eyebrow" style={{ color: 'var(--text-dim)', marginBottom: 4 }}>Integrity checks</div>
          <div className="card" style={{ padding: '6px 14px' }}>
            {Object.entries(checks).map(([k, v]) => (
              <CheckRow key={k} label={CHECK_LABELS[k] || k} state={v} />
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 16px 18px' }}>
          <button className="btn btn-primary btn-block btn-lg" onClick={onClose}>
            {accepted ? 'Nice — keep going' : 'Try another photo'}
          </button>
        </div>
      </div>
    </>
  );
}
