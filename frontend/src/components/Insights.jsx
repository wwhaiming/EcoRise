/* EcoRise — AI Insights (Direction B reasoning layer), senior-grade layout.
 *
 * The input -> AI -> insight -> action loop, made visible and inspectable:
 *  - school + scope header (proves locality; states food is excluded)
 *  - the 4-step pipeline with this school's real data
 *  - the primary finding + an Evidence Chart (observed vs learned baseline) + a
 *    "why the AI flagged this" reasoning drawer
 *  - a next-month forecast strip
 *  - a ranked action plan: role-specific CTA, verification metric, status lifecycle
 *  - a visible Responsible-AI + limitations panel
 * Restrained, accessible, light-theme. Environmental scope only.
 */
import { useState, useEffect, useCallback } from 'react';
import Icon from './Icon';
import EvidenceChart from './EvidenceChart';
import api from '../utils/api';

const STATUS_LABEL = { proposed: 'Proposed', requested: 'Requested', approved: 'Approved', in_progress: 'In progress', verifying: 'Verifying', confirmed: 'Confirmed' };
const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function LoadingState() {
  const steps = ['Normalizing weather (degree-days)', 'Learning expected baseline', 'Checking residuals for anomalies', 'Ranking interventions'];
  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div className="card" style={{ padding: 16 }}>
        <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 10 }}>AI insights · analyzing…</div>
        {steps.map((s, i) => (
          <div key={i} className="row" style={{ gap: 8, marginBottom: 8, fontSize: 12.5, fontWeight: 650, color: 'var(--text-dim)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--green)', opacity: 0.4 }} /> {s}
          </div>
        ))}
        <div style={{ height: 64, borderRadius: 12, background: 'linear-gradient(90deg, rgba(0,0,0,.04), rgba(0,0,0,.02))', marginTop: 6 }} />
      </div>
    </div>
  );
}

