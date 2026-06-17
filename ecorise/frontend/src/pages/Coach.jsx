/* EcoRise — AI Eco Coach screen.
 *
 * The learning-to-action loop, with the responsible-AI guardrails made VISIBLE:
 * every question and tip shows its sources, learning points are explicitly capped,
 * and the UI says "AI drafts; EcoRise validates" rather than "AI says this is true".
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../components/Icon';
import api from '../utils/api';

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

function Banner() {
  return (
    <div style={{ padding: '8px 16px 0' }}>
      <div className="card" style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', border: '1px solid rgba(0,230,118,.25)' }}>
        <Icon name="sparkle" size={18} color="var(--green)" />
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.35 }}>
          AI drafts from trusted sources; EcoRise validates every citation and caps learning points so real-world action stays #1.
        </span>
      </div>
    </div>
  );
}

export default function Coach({ ctx }) {
  const { leaderboardId, go, openLog, showToast } = ctx;
  const [enabled, setEnabled] = useState(null); // null = loading
  const [q, setQ] = useState(null);
  const [result, setResult] = useState(null);
  const [noCorpus, setNoCorpus] = useState(false);
  const [guidance, setGuidance] = useState(null);
  const [tip, setTip] = useState(null);
  const shownAt = useRef(Date.now());

  const loadQuestion = useCallback(async () => {
    setResult(null);
    try {
      const r = await api.coachQuestion();
      setQ(r.question); setNoCorpus(false); shownAt.current = Date.now();
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
        api.coachGuidance().then(r => alive && setGuidance(r.guidance)).catch(() => {});
        api.coachTip().then(r => alive && setTip(r.tip)).catch(() => {});
      })
      .catch(() => { if (alive) setEnabled(false); });
    return () => { alive = false; };
  }, [loadQuestion]);

  const answer = async (choice) => {
    if (result) return;
    try {
      const ms = Date.now() - shownAt.current;
      const r = await api.coachAnswer(q.id, { answer: choice, msToAnswer: ms, leaderboardId: leaderboardId || undefined });
      setResult({ ...r, chosen: choice });
    } catch (e) {
      if (e.status === 409) showToast?.('You already answered this one');
      else showToast?.(e.message || 'Could not submit answer');
    }
  };

  return (
    <div className="screen-in">
      {/* header */}
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(0,230,118,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkle" size={22} color="var(--green)" />
        </span>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>AI Eco Coach</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 19, lineHeight: 1 }}>Learn the science</div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} aria-label="Back home" onClick={() => go('home')}>
          <Icon name="home" size={18} />
        </button>
      </div>

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
                    const color = result ? (isAnswer ? 'var(--green)' : chosen ? 'var(--coral)' : 'var(--text-dim)') : '#fff';
                    const border = result && (isAnswer || chosen) ? `1.5px solid ${color}` : '1px solid rgba(255,255,255,.08)';
                    return (
                      <button key={i} disabled={!!result} onClick={() => answer(c)}
                        style={{ textAlign: 'left', cursor: result ? 'default' : 'pointer', borderRadius: 13, padding: '12px 14px', border,
                          background: 'var(--navy-700)', color, fontSize: 14, fontWeight: 600, display: 'flex', gap: 10, alignItems: 'center' }}>
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
              <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 6 }}>Try this today</div>
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
              <div className="eyebrow" style={{ color: 'var(--text-dim)', marginBottom: 6 }}>Daily eco tip</div>
              <div className="card" style={{ padding: 14 }}>
                <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}>{tip.body}</div>
                <Sources sources={tip.sources} />
              </div>
            </div>
          )}
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
