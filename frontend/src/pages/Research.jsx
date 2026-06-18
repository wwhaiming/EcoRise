/* GeoRise — Research screen.
 *
 * Split out of the AI Eco Coach screen: this is the "research library and below"
 * half (the 1000-paper corpus: ask / browse / summarize / visualize) plus the
 * responsible-AI guardrails note. Reached from its own bottom-nav tab.
 */
import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import ResearchLibrary from '../components/ResearchLibrary';
import api from '../utils/api';

// Live responsible-AI report card: reads the eval harness output from the server
// (GET /api/coach/eval-report), never hardcoded. Renders nothing if unavailable.
function AIReportCard() {
  const [rep, setRep] = useState(null);
  useEffect(() => { api.coachEvalReport().then(setRep).catch(() => {}); }, []);
  if (!rep || !rep.available) return null;
  const m = rep.metrics || {};
  const pctv = v => `${Math.round((v || 0) * 100)}%`;
  const rows = [
    ['Faithfulness pass', pctv(m.faithfulnessPass)],
    ['Citation validity', pctv(m.citationValidity)],
    ['Unanswerable refusal', pctv(m.refusalRate)],
    ['Hallucination rate', pctv(m.hallucinationRate)],
    ['Injection resistance', pctv(m.injectionResistance)],
    ['Point cap holds', `${m.capMaxDaily}/day`],
  ];
  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div className="card" style={{ padding: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Icon name="sparkle" size={15} color="var(--green)" />
          <span className="eyebrow" style={{ color: 'var(--green)' }}>AI report card</span>
          <span className="chip" style={{ marginLeft: 'auto', fontSize: 10, background: rep.pass ? 'rgba(46,125,79,.14)' : 'rgba(182,111,77,.16)', color: rep.pass ? 'var(--green-d)' : 'var(--coral-d)' }}>{rep.pass ? 'all gates pass' : 'gate fail'}</span>
        </div>
        <div className="dim" style={{ fontSize: 11, fontWeight: 650, marginBottom: 10 }}>Live output of the responsible-AI eval harness — not hardcoded.</div>
        <div style={{ display: 'grid', gap: 7 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700 }}>
              <span className="muted">{k}</span><span className="tnum">{v}</span>
            </div>
          ))}
        </div>
        <div className="dim" style={{ fontSize: 10.5, fontWeight: 600, marginTop: 9, lineHeight: 1.4 }}>{rep.note}</div>
      </div>
    </div>
  );
}

export default function Research({ ctx }) {
  const { go, showToast } = ctx;
  return (
    <div className="screen-in">
      {/* header */}
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(46,125,79,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="folder" size={22} color="var(--green)" />
        </span>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>AI · grounded in research</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 19, lineHeight: 1 }}>Research library</div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} aria-label="Back home" onClick={() => go('home')}>
          <Icon name="home" size={18} />
        </button>
      </div>

      <ResearchLibrary showToast={showToast} />

      <AIReportCard />

      <div style={{ padding: '16px 16px 0' }}>
        <div className="card" style={{ padding: 15, border: '1px solid rgba(182,111,77,.22)' }}>
          <div className="eyebrow" style={{ color: 'var(--coral-d)', marginBottom: 6 }}>Responsible AI guardrails</div>
          <div className="muted" style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.45 }}>
            The coach cannot award unlimited points or invent sources. Learning points are capped, citations are shown, impact math stays deterministic, and organizers keep human review over boards, source approval, and moderation.
          </div>
        </div>
      </div>

      <div style={{ height: 110 }} />
    </div>
  );
}
