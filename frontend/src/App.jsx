/* EcoRise — App shell: auth, routing, state, API integration */
import { useState, useEffect, useRef, useCallback } from 'react';
import './styles/global.css';

import BottomNav from './components/BottomNav';
import { Toast } from './components/UI';
import { fireConfetti } from './components/Confetti';

import Onboarding from './pages/Onboarding';
import SetupBoard from './pages/SetupBoard';
import Home from './pages/Home';
import Learning from './pages/Learning';
import FootprintDashboard from './pages/FootprintDashboard';
import { Feed, Profile, Organizer } from './pages/Pages';
import { LogAction, TrashSpotter } from './pages/Modals';
import AIEvidence from './components/AIEvidence';
import PrivacyCenter from './components/PrivacyCenter';

import api from './utils/api';

// Invite deep-link: /j/<code> -> join that board after auth.
const inviteMatch = typeof window !== 'undefined' && window.location.pathname.match(/^\/j\/([A-Za-z0-9]+)/);
const PENDING_INVITE = inviteMatch ? inviteMatch[1] : null;

// Mock data for when backend is unavailable
const MOCK_MEMBERS = [
  { user_id: 'maya', name: 'Maya Chen', handle: '@mayagrows', points: 4820, avatar: 'https://i.pravatar.cc/200?img=47', streak: 12 },
  { user_id: 'devon', name: 'Devon Park', handle: '@devonp', points: 4610, avatar: 'https://i.pravatar.cc/200?img=12', streak: 9 },
  { user_id: 'aria', name: 'Aria Nasser', handle: '@aria.eco', points: 4390, avatar: 'https://i.pravatar.cc/200?img=45', streak: 7 },
  { user_id: 'leo', name: 'Leo Martins', handle: '@leomar', points: 3980, avatar: 'https://i.pravatar.cc/200?img=15', streak: 5 },
  { user_id: 'priya', name: 'Priya Rao', handle: '@priyar', points: 3740, avatar: 'https://i.pravatar.cc/200?img=32', streak: 4 },
  { user_id: 'you', name: 'You', handle: '@you', points: 3610, avatar: 'https://i.pravatar.cc/200?img=68', streak: 6, isYou: true },
  { user_id: 'sam', name: 'Sam Whitfield', handle: '@samw', points: 3480, avatar: 'https://i.pravatar.cc/200?img=13', streak: 3 },
  { user_id: 'noor', name: 'Noor Haddad', handle: '@noorh', points: 3120, avatar: 'https://i.pravatar.cc/200?img=26', streak: 2 },
  { user_id: 'kai', name: 'Kai Anderson', handle: '@kaia', points: 2980, avatar: 'https://i.pravatar.cc/200?img=33', streak: 8 },
  { user_id: 'zoe', name: 'Zoe Bennett', handle: '@zoeb', points: 2740, avatar: 'https://i.pravatar.cc/200?img=44', streak: 1 },
  { user_id: 'omar', name: 'Omar Reyes', handle: '@omarr', points: 2510, avatar: 'https://i.pravatar.cc/200?img=50', streak: 3 },
  { user_id: 'tess', name: 'Tess Lindqvist', handle: '@tessl', points: 2280, avatar: 'https://i.pravatar.cc/200?img=20', streak: 2 },
].map((m, i) => ({ ...m, rank: i + 1, co2: +(((m.points || 0) / 1000).toFixed(1)) }));

