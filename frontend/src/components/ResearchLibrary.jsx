/* EcoRise — Research Library.
 *
 * Three AI features over the 1000-paper research corpus:
 *  1. "Ask the research" — a free-form question whose answer is pulled out of the
 *     most relevant papers (RAG), always shown WITH its citations.
 *  2. AI summary — plain-language TL;DR + key points for one paper.
 *  3. AI visual — a structured infographic (metric / concept nodes / comparison bars /
 *     cause→effect flow) rendered client-side so a dense paper is easy to grasp.
 */
import { useState, useCallback } from 'react';
import Icon from './Icon';
import api from '../utils/api';

// Direction B environmental topics (food = Direction A, omitted from the filter chips).
const TOPICS = ['transportation', 'waste', 'energy', 'water', 'climate_ed', 'sustainability', 'footprint', 'nature'];

function Cite({ sources }) {
  if (!sources || !sources.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
      {sources.map((s, i) => (
        <a key={i} href={s.url || '#'} target="_blank" rel="noreferrer"
          className="chip chip-dim" title={s.snippet || ''} style={{ fontSize: 11, textDecoration: 'none' }}>
          <Icon name="leaf" size={11} color="var(--green)" /> {(s.title || 'source').slice(0, 48)}{s.pubYear ? ` (${s.pubYear})` : ''}
        </a>
      ))}
    </div>
  );
}

