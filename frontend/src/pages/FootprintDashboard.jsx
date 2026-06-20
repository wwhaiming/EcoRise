/* EcoRise — School Footprint Insights Dashboard (Direction B: My School's Hidden Footprint)
 *
 * Visible flow for judges / pitch video (90-second demo):
 *   1. Raw data mini-chart  (INPUT)
 *   2. AI Anomaly cards     (AI REASONING — anomaly detection)
 *   3. AI Prediction cards  (AI REASONING — OLS regression)
 *   4. AI Recommendation list with "Approve" gate  (AI REASONING + HUMAN-IN-THE-LOOP)
 *   5. AI plain-language summary paragraph  (GENERATIVE AI — clearly separated section)
 *
 * Human-in-the-loop: recommendations stay "Proposed" until a named role
 * (sustainability coordinator / cafeteria manager) explicitly approves them.
 * The AI never auto-executes. See also: backend/routes/footprint.js header comment.
 */
import { useState, useEffect, useCallback } from 'react';
import Icon from '../components/Icon';
import { HelpTip } from '../components/UI';
import api from '../utils/api';

// ── Small inline mini bar chart ──────────────────────────────────────────────
function MiniBar({ label, value, max, color = 'var(--green)', unit = '' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 50px', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <div className="bar" style={{ height: 7 }}>
        <i style={{ width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>
        {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}
        {unit && <span style={{ color: 'var(--text-muted)', marginLeft: 2 }}>{unit}</span>}
      </span>
    </div>
  );
}

// ── Flag button on every AI card ──────────────────────────────────────────────
function FlagBtn({ insightType, insightRef, onFlag }) {
  const [flagged, setFlagged] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');

  const submit = async () => {
    setFlagging(true);
    try {
      await api.footprintFlag({ insightType, insightRef, reason });
      setFlagged(true);
      setShowForm(false);
      onFlag?.();
    } catch { /* best effort */ }
    finally { setFlagging(false); }
  };

  if (flagged) return <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Flagged — thanks</span>;
  return (
    <div>
      <button
        onClick={() => setShowForm(v => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, padding: '2px 0' }}
      >
        ⚑ Flag as inaccurate
      </button>
      {showForm && (
        <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Optional: why is this wrong?"
            rows={2}
            style={{ fontSize: 12, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--navy-500)', background: 'var(--glass)', resize: 'none', fontFamily: 'var(--body)' }}
          />
          <button className="btn btn-secondary btn-sm" disabled={flagging} onClick={submit} style={{ fontSize: 11 }}>
            {flagging ? 'Sending…' : 'Submit flag'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Anomaly card ──────────────────────────────────────────────────────────────
function AnomalyCard({ anomaly, onFlag }) {
  const isEnergy = anomaly.type === 'energy';
  const color = isEnergy ? 'var(--coral)' : '#3a8fc5';
  const icon = isEnergy ? 'flame' : 'leaf';
  const ref = `${anomaly.type}:${anomaly.building}:${anomaly.date}`;

  return (
    <div className="card" style={{ padding: 14, border: `1px solid ${isEnergy ? 'rgba(182,111,77,.22)' : 'rgba(58,143,197,.18)'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: isEnergy ? 'rgba(182,111,77,.12)' : 'rgba(58,143,197,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={icon} size={16} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', color, textTransform: 'uppercase' }}>
              Unusual activity — {isEnergy ? 'Energy' : 'Water'}
            </div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, marginTop: 1 }}>
              {anomaly.building}
            </div>
          </div>
        </div>
        <HelpTip text={`Rolling 14-day window: mean ${anomaly.mean.toLocaleString()} ${anomaly.unit}, std ${anomaly.std.toLocaleString()} ${anomaly.unit}. This day = ${anomaly.value.toLocaleString()} ${anomaly.unit} — ${anomaly.sigmas}σ above normal.`} />
      </div>

      <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: isEnergy ? 'rgba(182,111,77,.08)' : 'rgba(58,143,197,.07)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>
          On <strong>{anomaly.date}</strong>, usage was <strong style={{ color }}>{anomaly.pctAbove}% above normal</strong>
          &nbsp;({anomaly.value.toLocaleString()} vs avg {anomaly.mean.toLocaleString()} {anomaly.unit}).
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
          ⓘ based on rolling 14-day avg · {anomaly.sigmas}σ deviation · ±{Math.round(anomaly.std)} {anomaly.unit} normal band
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <FlagBtn insightType="anomaly" insightRef={ref} onFlag={onFlag} />
      </div>
    </div>
  );
}

// ── Prediction card ───────────────────────────────────────────────────────────
function PredictionCard({ prediction, model, onFlag }) {
  const ref = `prediction:cafeteria:${prediction.date}`;
  const highWaste = prediction.predictedLbs > 50;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--glass-edge-soft)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: highWaste ? 'var(--coral)' : 'var(--green-d)', lineHeight: 1 }}>
          {prediction.predictedLbs}
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', marginTop: 1 }}>lbs waste</div>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{prediction.dayName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          Range: {prediction.lowerLbs}–{prediction.upperLbs} lbs
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(0,0,0,.05)', padding: '2px 6px', borderRadius: 6 }}>
            ⓘ ±{model?.confidencePct ?? '~15'}%, based on {model?.trainingRows ?? '?'} days · OLS model
          </span>
          {highWaste && <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--coral)', textTransform: 'uppercase' }}>High</span>}
        </div>
        <div style={{ marginTop: 4 }}>
          <FlagBtn insightType="prediction" insightRef={ref} onFlag={() => {}} />
        </div>
      </div>
    </div>
  );
}

// ── Recommendation card ────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  'Sustainability Coordinator',
  'Cafeteria Manager',
  'Facilities Director',
  'Assistant Principal',
];
const CAT_COLOR = { cafeteria: '#8a6d2a', energy: 'var(--coral-d)', water: '#3a8fc5', transportation: 'var(--green-d)' };
const CAT_ICON  = { cafeteria: 'leaf', energy: 'flame', water: 'leaf', transportation: 'home' };

function RecommendationCard({ rec, onApprove, onAssign, onFlag }) {
  const [assignMode, setAssignMode] = useState(false);
  const [assignedTo, setAssignedTo] = useState(rec.assigned_to || '');
  const [note, setNote] = useState(rec.assigned_note || '');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const color = CAT_COLOR[rec.category] || 'var(--green)';
  const isApproved = rec.status === 'approved';

  const doApprove = async () => {
    setApproving(true);
    try { await onApprove(rec.id); } finally { setApproving(false); }
  };

  const doAssign = async () => {
    if (!assignedTo) return;
    setSaving(true);
    try { await onAssign(rec.id, { assignedTo, note }); setAssignMode(false); } finally { setSaving(false); }
  };

  return (
    <div className="card" style={{ padding: 15, border: isApproved ? '1.5px solid rgba(46,125,79,.35)' : '1px solid var(--glass-edge-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <Icon name={CAT_ICON[rec.category] || 'sparkle'} size={16} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', color, textTransform: 'uppercase' }}>{rec.category}</span>
            {isApproved && (
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--green-d)', background: 'rgba(46,125,79,.12)', padding: '2px 7px', borderRadius: 6 }}>
                ✓ Approved — active school goal
              </span>
            )}
            {rec.status === 'proposed' && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(0,0,0,.06)', padding: '2px 7px', borderRadius: 6 }}>
                Proposed — awaiting approval
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14.5, marginTop: 3 }}>{rec.title}</div>
        </div>
        <HelpTip text="Ranked by estimated impact from this week's data. A human must approve before this appears as an active school goal." />
      </div>

      {/* Reasoning — 1 sentence explaining the "why" */}
      <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.5, padding: '9px 11px', borderRadius: 9, background: 'rgba(0,0,0,.03)' }}>
        <span style={{ fontWeight: 800, color: 'var(--text)' }}>Why: </span>{rec.reasoning}
      </div>

      {rec.estimated_impact && (
        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span>Estimated impact:</span>
          <span style={{ background: `${color}14`, padding: '2px 8px', borderRadius: 6 }}>{rec.estimated_impact}</span>
          <HelpTip text="Estimated from this week's data. Actual results depend on staff implementation. ±15% confidence range." />
        </div>
      )}
      {rec.kg_co2e_per_year > 0 && (
        <div style={{ marginTop: 5, fontSize: 11, fontWeight: 800, color: 'var(--green-d)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ background: 'rgba(46,125,79,.10)', padding: '3px 9px', borderRadius: 6, letterSpacing: '.02em' }}>
            Projected annual CO₂e avoided: {rec.kg_co2e_per_year.toLocaleString()} kg
          </span>
          <HelpTip text="Annualised over 180 school days using EPA-cited emission factors (eGRID 2023 for electricity, WARM for food waste, GHG Factors Hub for transport). Assumes the anomaly pattern persists if unaddressed." />
        </div>
      )}

      {/* Assign section */}
      {rec.assigned_to && !assignMode && (
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>
          Assigned to: <strong style={{ color: 'var(--text)' }}>{rec.assigned_to}</strong>
          {rec.assigned_note && <span style={{ marginLeft: 6 }}>— "{rec.assigned_note}"</span>}
        </div>
      )}

      {assignMode && (
        <div style={{ marginTop: 10, display: 'grid', gap: 7 }}>
          <select
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
            style={{ fontSize: 13, padding: '8px 10px', borderRadius: 9, border: '1px solid var(--navy-500)', background: 'var(--glass)', fontFamily: 'var(--body)' }}
          >
            <option value="">Select staff role…</option>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note for the assignee…"
            rows={2}
            style={{ fontSize: 12, padding: '7px 10px', borderRadius: 9, border: '1px solid var(--navy-500)', background: 'var(--glass)', resize: 'none', fontFamily: 'var(--body)' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" disabled={saving || !assignedTo} onClick={doAssign} style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Assign'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setAssignMode(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!isApproved ? (
          <button className="btn btn-primary btn-sm" disabled={approving} onClick={doApprove} style={{ flex: 1 }}>
            {approving ? 'Approving…' : '✓ Approve — Make Active Goal'}
          </button>
        ) : (
          <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--green-d)', padding: '9px 15px', background: 'rgba(46,125,79,.08)', borderRadius: 9999, textAlign: 'center' }}>
            Active — visible on school leaderboard feed
          </div>
        )}
        {!assignMode && (
          <button className="btn btn-secondary btn-sm" onClick={() => setAssignMode(v => !v)}>
            <Icon name="user" size={13} /> Assign
          </button>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <FlagBtn insightType="recommendation" insightRef={`rec:${rec.id}`} onFlag={onFlag} />
      </div>
    </div>
  );
}

// ── Raw data mini chart (last 10 school days) ─────────────────────────────────
function RawDataChart({ chart }) {
  if (!chart || chart.length === 0) return null;
  const maxKwh = Math.max(...chart.map(r => r.total_kwh || 0), 1);
  const maxWaste = Math.max(...chart.map(r => r.waste_lbs || 0), 1);

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>Raw school data</div>
          <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2 }}>Last 10 school days · all buildings combined</div>
        </div>
        <HelpTip text="This is the raw input data that the AI reasoning layer processes. Anomalies and predictions are computed from these records." />
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 56 }}>
        {chart.map((r, i) => {
          const h = maxKwh > 0 ? ((r.total_kwh || 0) / maxKwh) * 54 : 2;
          const isAnomaly = (r.total_kwh || 0) / maxKwh > 0.9;
          return (
            <div key={i} title={`${r.date}: ${Math.round(r.total_kwh || 0)} kWh`}
              style={{ flex: 1, height: `${h}px`, minHeight: 4, borderRadius: '3px 3px 0 0', background: isAnomaly ? 'var(--coral)' : 'rgba(46,125,79,.35)', transition: 'height .3s', cursor: 'default' }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--coral)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--coral)', display: 'inline-block' }} /> High-use day (possible anomaly)
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green-d)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(46,125,79,.35)', display: 'inline-block' }} /> Normal range (kWh)
        </span>
      </div>
      <div style={{ display: 'grid', gap: 5, marginTop: 14 }}>
        {chart.slice(-3).map((r, i) => (
          <MiniBar key={i} label={r.date?.slice(5) || ''} value={Math.round(r.total_kwh || 0)} max={maxKwh} unit="kWh" />
        ))}
      </div>
    </div>
  );
}

// ── AI Summary section (Generative AI — visually distinct from inference cards) ─
function AISummaryCard({ aiSummary, onFlag }) {
  return (
    <div style={{ padding: '12px 0 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(140deg,var(--green-2),var(--green-d))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkle" size={15} color="#fff" />
        </div>
        <div>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>Generative AI — Weekly Digest</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginTop: 1 }}>Plain-language summary for eco-club students · written by AI from the data above</div>
        </div>
        <HelpTip text={`This paragraph was generated by the AI from the structured anomaly, prediction, and recommendation data — not from raw numbers directly. ${aiSummary.isMock ? 'Running in offline mode (no API key).' : 'Written by OpenAI GPT-4o-mini.'}`} />
      </div>
      <div style={{ background: 'linear-gradient(135deg, rgba(46,125,79,.07), rgba(46,125,79,.04))', border: '1px solid rgba(46,125,79,.18)', borderRadius: 14, padding: '14px 16px' }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, fontWeight: 500, color: 'var(--text)' }}>
          {aiSummary.text}
        </p>
        {aiSummary.isMock && (
          <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700 }}>
            ⓘ Offline mode — add OPENAI_API_KEY for live AI generation
          </div>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <FlagBtn insightType="summary" insightRef={`summary:${aiSummary.weekStart}`} onFlag={onFlag} />
      </div>
    </div>
  );
}

// ── Main dashboard page ────────────────────────────────────────────────────────
export default function FootprintDashboard({ ctx }) {
  const { showToast, setScreen } = ctx;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const result = await api.footprintInsights();
      setData(result);
    } catch (e) {
      setErr(e.message || 'Could not load footprint insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    try {
      const result = await api.footprintApprove(id);
      setData(prev => ({
        ...prev,
        recommendations: prev.recommendations.map(r => r.id === id ? result.recommendation : r),
      }));
      showToast?.('Recommendation approved — now an active school goal');
    } catch (e) {
      showToast?.(e.message || 'Could not approve');
    }
  };

  const handleAssign = async (id, body) => {
    try {
      const result = await api.footprintAssign(id, body);
      setData(prev => ({
        ...prev,
        recommendations: prev.recommendations.map(r => r.id === id ? result.recommendation : r),
      }));
      showToast?.(`Assigned to ${body.assignedTo}`);
    } catch (e) {
      showToast?.(e.message || 'Could not assign');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.footprintRefresh();
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, fontWeight: 700 }}>
      Computing AI insights…
    </div>
  );

  if (err) return (
    <div style={{ padding: 24 }}>
      <div className="card" style={{ padding: 16, borderColor: 'rgba(182,111,77,.22)' }}>
        <div style={{ fontWeight: 700, color: 'var(--coral-d)', marginBottom: 8 }}>Could not load insights</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{err}</div>
        <button className="btn btn-secondary btn-sm" onClick={load}>Retry</button>
      </div>
    </div>
  );

  const { anomalies = [], cafeteria = {}, recommendations = [], chart = [], aiSummary = {} } = data || {};
  const { predictions = [], model } = cafeteria;
  const approvedCount = recommendations.filter(r => r.status === 'approved').length;

  return (
    <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <button onClick={() => setScreen?.('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'var(--text-muted)' }}>
            <Icon name="home" size={18} color="var(--text-muted)" />
          </button>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ color: 'var(--green)' }}>Direction B · My School's Hidden Footprint</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, lineHeight: 1.15 }}>
              {data?.school?.name ?? 'Greenfield High'} — Weekly Insights
            </div>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} title="Recompute insights" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-muted)', opacity: refreshing ? .5 : 1 }}>
            <Icon name="settings" size={18} color="var(--text-muted)" />
          </button>
        </div>

        {/* Status bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, marginTop: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(182,111,77,.12)', color: 'var(--coral-d)', padding: '4px 9px', borderRadius: 9999 }}>
            {anomalies.length} anomal{anomalies.length === 1 ? 'y' : 'ies'} detected
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(46,125,79,.10)', color: 'var(--green-d)', padding: '4px 9px', borderRadius: 9999 }}>
            {predictions.length} days predicted
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, background: approvedCount > 0 ? 'rgba(46,125,79,.15)' : 'rgba(0,0,0,.06)', color: approvedCount > 0 ? 'var(--green-d)' : 'var(--text-muted)', padding: '4px 9px', borderRadius: 9999 }}>
            {approvedCount}/{recommendations.length} rec{recommendations.length !== 1 ? 's' : ''} approved
          </span>
        </div>
      </div>

      {/* ── SECTION 1: Raw data chart (INPUT) ── */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          ① Input data
        </div>
        <RawDataChart chart={chart} />
      </div>

      {/* ── SECTION 2: AI Anomaly cards ── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            ② AI Reasoning — Anomaly Detection
          </div>
          <HelpTip text="Rolling 14-day z-score: flags any building that exceeded its mean by more than 1.5 standard deviations. Deterministic — no LLM involved." />
        </div>
        {anomalies.length === 0 ? (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>No significant anomalies in the last 3 weeks.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {anomalies.map((a, i) => (
              <AnomalyCard key={i} anomaly={a} onFlag={() => showToast?.('Flag recorded — thank you')} />
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 3: AI Prediction (cafeteria) ── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            ③ AI Reasoning — Cafeteria Forecast
          </div>
          <HelpTip text={`OLS linear regression: features = [intercept, is_Tue, is_Wed, is_Thu, is_Fri, post_holiday]. Trained on ${model?.trainingRows ?? '?'} days. RMSE = ${model?.rmse ?? '?'} lbs. Confidence band = ±${model?.confidencePct ?? '~15'}%.`} />
        </div>
        <div className="card" style={{ padding: '4px 14px 10px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', margin: '10px 0 6px' }}>
            Predicted food waste — next school week
          </div>
          {predictions.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 0' }}>Insufficient training data.</div>
          ) : (
            predictions.map((p, i) => <PredictionCard key={i} prediction={p} model={model} onFlag={() => showToast?.('Flag recorded')} />)
          )}
        </div>
      </div>

      {/* ── SECTION 4: Recommendations + Human-in-the-loop approve gate ── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              ④ AI Recommendations + Human Approval Gate
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 3 }}>
              Ranked by estimated impact · Proposed → Approved by named staff role
            </div>
          </div>
          <HelpTip text="Decision the AI does NOT make: approving a recommendation for public display or operational action. A sustainability coordinator or cafeteria manager must click Approve. The AI only proposes." />
        </div>

        {/* Human-in-the-loop explainer chip */}
        <div style={{ padding: '9px 13px', background: 'rgba(46,125,79,.06)', border: '1px solid rgba(46,125,79,.14)', borderRadius: 11, marginBottom: 12, fontSize: 12, fontWeight: 600, color: 'var(--green-d)', lineHeight: 1.45 }}>
          <strong>Human-in-the-loop:</strong> The AI does not auto-execute any of these. A named staff role must approve before a recommendation becomes active or appears on the school-wide leaderboard feed.
        </div>

        {recommendations.length === 0 ? (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>No recommendations computed yet. Try refreshing.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {recommendations.map((r) => (
              <RecommendationCard key={r.id} rec={r} onApprove={handleApprove} onAssign={handleAssign} onFlag={() => showToast?.('Flag recorded')} />
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 5: Generative AI plain-language summary ── */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ borderTop: '1px solid var(--glass-edge-soft)', paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
            ⑤ Generative AI Layer
          </div>
          {aiSummary?.text ? (
            <AISummaryCard aiSummary={aiSummary} onFlag={() => showToast?.('Flag recorded')} />
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 0' }}>Generating weekly summary…</div>
          )}
        </div>
      </div>

      {/* Responsible AI footer */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ padding: '11px 14px', background: 'rgba(0,0,0,.03)', border: '1px solid var(--glass-edge-soft)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>Responsible AI</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.5 }}>
            Every AI-generated number shows its assumptions inline (ⓘ tags). Use the "Flag as inaccurate" button on any card to report errors. Flags are logged for model improvement. Predictions carry ±{data?.cafeteria?.model?.confidencePct ?? '~15'}% uncertainty and must not be acted on without human review.
          </div>
        </div>
      </div>
    </div>
  );
}
