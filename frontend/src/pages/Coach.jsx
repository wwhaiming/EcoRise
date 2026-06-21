/* EcoRise — AI Eco Coach screen.
 *
 * The learning-to-action loop, with the responsible-AI guardrails made VISIBLE:
 * every question and tip shows its sources, learning points are explicitly capped,
 * and the UI says "AI drafts; EcoRise validates" rather than "AI says this is true".
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../components/Icon';
import SchoolFootprint from '../components/SchoolFootprint';
import { HelpTip } from '../components/UI';
import api from '../utils/api';

const CLIMATE_FACTS = [
  'Transportation is ~29% of U.S. greenhouse-gas emissions — the single largest source.',
  'One tree absorbs roughly 21 kg of CO₂ per year.',
  'Producing 1 kg of beef emits ~60 kg of CO₂ — about 10× a plant-based meal.',
  'A reusable bottle can prevent ~150 single-use plastic bottles a year.',
  'Biking 10 miles instead of driving saves about 4 kg of CO₂.',
  'Food waste causes ~8% of global greenhouse-gas emissions.',
  'Air-drying one load of laundry saves ~1 kg of CO₂ vs. a dryer.',
  'LED bulbs use ~75% less energy and last ~25× longer than incandescent.',
  'Recycling one aluminum can saves enough energy to run a TV for ~3 hours.',
  'Skipping meat one day a week ~= taking your car off the road for a month each year.',
];

const FACT_INTERVAL = 10000;

function ClimateFact() {
  const [i, setI] = useState(() => Math.floor(Math.random() * CLIMATE_FACTS.length));
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());
  const rafRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / FACT_INTERVAL, 1);
      setProgress(pct);
      if (elapsed >= FACT_INTERVAL) {
        setI(prev => (prev + 1) % CLIMATE_FACTS.length);
        startRef.current = Date.now();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = () => {
    setI(prev => (prev + 1) % CLIMATE_FACTS.length);
    startRef.current = Date.now();
    setProgress(0);
  };

  return (
    <button onClick={handleClick} aria-label="Show another climate fact"
      style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(46,125,79,.18)', borderRadius: 18,
        padding: '12px 14px', background: 'radial-gradient(180px 80px at 90% -10%, rgba(117,183,123,.14), transparent), var(--navy-800)',
        display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, height: 3, width: '100%', background: 'rgba(46,125,79,.15)', borderRadius: '18px 18px 0 0', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--green)', transition: 'none', borderRadius: 'inherit' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Icon name="leaf" size={18} color="var(--green)" style={{ flexShrink: 0 }} />
        <div className="muted" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: 'var(--text)', flex: 1 }}>{CLIMATE_FACTS[i]}</div>
      </div>
    </button>
  );
}

function nowMs() {
  return Date.now();
}

function Sources({ sources }) {
  if (!sources || !sources.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {sources.map((s, i) => (
        <span key={i} className="chip chip-dim" title={s.title || s.snippet || ''}
          style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, maxWidth: '100%', overflow: 'hidden' }}>
          <Icon name="leaf" size={11} color="var(--green)" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {s.title}{s.pubYear ? ` (${s.pubYear})` : ''}
          </span>
        </span>
      ))}
    </div>
  );
}

const CATEGORY_LABELS = {
  transport: 'transport',
  transportation: 'transport',
  waste: 'waste',
  recycling: 'waste',
  energy: 'energy',
  food: 'food',
  consumption: 'food',
  nature: 'nature',
  cleanup: 'nature',
  community: 'community',
  learning: 'learning',
};

const ACTION_MAP = {
  transport: 'Run a car-free arrival challenge for one hallway or club.',
  waste: 'Audit one lunch period for single-use plastic, then test one refill or reuse fix.',
  energy: 'Measure one classroom energy habit and log a low-cost switch-off action.',
  food: 'Pilot a plant-forward lunch or compost reminder with one table group.',
  nature: 'Map a litter hotspot, clean it, and report whether the hotspot returns.',
  community: 'Recruit two classmates to test the recommended action and compare results.',
  learning: 'Answer one cited question, then convert it into one verified action.',
};

function normalizeCategory(post) {
  const raw = String(post?.action_type || post?.category || '').toLowerCase();
  return CATEGORY_LABELS[raw] || raw || 'action';
}

function footprintFrom(posts = [], leaderboard) {
  const counts = {};
  let totalCo2 = 0;
  let verified = 0;
  posts.forEach(post => {
    const category = normalizeCategory(post);
    counts[category] = (counts[category] || 0) + 1;
    totalCo2 += Number(post.co2_saved || post.co2Saved || 0) || 0;
    if (post.accepted !== false && post.rejected !== true) verified += 1;
  });

  const categories = ['transport', 'waste', 'energy', 'food', 'nature', 'community'];
  const ranked = categories.map(category => ({ category, count: counts[category] || 0 }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
  const strongest = ranked[0] || { category: 'learning', count: 0 };
  const weakest = [...ranked].sort((a, b) => a.count - b.count || a.category.localeCompare(b.category))[0] || { category: 'learning', count: 0 };
  const actionGap = posts.length ? weakest.category : 'transport';
  const recommendation = ACTION_MAP[actionGap] || ACTION_MAP.learning;

  return {
    boardName: leaderboard?.name || 'your school',
    totalCo2,
    verified,
    strongest,
    weakest,
    actionGap,
    recommendation,
    hasLocalData: posts.length > 0,
  };
}

function Banner() {
  return (
    <div style={{ padding: '8px 16px 0' }}>
      <div className="card" style={{ padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center', border: '1px solid rgba(46,125,79,.18)' }}>
        <Icon name="sparkle" size={16} color="var(--green)" />
        <span className="eyebrow" style={{ color: 'var(--green)', flex: 1 }}>AI-verified · capped points</span>
        <HelpTip text="AI drafts answers from trusted sources. EcoRise validates every citation and caps learning points so real-world action stays #1." />
      </div>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div className="card" style={{ padding: 12, minWidth: 0 }}>
      <div className="eyebrow" style={{ color: 'var(--text-dim)', fontSize: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 'clamp(16px, 5.2vw, 24px)', fontWeight: 700, color: 'var(--green-d)', lineHeight: 1.05, marginTop: 4, overflowWrap: 'anywhere' }}>{value}</div>
      <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 4, lineHeight: 1.25 }}>{sub}</div>
    </div>
  );
}

function CoachCommandCenter({ footprint, openLog }) {
  return (
    <div style={{ padding: '8px 16px 0' }}>
      <div className="card" style={{
        padding: 16,
        border: '1px solid rgba(46,125,79,.18)',
        background: 'linear-gradient(145deg, rgba(255,255,255,.96), rgba(238,248,238,.92))',
        boxShadow: '0 18px 42px rgba(30,91,57,.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(160deg,var(--green-2),var(--green))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 20px rgba(46,125,79,.22)',
            flexShrink: 0,
          }}>
            <Icon name="sparkle" size={22} color="#fff" strokeWidth={2.5} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, lineHeight: 1.05 }}>
              Footprint Coach
            </div>
            <div className="dim" style={{ fontSize: 12, fontWeight: 700 }}>{footprint.boardName}</div>
          </div>
          <HelpTip text="The coach connects your board's action logs with approved research, then recommends what to try next. Input → AI reasoning → Insight → Action (with capped points)." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 14 }}>
          <Metric label="Verified" value={footprint.verified} sub="actions" />
          <Metric label="Impact" value={`${footprint.totalCo2.toFixed(1)}kg`} sub="CO₂e saved" />
          <Metric label="Leading" value={footprint.strongest.category} sub="category" />
        </div>

        <div style={{ marginTop: 14, padding: 13, borderRadius: 16, background: 'rgba(46,125,79,.08)', border: '1px solid rgba(46,125,79,.13)' }}>
          <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 5 }}>Insight</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 650, lineHeight: 1.22 }}>
            {footprint.hasLocalData
              ? `Strongest: ${footprint.strongest.category} · gap: ${footprint.weakest.category}`
              : 'No local data yet — start with a transport audit.'}
          </div>
          <div className="muted" style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.38, marginTop: 6 }}>
            {footprint.recommendation}
          </div>
          <button className="btn btn-primary btn-block btn-sm" style={{ marginTop: 12 }} onClick={openLog}>
            <Icon name="camera" size={16} /> Log action
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Coach({ ctx, isCombined }) {
  const { leaderboardId, leaderboard, posts, go, openLog, showToast } = ctx;
  const [enabled, setEnabled] = useState(null); // null = loading
  const [q, setQ] = useState(null);
  const [result, setResult] = useState(null);
  const [noCorpus, setNoCorpus] = useState(false);
  const [guidance, setGuidance] = useState(null);
  const [guidanceError, setGuidanceError] = useState(false);
  const [tip, setTip] = useState(null);
  const shownAt = useRef(0);

  const loadQuestion = useCallback(async () => {
    setResult(null);
    try {
      const r = await api.coachQuestion();
      setQ(r.question); setNoCorpus(false); shownAt.current = nowMs();
    } catch (e) {
      if (e.status === 503) { setNoCorpus(true); setQ(null); }
      else showToast?.(e.message || 'Could not load a question');
    }
  }, [showToast]);

  useEffect(() => {
    let alive = true;
    api.coachStatus()
      .then(() => {
        if (!alive) return;
        setEnabled(true);
        loadQuestion();
        api.coachGuidance().then(r => alive && setGuidance(r.guidance)).catch((e) => { if (alive && (e?.status === 502 || e?.status === 503)) setGuidanceError(true); });
        api.coachTip().then(r => alive && setTip(r.tip)).catch(() => { /* optional coach card */ });
      })
      .catch(() => { if (alive) setEnabled(false); });
    return () => { alive = false; };
  }, [loadQuestion]);

  const answer = async (choice) => {
    if (result) return;
    try {
      const ms = nowMs() - shownAt.current;
      const r = await api.coachAnswer(q.id, { answer: choice, msToAnswer: ms, leaderboardId: leaderboardId || undefined });
      setResult({ ...r, chosen: choice });
    } catch (e) {
      if (e.status === 409) showToast?.('You already answered this one');
      else showToast?.(e.message || 'Could not submit answer');
    }
  };

  const footprint = footprintFrom(posts, leaderboard);

  const content = (
    <>

      <div style={{ padding: '8px 16px 0' }}><ClimateFact /></div>

      <SchoolFootprint leaderboardId={leaderboardId} showToast={showToast} />

      <CoachCommandCenter footprint={footprint} openLog={openLog} />

      {enabled === null && <div className="dim" style={{ padding: 24, textAlign: 'center', fontWeight: 700 }}>Loading the coach…</div>}

      {enabled === false && (
        <div style={{ padding: '16px 16px 0' }}>
          <div className="card" style={{ padding: 18, textAlign: 'center' }}>
            <Icon name="sparkle" size={26} color="var(--green)" />
            <div className="h2" style={{ marginTop: 8 }}>Coach is warming up</div>
            <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 6 }}>
              The AI Eco Coach isn’t enabled in this environment yet. A teacher-approved source corpus powers it once turned on.
            </div>
          </div>
        </div>
      )}

      {enabled && (
        <>
          <Banner />

          {/* question / result */}
          <div style={{ padding: '14px 16px 0' }}>
            <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 6 }}>Question</div>
            {noCorpus ? (
              <div className="card" style={{ padding: 16 }}>
                <div className="muted" style={{ fontSize: 13.5, fontWeight: 600 }}>No approved learning sources yet — ask a teacher/admin to add and approve sources.</div>
              </div>
            ) : !q ? (
              <div className="dim" style={{ padding: 18, textAlign: 'center', fontWeight: 700 }}>Loading a question…</div>
            ) : (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="chip chip-purple" style={{ fontSize: 11 }}>{q.topic}</span>
                  <span className="chip chip-dim" style={{ fontSize: 11 }}>difficulty {q.difficulty}/5</span>
                  {q.isMock && <span className="chip chip-dim" style={{ fontSize: 11 }}>demo</span>}
                </div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16.5, lineHeight: 1.25 }}>{q.prompt}</div>

                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  {(q.choices || []).map((c, i) => {
                    const chosen = result && result.chosen === c;
                    const isAnswer = result && result.correctAnswer === c;
                    const color = result ? (isAnswer ? 'var(--green)' : chosen ? 'var(--coral)' : 'var(--text-dim)') : 'var(--text)';
                    const border = result && (isAnswer || chosen) ? `1.5px solid ${color}` : '1px solid rgba(45,91,57,.10)';
                    return (
                      <button key={i} disabled={!!result} onClick={() => answer(c)}
                        style={{ textAlign: 'left', cursor: result ? 'default' : 'pointer', borderRadius: 13, padding: '12px 14px', border,
                          background: result && (isAnswer || chosen) ? 'rgba(46,125,79,.07)' : 'var(--navy-800)',
                          color, fontSize: 14, fontWeight: 600, display: 'flex', gap: 10, alignItems: 'center' }}>
                        {result && (isAnswer || chosen) && <Icon name={isAnswer ? 'check' : 'x'} size={15} color={color} strokeWidth={3} />}
                        <span style={{ flex: 1 }}>{c}</span>
                      </button>
                    );
                  })}
                </div>

                {!result && <Sources sources={q.sources} />}

                {result && (
                  <div style={{ marginTop: 14 }} role="status" aria-live="polite">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: result.correct ? 'var(--green)' : 'var(--coral)' }}>
                        {result.correct ? 'Correct' : 'Not quite'}
                      </span>
                      {result.points > 0
                        ? <span className="chip chip-green" style={{ fontSize: 11 }}>+{result.points} learning pts (capped)</span>
                        : <span className="chip chip-dim" style={{ fontSize: 11 }}>{capLabel(result)}</span>}
                    </div>
                    <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}>{result.explanation}</div>
                    <Sources sources={result.sources} />
                    {result.cap && (result.cap.dailyCap != null) && (
                      <div className="dim" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 8 }}>
                        Daily learning cap: {result.cap.dailyUsed ?? 0}/{result.cap.dailyCap} points used
                      </div>
                    )}
                    <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={loadQuestion}>Next question</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* guidance */}
          {guidance && (
            <div style={{ padding: '16px 16px 0' }}>
              <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 6 }}>Next action</div>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15.5 }}>{guidance.recommendation}</div>
                <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>{guidance.explanation}</div>
                <Sources sources={guidance.sources} />
                <button className="btn btn-secondary btn-block btn-sm" style={{ marginTop: 12 }} onClick={openLog}>
                  <Icon name="camera" size={16} /> {guidance.action || 'Log a verified action'}
                </button>
              </div>
            </div>
          )}

          {/* refusal card */}
          {!guidance && guidanceError && (
            <div style={{ padding: '16px 16px 0' }}>
              <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(182,111,77,.22)' }}>
                <div className="eyebrow" style={{ color: 'var(--coral-d)', flex: 1 }}>Guidance withheld</div>
                <HelpTip text="The coach declined to generate a recommendation it couldn't ground in approved sources, or the model was unreachable. It refuses rather than guess." />
              </div>
            </div>
          )}

          {/* daily tip */}
          {tip && (
            <div style={{ padding: '16px 16px 0' }}>
              <div className="card" style={{ padding: 14 }}>
                <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}>{tip.body}</div>
                <Sources sources={tip.sources} />
              </div>
            </div>
          )}

        </>
      )}

      <div style={{ height: 110 }} />
    </>
  );

  if (isCombined) return content;

  return (
    <div className="screen-in">
      {/* header */}
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(46,125,79,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkle" size={22} color="var(--green)" />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 19, lineHeight: 1 }}>Coach</div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} aria-label="Back" onClick={() => go('home')}>
          <Icon name="home" size={18} />
        </button>
      </div>
      {content}
    </div>
  );
}

function capLabel(result) {
  const r = result.cap && result.cap.reason;
  if (result.cap && result.cap.flagged) return 'flagged: answered too fast';
  if (r === 'cap_reached') return 'daily cap reached';
  if (!result.correct) return 'no points';
  if (result.cap && !result.cap.awardedToBoard) return 'join a board to earn';
  return 'no points';
}
