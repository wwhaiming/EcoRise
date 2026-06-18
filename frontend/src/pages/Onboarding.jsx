/* EcoRise — Onboarding (Hero → Carousel → Auth) */
import { useState } from 'react';
import Icon from '../components/Icon';
import { LogoMark, Wordmark, Orbs } from '../components/Shared';
import api from '../utils/api';

const ONB_STEPS = [
  { key: 'coach', icon: 'sparkle', color: '#2E7D4F',
    title: 'Ask the AI footprint coach', sub: 'The coach studies your school board, finds hidden impact patterns, and turns them into a practical action plan.' },
  { key: 'learn', icon: 'leaf', color: '#5D8F86',
    title: 'Learn from cited sources', sub: 'Questions, tips, and explanations come from approved environmental research instead of unsupported AI guesses.' },
  { key: 'prove', icon: 'camera', color: '#C6A35A',
    title: 'Turn insight into proof', sub: 'Log a photo when you act. AI checks the evidence, deterministic code scores it, and the leaderboard updates.' },
];

export default function Onboarding({ onAuth }) {
  const [stage, setStage] = useState('hero');
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const next = () => {
    if (step < ONB_STEPS.length - 1) setStep(step + 1);
    else setStage('auth');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = mode === 'signup' ? { email, password, name } : { email, password };
      const data = mode === 'signup' ? await api.signup(body) : await api.login(body);
      localStorage.setItem('ecorise_onboarded', '1'); // UI hint only (not auth)
      onAuth(data.user);
    } catch (err) {
      // Surface server validation details when present.
      const detail = err.data?.details?.[0]?.message;
      setError(detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ----- HERO ----- */
  if (stage === 'hero') {
    return (
      <div className="screen-in" style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 26px 62px' }}>
        <Orbs />
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 22, width: '100%' }}>
          <div className="floaty" style={{ filter: 'drop-shadow(0 16px 30px rgba(30,91,57,.16))' }}>
            <LogoMark size={104} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 46, letterSpacing: 0, lineHeight: 1 }}>
              Eco<span style={{ color: 'var(--green)' }}>Rise</span>
            </div>
            <div className="h-hero" style={{ marginTop: 18, fontSize: 26, lineHeight: 1.15, maxWidth: 300 }}>
              AI school audit.<br />Local insight.<br /><span style={{ color: 'var(--green)' }}>Verified action.</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 16 }}>
          <button className="btn btn-primary btn-block btn-lg pulse-green" onClick={() => setStage('carousel')}>Start AI audit</button>
        </div>
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--green)', fontWeight: 700, fontSize: 14 }} onClick={() => { setMode('login'); setStage('auth'); }}>I already have an account</button>
        </div>
      </div>
    );
  }

  /* ----- CAROUSEL ----- */
  if (stage === 'carousel') {
    const s = ONB_STEPS[step];
    return (
      <div className="screen-in" style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', padding: '52px 26px 32px' }}>
        <Orbs />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Wordmark size={20} />
          <button className="btn btn-ghost btn-sm" onClick={() => setStage('auth')}>Skip</button>
        </div>
        <div key={s.key} className="screen-in" style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 30 }}>
          <div className="pop-in" style={{
            width: 168, height: 168, borderRadius: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(120px 120px at 50% 30%, ${s.color}22, transparent), linear-gradient(180deg,var(--navy-800),var(--navy-700))`,
            boxShadow: `0 20px 44px rgba(30,91,57,.16)`, border: `1.5px solid ${s.color}33`,
          }}>
            <div style={{ filter: `drop-shadow(0 8px 16px ${s.color}66)` }}>
              <Icon name={s.icon} size={78} color={s.color} strokeWidth={1.8} />
            </div>
          </div>
          <div style={{ maxWidth: 320 }}>
            <div className="eyebrow" style={{ color: s.color, marginBottom: 8 }}>Step {step + 1} of 3</div>
            <div className="h1" style={{ fontSize: 30, lineHeight: 1.08 }}>{s.title}</div>
            <p className="muted" style={{ fontSize: 16, lineHeight: 1.5, marginTop: 12, fontWeight: 600 }}>{s.sub}</p>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {ONB_STEPS.map((_, i) => (
              <div key={i} style={{
                height: 8, borderRadius: 9999, transition: 'all .3s',
                width: i === step ? 30 : 8, background: i === step ? s.color : 'rgba(255,255,255,.18)',
              }} />
            ))}
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={next}>
            {step < 2 ? 'Next' : 'Open coach'} <Icon name="arrowR" size={20} color="#fff" strokeWidth={2.6} />
          </button>
        </div>
      </div>
    );
  }

  /* ----- AUTH ----- */
  return (
    <div className="screen-in" style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', padding: '52px 26px 30px' }}>
      <Orbs />
      <button className="btn btn-ghost btn-sm" style={{ position: 'relative', alignSelf: 'flex-start', padding: '8px 6px' }} onClick={() => setStage('carousel')}>
        <Icon name="chevL" size={20} /> Back
      </button>
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><LogoMark size={64} /></div>
        <div className="h1" style={{ textAlign: 'center', fontSize: 30 }}>{mode === 'signup' ? 'Launch your AI audit' : 'Welcome back'}</div>
        <p className="muted" style={{ textAlign: 'center', fontWeight: 600, marginTop: 6, marginBottom: 26 }}>
          {mode === 'signup' ? 'Build a school footprint plan from evidence, then prove the action.' : 'Return to your school footprint coach.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          {mode === 'signup' && (
            <>
              <label className="eyebrow" htmlFor="auth-name" style={{ display: 'block', marginBottom: -4 }}>Name</label>
              <input id="auth-name" className="field" type="text" placeholder="Alex Rivera" value={name} onChange={e => setName(e.target.value)} />
            </>
          )}
          <label className="eyebrow" htmlFor="auth-email" style={{ display: 'block', marginBottom: -4 }}>Email</label>
          <input id="auth-email" className="field" type="email" placeholder="you@school.edu" value={email} onChange={e => setEmail(e.target.value)} required />
          <label className="eyebrow" htmlFor="auth-password" style={{ display: 'block', marginBottom: -4 }}>Password</label>
          <input id="auth-password" className="field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          {mode === 'signup' && password.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              marginTop: 2,
              padding: '10px 14px',
              borderRadius: 'var(--r-md)',
              background: 'rgba(46, 125, 79, 0.05)',
              border: '1.5px solid rgba(46, 125, 79, 0.1)',
              animation: 'fadeIn 0.2s both'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Password Requirements
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: password.length >= 8 ? 'var(--green)' : 'var(--text-dim)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14 }}>
                  {password.length >= 8 ? (
                    <Icon name="check" size={14} color="var(--green)" strokeWidth={3} />
                  ) : (
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      border: '1.5px solid var(--text-dim)',
                      boxSizing: 'border-box'
                    }} />
                  )}
                </span>
                <span style={{ fontWeight: 600, transition: 'color 0.2s' }}>
                  At least 8 characters
                </span>
              </div>
            </div>
          )}
          {error && <div style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>{error}</div>}
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Loading...' : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>
      </div>

      <div className="row" style={{ position: 'relative', justifyContent: 'center', gap: 6, fontWeight: 700, fontSize: 14 }}>
        <span className="dim">{mode === 'signup' ? 'Already racing?' : 'New here?'}</span>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--green)', padding: 4 }} onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
          {mode === 'signup' ? 'Log in' : 'Create account'}
        </button>
      </div>
    </div>
  );
}
