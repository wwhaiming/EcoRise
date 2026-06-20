/* EcoRise — School Hidden-Footprint digest (Direction B core).
 *
 * Shows the school's ESTIMATED institutional footprint by category (the "hidden"
 * emissions a school doesn't see), the biggest emitter, how much student action
 * offsets it (leverage), and a grounded + cited next step. Every number carries an
 * honest confidence label; a teacher can enter real bills to raise confidence.
 */
import { useState, useEffect, useCallback } from 'react';
import Icon from './Icon';
import { HelpTip } from './UI';
import api from '../utils/api';

const CONF_STYLE = {
  low: { bg: 'rgba(182,111,77,.14)', fg: 'var(--coral-d)' },
  medium: { bg: 'rgba(198,163,90,.18)', fg: '#8a6d2a' },
  high: { bg: 'rgba(46,125,79,.14)', fg: 'var(--green-d)' },
};
function ConfChip({ level }) {
  const s = CONF_STYLE[level] || CONF_STYLE.low;
  return <span className="chip" style={{ fontSize: 10, background: s.bg, color: s.fg }}>{level} confidence</span>;
}

const WIZARD_FIELDS = [
  ['students', 'Students'], ['monthlyKwh', 'Electricity (kWh/mo)'], ['monthlyGasTherms', 'Gas (therms/mo)'],
  ['busMilesPerWeek', 'Bus miles/week'], ['pctDrivenStudents', '% driven to school'],
  ['dailyMealsServed', 'Meals served/day'], ['landfillBagsPerWeek', 'Landfill bags/week'], ['monthlyWaterM3', 'Water (m3/mo)'],
];

