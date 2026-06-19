/* EcoRise — Evidence Chart (Direction B).
 *
 * NOT a generic line chart: it plots OBSERVED usage against the AI-LEARNED expected baseline
 * and its 80% range, with the flagged month marked. This is what makes the chart EVIDENCE for
 * the reasoning ("observed sat above the weather-and-occupancy baseline"), not "visualization
 * pretending to be AI". Dependency-free inline SVG; accessible (role=img + text summary).
 */
export default function EvidenceChart({ series = [], unit = '', height = 170 }) {
  if (!Array.isArray(series) || series.length < 2) return null;
  const W = 520, H = height, padL = 10, padR = 10, padT = 16, padB = 22;
  const n = series.length;
  const vals = series.flatMap(p => [p.observed, p.low, p.high, p.expected]).filter(Number.isFinite);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.08; min -= pad; max += pad;
  const X = (i) => padL + (i / (n - 1)) * (W - padL - padR);
  const Y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const line = (key) => series.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(' ');
  const band = series.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.high).toFixed(1)}`).join(' ')
    + ' ' + series.slice().reverse().map((p, i) => `L${X(n - 1 - i).toFixed(1)},${Y(p.low).toFixed(1)}`).join(' ') + ' Z';
  const flagged = series.filter(p => p.anomaly);
  const summary = `Observed ${unit} versus the AI-learned weather-and-occupancy expected baseline over ${n} months. ${flagged.length} month${flagged.length === 1 ? '' : 's'} flagged above the expected 80% range${flagged[0] ? ` (e.g. ${flagged[0].month}: ${flagged[0].observed} vs ${flagged[0].expected} expected)` : ''}.`;
  const labelIdx = [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <figure role="img" aria-label={summary} style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        {/* expected 80% range band */}
        <path d={band} fill="rgba(56,120,180,.12)" stroke="none" />
        {/* expected baseline (model) */}
        <path d={line('expected')} fill="none" stroke="var(--text-dim)" strokeWidth="1.6" strokeDasharray="4 4" />
        {/* observed usage */}
        <path d={line('observed')} fill="none" stroke="var(--green-d)" strokeWidth="2.4" strokeLinejoin="round" />
        {/* flagged anomalies */}
        {series.map((p, i) => p.anomaly ? (
          <g key={i}>
            <circle cx={X(i)} cy={Y(p.observed)} r="5.5" fill="var(--coral)" stroke="#fff" strokeWidth="1.6" />
            <title>{p.month}: {p.observed} {unit} (expected ~{p.expected})</title>
          </g>
        ) : null)}
        {labelIdx.map(i => (
          <text key={i} x={X(i)} y={H - 6} fontSize="9" fontWeight="700" fill="var(--text-dim)"
            textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{series[i].month}</text>
        ))}
      </svg>
      <div className="row" style={{ gap: 14, marginTop: 6, fontSize: 10.5, fontWeight: 700, flexWrap: 'wrap' }}>
        <span className="row" style={{ gap: 5 }}><span style={{ width: 14, height: 2.5, background: 'var(--green-d)', display: 'inline-block', borderRadius: 2 }} /> Observed</span>
        <span className="row" style={{ gap: 5 }}><span style={{ width: 14, height: 0, borderTop: '2px dashed var(--text-dim)', display: 'inline-block' }} /> Expected (AI baseline)</span>
        <span className="row" style={{ gap: 5 }}><span style={{ width: 10, height: 10, background: 'rgba(56,120,180,.18)', display: 'inline-block', borderRadius: 3 }} /> 80% range</span>
        <span className="row" style={{ gap: 5 }}><span style={{ width: 9, height: 9, background: 'var(--coral)', display: 'inline-block', borderRadius: 9999 }} /> Anomaly</span>
      </div>
    </figure>
  );
}
