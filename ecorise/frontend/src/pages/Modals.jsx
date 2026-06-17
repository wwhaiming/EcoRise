/* EcoRise — Log Action + Trash Spotter modal sheets */
import React, { useState, useRef } from 'react';
import Icon from '../components/Icon';
import { PointsChip } from '../components/UI';
import { Sheet, UploadFrame } from '../components/Shared';
import api from '../utils/api';

/* ---------- LOG ECO ACTION ---------- */
export function LogAction({ ctx }) {
  const [phase, setPhase] = useState('capture');
  const [aiResult, setAiResult] = useState(null);
  const [actionType, setActionType] = useState('transportation');
  const [actionDesc, setActionDesc] = useState('');
  const [miles, setMiles] = useState(6);
  const [caption, setCaption] = useState('');
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  
  const fileRef = useRef(null);
  const chatEndRef = useRef(null);

  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setImageData(base64);
      setPhase('analyzing');

      try {
        const data = await api.chatPost({ image: base64, messages: [] });
        const res = data.chatResult;
        setAiResult(res);
        setChatMessages([
          { role: 'assistant', content: res.message }
        ]);
        setActionType(res.actionType !== 'none' ? res.actionType : 'transportation');
        setActionDesc(res.specificAction || '');
        if (res.miles) {
          setMiles(res.miles);
        }
        setPhase('result');
      } catch (err) {
        ctx.showToast(err.message || 'Could not analyze the photo.');
        ctx.closeModal();
      }
    };
    reader.readAsDataURL(file);
  };

  const mockCapture = () => {
    setPhase('analyzing');
    setTimeout(() => {
      const initialMessage = "Hey! I see your photo. It looks like you're doing something green! What eco-friendly action are you taking here? (e.g., did you bike/walk/transit somewhere, or reuse a bottle?)";
      setAiResult({
        message: initialMessage,
        isComplete: false,
        actionType: 'none',
        specificAction: '',
        estimatedCO2Saved: 0,
        points: 0
      });
      setChatMessages([
        { role: 'assistant', content: initialMessage }
      ]);
      setPhase('result');
    }, 1300);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    const updatedMessages = [...chatMessages, { role: 'user', content: userText }];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const data = await api.chatPost({ image: imageData, messages: updatedMessages });
      const res = data.chatResult;
      setAiResult(res);
      setChatMessages([...updatedMessages, { role: 'assistant', content: res.message }]);
      
      if (res.actionType && res.actionType !== 'none') {
        setActionType(res.actionType);
      }
      if (res.specificAction) {
        setActionDesc(res.specificAction);
      }
      if (res.miles) {
        setMiles(res.miles);
      }
    } catch (err) {
      ctx.showToast(err.message || 'Error communicating with AI.');
    }
    setChatLoading(false);
  };

  const confirm = async () => {
    if (!actionDesc || actionDesc.trim().length < 3) {
      ctx.showToast('Please provide a specific description of your action.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.createPost({
        image: imageData,
        leaderboardId: ctx.leaderboardId,
        miles: actionType === 'transportation' ? miles : undefined,
        caption,
        actionType,
        actionDesc,
      });
      if (data && (data.accepted === false || data.success === false)) {
        setAiResult(prev => ({
          ...(prev || {}),
          isComplete: false,
          isEcoAction: false,
          environmentalImpactSummary: data.description || 'This photo does not look like an eco action.',
        }));
        ctx.showToast(data.description || 'This photo does not look like an eco action. Please clarify.');
      } else {
        ctx.onActionComplete(data);
      }
    } catch (err) {
      ctx.showToast(err?.status === 409 ? 'You already logged this photo recently.' : (err.message || 'Could not post.'));
      ctx.closeModal();
    }
    setLoading(false);
  };

  const isTransport = ['transportation', 'transport'].includes(actionType.toLowerCase());
  const co2 = isTransport ? +(miles * 0.4).toFixed(1) : (aiResult?.estimatedCO2Saved || 0.5);
  const pts = showManual
    ? (isTransport ? Math.min(40, Math.max(15, Math.round(15 + miles * 0.8 + co2 * 2))) : Math.round((co2 || 0.6) * 25))
    : (aiResult?.points || 15);

  return (
    <Sheet title="Log an eco action" onClose={ctx.closeModal}>
      <div style={{ padding: '4px 20px 24px', display: 'grid', gap: 16 }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <UploadFrame phase={phase} label="Tap to snap or upload a photo" image={imageData} onCapture={() => fileRef.current ? fileRef.current.click() : mockCapture()} />

        {phase === 'capture' && (
          <div className="muted" style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600 }}>
            Chat with our AI assistant to verify your eco action and claim your points.
          </div>
        )}

        {phase === 'result' && aiResult && (
          <>
            {/* Conversations Container */}
            {!showManual && (
              <div className="card pop-in" style={{
                padding: '16px 14px',
                borderRadius: 'var(--r-md)',
                background: 'var(--navy-900)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'grid',
                gap: 12
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  paddingBottom: 8
                }}>
                  <Icon name="sparkle" size={16} color="var(--green)" />
                  <span className="eyebrow" style={{ color: 'var(--green)' }}>EcoRise AI Assistant</span>
                  {aiResult.isComplete && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: 'rgba(0, 230, 118, 0.2)',
                      color: 'var(--green)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      marginLeft: 'auto',
                      textTransform: 'uppercase'
                    }}>
                      Completed
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxHeight: 220,
                  overflowY: 'auto',
                  padding: '4px 4px 12px',
                }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      gap: 8,
                      animation: 'fadeIn 0.2s both'
                    }}>
                      {msg.role !== 'user' && (
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: 'rgba(0, 230, 118, 0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon name="sparkle" size={12} color="var(--green)" />
                        </div>
                      )}
                      <div style={{
                        maxWidth: '82%',
                        padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: msg.role === 'user' ? 'var(--green)' : 'var(--navy-800)',
                        color: msg.role === 'user' ? '#06281A' : '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'rgba(0, 230, 118, 0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon name="sparkle" size={12} color="var(--green)" />
                      </div>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '16px 16px 16px 4px',
                        background: 'var(--navy-800)',
                        color: 'var(--text-dim)',
                        fontSize: 13,
                        fontStyle: 'italic',
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}>
                        Typing...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {!aiResult.isComplete && (
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input
                      className="field"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 14 }}
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={chatLoading || !chatInput.trim()}
                      style={{ borderRadius: 12, padding: '0 18px', height: 42 }}
                    >
                      Send
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Manual Form Bypasser */}
            {showManual && (
              <div className="card card-glow pop-in" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon name="sparkle" size={18} color="var(--green)" />
                  <span className="eyebrow" style={{ color: 'var(--green)' }}>Review Action details</span>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Action Category</label>
                    <select
                      className="field"
                      value={actionType}
                      onChange={e => {
                        const val = e.target.value;
                        setActionType(val);
                        if (val === 'transportation') setActionDesc('Walking');
                        else if (val === 'waste') setActionDesc('Reusable bottle');
                        else if (val === 'food') setActionDesc('Plant-based meal');
                        else if (val === 'energy') setActionDesc('Turning off lights');
                        else if (val === 'nature') setActionDesc('Picking up litter');
                      }}
                      style={{ width: '100%' }}
                    >
                      <option value="transportation">Transportation (Biking, Walking, Transit)</option>
                      <option value="waste">Waste (Recycling, Composting, Refills)</option>
                      <option value="energy">Energy (Saving energy, LED, Drying)</option>
                      <option value="food">Food (Vegan/Vegetarian, Composting scraps)</option>
                      <option value="nature">Nature (Planting, Litter Cleanup)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Specific Action description</label>
                    <input
                      className="field"
                      type="text"
                      placeholder="e.g. Biking to school"
                      value={actionDesc}
                      onChange={e => setActionDesc(e.target.value)}
                      style={{ width: '100%' }}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {showManual && isTransport && (
              <div className="card pop-in" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 16 }}>How far did you travel?</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, color: 'var(--green)' }}>{miles} mi</span>
                </div>
                <input type="range" min="1" max="20" value={miles} onChange={e => setMiles(+e.target.value)}
                  style={{ width: '100%', accentColor: '#00E676' }} />
                <div className="dim" style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Drag to match your trip distance</div>
              </div>
            )}

            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Caption (optional)</label>
              <input className="field" placeholder="Tell us about it..." value={caption} onChange={e => setCaption(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px' }}>
              <span className="muted" style={{ fontWeight: 700 }}>Estimated reward</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 26, color: 'var(--green)' }}>+{pts} pts</span>
            </div>

            <button className="btn btn-primary btn-block btn-lg" onClick={confirm} disabled={loading || (!aiResult?.isComplete && !showManual)} style={{ width: '100%' }}>
              {loading ? 'Posting...' : 'Post & earn points'}
            </button>

            <div style={{ textAlign: 'center', marginTop: -4 }}>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => setShowManual(!showManual)}
                style={{ color: 'var(--text-dim)', fontSize: 12, padding: 4 }}
              >
                {showManual ? "← Switch back to AI Chat" : "🔧 Bypass with Manual Form"}
              </button>
            </div>
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
      setPhase('result'); // severity is scored server-side on submit; no fabricated preview
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
      // Server runs the trash detector; it may reject (accepted:false) -> no points.
      const data = await api.reportTrash({ image: imageData, location: loc, leaderboardId: ctx.leaderboardId });
      ctx.onActionComplete({ ...data, aiResult: { specificAction: 'Trash report', actionType: 'Cleanup' } });
    } catch (err) {
      ctx.showToast(err?.status === 409 ? 'You already reported this photo recently.' : (err.message || 'Could not report.'));
      ctx.closeModal();
    }
    setLoading(false);
  };

  return (
    <Sheet title="Trash Spotter" onClose={ctx.closeModal} accent="var(--coral)">
      <div style={{ padding: '4px 20px 24px', display: 'grid', gap: 16 }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <UploadFrame phase={phase} label="Photograph the litter or hotspot" accent="var(--coral)" image={imageData} onCapture={() => fileRef.current ? fileRef.current.click() : mockCapture()} />

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
                <span className="eyebrow" style={{ color: 'var(--coral)' }}>AI rates severity on submit</span>
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
  );
}
