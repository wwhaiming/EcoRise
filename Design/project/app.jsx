/* EcoRise — App shell: state, router, bottom nav, FAB, Tweaks */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "podium": "cards",
  "font": "fredoka"
}/*EDITMODE-END*/;

const NAV = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'feed', label: 'Feed', icon: 'feed' },
  { key: 'quests', label: 'Quests', icon: 'bolt' },
  { key: 'leaderboard', label: 'Ranks', icon: 'trophy' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

function BottomNav({ screen, go, onFab }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* FAB */}
      <button onClick={onFab} className="pulse-green" style={{
        position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
        width: 60, height: 60, borderRadius: '50%', border: '3px solid var(--navy-900)', cursor: 'pointer',
        background: 'linear-gradient(180deg,var(--green-2),var(--green))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="plus" size={30} color="#06281A" strokeWidth={3} />
      </button>
      <div className="nav">
        {NAV.map((n, i) => (
          <React.Fragment key={n.key}>
            {i === 2 && <div style={{ width: 56, flexShrink: 0 }} />}
            <button className={`nav-item ${screen === n.key ? 'active' : ''}`} onClick={() => go(n.key)}>
              <Icon name={n.icon} size={24} color={screen === n.key ? 'var(--green)' : 'var(--text-dim)'} fill={false} />
              {n.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = React.useState('onboarding');
  const [modal, setModal] = React.useState(null); // 'log' | 'trash'
  const [toast, setToast] = React.useState(null);
  const [bump, setBump] = React.useState(null);

  // live data state
  const [youPts, setYouPts] = React.useState(3610);
  const [feed, setFeed] = React.useState(() => window.ECO.FEED.map(p => ({ ...p })));
  const [quests, setQuests] = React.useState(() => window.ECO.QUESTS.map(q => ({ ...q })));

  const appRef = React.useRef(null);
  const toastTimer = React.useRef(null);
  const resetTarget = React.useRef(Date.now() + (3 * 86400000) + (14 * 3600000) + (22 * 60000)).current;

  // apply font tweak to root
  React.useEffect(() => {
    document.documentElement.setAttribute('data-font', t.font);
  }, [t.font]);

  // recompute ranked players from live youPts
  const players = React.useMemo(() => {
    const base = window.ECO.PLAYERS.map(p => p.isYou ? { ...p, pts: youPts } : { ...p });
    base.sort((a, b) => b.pts - a.pts);
    return base.map((p, i) => ({ ...p, rank: i + 1 }));
  }, [youPts]);
  const you = players.find(p => p.isYou);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const go = (s) => { setScreen(s); setModal(null); };

  const flashBump = (id) => { setBump(id); setTimeout(() => setBump(null), 700); };

  const addPoints = (n) => {
    setYouPts(prev => prev + n);
    flashBump('you');
    if (appRef.current) fireConfetti(appRef.current, { count: 80, origin: { x: 0.5, y: 0.42 } });
  };

  const confirmAction = (pts, label, cat) => {
    setModal(null);
    addPoints(pts);
    showToast(`+${pts} pts · ${label}`);
    // auto-advance matching quests
    setQuests(qs => qs.map(q => {
      if (q.done >= q.goal) return q;
      const match = (cat === 'Transport' && q.id === 'q1') || (cat === 'Cleanup' && q.id === 'q4') ||
        (cat === 'Waste' && q.id === 'q3') || (cat === 'Food' && q.id === 'q2');
      return match ? { ...q, done: Math.min(q.goal, q.done + 1) } : q;
    }));
  };

  const toggleLike = (id) => setFeed(f => f.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));

  const advanceQuest = (id) => {
    setQuests(qs => qs.map(q => {
      if (q.id !== id || q.done >= q.goal) return q;
      const nd = Math.min(q.goal, q.done + 1);
      if (nd >= q.goal) { addPoints(q.reward); showToast(`Quest complete! +${q.reward} pts`); }
      return { ...q, done: nd };
    }));
  };

  const ctx = {
    screen, go, players, you, youPts, resetTarget,
    feed, quests, toggleLike, advanceQuest,
    ai: window.ECO.AI_ACTIONS,
    showToast, bump,
    openLog: () => setModal('log'), openTrash: () => setModal('trash'),
    closeModal: () => setModal(null), confirmAction,
    tweaks: { podium: t.podium, font: t.font },
  };

  const isOnboarding = screen === 'onboarding';
  const showNav = !isOnboarding && screen !== 'organizer';

  const renderScreen = () => {
    switch (screen) {
      case 'onboarding': return <OnboardingScreen ctx={ctx} />;
      case 'home': return <HomeScreen ctx={ctx} />;
      case 'feed': return <FeedScreen ctx={ctx} />;
      case 'quests': return <QuestsScreen ctx={ctx} />;
      case 'leaderboard': return <LeaderboardScreen ctx={ctx} />;
      case 'profile': return <ProfileScreen ctx={ctx} />;
      case 'organizer': return <OrganizerScreen ctx={ctx} />;
      default: return <HomeScreen ctx={ctx} />;
    }
  };

  return (
    <IOSDevice dark>
      <div className="app" ref={appRef}>
        {!isOnboarding && <div style={{ height: 48, flexShrink: 0 }} />}
        <div className="scroll" key={screen}>
          {renderScreen()}
        </div>
        {showNav && <BottomNav screen={screen} go={go} onFab={() => setModal('log')} />}

        {modal === 'log' && <LogActionSheet ctx={ctx} />}
        {modal === 'trash' && <TrashSpotterSheet ctx={ctx} />}
        <Toast toast={toast} />
      </div>

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="Leaderboard" />
        <TweakRadio label="Podium style" value={t.podium}
          options={['cards', 'stand', 'medals']}
          onChange={(v) => { setTweak('podium', v); if (screen !== 'leaderboard') go('leaderboard'); }} />
        <TweakSection label="Typography" />
        <TweakRadio label="Display font" value={t.font}
          options={['fredoka', 'nunito', 'baloo']}
          onChange={(v) => setTweak('font', v)} />
      </TweaksPanel>
    </IOSDevice>
  );
}

/* ---- mount with phone scaling ---- */
function Root() {
  const wrapRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  const DW = 402, DH = 874;
  React.useLayoutEffect(() => {
    const fit = () => {
      const pad = 28;
      const s = Math.min((window.innerWidth - pad) / DW, (window.innerHeight - pad) / DH, 1);
      setScale(s);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return (
    <div ref={wrapRef} style={{ width: DW * scale, height: DH * scale }}>
      <div style={{ width: DW, height: DH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <App />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('stage')).render(<Root />);
