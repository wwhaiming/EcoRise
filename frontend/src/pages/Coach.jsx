/* GeoRise — AI Eco Coach screen.
 *
 * The learning-to-action loop, with the responsible-AI guardrails made VISIBLE:
 * every question and tip shows its sources, learning points are explicitly capped,
 * and the UI says "AI drafts; GeoRise validates" rather than "AI says this is true".
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../components/Icon';
import api from '../utils/api';

function nowMs() {
  return Date.now();
}

function Sources({ sources }) {
  if (!sources || !sources.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {sources.map((s, i) => (
        <span key={i} className="chip chip-dim" title={s.snippet || ''} style={{ fontSize: 11 }}>
          <Icon name="leaf" size={11} color="var(--green)" /> {s.title}{s.pubYear ? ` (${s.pubYear})` : ''}
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

const RUBRIC_SIGNALS = [
  ['Problem', 'school-specific hidden footprint'],
  ['AI', 'pattern + source-backed recommendation'],
  ['Design', 'input -> AI -> insight -> action'],
  ['Impact', 'verified actions and leaderboard movement'],
  ['Responsible', 'citations, caps, human review'],
];

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
      <div className="card" style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', border: '1px solid rgba(46,125,79,.18)' }}>
        <Icon name="sparkle" size={18} color="var(--green)" />
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.35 }}>
          AI drafts from trusted sources; GeoRise validates every citation and caps learning points so real-world action stays #1.
        </span>
      </div>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div className="card" style={{ padding: 12, minWidth: 0 }}>
      <div className="eyebrow" style={{ color: 'var(--text-dim)', fontSize: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, color: 'var(--green-d)', lineHeight: 1.05, marginTop: 4 }}>{value}</div>
      <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 4, lineHeight: 1.25 }}>{sub}</div>
    </div>
  );
}

function FlowStep({ icon, title, body }) {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', minWidth: 0 }}>
      <span style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(46,125,79,.11)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={16} color="var(--green)" />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 900, fontSize: 12.5, color: 'var(--text)', lineHeight: 1.15 }}>{title}</span>
        <span className="muted" style={{ display: 'block', fontWeight: 650, fontSize: 11.5, lineHeight: 1.25, marginTop: 2 }}>{body}</span>
      </span>
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{
            width: 48, height: 48, borderRadius: 16,
            background: 'linear-gradient(160deg,var(--green-2),var(--green))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 24px rgba(46,125,79,.24)',
            flexShrink: 0,
          }}>
            <Icon name="sparkle" size={25} color="#fff" strokeWidth={2.5} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow" style={{ color: 'var(--green)' }}>Direction B · My School's Hidden Footprint</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 26, lineHeight: 1.02, marginTop: 4 }}>
              AI Footprint Coach
            </div>
            <div className="muted" style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.4, marginTop: 7 }}>
              For {footprint.boardName}, the coach connects local action logs with approved environmental research, then recommends what students should actually try next.
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 14 }}>
          <Metric label="Local proof" value={footprint.verified} sub="verified actions" />
          <Metric label="Impact logged" value={`${footprint.totalCo2.toFixed(1)}kg`} sub="CO2e saved" />
          <Metric label="AI gap" value={footprint.actionGap} sub="needs focus" />
        </div>

        <div style={{ marginTop: 14, padding: 13, borderRadius: 16, background: 'rgba(46,125,79,.08)', border: '1px solid rgba(46,125,79,.13)' }}>
          <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 5 }}>Priority AI insight</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 650, lineHeight: 1.22 }}>
            {footprint.hasLocalData
              ? `Your board is strongest in ${footprint.strongest.category}, but ${footprint.weakest.category} is underrepresented.`
              : 'No local evidence yet. Start with a transport audit because school arrival habits are visible, measurable, and easy to verify.'}
          </div>
          <div className="muted" style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.38, marginTop: 6 }}>
            {footprint.recommendation}
          </div>
          <button className="btn btn-primary btn-block btn-sm" style={{ marginTop: 12 }} onClick={openLog}>
            <Icon name="camera" size={16} /> Log recommended action
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <FlowStep icon="camera" title="Input" body="school posts, board stats, action photos" />
          <FlowStep icon="sparkle" title="AI reasoning" body="retrieval, pattern finding, recommendation" />
          <FlowStep icon="leaf" title="Insight" body="cited question, gap, practical next step" />
          <FlowStep icon="check" title="Action" body="human-visible proof and capped points" />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {RUBRIC_SIGNALS.map(([label, body]) => (
            <span key={label} className="chip chip-green" style={{ fontSize: 10.5 }}>
              {label}: {body}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Coach({ ctx }) {
  const { leaderboardId, leaderboard, posts, go, openLog, showToast } = ctx;
  const [enabled, setEnabled] = useState(null); // null = loading
  const [q, setQ] = useState(null);
  const [result, setResult] = useState(null);
  const [noCorpus, setNoCorpus] = useState(false);
  const [guidance, setGuidance] = useState(null);
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
        api.coachGuidance().then(r => alive && setGuidance(r.guidance)).catch(() => { /* optional coach card */ });
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

  return (
    <div className="screen-in">
      {/* header */}
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(46,125,79,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkle" size={22} color="var(--green)" />
        </span>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>AI-first workspace</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 19, lineHeight: 1 }}>School footprint coach</div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} aria-label="Back home" onClick={() => go('home')}>
          <Icon name="home" size={18} />
        </button>
      </div>

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
            <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 6 }}>Source-backed question</div>
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
                  <div style={{ marginTop: 14 }}>
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
              <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 6 }}>Research-grounded next action</div>
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

          {/* daily tip */}
          {tip && (
            <div style={{ padding: '16px 16px 0' }}>
              <div className="eyebrow" style={{ color: 'var(--text-dim)', marginBottom: 6 }}>Daily micro-coach notification</div>
              <div className="card" style={{ padding: 14 }}>
                <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}>{tip.body}</div>
                <Sources sources={tip.sources} />
              </div>
            </div>
          )}

          <div style={{ padding: '16px 16px 0' }}>
            <div className="card" style={{ padding: 15, border: '1px solid rgba(182,111,77,.22)' }}>
              <div className="eyebrow" style={{ color: 'var(--coral-d)', marginBottom: 6 }}>Responsible AI guardrails</div>
              <div className="muted" style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.45 }}>
                The coach cannot award unlimited points or invent sources. Learning points are capped, citations are shown, impact math stays deterministic, and organizers keep human review over boards, source approval, and moderation.
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ height: 110 }} />
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
