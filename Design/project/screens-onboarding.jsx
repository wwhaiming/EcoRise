/* EcoRise — Logo + Onboarding / Landing / Auth */

/* ---------- Logo mark: leaf + upward rise ---------- */
function LogoMark({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="lgM" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1AF08A" /><stop offset="1" stopColor="#00C766" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="#13132A" stroke="rgba(0,230,118,.35)" strokeWidth="1.5" />
      {/* leaf */}
      <path d="M20 44c0-15 10-23 24-24-1 15-9 23-24 24Z" fill="url(#lgM)" />
      <path d="M20 44c3.5-8 8.5-12 15-15" stroke="#06281A" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
      {/* rising spark */}
      <path d="M40 16l2.4 6.6L49 25l-6.6 2.4L40 34l-2.4-6.6L31 25l6.6-2.4L40 16Z" fill="#FFD23F" />
    </svg>
  );
}

function Wordmark({ size = 26, color = '#fff' }) {
  return (
    <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: size, letterSpacing: '-.5px', color, lineHeight: 1 }}>
      Eco<span style={{ color: 'var(--green)' }}>Rise</span>
    </span>
  );
}

/* ---------- Animated orb backdrop ---------- */
function Orbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="floaty" style={{ position: 'absolute', top: -40, left: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,#7C4DFF,transparent 70%)', opacity: .5, filter: 'blur(8px)' }} />
      <div className="floaty" style={{ position: 'absolute', bottom: 40, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,#00E676,transparent 70%)', opacity: .35, filter: 'blur(8px)', animationDelay: '1.2s' }} />
      <div className="floaty" style={{ position: 'absolute', top: '38%', right: -30, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle,#FF6B6B,transparent 70%)', opacity: .3, filter: 'blur(6px)', animationDelay: '.6s' }} />
    </div>
  );
}

const ONB_STEPS = [
  { key: 'track', icon: 'camera', color: '#00E676',
    title: 'Track your eco actions', sub: 'Snap a photo of your bike ride, reusable bottle or cleanup. Our AI does the math.' },
  { key: 'earn', icon: 'trophy', color: '#FFD23F',
    title: 'Earn points on the leaderboard', sub: 'Every action you log earns points and climbs you up the ranks in real time.' },
  { key: 'win', icon: 'gift', color: '#7C4DFF',
    title: 'Compete & win prizes', sub: 'Battle your school or community. Top the board before the timer resets to win.' },
];

function OnboardingScreen({ ctx }) {
  const [stage, setStage] = React.useState('hero'); // hero | carousel | auth
  const [step, setStep] = React.useState(0);
  const [mode, setMode] = React.useState('signup');
  const [email, setEmail] = React.useState('');

  const next = () => {
    if (step < ONB_STEPS.length - 1) setStep(step + 1);
    else setStage('auth');
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

        <button className="btn btn-block" style={{ background: '#fff', color: '#1a1a2e', boxShadow: '0 8px 20px rgba(0,0,0,.3)', marginBottom: 12 }} onClick={() => ctx.go('home')}>
          <Icon name="google" size={20} /> Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
          <span className="dim" style={{ fontWeight: 700, fontSize: 12 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
        </div>

        <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Email</label>
        <input className="field" type="email" placeholder="you@school.edu" value={email} onChange={e => setEmail(e.target.value)} />
        <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 14 }} onClick={() => ctx.go('home')}>
          {mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
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

Object.assign(window, { LogoMark, Wordmark, Orbs, OnboardingScreen });
