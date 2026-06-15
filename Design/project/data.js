/* EcoRise — mock data. Plain JS, attaches to window. */
(function () {
  const av = (n) => `https://i.pravatar.cc/200?img=${n}`;

  // ranked players (sorted high → low)
  const PLAYERS = [
    { id: 'maya',   name: 'Maya Chen',      handle: '@mayagrows',  pts: 4820, img: av(47), color: '#00E676', streak: 12 },
    { id: 'devon',  name: 'Devon Park',     handle: '@devonp',     pts: 4610, img: av(12), color: '#7C4DFF', streak: 9 },
    { id: 'aria',   name: 'Aria Nasser',    handle: '@aria.eco',   pts: 4390, img: av(45), color: '#FF6B6B', streak: 7 },
    { id: 'leo',    name: 'Leo Martins',    handle: '@leomar',     pts: 3980, img: av(15), color: '#38BDF8', streak: 5 },
    { id: 'priya',  name: 'Priya Rao',      handle: '@priyar',     pts: 3740, img: av(32), color: '#FFD23F', streak: 4 },
    { id: 'you',    name: 'You',            handle: '@you',        pts: 3610, img: av(68), color: '#00E676', streak: 6, isYou: true },
    { id: 'sam',    name: 'Sam Whitfield',  handle: '@samw',       pts: 3480, img: av(13), color: '#9D7BFF', streak: 3 },
    { id: 'noor',   name: 'Noor Haddad',    handle: '@noorh',      pts: 3120, img: av(26), color: '#1AF08A', streak: 2 },
    { id: 'kai',    name: 'Kai Anderson',   handle: '@kaia',       pts: 2980, img: av(33), color: '#FF8A8A', streak: 8 },
    { id: 'zoe',    name: 'Zoe Bennett',    handle: '@zoeb',       pts: 2740, img: av(44), color: '#38BDF8', streak: 1 },
    { id: 'omar',   name: 'Omar Reyes',     handle: '@omarr',      pts: 2510, img: av(50), color: '#7C4DFF', streak: 3 },
    { id: 'tess',   name: 'Tess Lindqvist', handle: '@tessl',      pts: 2280, img: av(20), color: '#FFD23F', streak: 2 },
  ];

  const FEED = [
    { id: 'p1', user: 'maya',  action: 'Biked to campus instead of driving', co2: 2.4, pts: 60, mins: 14,
      img: 'linear-gradient(135deg,#0e7a4f,#11b06f)', tag: 'Transport', likes: 48, liked: false, comments: 6,
      caption: 'Morning ride was unreal 🚲 beat my record. Who else is car-free this week? @devonp' },
    { id: 'p2', user: 'aria',  action: 'Refilled 5 bottles at the hydration station', co2: 0.9, pts: 25, mins: 52,
      img: 'linear-gradient(135deg,#2563eb,#38BDF8)', tag: 'Waste', likes: 31, liked: true, comments: 3,
      caption: 'Single-use is so last season 💧' },
    { id: 'p3', user: 'devon', action: 'Composted this week\u2019s food scraps', co2: 1.6, pts: 40, mins: 96,
      img: 'linear-gradient(135deg,#7c5c1e,#caa14a)', tag: 'Food', likes: 27, liked: false, comments: 4,
      caption: 'Dorm compost bin is officially thriving 🌱' },
    { id: 'p4', user: 'leo',   action: 'Picked up litter at Riverside Park', co2: 0.5, pts: 35, mins: 140,
      img: 'linear-gradient(135deg,#5b21b6,#7C4DFF)', tag: 'Cleanup', likes: 52, liked: false, comments: 9,
      caption: 'Filled two bags before lunch. Severity was a solid 7/10 down there 🧤' },
  ];

  const QUESTS = [
    { id: 'q1', title: 'Two-Wheel Tuesday', desc: 'Log a bike or walk commute', icon: 'bike',   reward: 120, goal: 1, done: 1, color: '#00E676' },
    { id: 'q2', title: 'Zero-Waste Lunch',  desc: 'Post a meal with no single-use plastic', icon: 'leaf', reward: 80, goal: 1, done: 0, color: '#1AF08A' },
    { id: 'q3', title: 'Bottle Streak',     desc: 'Refill a reusable bottle 3 times', icon: 'drop', reward: 90, goal: 3, done: 2, color: '#38BDF8' },
    { id: 'q4', title: 'Spot the Trash',    desc: 'Report one litter hotspot near you', icon: 'trash', reward: 100, goal: 1, done: 0, color: '#FF6B6B' },
    { id: 'q5', title: 'Bring a Friend',    desc: 'Invite someone to your leaderboard', icon: 'users', reward: 150, goal: 1, done: 0, color: '#7C4DFF' },
  ];

  // mocked AI detections for the Log Action flow
  const AI_ACTIONS = [
    { action: 'Cycling commute',   cat: 'Transport', co2: 2.4, pts: 60, needsMiles: true,  unit: 'miles biked', factor: 0.4 },
    { action: 'Reusable bottle',   cat: 'Waste',     co2: 0.5, pts: 25, needsMiles: false },
    { action: 'Plant-based meal',  cat: 'Food',      co2: 1.8, pts: 45, needsMiles: false },
    { action: 'Public transit ride',cat:'Transport', co2: 1.6, pts: 50, needsMiles: true,  unit: 'miles ridden', factor: 0.25 },
  ];

  window.ECO = { PLAYERS, FEED, QUESTS, AI_ACTIONS };
})();
