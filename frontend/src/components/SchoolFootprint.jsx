/* GeoRise — School Hidden-Footprint digest (Direction B core).
 *
 * Shows the school's ESTIMATED institutional footprint by category (the "hidden"
 * emissions a school doesn't see), the biggest emitter, how much student action
 * offsets it (leverage), and a grounded + cited next step. Every number carries an
 * honest confidence label; a teacher can enter real bills to raise confidence.
 */
import { useState, useEffect, useCallback } from 'react';
import Icon from './Icon';
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

  const { footprint: fp, leverage, recommendation } = data;
  const max = Math.max(1, ...fp.categories.map(c => c.kgCO2ePerMonth));
  const t = (fp.totalKgPerMonth / 1000).toFixed(1);

  return (
    <div style={{ padding: '8px 16px 0' }}>
      <div className="card" style={{ padding: 16, border: '1px solid rgba(46,125,79,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow" style={{ color: 'var(--green)' }}>Direction B · your school's hidden footprint</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, color: 'var(--green-d)', lineHeight: 1 }}>{t}t</span>
              <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>CO₂e / month (est.)</span>
            </div>
          </div>
          <ConfChip level={fp.overallConfidence} />
        </div>
        <div className="dim" style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.35, marginTop: 6 }}>{fp.disclaimer}</div>

        {/* category bars — the hidden emitters, biggest first */}
        <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
          {fp.categories.map((c, i) => (
            <div key={c.category}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {i === 0 && <Icon name="flame" size={13} color="var(--coral)" />}{c.label}
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
              <span className="eyebrow" style={{ color: 'var(--green)' }}>Source-backed next step</span>
              <span className="chip chip-dim" style={{ fontSize: 10, marginLeft: 'auto' }}>grounding {recommendation.faithfulness?.toFixed?.(2) ?? recommendation.faithfulness}</span>
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

        {/* baseline wizard — real inputs raise confidence */}
        <button className="btn btn-secondary btn-block btn-sm" style={{ marginTop: 12 }} onClick={() => setEditing(v => !v)}>
          <Icon name="settings" size={14} /> {editing ? 'Close' : 'Enter real school data (raises confidence)'}
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