/* Render the structured infographic the AI extracts from a paper. */
function Visual({ v }) {
  if (!v) return null;
  const maxBar = Math.max(1, ...(v.comparison || []).map(c => c.value || 0));
  return (
    <div style={{ marginTop: 10, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(46,125,79,.18)' }}>
      <div style={{ padding: '14px 16px', background: 'linear-gradient(150deg,var(--green-2),var(--green-d))', color: '#fff' }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, lineHeight: 1.12 }}>{v.headline}</div>
        {v.subtitle && <div style={{ fontSize: 12.5, fontWeight: 650, opacity: .92, marginTop: 4 }}>{v.subtitle}</div>}
      </div>
      <div style={{ padding: 14, background: 'rgba(255,255,255,.94)' }}>
        {v.metric && (
          <div style={{ textAlign: 'center', margin: '2px 0 14px' }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 40, lineHeight: 1, color: 'var(--green-d)' }}>{v.metric.value}</div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{v.metric.label}</div>
          </div>
        )}
        {!!(v.nodes && v.nodes.length) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {v.nodes.map((n, i) => (
              <div key={i} style={{ padding: 11, borderRadius: 12, background: 'rgba(46,125,79,.08)', border: '1px solid rgba(46,125,79,.12)' }}>
                <div style={{ fontWeight: 800, fontSize: 12.5, color: 'var(--green-d)' }}>{n.label}</div>
                <div className="muted" style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.3, marginTop: 3 }}>{n.detail}</div>
              </div>
            ))}
          </div>
        )}
        {!!(v.comparison && v.comparison.length) && (
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            {v.comparison.map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, marginBottom: 3 }}>
                  <span>{c.label}</span><span className="dim">{c.value}</span>
                </div>
                <div className="bar"><i style={{ width: `${(c.value / maxBar) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        )}
        {!!(v.flow && v.flow.length) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 14 }}>
            {v.flow.map((s, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="chip chip-purple" style={{ fontSize: 10.5 }}>{s}</span>
                {i < v.flow.length - 1 && <Icon name="arrowR" size={12} color="var(--green)" />}
              </span>
            ))}
          </div>
        )}
        {v.isMock && <div className="dim" style={{ fontSize: 10.5, fontWeight: 700, marginTop: 10 }}>demo (AI key not set)</div>}
      </div>
    </div>
  );
}

function PaperCard({ p, showToast }) {
  const [busy, setBusy] = useState('');        // 'summary' | 'visual'
  const [summary, setSummary] = useState(null);
  const [visual, setVisual] = useState(null);

  const run = async (kind) => {
    if (busy) return;
    setBusy(kind);
    try {
      if (kind === 'summary') { const r = await api.coachPaperSummary(p.id); setSummary(r.summary); }
      else { const r = await api.coachPaperVisual(p.id); setVisual(r.visual); }
    } catch (e) { showToast?.(e.message || `Could not generate ${kind}`); }
    finally { setBusy(''); }
  };

  return (
    <div className="card" style={{ padding: 14, marginTop: 10 }}>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14.5, lineHeight: 1.25 }}>{p.title}</div>
      <div className="muted" style={{ fontSize: 11.5, fontWeight: 650, marginTop: 4 }}>
        {(p.authors || '').slice(0, 70) || '—'}{p.year ? ` · ${p.year}` : ''}{p.venue ? ` · ${p.venue}` : ''}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn btn-secondary btn-sm" disabled={!!busy} onClick={() => run('summary')}>
          <Icon name="leaf" size={14} /> {busy === 'summary' ? 'Summarizing…' : 'Summarize'}
        </button>
        <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => run('visual')}>
          <Icon name="sparkle" size={14} /> {busy === 'visual' ? 'Visualizing…' : 'Visualize'}
        </button>
        {p.topic && <span className="chip chip-dim" style={{ fontSize: 10.5, marginLeft: 'auto', alignSelf: 'center' }}>{p.topic}</span>}
      </div>

      {summary && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 13, background: 'rgba(46,125,79,.06)', border: '1px solid rgba(46,125,79,.12)' }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.4 }}>{summary.tldr}</div>
          {!!(summary.keyPoints && summary.keyPoints.length) && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {summary.keyPoints.map((k, i) => <li key={i} className="muted" style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, marginTop: 2 }}>{k}</li>)}
            </ul>
          )}
          {summary.soWhat && <div className="dim" style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>Why it matters: {summary.soWhat}</div>}
        </div>
      )}
      {visual && <Visual v={visual} />}
    </div>
  );
}

export default function ResearchLibrary({ showToast }) {
  const [askQ, setAskQ] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState(null);     // { answer, sources } | { message }

  const [topic, setTopic] = useState('');
  const [search, setSearch] = useState('');
  const [papers, setPapers] = useState(null);     // null = not loaded
  const [total, setTotal] = useState(0);
  const [loadingPapers, setLoadingPapers] = useState(false);

  const ask = async () => {
    const q = askQ.trim();
    if (q.length < 4 || asking) return;
    setAsking(true); setAnswer(null);
    try { setAnswer(await api.coachAsk(q)); }
    catch (e) {
      if (e.status === 503) setAnswer({ message: 'No research corpus loaded yet.' });
      else showToast?.(e.message || 'Could not answer');
    } finally { setAsking(false); }
  };

  const loadPapers = useCallback(async (nextTopic = topic, nextSearch = search, random = false) => {
    setLoadingPapers(true);
    try {
      const r = await api.coachPapers({ q: nextSearch, topic: nextTopic, limit: 12, random });
      setPapers(r.papers); setTotal(r.total);
    } catch (e) { showToast?.(e.message || 'Could not load papers'); }
    finally { setLoadingPapers(false); }
  }, [topic, search, showToast]);

  return (
    <div style={{ padding: '20px 16px 0' }}>
      <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 6 }}>Research library · 1,000 papers</div>

      {/* 1. Ask the research */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16 }}>Ask the research</div>
        <div className="muted" style={{ fontSize: 12.5, fontWeight: 650, marginTop: 3, lineHeight: 1.35 }}>
          Your answer is pulled out of real papers and shown with its citations — never invented.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input className="field" value={askQ} onChange={e => setAskQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="e.g. Does biking to school cut emissions?" style={{ flex: 1 }} />
          <button className="btn btn-primary" disabled={asking || askQ.trim().length < 4} onClick={ask} style={{ flexShrink: 0 }}>
            <Icon name="sparkle" size={16} /> {asking ? '…' : 'Ask'}
          </button>
        </div>
        {answer && (
          <div style={{ marginTop: 12, padding: 13, borderRadius: 13, background: 'rgba(46,125,79,.07)', border: '1px solid rgba(46,125,79,.13)' }}>
            {answer.answer ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 650, lineHeight: 1.5 }}>{answer.answer}</div>
                <Cite sources={answer.sources} />
              </>
            ) : (
              <div className="muted" style={{ fontSize: 13, fontWeight: 650 }}>{answer.message || 'No grounded answer found in the corpus.'}</div>
            )}
          </div>
        )}
      </div>

      {/* 2 + 3. Browse papers -> summarize / visualize */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input className="field" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadPapers(topic, search)}
            placeholder="Search 1,000 papers by title…" style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={() => loadPapers(topic, search, true)} style={{ flexShrink: 0 }}
            title="Show a fresh random set of papers — click again for new ones">
            <Icon name="home" size={16} /> Browse
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TOPICS.map(t => (
            <button key={t} className={`chip ${topic === t ? 'chip-green' : 'chip-dim'}`} style={{ fontSize: 10.5, cursor: 'pointer', border: 'none' }}
              onClick={() => { const nt = topic === t ? '' : t; setTopic(nt); loadPapers(nt, search); }}>
              {t}
            </button>
          ))}
        </div>

        {loadingPapers && <div className="dim" style={{ padding: 16, textAlign: 'center', fontWeight: 700 }}>Loading papers…</div>}
        {papers && !loadingPapers && (
          <div style={{ marginTop: 4 }}>
            <div className="dim" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 8 }}>{total} matching papers{papers.length < total ? ` · showing ${papers.length}` : ''}</div>
            {papers.map(p => <PaperCard key={p.id} p={p} showToast={showToast} />)}
            {!papers.length && <div className="muted" style={{ fontSize: 13, fontWeight: 650, padding: 12 }}>No papers match — clear the filter or try another term.</div>}
          </div>
        )}
        {papers === null && !loadingPapers && (
          <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 8 }} onClick={() => loadPapers(topic, search, true)}>
            Browse the corpus →
          </button>
        )}
      </div>
    </div>
  );
}
