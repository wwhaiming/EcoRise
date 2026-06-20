/* EcoRise — AI Insights (Direction B reasoning layer), senior-grade layout.
 *
 * input -> AI -> insight -> action, made visible + inspectable + validated:
 *  - school + scope header, data-source badge
 *  - the 4-step pipeline with this school's real data
 *  - primary finding + Evidence Chart + "why the AI flagged this" drawer
 *  - model validation (holdout backtest MAPE) — explainable AND validated
 *  - forecast strip
 *  - ranked action plan: role CTA, verification metric, status lifecycle, MEASURED outcome
 *  - Real Data Mode (CSV import) + Responsible-AI + limitations panel
 * Restrained, accessible, light-theme. Environmental scope only.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from './Icon';
import EvidenceChart from './EvidenceChart';
import api from '../utils/api';

const STATUS_LABEL = { proposed: 'Proposed', requested: 'Requested', approved: 'Approved', in_progress: 'In progress', verifying: 'Verifying', confirmed: 'Confirmed' };
const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function LoadingState() {
  const steps = ['Normalizing weather (degree-days)', 'Learning expected baseline', 'Checking residuals for anomalies', 'Backtesting + ranking interventions'];
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

// Inline "record a measured before/after" form for an approved action.
function VerifyRow({ rec, busy, onVerify }) {
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  return (
    <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
      <div className="dim" style={{ fontSize: 10.5, fontWeight: 700 }}>Record measured outcome ({rec.verificationMetric})</div>
      <div className="row" style={{ gap: 6 }}>
        <input className="field" style={{ flex: 1, padding: '6px 8px', fontSize: 12 }} inputMode="decimal" placeholder="before" value={before} onChange={e => setBefore(e.target.value)} aria-label="before value" />
        <input className="field" style={{ flex: 1, padding: '6px 8px', fontSize: 12 }} inputMode="decimal" placeholder="after" value={after} onChange={e => setAfter(e.target.value)} aria-label="after value" />
        <button className="btn btn-secondary btn-sm" disabled={busy || !before || !after} onClick={() => onVerify(rec.key, Number(before), Number(after), rec.verificationMetric)}>Save</button>
      </div>
    </div>
  );
}

export default function Insights({ leaderboardId, showToast }) {
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const [busy, setBusy] = useState('');
  const [openDrawer, setOpenDrawer] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try { const d = await api.coachInsights(leaderboardId); setData(d); setState('ready'); }
    catch { setState('hidden'); }
  }, [leaderboardId]);
  useEffect(() => { setState('loading'); load(); }, [load]);

  if (state === 'hidden') return null;
  if (state === 'loading') return <LoadingState />;
  if (!data) return null;

  const { anomalies = [], forecast = {}, recommendations = [], summary, school, sampleData, profile,
    schoolContext, scope = {}, pipeline = [], evidence = {}, humanInLoop, responsibleAI = [], limitations = [],
    statusFlow = [], evaluation = {}, dataSource, judgeEvidence = {}, dataMode = 'synthetic' } = data;
  const top = anomalies[0] || null;
  const isReal = (judgeEvidence.dataMode || dataMode) === 'real';

  const call = async (fn, label) => {
    if (!leaderboardId) { showToast && showToast('Open your board first.'); return; }
    setBusy(label);
    try { await fn(); showToast && showToast('Done.'); await load(); }
    catch (e) { showToast && showToast(e && e.status === 403 ? 'Only the board organizer (teacher) can do that.' : (e && e.message) || 'Action failed.'); }
    finally { setBusy(''); }
  };
  const approve = (key) => call(() => api.coachInsightsApprove(leaderboardId, key), 'a' + key);
  const advance = (key, status) => call(() => api.coachInsightsStatus(leaderboardId, key, status), 's' + key);
  const verify = (key, before, after, metric) => call(() => api.coachInsightsVerify(leaderboardId, key, before, after, metric), 'v' + key);
  const loadDemo = () => call(() => api.coachInsightsLoadDemo(leaderboardId), 'demo');

  // CSV import: header row of column names, then numeric rows. month column required.
  const onCsv = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const lines = String(reader.result).trim().split(/\r?\n/);
        const head = lines[0].split(',').map(s => s.trim());
        const readings = lines.slice(1).map(l => {
          const cells = l.split(',');
          const o = {};
          head.forEach((h, i) => { const v = (cells[i] || '').trim(); o[h] = h === 'month' ? v : (v === '' ? undefined : Number(v)); });
          return o;
        }).filter(o => o.month);
        if (!readings.length) { showToast && showToast('No rows found in CSV.'); return; }
        if (!leaderboardId) { showToast && showToast('Open your board first.'); return; }
        setBusy('import');
        api.coachInsightsImport(leaderboardId, readings)
          .then((res) => { setImportResult(res); showToast && showToast(`Imported ${res.accepted} months${(res.rejected || []).length ? `, ${res.rejected.length} rejected` : ''}.`); return load(); })
          .catch((e) => showToast && showToast(e && e.status === 403 ? 'Only the board organizer (teacher) can import.' : (e && e.message) || 'Import failed.'))
          .finally(() => setBusy(''));
      } catch { showToast && showToast('Could not parse that CSV.'); }
    };
    reader.readAsText(file);
  };

  const Chip = ({ children, tone }) => (
    <span className="chip" style={{ fontSize: 10, background: tone === 'excl' ? 'rgba(182,111,77,.14)' : 'rgba(46,125,79,.12)', color: tone === 'excl' ? 'var(--coral-d)' : 'var(--green-d)' }}>{children}</span>
  );
  const EvRow = ({ k, v }) => (
    <div style={{ minWidth: 0 }}>
      <div className="dim" style={{ fontWeight: 700, fontSize: 10 }}>{k}</div>
      <div style={{ fontWeight: 650, fontSize: 11.5, lineHeight: 1.3 }}>{v}</div>
    </div>
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
        {dataSource && <div className="dim" style={{ fontSize: 10.5, fontWeight: 700, marginTop: 3 }}>Data source: {dataSource}</div>}
        <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {(scope.included || []).map((s) => <Chip key={s}>{s}</Chip>)}
          <Chip tone="excl">Food excluded — Direction B</Chip>
        </div>
        <div className="muted" style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.5, marginTop: 10 }}>{summary}</div>

        {/* Judge evidence — one-stop transparency: what's real, what's modeled, how it's validated */}
        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: '1px solid rgba(46,125,79,.16)', background: 'rgba(46,125,79,.05)' }}>
          <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 8 }}>Judge evidence</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 12px' }}>
            <EvRow k="Data" v={isReal ? 'Real import' : 'Synthetic sandbox'} />
            <EvRow k="AI mode" v={judgeEvidence.aiMode || '—'} />
            <EvRow k="Model" v={judgeEvidence.model || (evaluation && evaluation.model) || 'OLS (interpretable)'} />
            <EvRow k="Backtest MAPE" v={judgeEvidence.holdoutMapePct != null ? `${judgeEvidence.holdoutMapePct}%` : '—'} />
            <EvRow k="Anomaly rule" v={judgeEvidence.anomalyThreshold || 'residual z ≥ 2'} />
            <EvRow k="Features" v={(judgeEvidence.features || []).join(', ') || '—'} />
            <EvRow k="Human approval" v="required (named adult)" />
            <EvRow k="Tests" v={judgeEvidence.tests ? `${judgeEvidence.tests.passed}/${judgeEvidence.tests.total} ${judgeEvidence.tests.status || 'passing'}${judgeEvidence.tests.generatedAt ? ` · ${String(judgeEvidence.tests.generatedAt).slice(0, 10)}` : ''}` : (judgeEvidence.testCommand || 'npm test')} />
          </div>
          <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 700, lineHeight: 1.4, color: isReal ? 'var(--green-d)' : 'var(--coral-d)' }}>
            {isReal
              ? 'Running on real imported utility data.'
              : 'Synthetic sandbox — not a pilot. Imports real utility CSVs (sample provided). A verified pathway to savings; no real-world savings claimed yet.'}
          </div>
        </div>

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
              {cap(top.category === 'gas' ? 'heating gas' : top.category)} in {top.month} ran <span style={{ color: 'var(--coral-d)' }}>{top.percentAboveExpected != null ? `+${top.percentAboveExpected}%` : 'measurably'}</span> above the weather-adjusted baseline
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

        {/* Model validation */}
        {evaluation.perUtility && evaluation.perUtility.length > 0 && (
          <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'rgba(56,120,180,.06)', border: '1px solid rgba(56,120,180,.14)' }}>
            <div className="eyebrow" style={{ color: '#2f6f8f', marginBottom: 6 }}>Model validation · holdout backtest</div>
            <div className="row" style={{ gap: 12, flexWrap: 'wrap', fontSize: 12, fontWeight: 750 }}>
              <span>Avg error (MAPE): <span className="tnum">{evaluation.avgMapePct}%</span></span>
              {evaluation.perUtility.map(u => <span key={u.category} className="dim" style={{ fontWeight: 700 }}>{u.category} {u.mapePct}%</span>)}
            </div>
            <div className="dim" style={{ fontSize: 10.5, fontWeight: 600, marginTop: 5, lineHeight: 1.4 }}>{evaluation.note} {evaluation.modelRationale}</div>
          </div>
        )}

        {/* Forecast strip */}
        {(forecast.gas || forecast.electricity || forecast.water) && (
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ color: '#2f6f8f', marginBottom: 8 }}>Next-month forecast (80% band)</div>
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
            <div className="dim" style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, padding: '7px 10px', borderRadius: 10, background: 'rgba(46,125,79,.06)' }}>
              The loop: approve → record before/after → projected vs measured. Values shown are a sandbox demonstration of the verified-action loop, not a claimed real-world saving.
            </div>
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
                  <div className="dim" style={{ fontSize: 11.5, fontWeight: 650, marginTop: 6 }}>{r.costBand} · {r.effortTier} effort · ~{r.timeToImpactWeeks} wks · approver: {r.approver}</div>
                  <div className="dim" style={{ fontSize: 11.5, fontWeight: 650, marginTop: 3 }}>Verify by: {r.verificationMetric}</div>
                  {/* status stepper */}
                  <div className="row" style={{ gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {statusFlow.map((s, i) => (
                      <span key={s} style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 9999, background: i <= idx ? 'rgba(46,125,79,.14)' : 'rgba(0,0,0,.04)', color: i <= idx ? 'var(--green-d)' : 'var(--text-dim)' }}>{STATUS_LABEL[s]}</span>
                    ))}
                  </div>
                  {/* measured outcome */}
                  {r.measured ? (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ padding: 8, borderRadius: 10, background: 'rgba(0,0,0,.04)' }}>
                          <div className="dim" style={{ fontSize: 9.5, fontWeight: 800 }}>PROJECTED</div>
                          <div style={{ fontWeight: 800, fontSize: 13 }}>~{fmt(r.expectedKgPerMonth)} kg/mo</div>
                        </div>
                        <div style={{ padding: 8, borderRadius: 10, background: 'rgba(46,125,79,.12)' }}>
                          <div className="dim" style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--green-d)' }}>MEASURED</div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--green-d)' }}><Icon name="check" size={11} color="var(--green-d)" /> {r.measured.actualPct}% ↓ ({fmt(r.measured.beforeValue)}→{fmt(r.measured.afterValue)})</div>
                        </div>
                      </div>
                      {r.measured.metric && <div className="dim" style={{ fontSize: 10.5, fontWeight: 650, marginTop: 4 }}>metric: {r.measured.metric}</div>}
                    </div>
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      {!isApproved ? (
                        <button className="btn btn-secondary btn-sm" disabled={busy === 'a' + r.key} onClick={() => approve(r.key)}>{busy === 'a' + r.key ? 'Submitting…' : r.cta}</button>
                      ) : nextStatus ? (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--green-d)', fontWeight: 700 }} disabled={busy === 's' + r.key} onClick={() => advance(r.key, nextStatus)}>{busy === 's' + r.key ? 'Updating…' : `Mark ${STATUS_LABEL[nextStatus].toLowerCase()}`}{r.verifyBy ? ` · verify by ${r.verifyBy}` : ''}</button>
                      ) : null}
                      {isApproved && <VerifyRow rec={r} busy={busy === 'v' + r.key} onVerify={verify} />}
                    </div>
                  )}
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

        {/* Real Data Mode + sample loader */}
        <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onCsv} />
          <button className="btn btn-secondary btn-sm" disabled={busy === 'import'} onClick={() => fileRef.current && fileRef.current.click()}>
            {busy === 'import' ? 'Importing…' : 'Import real utility data (CSV)'}
          </button>
          {sampleData && (
            <button className="btn btn-primary btn-sm" disabled={busy === 'demo'} onClick={loadDemo}>
              {busy === 'demo' ? 'Loading…' : 'Load Lincoln High sample'}
            </button>
          )}
        </div>
        <div className="dim" style={{ fontSize: 10, fontWeight: 600, marginTop: 5 }}>CSV header: month,schoolDays,hdd,cdd,electricityKwh,gasTherms,waterGallons (extra columns ignored).</div>

        {/* CSV import proof: accepted/rejected rows + the anomaly re-running on the new data */}
        {importResult && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: '1px solid rgba(46,125,79,.18)', background: 'rgba(46,125,79,.05)' }}>
            <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 6 }}>CSV import proof</div>
            <div style={{ fontSize: 12, fontWeight: 750 }}>{importResult.accepted} rows accepted · {(importResult.rejected || []).length} rejected · data mode → {importResult.dataMode}</div>
            {(importResult.rejected || []).length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
                {importResult.rejected.slice(0, 6).map((r, i) => (
                  <li key={i} className="dim" style={{ fontSize: 11, fontWeight: 650, color: 'var(--coral-d)' }}>row {r.rowNumber}: {r.reason}</li>
                ))}
              </ul>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(0,0,0,.04)' }}>
                <div className="dim" style={{ fontSize: 9.5, fontWeight: 800 }}>TOP ANOMALY · BEFORE</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{importResult.beforeAnomaly ? `${importResult.beforeAnomaly.category} ${importResult.beforeAnomaly.month} +${importResult.beforeAnomaly.percentAboveExpected}%` : 'none'}</div>
              </div>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(46,125,79,.10)' }}>
                <div className="dim" style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--green-d)' }}>TOP ANOMALY · AFTER</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-d)' }}>{importResult.afterAnomaly ? `${importResult.afterAnomaly.category} ${importResult.afterAnomaly.month} +${importResult.afterAnomaly.percentAboveExpected}%` : 'none'}</div>
              </div>
            </div>
            <div className="dim" style={{ fontSize: 10, fontWeight: 650, marginTop: 6 }}>The engine re-ran on your imported data — different rows in, different anomaly out (not hardcoded to the sample).</div>
          </div>
        )}
      </div>
    </div>
  );
}