export default function SchoolFootprint({ leaderboardId, showToast }) {
  const [data, setData] = useState(null);     // { footprint, leverage, recommendation, hasBaseline }
  const [err, setErr] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api.coachSchoolInsight(leaderboardId)); setErr(false); }
    catch { setErr(true); }
  }, [leaderboardId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const body = { leaderboardId };
      for (const [k] of WIZARD_FIELDS) if (form[k] !== undefined && form[k] !== '') body[k] = Number(form[k]);
      await api.coachSetFootprint(body);
      setEditing(false);
      await load();
      showToast?.('Footprint baseline updated');
    } catch (e) {
      showToast?.(e?.status === 403 ? 'Join or organize a board to set its baseline.' : (e.message || 'Could not save baseline'));
    } finally { setSaving(false); }
  };

  if (err || !data) {
    return (
      <div style={{ padding: '8px 16px 0' }}>
        <div className="card" style={{ padding: 14 }}>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>Your school's hidden footprint</div>
          <div className="muted" style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>
            {err ? 'Footprint estimate unavailable right now.' : 'Estimating…'}
          </div>
        </div>
      </div>
    );
  }
  const { footprint: fp, leverage, recommendation, hasBaseline } = data;
  const showReal = !!hasBaseline;
  const categories = showReal ? fp.categories : fp.categories.map(c => ({ ...c, kgCO2ePerMonth: 0 }));
  const totalTons = showReal ? (fp.totalKgPerMonth / 1000) : 0;
  const max = showReal ? Math.max(...fp.categories.map(c => c.kgCO2ePerMonth), 1) : 1;
  const t = totalTons.toFixed(1);

  return (
    <div style={{ padding: '8px 16px 0' }}>
      <div className="card" style={{ padding: 16, border: '1px solid rgba(46,125,79,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow" style={{ color: 'var(--green)' }}>School footprint</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, color: 'var(--green-d)', lineHeight: 1 }}>{t}t</span>
              <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>CO₂e / mo</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ConfChip level={fp.overallConfidence} />
            <HelpTip text={fp.disclaimer} />
          </div>
        </div>

        {/* category bars — the hidden emitters, biggest first */}
        <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
          {categories.map((c, i) => (
            <div key={c.category}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {i === 0 && (
                    <span title="Biggest emitter — this category produces the most CO₂e of all your school's emission sources" style={{ display: 'flex', cursor: 'help' }}>
                      <Icon name="flame" size={13} color="var(--coral)" />
                    </span>
                  )}{c.label}
                </span>
                <span className="tnum dim" title={`range ${c.low}–${c.high} kg/mo · ${c.factorName}`}>{Math.round(c.kgCO2ePerMonth).toLocaleString()} kg/mo</span>
              </div>
              <div className="bar"><i style={{ width: `${(c.kgCO2ePerMonth / max) * 100}%`, background: i === 0 ? 'linear-gradient(90deg,var(--coral),var(--coral-2,#d98a63))' : undefined }} /></div>
            </div>
          ))}
        </div>

        {/* leverage: student action vs the biggest hidden emitter */}
        {leverage && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 13, background: 'rgba(46,125,79,.07)', border: '1px solid rgba(46,125,79,.13)' }}>
            <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 4 }}>Action leverage</div>
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 650, lineHeight: 1.4 }}>{leverage.message}</div>
          </div>
        )}

        {/* grounded + cited recommendation (only when the faithfulness gate passed) */}
        {recommendation && (
          <div style={{ marginTop: 12, padding: 13, borderRadius: 13, background: 'var(--navy-800)', border: '1px solid rgba(45,91,57,.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <Icon name="sparkle" size={14} color="var(--green)" />
              <span className="eyebrow" style={{ color: 'var(--green)', flex: 1 }}>Next step</span>
              <HelpTip text={`Source-backed recommendation. Grounding score: ${recommendation.faithfulness?.toFixed?.(2) ?? recommendation.faithfulness} (passes faithfulness gate).`} />
            </div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14.5 }}>{recommendation.recommendation}</div>
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 5, lineHeight: 1.4 }}>{recommendation.explanation}</div>
            {!!(recommendation.sources && recommendation.sources.length) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {recommendation.sources.map((s, i) => (
                  <a key={i} href={s.url || '#'} target="_blank" rel="noreferrer" className="chip chip-dim" style={{ fontSize: 10.5, textDecoration: 'none' }}>
                    <Icon name="leaf" size={10} color="var(--green)" /> {(s.title || 'source').slice(0, 42)}{s.pubYear ? ` (${s.pubYear})` : ''}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dev fixture: shown only in dev when COACH_ENABLED is off / corpus unseeded */}
        {!recommendation && import.meta.env.DEV && (
          <div style={{ marginTop: 12, padding: 13, borderRadius: 13, background: 'var(--navy-800)', border: '2px dashed rgba(182,111,77,.45)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <Icon name="sparkle" size={14} color="var(--green)" />
              <span className="eyebrow" style={{ color: 'var(--green)', flex: 1 }}>Next step</span>
              <span className="chip" style={{ fontSize: 9, background: 'rgba(182,111,77,.18)', color: 'var(--coral-d)' }}>Demo fixture</span>
              <HelpTip text="Demo fixture — real output requires COACH_ENABLED=true + seeded corpus." />
            </div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14.5 }}>
              Switch gymnasium lighting to LED — highest single-action return for this school.
            </div>
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 5, lineHeight: 1.4 }}>
              Lighting is your school's top emitter at ~38% of electricity draw. Retrofitting 200 fixtures to LED cuts monthly use by ~1,840 kWh — offsetting 0.9 t CO₂e/mo at current grid intensity (EPA eGRID 2023, SUBRGN RFCE).
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <span className="chip chip-dim" style={{ fontSize: 10.5 }}>
                <Icon name="leaf" size={10} color="var(--green)" /> Mills et al. "Energy Efficiency in K–12 Schools" (2023)
              </span>
            </div>
            <div className="dim" style={{ fontSize: 10, fontWeight: 600, marginTop: 6 }}>
              Faithfulness score: 0.82 · Demo fixture — real output requires COACH_ENABLED=true + seeded corpus
            </div>
          </div>
        )}

        {/* baseline wizard — real inputs raise confidence */}
        <button className="btn btn-secondary btn-block btn-sm" style={{ marginTop: 12 }} onClick={() => setEditing(v => !v)}>
          <Icon name="settings" size={14} /> {editing ? 'Close' : 'Update school data'}
        </button>
        {editing && (
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {WIZARD_FIELDS.map(([k, label]) => (
              <label key={k} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                {label}
                <input className="field" type="number" min="0" inputMode="numeric" value={form[k] ?? ''} placeholder="est."
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={{ marginTop: 3, padding: '9px 11px' }} />
              </label>
            ))}
            <button className="btn btn-primary btn-sm" disabled={saving} onClick={save} style={{ gridColumn: '1 / -1' }}>
              {saving ? 'Saving…' : 'Save baseline'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
