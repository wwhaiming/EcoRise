/* EcoRise — App shell: auth, routing, state, API integration */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles/global.css';

import BottomNav from './components/BottomNav';
import { Toast } from './components/UI';
import { fireConfetti } from './components/Confetti';

import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import { Feed, Leaderboard, Profile, Organizer } from './pages/Pages';
import SetupBoard from './pages/SetupBoard';
import { LogAction, TrashSpotter } from './pages/Modals';
import Coach from './pages/Coach';

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
].map((m, i) => ({ ...m, rank: i + 1 }));

const MOCK_POSTS = [
  { id: 'p1', user_id: 'maya', user_name: 'Maya Chen', user_handle: '@mayagrows', user_avatar: 'https://i.pravatar.cc/200?img=47', action_type: 'Transport', action_desc: 'Biked to campus instead of driving', co2_saved: 2.4, points: 60, caption: 'Morning ride was unreal 🚲 beat my record. Who else is car-free this week? @devonp', like_count: 48, liked: false, comment_count: 6, created_at: new Date(Date.now() - 14 * 60000).toISOString() },
  { id: 'p2', user_id: 'aria', user_name: 'Aria Nasser', user_handle: '@aria.eco', user_avatar: 'https://i.pravatar.cc/200?img=45', action_type: 'Waste', action_desc: 'Refilled 5 bottles at the hydration station', co2_saved: 0.9, points: 25, caption: 'Single-use is so last season 💧', like_count: 31, liked: true, comment_count: 3, created_at: new Date(Date.now() - 52 * 60000).toISOString() },
  { id: 'p3', user_id: 'devon', user_name: 'Devon Park', user_handle: '@devonp', user_avatar: 'https://i.pravatar.cc/200?img=12', action_type: 'Food', action_desc: 'Composted this week\'s food scraps', co2_saved: 1.6, points: 40, caption: 'Dorm compost bin is officially thriving 🌱', like_count: 27, liked: false, comment_count: 4, created_at: new Date(Date.now() - 96 * 60000).toISOString() },
  { id: 'p4', user_id: 'leo', user_name: 'Leo Martins', user_handle: '@leomar', user_avatar: 'https://i.pravatar.cc/200?img=15', action_type: 'Cleanup', action_desc: 'Picked up litter at Riverside Park', co2_saved: 0.5, points: 35, caption: 'Filled two bags before lunch. Severity was a solid 7/10 down there 🧤', like_count: 52, liked: false, comment_count: 9, created_at: new Date(Date.now() - 140 * 60000).toISOString() },
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
  const [toast, setToast] = useState(null);
  const [bump, setBump] = useState(null);

  // Data state
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [quests, setQuests] = useState(MOCK_QUESTS);
  const [leaderboard, setLeaderboard] = useState({ name: 'Greenfield High', prize: '$250 campus store + a tree planted', invite_code: 'GRNFLD-7K2', reset_interval: 'weekly' });
  const [leaderboardId, setLeaderboardId] = useState(null);
  const [podiumVariant, setPodiumVariant] = useState('stand');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const appRef = useRef(null);
  const toastTimer = useRef(null);
  const resetTarget = leaderboard?.next_reset
    ? new Date(leaderboard.next_reset).getTime()
    : Date.now() + (3 * 86400000) + (14 * 3600000) + (22 * 60000);

  // ── Init: check session (cookie) on mount ──
  useEffect(() => {
    api.me().then(async (data) => {
      setUser(data.user);
      setAuthed(true);
      setMembers([]);
      setPosts([]);
      if (PENDING_INVITE) {
        await consumePendingInvite();
      } else {
        await loadData();
      }
    }).catch(() => { /* not signed in — show onboarding */ });
  }, []);

  const loadData = useCallback(async (boardIdOverride) => {
    try {
      // Try to load leaderboards
      const boards = await api.listLeaderboards();
      let activeBoardId = boardIdOverride || leaderboardId;
      if (boards.leaderboards?.length > 0) {
        let board = boards.leaderboards.find(b => b.id === activeBoardId);
        if (!board) {
          board = boards.leaderboards[0];
        }
        activeBoardId = board.id;
        setLeaderboardId(board.id);
        setLeaderboard(board);
        setScreen('home');

        const boardData = await api.getLeaderboard(board.id);
        if (boardData.members?.length > 0) {
          setMembers(boardData.members);
        }
      } else {
        setScreen('setup');
        return false;
      }

      // Load posts for the active board (use the resolved id, not stale state)
      if (activeBoardId) {
        const postsData = await api.getPosts(activeBoardId);
        if (postsData.posts?.length > 0) {
          setPosts(postsData.posts);
        } else {
          setPosts([]);
        }
      } else {
        setPosts([]);
      }

      // Load quests
      const questsData = await api.getQuests();
      if (questsData.quests?.length > 0) {
        setQuests(questsData.quests);
      }

      // Notifications
      const me = await api.me().catch(() => null);
      if (me?.user?.id) {
        const n = await api.getNotifications(me.user.id).catch(() => null);
        if (n) { setNotifications(n.notifications || []); setUnreadCount(n.unread || 0); }
      }
    } catch {
      // Offline: keep seed data (clearly a demo, not real standings).
    }
  }, [leaderboardId]);

  const joinBoardByCode = useCallback(async (code) => {
    const r = await api.joinLeaderboard(null, code);
    showToast(`Joined ${r.name || 'the leaderboard'}!`);
    await loadData(r.leaderboardId);
    return r;
  }, [loadData]);

  const consumePendingInvite = useCallback(() => {
    if (!PENDING_INVITE) return Promise.resolve(null);
    return api.joinLeaderboard(null, PENDING_INVITE).then(async (r) => {
      window.history.replaceState({}, '', '/');
      showToast(`Joined ${r.name || 'the leaderboard'}!`);
      setScreen('home');
      await loadData(r.leaderboardId);
      return r;
    }).catch(() => {
      window.history.replaceState({}, '', '/');
      return null;
    });
  }, [loadData]);

  const markNotificationsRead = useCallback(async () => {
    if (!user?.id) return;
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    try { await api.readNotifications(user.id); } catch { }
  }, [user]);

  // ── Toast ──
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  // ── Navigation ──
  const go = (s) => { setScreen(s); setModal(null); };

  // ── Points + confetti ──
  const flashBump = (id) => { setBump(id); setTimeout(() => setBump(null), 700); };

  const addPoints = (n) => {
    setMembers(prev => {
      const updated = prev.map(m => m.isYou ? { ...m, points: (m.points || 0) + n } : m);
      updated.sort((a, b) => (b.points || 0) - (a.points || 0));
      return updated.map((m, i) => ({ ...m, rank: i + 1 }));
    });
    flashBump('you');
    if (appRef.current) fireConfetti(appRef.current, { count: 80, origin: { x: 0.5, y: 0.42 } });
  };

  // ── Auth callback ──
  const onAuth = async (userData) => {
    setUser(userData);
    setAuthed(true);
    setMembers([]);
    setPosts([]);

    if (PENDING_INVITE) {
      await consumePendingInvite();
    } else {
      await loadData();
    }
  };

  // ── Action complete ──
  const onActionComplete = (data) => {
    setModal(null);
    // Honor server rejection — never fabricate points.
    if (!data || data.accepted === false || data.success === false) {
      showToast(data?.description || 'Not accepted — try another photo');
      return;
    }
    const pts = Number(data.points) || 0;
    if (pts > 0) {
      addPoints(pts);
      showToast(`+${pts} pts · ${data.aiResult?.specificAction || data.description || 'Eco action'}`);
    } else {
      showToast('Logged');
    }
    loadData();
  };

  // ── Toggle like ──
  const toggleLike = async (postId) => {
    setPosts(f => f.map(p => p.id === postId ? { ...p, liked: !p.liked, like_count: (p.like_count || 0) + (p.liked ? -1 : 1) } : p));
    try { await api.likePost(postId); } catch { }
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

  // ── Update leaderboard ──
  const updateLeaderboard = async (data) => {
    if (leaderboardId) {
      try { await api.updateLeaderboard(leaderboardId, data); } catch { }
    }
    setLeaderboard(prev => ({ ...prev, ...data }));
  };

  // ── Logout ──
  const logout = async () => {
    try { await api.logout(); } catch { }
    localStorage.removeItem('ecorise_onboarded');
    setUser(null);
    setAuthed(false);
    setScreen('onboarding');
  };

  // ── Context for child components ──
  const ctx = {
    user: user || { name: 'Eco Champion', handle: '@you', avatar: '' },
    members, posts, quests, leaderboard, leaderboardId,
    resetTarget, bump, podiumVariant,
    go, showToast, openLog: () => setModal('log'), openTrash: () => setModal('trash'),
    closeModal: () => setModal(null), toggleLike, reportPost, keepPost, deletePost, onActionComplete,
    updateLeaderboard, logout, joinBoardByCode,
    notifications, unreadCount, markNotificationsRead,
  };

  const isOnboarding = screen === 'onboarding' || !authed;
  const showNav = !isOnboarding && screen !== 'organizer' && screen !== 'setup';

  const renderScreen = () => {
    if (isOnboarding) return <Onboarding onAuth={onAuth} />;
    switch (screen) {
      case 'setup': return <SetupBoard ctx={ctx} onComplete={() => go('home')} />;
      case 'home': return <Home ctx={ctx} />;
      case 'feed': return <Feed ctx={ctx} />;
      case 'quests': return <Home ctx={ctx} />;
      case 'leaderboard': return <Leaderboard ctx={ctx} />;
      case 'profile': return <Profile ctx={ctx} />;
      case 'coach': return <Coach ctx={ctx} />;
      case 'organizer': return <Organizer ctx={ctx} />;
      default: return <Home ctx={ctx} />;
    }
  };

  return (
    <div className="app" ref={appRef}>
      <div className="scroll" key={screen}>
        {renderScreen()}
      </div>
      {showNav && <BottomNav screen={screen} go={go} onFab={() => setModal('log')} />}
      {modal === 'log' && <LogAction ctx={ctx} />}
      {modal === 'trash' && <TrashSpotter ctx={ctx} />}
      <Toast toast={toast} />
    </div>
  );
}