const MOCK_POSTS = [
  { id: 'p1', user_id: 'maya', user_name: 'Maya Chen', user_handle: '@mayagrows', user_avatar: 'https://i.pravatar.cc/200?img=47', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=60&auto=format&fit=crop', action_type: 'Transport', action_desc: 'Biked to campus instead of driving', co2_saved: 2.4, points: 60, caption: 'Morning ride was unreal 🚲 beat my record. Who else is car-free this week? @devonp', like_count: 48, liked: false, comment_count: 6, created_at: new Date(Date.now() - 14 * 60000).toISOString() },
  { id: 'p2', user_id: 'aria', user_name: 'Aria Nasser', user_handle: '@aria.eco', user_avatar: 'https://i.pravatar.cc/200?img=45', image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&q=60&auto=format&fit=crop', action_type: 'Waste', action_desc: 'Refilled 5 bottles at the hydration station', co2_saved: 0.9, points: 25, caption: 'Single-use is so last season 💧', like_count: 31, liked: true, comment_count: 3, created_at: new Date(Date.now() - 52 * 60000).toISOString() },
  { id: 'p3', user_id: 'devon', user_name: 'Devon Park', user_handle: '@devonp', user_avatar: 'https://i.pravatar.cc/200?img=12', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=60&auto=format&fit=crop', action_type: 'Food', action_desc: 'Composted this week\'s food scraps', co2_saved: 1.6, points: 40, caption: 'Dorm compost bin is officially thriving 🌱', like_count: 27, liked: false, comment_count: 4, created_at: new Date(Date.now() - 96 * 60000).toISOString() },
  { id: 'p4', user_id: 'leo', user_name: 'Leo Martins', user_handle: '@leomar', user_avatar: 'https://i.pravatar.cc/200?img=15', image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=60&auto=format&fit=crop', action_type: 'Cleanup', action_desc: 'Picked up litter at Riverside Park', co2_saved: 0.5, points: 35, caption: 'Filled two bags before lunch. Severity was a solid 7/10 down there 🧤', like_count: 52, liked: false, comment_count: 9, created_at: new Date(Date.now() - 140 * 60000).toISOString() },
];

const MOCK_QUESTS = [
  { id: 'q1', title: 'Two-Wheel Tuesday', description: 'Log a bike or walk commute', action_type: 'transportation', points_base: 60, goal: 1, progress: 1 },
  { id: 'q2', title: 'Zero-Waste Lunch', description: 'Post a meal with no single-use plastic', action_type: 'waste', points_base: 40, goal: 1, progress: 0 },
  { id: 'q3', title: 'Bottle Streak', description: 'Refill a reusable bottle 3 times', action_type: 'waste', points_base: 45, goal: 3, progress: 2 },
  { id: 'q4', title: 'Spot the Trash', description: 'Report one litter hotspot near you', action_type: 'nature', points_base: 50, goal: 1, progress: 0 },
  { id: 'q5', title: 'Bring a Friend', description: 'Invite someone to your leaderboard', action_type: 'community', points_base: 75, goal: 1, progress: 0 },
];

export default function App() {
  // Auth state (session is an httpOnly cookie; no token kept in JS)
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(false);

  // App state
  const [screen, setScreen] = useState('onboarding');
  const [modal, setModal] = useState(null);
  const [evidence, setEvidence] = useState(null);   // AI Evidence Panel payload
  const [toast, setToast] = useState(null);
  const [bump, setBump] = useState(null);

  // Data state
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [quests, setQuests] = useState(MOCK_QUESTS);
  const [leaderboard, setLeaderboard] = useState({ name: 'Garfield High School', prize: '$250 campus store + a tree planted', invite_code: 'GRNFLD-7K2', reset_interval: 'weekly' });
  const [leaderboardId, setLeaderboardId] = useState(null);
  const [podiumVariant] = useState('stand');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const toastTimer = useRef(null);
  const didBootstrap = useRef(false);
  const scrollRef = useRef(null);
  const notifClearedAt = useRef(0);   // timestamp of last manual notif clear (badge anti-flicker)
  const [resetTarget] = useState(() => Date.now() + (3 * 86400000) + (14 * 3600000) + (22 * 60000));

  // ── Toast ──
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const loadData = useCallback(async (preferredBoardId = null) => {
    try {
      // Try to load leaderboards
      const boards = await api.listLeaderboards();
      let activeBoardId = preferredBoardId || leaderboardId;
      if (boards.leaderboards?.length > 0) {
        const board = preferredBoardId
          ? (boards.leaderboards.find(b => b.id === preferredBoardId) || boards.leaderboards[0])
          : boards.leaderboards[0];
        activeBoardId = board.id;
        setLeaderboardId(board.id);
        setLeaderboard(board);

        const boardData = await api.getLeaderboard(board.id);
        setMembers(boardData.members || []);
      }

      // Load posts for the active board (use the resolved id, not stale state)
      const postsData = await api.getPosts(activeBoardId);
      setPosts(postsData.posts || []);

      // Load quests
      const questsData = await api.getQuests();
      setQuests(questsData.quests || []);

      // Notifications
      const me = await api.me().catch(() => null);
      if (me?.user?.id) {
        const n = await api.getNotifications(me.user.id).catch(() => null);
        if (n) {
          setNotifications(n.notifications || []);
          // Don't let a refetch racing an in-flight "mark read" write resurrect the
          // badge: suppress the upward revert for a few seconds after a manual clear.
          const recentlyCleared = Date.now() - notifClearedAt.current < 5000;
          setUnreadCount(recentlyCleared ? 0 : (n.unread || 0));
        }
      }
    } catch {
      // Offline: keep seed data (clearly a demo, not real standings).
    }
  }, [leaderboardId]);

  const consumePendingInvite = useCallback(async () => {
    if (!PENDING_INVITE) return;
    try {
      const r = await api.joinByCode(PENDING_INVITE);
      window.history.replaceState({}, '', '/');
      showToast(`Joined ${r.name || 'the leaderboard'}!`);
      await loadData(r.leaderboardId);
    } catch {
      window.history.replaceState({}, '', '/');
    }
  }, [loadData, showToast]);

  // ── Init: check session (cookie) on mount ──
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    let live = true;
    const enter = async data => {
      if (!live) return;
      setUser(data.user);
      setAuthed(true);
      setScreen('learning');
      setMembers([]);
      setPosts([]);
      await loadData();
      if (live) await consumePendingInvite();
    };
    api.me()
      .then(enter)
      .catch(() => {
        // Hosted interactive demo: no session yet, so ask the server to sign us in as
        // the seeded demo account, then load. Harmless on a normal deploy — demo-login
        // 404s when the server is not in DEMO_MODE, and we fall through to onboarding.
        api.demoLogin()
          .then(() => api.me().then(enter))
          .catch(() => { /* not a demo deploy / not signed in — show onboarding */ });
      });
    return () => { live = false; };
  }, [loadData, consumePendingInvite]);

  const markNotificationsRead = useCallback(async () => {
    if (!user?.id) return;
    notifClearedAt.current = Date.now();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    try { await api.readNotifications(user.id); } catch { /* best-effort badge sync */ }
  }, [user]);

  useEffect(() => {
    const resetScroll = () => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTop = 0;
      const shell = scrollRef.current.parentElement;
      if (shell) shell.scrollTop = 0;
    };
    resetScroll();
    const frame = requestAnimationFrame(resetScroll);
    return () => cancelAnimationFrame(frame);
  }, [screen]);

  // ── Navigation ──
  const go = (s) => { setScreen(s); setModal(null); };
  // Stable identity so the AIEvidence dialog's focus effect doesn't re-run on every render.
  const closeEvidence = useCallback(() => setEvidence(null), []);

  // ── Points + confetti ──
  const flashBump = (id) => { setBump(id); setTimeout(() => setBump(null), 700); };

  const addPoints = (n) => {
    setMembers(prev => {
      const updated = prev.map(m => m.isYou ? { ...m, points: (m.points || 0) + n } : m);
      updated.sort((a, b) => (b.points || 0) - (a.points || 0));
      return updated.map((m, i) => ({ ...m, rank: i + 1 }));
    });
    flashBump(members.find(m => m.isYou)?.user_id || 'you');
    const host = document.querySelector('.app');
    if (host) fireConfetti(host, { count: 80, origin: { x: 0.5, y: 0.42 } });
  };

  // ── Join board by invite code (used by SetupBoard + Leaderboard inline form) ──
  const joinBoardByCode = useCallback(async (code) => {
    const r = await api.joinByCode(code);
    showToast(`Joined ${r.name || 'the leaderboard'}!`);
    await loadData(r.leaderboardId);
    return r;
  }, [loadData, showToast]);

  // ── Called after board creation (skip redundant join toast) ──
  const onBoardCreated = useCallback((board) => {
    setLeaderboardId(board.id);
    setLeaderboard(board);
    loadData(board.id).catch(() => {});
  }, [loadData]);

  // ── Auth callback ──
  const onAuth = async (userData) => {
    setUser(userData);
    setAuthed(true);
    setMembers([]);
    setPosts([]);

    if (PENDING_INVITE) {
      setScreen('learning');
      await consumePendingInvite();
      return;
    }

    // Check if user has a board; if not, send to setup screen to create or join.
    try {
      const data = await api.listLeaderboards();
      const board = data.leaderboards?.[0] || null;
      if (!board) {
        setScreen('setup');
        return;
      }
      setLeaderboardId(board.id);
      setLeaderboard(board);
    } catch { /* offline */ }

    setScreen('learning');
    await loadData();
  };

  // Predict the rank you move to after gaining `delta` points (for the Evidence
  // Panel's leaderboard animation), computed from the current standings.
  const computeRankMove = (delta) => {
    const you = members.find(m => m.isYou);
    const beforeRank = you?.rank || (members.length + 1);
    const beforePoints = you?.points || 0;
    const afterPoints = beforePoints + delta;
    const afterRank = members.filter(m => !m.isYou && (m.points || 0) > afterPoints).length + 1;
    return { beforeRank, afterRank, beforePoints, afterPoints };
  };

  // ── Action complete → open the AI Evidence Panel (accepted OR rejected) ──
  const onActionComplete = (data, photo) => {
    setModal(null);
    const accepted = !(!data || data.accepted === false || data.success === false);
    const kind = data && (data.severity !== undefined || data.reportId) ? 'trash' : 'eco';
    let rankMove = null;
    if (accepted) {
      const pts = Number(data.points) || 0;
      if (pts > 0) { rankMove = computeRankMove(pts); addPoints(pts); }
    }
    setEvidence({ ...data, accepted, kind, photo, rankMove });
    loadData();
  };

  // ── Toggle like ──
  const toggleLike = async (postId) => {
    setPosts(f => f.map(p => p.id === postId ? { ...p, liked: !p.liked, like_count: (p.like_count || 0) + (p.liked ? -1 : 1) } : p));
    try { await api.likePost(postId); } catch { /* optimistic like rolls forward in demo mode */ }
  };

  // ── Moderation (await the server; never show success on a 403) ──
  const reportPost = async (postId) => {
    try { await api.reportPost(postId); showToast('Post reported to moderators'); loadData(); }
    catch (err) { showToast(err.message || 'Could not report post'); }
  };

  const keepPost = async (postId) => {
    try {
      await api.resolvePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, reported: 0 } : p));
      showToast('Post kept'); loadData();
    } catch (err) { showToast(err.message || 'Not allowed'); }
  };

  const deletePost = async (postId) => {
    try {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post removed'); loadData();
    } catch (err) { showToast(err.message || 'Not allowed'); }
  };

  // Keep the feed card's comment count in sync when a comment is posted (the count
  // lives in `posts`, not in CommentSection's local list).
  const incrementCommentCount = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p));
  };

  // ── Update leaderboard ──
  const updateLeaderboard = async (data) => {
    if (leaderboardId) {
      try { await api.updateLeaderboard(leaderboardId, data); } catch { /* keep local draft if offline */ }
    }
    // The form sends camelCase; the board object is server snake_case. Normalize so a
    // reopened Organizer reads back the just-saved values instead of stale ones.
    setLeaderboard(prev => ({
      ...prev,
      name: data.name ?? prev?.name,
      reset_interval: data.resetInterval ?? prev?.reset_interval,
      prize: data.prize ?? prev?.prize,
      include_self: data.includeSelf !== undefined ? (data.includeSelf ? 1 : 0) : prev?.include_self,
    }));
  };

  // ── Logout ──
  const logout = async () => {
    try { await api.logout(); } catch { /* local logout still clears client state */ }
    localStorage.removeItem('ecorise_onboarded');
    setModal(null);
    setUser(null);
    setAuthed(false);
    setScreen('onboarding');
  };

  // ── Context for child components ──
  const ctx = {
    user: user || { name: 'Eco Champion', handle: '@you', avatar: '' },
    isDemo: user?.email === 'demo@ecorise.app',
    members, posts, quests, leaderboard, leaderboardId,
    resetTarget, bump, podiumVariant,
    go, setScreen, showToast, openLog: () => setModal('log'), openTrash: () => setModal('trash'),
    closeModal: () => setModal(null), toggleLike, reportPost, keepPost, deletePost, onActionComplete,
    updateLeaderboard, incrementCommentCount, logout,
    joinBoardByCode, onBoardCreated,
    notifications, unreadCount, markNotificationsRead,
  };

  const isOnboarding = screen === 'onboarding' || !authed;
  const showNav = !isOnboarding && screen !== 'organizer' && screen !== 'setup';

  const renderScreen = () => {
    if (isOnboarding) return <Onboarding onAuth={onAuth} />;
    switch (screen) {
      case 'setup': return <SetupBoard ctx={ctx} onComplete={() => { loadData(); go('learning'); }} />;
      case 'home': return <Home ctx={ctx} />;
      case 'feed': return <Feed ctx={ctx} />;
      case 'learning': return <Learning ctx={ctx} />;
      case 'footprint': return <FootprintDashboard ctx={ctx} />;
      case 'profile': return <Profile ctx={ctx} />;
      case 'privacy': return <PrivacyCenter ctx={ctx} />;
      case 'organizer': return <Organizer ctx={ctx} />;
      default: return <Learning ctx={ctx} />;
    }
  };

  return (
    <div className="app">
      <div className="scroll slide-screen" key={screen} ref={scrollRef} style={isOnboarding ? { paddingBottom: 0 } : null}>
        {renderScreen()}
      </div>
      {showNav && <BottomNav screen={screen} go={go} onFab={() => setModal('log')} />}
      {modal === 'log' && <LogAction ctx={ctx} />}
      {modal === 'trash' && <TrashSpotter ctx={ctx} />}
      {evidence && <AIEvidence data={evidence} onClose={closeEvidence} />}
      <Toast toast={toast} />
    </div>
  );
}
