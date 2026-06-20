/* EcoRise — Research screen.
 *
 * Split out of the AI Eco Coach screen: this is the "research library and below"
 * half (the 1000-paper corpus: ask / browse / summarize / visualize) plus the
 * responsible-AI guardrails note. Reached from its own bottom-nav tab.
 */
import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { HelpTip } from '../components/UI';
import ResearchLibrary from '../components/ResearchLibrary';
import api from '../utils/api';

// Live responsible-AI report card: reads the eval harness output from the server
// (GET /api/coach/eval-report), never hardcoded. Renders nothing if unavailable.
function AIReportCard() {
  const [rep, setRep] = useState(null);
  useEffect(() => { api.coachEvalReport().then(setRep).catch(() => {}); }, []);
  if (!rep || !rep.available) {
    if (!import.meta.env.DEV) return null;
    // Dev fixture — visually identical to real card; shown when eval harness is unavailable
    return (
      <div style={{ padding: '16px 16px 0' }}>
        <div className="card" style={{ padding: 15, border: '2px dashed rgba(182,111,77,.45)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Icon name="sparkle" size={15} color="var(--green)" />
            <span className="eyebrow" style={{ color: 'var(--green)' }}>AI report card</span>
            <span className="chip" style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(46,125,79,.14)', color: 'var(--green-d)' }}>all gates pass</span>
          </div>
          <div style={{ marginBottom: 10 }}>
            <span className="chip" style={{ fontSize: 9, background: 'rgba(182,111,77,.18)', color: 'var(--coral-d)' }}>Demo fixture</span>
            <HelpTip text="Demo fixture — real numbers require COACH_ENABLED=true + npm run test:coach-eval." />
          </div>
          <div style={{ display: 'grid', gap: 7 }}>
            {[
              ['Faithfulness pass', '84%'],
              ['Citation validity', '91%'],
              ['Unanswerable refusal', '88%'],
              ['Refusal precision', '79%'],
              ['Hallucination rate', '4%'],
              ['Injection resistance', '100%'],
              ['Point cap holds', '500/day'],
              ['Retrieval recall@5', '76%'],
              ['Retrieval MRR', '0.71'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700 }}>
                <span className="muted">{k}</span><span className="tnum">{v}</span>
              </div>
            ))}
          </div>
          <div className="dim" style={{ fontSize: 10.5, fontWeight: 600, marginTop: 9, lineHeight: 1.4 }}>
            Demo fixture — run <code>npm run test:coach-eval</code> to generate live numbers.
          </div>
        </div>
      </div>
    );
  }
  const m = rep.metrics || {};
  const pctv = v => `${Math.round((v || 0) * 100)}%`;
  const rows = [
    ['Faithfulness pass', pctv(m.faithfulnessPass)],
    ['Citation validity', pctv(m.citationValidity)],
    ['Unanswerable refusal', pctv(m.refusalRate)],
    ['Refusal precision', pctv(m.refusalPrecision)],
    ['Hallucination rate', pctv(m.hallucinationRate)],
    ['Injection resistance', pctv(m.injectionResistance)],
    ['Point cap holds', `${m.capMaxDaily}/day`],
  ];
  if (m.retrieval) {
    rows.push([`Retrieval recall@${m.retrieval.k}`, pctv(m.retrieval.recallAtK)]);
    rows.push(['Retrieval MRR', String(m.retrieval.mrr ?? 0)]);
  }
  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div className="card" style={{ padding: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Icon name="sparkle" size={15} color="var(--green)" />
          <span className="eyebrow" style={{ color: 'var(--green)' }}>AI report card</span>
          <span className="chip" style={{ marginLeft: 'auto', fontSize: 10, background: rep.pass ? 'rgba(46,125,79,.14)' : 'rgba(182,111,77,.16)', color: rep.pass ? 'var(--green-d)' : 'var(--coral-d)' }}>{rep.pass ? 'all gates pass' : 'gate fail'}</span>
        </div>
        <div style={{ marginBottom: 10 }}><HelpTip text="Live output of the responsible-AI eval harness — not hardcoded." /></div>
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

export default function Research({ ctx, isCombined }) {
  const { go, showToast } = ctx;
  const content = (
    <>

      <ResearchLibrary showToast={showToast} />

      <AIReportCard />

      <div style={{ padding: '16px 16px 0' }}>
        <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(182,111,77,.22)' }}>
          <span className="eyebrow" style={{ color: 'var(--coral-d)', flex: 1 }}>Responsible AI guardrails</span>
          <HelpTip text="The coach cannot award unlimited points or invent sources. Learning points are capped, citations are shown, impact math stays deterministic, and organizers keep human review over boards, source approval, and moderation." />
        </div>
      </div>
    </>
  );

  if (isCombined) return content;

  return (
    <div className="screen-in">
      {/* header */}
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(46,125,79,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="folder" size={22} color="var(--green)" />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 19, lineHeight: 1 }}>Research</div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} aria-label="Back" onClick={() => go('home')}>
          <Icon name="home" size={18} />
        </button>
      </div>
      {content}
    </div>
  );
}
