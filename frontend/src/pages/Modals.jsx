/* GeoRise — Log Action + Trash Spotter modal sheets */
import { useState } from 'react';
import Icon from '../components/Icon';
import { Sheet, UploadFrame, PhotoSources } from '../components/Shared';
import api from '../utils/api';

/* ---------- LOG ECO ACTION ---------- */
export function LogAction({ ctx }) {
  const [phase, setPhase] = useState('capture');
  const [aiResult, setAiResult] = useState(null);
  const [miles, setMiles] = useState(6);
  const [caption, setCaption] = useState('');
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(false);

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setImageData(base64);
      setPhase('analyzing');
      // Single server call analyzes + scores + (unless follow-up needed) creates the post.
      try {
        const data = await api.createPost({ image: base64, leaderboardId: ctx.leaderboardId });
        if (data.needsFollowUp) {
          setAiResult(data.aiResult);   // ask for miles; confirm() creates it
          setPhase('result');
        } else {
          // Accepted OR rejected → the AI Evidence Panel explains the verdict.
          ctx.onActionComplete(data, base64);
        }
      } catch (err) {
        ctx.showToast(err?.status === 409 ? 'You already logged this photo recently.' : (err.message || 'Could not analyze the photo.'));
        ctx.closeModal();
      }
    };
    reader.readAsDataURL(file);
  };

  const confirm = async () => {
    setLoading(true);
    try {
      // Points are computed server-side from the image; we only supply miles.
      const data = await api.createPost({
        image: imageData,
        leaderboardId: ctx.leaderboardId,
        miles: aiResult?.requiresFollowUp ? miles : undefined,
        caption,
      });
      ctx.onActionComplete(data, imageData);
    } catch (err) {
      ctx.showToast(err?.status === 409 ? 'You already logged this photo recently.' : (err.message || 'Could not post.'));
      ctx.closeModal();
    }
    setLoading(false);
  };

  const co2 = aiResult ? (aiResult.requiresFollowUp ? +(miles * 0.4).toFixed(1) : aiResult.estimatedCO2Saved || 0) : 0;
  const pts = aiResult ? (aiResult.requiresFollowUp ? Math.max(10, Math.round(co2 * 25)) : Math.round((aiResult.estimatedCO2Saved || 1) * 25)) : 0;

  return (
    <>
      <Sheet title="Log an eco action" onClose={ctx.closeModal}>
        <div style={{ padding: '4px 20px 24px', display: 'grid', gap: 16 }}>
          <UploadFrame phase={phase} label="Add a photo to log your action" onCapture={() => setPicker(true)} />

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
                    style={{ width: '100%', accentColor: 'var(--green)' }} />
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
      <PhotoSources open={picker} onClose={() => setPicker(false)} onFile={processFile} />
    </>
  );
}

/* ---------- TRASH SPOTTER ---------- */
export function TrashSpotter({ ctx }) {
  const [phase, setPhase] = useState('capture');
  const [loc, setLoc] = useState('');
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(false);

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result);
      setPhase('result'); // severity is scored server-side on submit; no fabricated preview
    };
    reader.readAsDataURL(file);
  };

  const confirm = async () => {
    setLoading(true);
    try {
      // Server runs the trash detector; it may reject (accepted:false) -> no points.
      // The AI Evidence Panel renders the real severity/confidence it returns.
      const data = await api.reportTrash({ image: imageData, location: loc, leaderboardId: ctx.leaderboardId });
      ctx.onActionComplete(data, imageData);
    } catch (err) {
      ctx.showToast(err?.status === 409 ? 'You already reported this photo recently.' : (err.message || 'Could not report.'));
      ctx.closeModal();
    }
    setLoading(false);
  };

  return (
    <>
      <Sheet title="Trash Spotter" onClose={ctx.closeModal} accent="var(--coral)">
        <div style={{ padding: '4px 20px 24px', display: 'grid', gap: 16 }}>
          <UploadFrame phase={phase} label="Photograph the litter or hotspot" accent="var(--coral)" onCapture={() => setPicker(true)} />

          {phase === 'capture' && (
            <div className="muted" style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600 }}>
              Spot litter in your area? Snap it. Our AI rates severity and turns cleanup into points.
            </div>
          )}

          {phase === 'result' && (
            <>
              <div className="card pop-in" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="sparkle" size={18} color="var(--coral)" />
                  <span className="eyebrow" style={{ color: 'var(--coral-d)' }}>AI rates severity on submit</span>
                </div>
                <div className="muted" style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>
                  Add a location, then submit. The detector verifies it's real litter and scores severity 0–10 server-side. Points are awarded only if it's confirmed.
                </div>
              </div>

              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}><Icon name="pin" size={13} color="var(--coral)" style={{ verticalAlign: -2 }} /> Location tag</label>
                <input className="field" placeholder="e.g. Riverside Park, north entrance" value={loc} onChange={e => setLoc(e.target.value)} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="muted" style={{ fontWeight: 700 }}>Reward</span>
                <span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>35–85 pts · AI-scored</span>
              </div>
              <button className="btn btn-danger btn-block btn-lg" onClick={confirm} disabled={loading}>
                <Icon name="pin" size={18} color="#fff" /> {loading ? 'Reporting...' : 'Submit report'}
              </button>
            </>
          )}
        </div>
      </Sheet>
      <PhotoSources open={picker} onClose={() => setPicker(false)} onFile={processFile} accent="var(--coral)" />
    </>
  );
}
