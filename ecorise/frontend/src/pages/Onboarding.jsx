/* EcoRise — Onboarding (Hero → Carousel → Auth) */
import React, { useState } from 'react';
import Icon from '../components/Icon';
import { LogoMark, Wordmark, Orbs } from '../components/Shared';
import api from '../utils/api';

const ONB_STEPS = [
  { key: 'track', icon: 'camera', color: '#2BFF9C',
    title: 'Track your eco actions', sub: 'Snap a photo of your bike ride, reusable bottle or cleanup. Our AI does the math.' },
  { key: 'earn', icon: 'trophy', color: '#FFD66B',
    title: 'Earn points on the leaderboard', sub: 'Every action you log earns points and climbs you up the ranks in real time.' },
  { key: 'win', icon: 'gift', color: '#8A6CFF',
    title: 'Compete & win prizes', sub: 'Battle your school or community. Top the board before the timer resets to win.' },
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
      setError(detail ? `${err.message}: ${detail}` : err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ----- HERO ----- */
  if (stage === 'hero') {
    return (
      <div className="screen-in" style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 26px 34px' }}>
        <Orbs />
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 22 }}>
          <div className="floaty" style={{ filter: 'drop-shadow(0 16px 30px rgba(0,230,118,.4))' }}>
            <LogoMark size={104} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 46, letterSpacing: '-1px', lineHeight: 1 }}>
              Eco<span style={{ color: 'var(--green)' }}>Rise</span>
            </div>
            <div className="h-hero" style={{ marginTop: 18, fontSize: 26, lineHeight: 1.15, maxWidth: 300 }}>
              Your choices.<br />Your impact.<br /><span style={{ color: 'var(--green)' }}>Your rank.</span>
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn btn-primary btn-block btn-lg pulse-green" onClick={() => setStage('carousel')}>Get started</button>
          <button className="btn btn-ghost btn-block" onClick={() => { setMode('login'); setStage('auth'); }}>I already have an account</button>
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
            background: `radial-gradient(120px 120px at 50% 30%, ${s.color}33, transparent), linear-gradient(180deg,var(--navy-700),var(--navy-800))`,
            boxShadow: `0 20px 50px rgba(0,0,0,.4), 0 0 60px ${s.color}33`, border: `1.5px solid ${s.color}44`,
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
            {step < 2 ? 'Next' : 'Let\u2019s go'} <Icon name="arrowR" size={20} color="#06281A" strokeWidth={2.6} />
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
        <div className="h1" style={{ textAlign: 'center', fontSize: 30 }}>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</div>
        <p className="muted" style={{ textAlign: 'center', fontWeight: 600, marginTop: 6, marginBottom: 26 }}>
          {mode === 'signup' ? 'Join the race to a greener campus.' : 'Pick up right where you left off.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          {mode === 'signup' && (
            <>
              <label className="eyebrow" style={{ display: 'block', marginBottom: -4 }}>Name</label>
              <input className="field" type="text" placeholder="Alex Rivera" value={name} onChange={e => setName(e.target.value)} />
            </>
          )}
          <label className="eyebrow" style={{ display: 'block', marginBottom: -4 }}>Email</label>
          <input className="field" type="email" placeholder="you@school.edu" value={email} onChange={e => setEmail(e.target.value)} required />
          <label className="eyebrow" style={{ display: 'block', marginBottom: -4 }}>Password</label>
          <input className="field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
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