export default function Insights({ leaderboardId, showToast }) {
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | hidden
  const [busy, setBusy] = useState('');
  const [openDrawer, setOpenDrawer] = useState(false);

  const load = useCallback(async () => {
    try { const d = await api.coachInsights(leaderboardId); setData(d); setState('ready'); }
    catch { setState('hidden'); } // coach disabled -> hide quietly
  }, [leaderboardId]);
  useEffect(() => { setState('loading'); load(); }, [load]);

  if (state === 'hidden') return null;
  if (state === 'loading') return <LoadingState />;
  if (!data) return null;

  const { anomalies = [], forecast = {}, recommendations = [], summary, school, sampleData, profile,
    schoolContext, scope, pipeline = [], evidence = {}, humanInLoop, responsibleAI = [], limitations = [], statusFlow = [] } = data;
  const top = anomalies[0] || null;

  const call = async (fn, label, ...args) => {
    if (!leaderboardId) { showToast && showToast('Open your board first.'); return; }
    setBusy(label);
    try { await fn(...args); showToast && showToast('Done.'); await load(); }
    catch (e) { showToast && showToast(e && e.status === 403 ? 'Only the board organizer (teacher) can do that.' : 'Action failed — try again.'); }
    finally { setBusy(''); }
  };
  const approve = (key) => call(() => api.coachInsightsApprove(leaderboardId, key), 'a' + key);
  const advance = (key, status) => call(() => api.coachInsightsStatus(leaderboardId, key, status), 's' + key);
  const loadDemo = () => call(() => api.coachInsightsLoadDemo(leaderboardId), 'demo');

  const Chip = ({ children, tone }) => (
    <span className="chip" style={{ fontSize: 10, background: tone === 'excl' ? 'rgba(182,111,77,.14)' : 'rgba(46,125,79,.12)', color: tone === 'excl' ? 'var(--coral-d)' : 'var(--green-d)' }}>{children}</span>
  );

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div className="card" style={{ padding: 16 }}>
        {/* Header + scope */}
        <div className="row" style={{ gap: 8, marginBottom: 4 }}>
          <Icon name="sparkle" size={16} color="var(--green)" />
          <span className="eyebrow" style={{ color: 'var(--green)' }}>Hidden Footprint AI · {school}</span>
          {sampleData && <span className="chip" style={{ marginLeft: 'auto', fontSize: 10 }}>sample data</span>}
        </div>
        {profile && <div className="dim" style={{ fontSize: 11, fontWeight: 600 }}>{profile.location}{schoolContext ? ` · ${schoolContext.district} · ${fmt(profile.students)} students · ${fmt(schoolContext.buildingSqFt)} sq ft` : ` · ${fmt(profile.students)} students`}</div>}
        <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {(scope.included || []).map((s) => <Chip key={s}>{s}</Chip>)}
          <Chip tone="excl">Food excluded — Direction B</Chip>
        </div>
        <div className="muted" style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.5, marginTop: 10 }}>{summary}</div>

        {/* input -> AI -> insight -> action */}
        {pipeline.length === 4 && (
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            {pipeline.map((p, i) => (
              <div key={p.step} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: 64, fontFamily: 'var(--display)', fontWeight: 700, fontSize: 12, color: i === 1 ? 'var(--green-d)' : 'var(--text-dim)' }}>{p.step}</span>
                <span className="muted" style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.4 }}>{p.detail}</span>
              </div>
            ))}
          </div>
        )}

        {/* Primary finding + evidence */}
        {top && (
          <div style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ color: 'var(--coral-d)', marginBottom: 6 }}>Primary finding · anomaly detection</div>
            <div className="h1" style={{ fontSize: 19, lineHeight: 1.2 }}>
              {cap(top.category === 'gas' ? 'heating gas' : top.category)} in {top.month} ran <span style={{ color: 'var(--coral-d)' }}>+{top.percentAboveExpected}%</span> above the weather-adjusted baseline
            </div>
            <div className="dim" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>
              ~{fmt(top.excessKgCO2ePerMonth)} kg CO₂e likely avoidable · {top.modelConfidencePct}% model confidence · {top.confidence} · review owner: facilities
            </div>
            {evidence.series && evidence.series.length >= 2 && (
              <div style={{ marginTop: 10 }}>
                <EvidenceChart series={evidence.series} unit={(evidence.series[0] || {}).unit || ''} />
                <div className="dim" style={{ fontSize: 10.5, fontWeight: 600, marginTop: 4 }}>Expected baseline learned from {(top.featuresUsed || []).join(', ')}.</div>
              </div>
            )}
            {/* Why AI flagged this — reasoning drawer */}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, padding: '4px 0', color: 'var(--green-d)', fontWeight: 700 }} aria-expanded={openDrawer} onClick={() => setOpenDrawer(v => !v)}>
              {openDrawer ? 'Hide' : 'Why the AI flagged this'} <Icon name={openDrawer ? 'chevL' : 'arrowR'} size={14} color="var(--green-d)" />
            </button>
            {openDrawer && (
              <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'rgba(0,0,0,.025)', border: '1px solid rgba(0,0,0,.06)' }}>
                <div style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 650 }}>
                  <div><span className="dim">Observed:</span> {fmt(top.observed)} {top.unit} · <span className="dim">expected:</span> {fmt(top.expected)} [{fmt(top.expectedLow)}–{fmt(top.expectedHigh)}]</div>
                  <div><span className="dim">Residual z-score:</span> {top.z} · <span className="dim">model confidence:</span> {top.modelConfidencePct}%</div>
                  <div><span className="dim">Features used:</span> {(top.featuresUsed || []).join(', ')}</div>
                  <div><span className="dim">Likely cause:</span> {top.likelyCauses[0]}</div>
                  <div style={{ color: 'var(--text-dim)' }}>Not enough evidence to conclude: {(top.notEnoughEvidenceFor || []).join(', ')}. Requires human review.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forecast strip */}
        {(forecast.gas || forecast.electricity || forecast.water) && (
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ color: 'var(--blue, #2f6f8f)', marginBottom: 8 }}>Next-month forecast (80% band)</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {['electricity', 'gas', 'water'].filter(k => forecast[k]).map(k => {
                const f = forecast[k];
                return (
                  <div key={k} className="row" style={{ justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700 }}>
                    <span className="muted" style={{ textTransform: 'capitalize' }}>{k}</span>
                    <span className="tnum">{fmt(f.predicted)} {f.unit} <span className="dim" style={{ fontWeight: 600 }}>[{fmt(f.low)}–{fmt(f.high)}]{f.trendPctVsTrailingAvg != null ? ` · ${f.trendPctVsTrailingAvg > 0 ? '+' : ''}${f.trendPctVsTrailingAvg}% vs avg` : ''}</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action plan */}
        {recommendations.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 8 }}>Recommended action plan</div>
            {recommendations.map((r) => {
              const idx = statusFlow.indexOf(r.status);
              const nextStatus = idx >= 0 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
              const isApproved = r.status && r.status !== 'proposed';
              return (
                <div key={r.key} className="card" style={{ padding: 12, marginBottom: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14.5 }}>{r.label}</span>
                    {r.addressesAnomaly && <Chip tone="excl">addresses anomaly</Chip>}
                    <span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--green-d)' }}>~{fmt(r.expectedKgPerMonth)} kg/mo</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, marginTop: 6 }}>{r.action}</div>
                  <div className="dim" style={{ fontSize: 11.5, fontWeight: 650, marginTop: 6 }}>
                    {r.costBand} · {r.effortTier} effort · ~{r.timeToImpactWeeks} wks · approver: {r.approver}
                  </div>
                  <div className="dim" style={{ fontSize: 11.5, fontWeight: 650, marginTop: 3 }}>Verify by: {r.verificationMetric}</div>
                  {/* status stepper */}
                  <div className="row" style={{ gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {statusFlow.map((s, i) => (
                      <span key={s} style={{
                        fontSize: 9.5, fontWeight: 800, letterSpacing: .2, padding: '2px 7px', borderRadius: 9999,
                        background: i <= idx ? 'rgba(46,125,79,.14)' : 'rgba(0,0,0,.04)',
                        color: i <= idx ? 'var(--green-d)' : 'var(--text-dim)',
                      }}>{STATUS_LABEL[s]}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {!isApproved ? (
                      <button className="btn btn-secondary btn-sm" disabled={busy === 'a' + r.key} onClick={() => approve(r.key)}>
                        {busy === 'a' + r.key ? 'Submitting…' : r.cta}
                      </button>
                    ) : nextStatus ? (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--green-d)', fontWeight: 700 }} disabled={busy === 's' + r.key} onClick={() => advance(r.key, nextStatus)}>
                        {busy === 's' + r.key ? 'Updating…' : `Mark ${STATUS_LABEL[nextStatus].toLowerCase()}`} {r.verifyBy ? `· verify by ${r.verifyBy}` : ''}
                      </button>
                    ) : (
                      <span className="chip chip-green" style={{ fontSize: 11 }}><Icon name="check" size={12} color="var(--green-d)" /> Confirmed impact</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Responsible AI + limitations */}
        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'rgba(46,125,79,.05)', border: '1px solid rgba(46,125,79,.12)' }}>
          <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 6 }}>Responsible AI · human in the loop</div>
          <div className="dim" style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.45, marginBottom: 6 }}>{humanInLoop}</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {responsibleAI.map((x, i) => <li key={i} className="dim" style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.4 }}>{x}</li>)}
          </ul>
          {limitations.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary className="dim" style={{ fontSize: 11, fontWeight: 800, cursor: 'pointer', color: 'var(--coral-d)' }}>Limitations</summary>
              <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
                {limitations.map((x, i) => <li key={i} className="dim" style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.4 }}>{x}</li>)}
              </ul>
            </details>
          )}
        </div>

        {sampleData && (
          <button className="btn btn-primary btn-block btn-sm" style={{ marginTop: 12 }} disabled={busy === 'demo'} onClick={loadDemo}>
            {busy === 'demo' ? 'Loading…' : 'Load Lincoln High sample onto my board'}
          </button>
        )}
      </div>
    </div>
  );
}
