/* EcoRise — Log Action + Trash Spotter modal sheets */
import React, { useState, useRef } from 'react';
import Icon from '../components/Icon';
import { PointsChip } from '../components/UI';
import { Sheet, UploadFrame } from '../components/Shared';

/* ---------- LOG ECO ACTION ---------- */
export function LogAction({ ctx }) {
  const [phase, setPhase] = useState('capture');
  const [aiResult, setAiResult] = useState(null);
  const [miles, setMiles] = useState(6);
  const [caption, setCaption] = useState('');
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setImageData(base64);
      setPhase('analyzing');

      // Send to AI
      try {
        const res = await fetch('http://localhost:3001/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: base64, leaderboardId: ctx.leaderboardId }),
        });
        const data = await res.json();
        if (data.needsFollowUp || data.aiResult) {
          setAiResult(data.aiResult);
          setPhase('result');
        } else if (data.success) {
          // Directly completed
          ctx.onActionComplete(data);
        } else {
          // Fallback mock
          setAiResult({
            actionType: 'transportation',
            specificAction: 'Cycling commute',
            requiresFollowUp: true,
            followUpQuestion: 'How many miles did you bike?',
            estimatedCO2Saved: 2.4,
          });
          setPhase('result');
        }
      } catch {
        // Mock fallback
        setAiResult({
          actionType: 'transportation',
          specificAction: 'Cycling commute',
          requiresFollowUp: true,
          followUpQuestion: 'How many miles did you bike?',
          estimatedCO2Saved: 2.4,
        });
        setPhase('result');
      }
    };
    reader.readAsDataURL(file);
  };

  const mockCapture = () => {
    setPhase('analyzing');
    setTimeout(() => {
      setAiResult({
        actionType: 'transportation',
        specificAction: 'Cycling commute',
        requiresFollowUp: true,
        followUpQuestion: 'How many miles did you bike?',
        estimatedCO2Saved: 2.4,
      });
      setPhase('result');
    }, 1300);
  };

  const confirm = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          image: imageData,
          leaderboardId: ctx.leaderboardId,
          miles: aiResult?.requiresFollowUp ? miles : undefined,
          caption,
          actionType: aiResult?.actionType,
          actionDesc: aiResult?.specificAction,
          co2Saved: aiResult?.estimatedCO2Saved,
        }),
      });
      const data = await res.json();
      ctx.onActionComplete(data);
    } catch {
      // Offline mock
      ctx.onActionComplete({
        success: true, points: 60,
        aiResult: aiResult,
        explanation: 'Cycling commute: +60 pts',
      });
    }
    setLoading(false);
  };

  const co2 = aiResult ? (aiResult.requiresFollowUp ? +(miles * 0.4).toFixed(1) : aiResult.estimatedCO2Saved || 0) : 0;
  const pts = aiResult ? (aiResult.requiresFollowUp ? Math.max(10, Math.round(co2 * 25)) : Math.round((aiResult.estimatedCO2Saved || 1) * 25)) : 0;

  return (
    <Sheet title="Log an eco action" onClose={ctx.closeModal}>
      <div style={{ padding: '4px 20px 24px', display: 'grid', gap: 16 }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <UploadFrame phase={phase} label="Tap to snap or upload a photo" onCapture={() => fileRef.current ? fileRef.current.click() : mockCapture()} />

        {phase === 'capture' && (
          <div className="muted" style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600 }}>
            Our AI detects the action, estimates CO₂ saved, and awards points automatically.
          </div>
        )}

        {phase === 'result' && aiResult && (
          <>
            <div className="card card-glow pop-in" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon name="sparkle" size={18} color="var(--green)" />
                <span className="eyebrow" style={{ color: 'var(--green)' }}>AI detected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 22 }}>{aiResult.specificAction}</div>
                  <span className="chip chip-purple" style={{ marginTop: 6 }}>{aiResult.actionType}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, color: 'var(--green)' }}>{co2} kg</div>
                  <div className="dim" style={{ fontSize: 11, fontWeight: 800 }}>CO₂ SAVED</div>
                </div>
              </div>
            </div>

            {aiResult.requiresFollowUp && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16 }}>{aiResult.followUpQuestion || 'How many miles?'}</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, color: 'var(--green)' }}>{miles} mi</span>
                </div>
                <input type="range" min="1" max="20" value={miles} onChange={e => setMiles(+e.target.value)}
                  style={{ width: '100%', accentColor: '#00E676' }} />
                <div className="dim" style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Drag to match your trip distance</div>
              </div>
            )}

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Caption (optional)</label>
              <input className="field" placeholder="Tell us about it..." value={caption} onChange={e => setCaption(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px' }}>
              <span className="muted" style={{ fontWeight: 700 }}>You&rsquo;ll earn</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 26, color: 'var(--green)' }}>+{pts} pts</span>
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={confirm} disabled={loading}>
              {loading ? 'Posting...' : 'Post & earn points'}
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* ---------- TRASH SPOTTER ---------- */
export function TrashSpotter({ ctx }) {
  const [phase, setPhase] = useState('capture');
  const [loc, setLoc] = useState('');
  const [severity, setSeverity] = useState(7);
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const pts = 35 + severity * 5;
  const sevColor = severity >= 7 ? 'var(--coral)' : severity >= 4 ? 'var(--yellow)' : 'var(--green)';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result);
      setPhase('analyzing');
      setTimeout(() => {
        setSeverity(Math.floor(Math.random() * 5) + 4);
        setPhase('result');
      }, 1300);
    };
    reader.readAsDataURL(file);
  };

  const mockCapture = () => {
    setPhase('analyzing');
    setTimeout(() => { setSeverity(7); setPhase('result'); }, 1300);
  };

  const confirm = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: imageData, location: loc, leaderboardId: ctx.leaderboardId }),
      });
      const data = await res.json();
      ctx.onActionComplete({ success: true, points: data.points || pts, aiResult: { specificAction: 'Trash report', actionType: 'Cleanup' } });
    } catch {
      ctx.onActionComplete({ success: true, points: pts, aiResult: { specificAction: 'Trash report', actionType: 'Cleanup' } });
    }
    setLoading(false);
  };

  return (
    <Sheet title="Trash Spotter" onClose={ctx.closeModal} accent="var(--coral)">
      <div style={{ padding: '4px 20px 24px', display: 'grid', gap: 16 }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <UploadFrame phase={phase} label="Photograph the litter or hotspot" accent="var(--coral)" onCapture={() => fileRef.current ? fileRef.current.click() : mockCapture()} />

        {phase === 'capture' && (
          <div className="muted" style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600 }}>
            Spot litter in your area? Snap it. Our AI rates severity and turns cleanup into points.
          </div>
        )}

        {phase === 'result' && (
          <>
            <div className="card pop-in" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="eyebrow" style={{ color: sevColor }}>AI severity rating</span>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, color: sevColor }}>{severity}<span className="dim" style={{ fontSize: 14 }}>/10</span></span>
              </div>
              <div style={{ height: 14, borderRadius: 9999, background: 'rgba(255,255,255,.08)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#00E676,#FFD23F,#FF6B6B)', opacity: .25 }} />
                <div style={{ height: '100%', width: severity * 10 + '%', borderRadius: 9999, background: 'linear-gradient(90deg,#FFD23F,#FF6B6B)', boxShadow: `0 0 16px ${sevColor}`, transition: 'width .6s' }} />
              </div>
              <div className="muted" style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>
                {severity >= 7 ? 'High-priority hotspot — worth reporting to campus grounds.' : 'Moderate litter accumulation detected.'}
              </div>
            </div>

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}><Icon name="pin" size={13} color="var(--coral)" style={{ verticalAlign: -2 }} /> Location tag</label>
              <input className="field" placeholder="e.g. Riverside Park, north entrance" value={loc} onChange={e => setLoc(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="muted" style={{ fontWeight: 700 }}>Reward</span>
              <PointsChip pts={pts} variant="green" />
            </div>
            <button className="btn btn-danger btn-block btn-lg" onClick={confirm} disabled={loading}>
              <Icon name="pin" size={18} color="#fff" /> {loading ? 'Reporting...' : `Report & earn ${pts} pts`}
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
