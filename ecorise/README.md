# 🌱 EcoRise — AI-Powered Environmental Leaderboard

EcoRise is a competitive environmental leaderboard app for schools and communities. Log eco-friendly actions, earn points, compete on leaderboards, and make a real impact — powered by AI.

**Think Kahoot if it cared about the planet.** 🌍

![Status](https://img.shields.io/badge/status-hackathon%20MVP-brightgreen)

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| **AI Evidence Panel** | After **every** submission: which model decided, its confidence, the **grounded** CO₂ math (formula + cited source + uncertainty range), the full point breakdown, the deterministic tool pipeline that ran, and every anti-fraud gate cleared (or why it was rejected) — the AI's reasoning, made visible |
| **AI Action Analysis** | Upload a photo → Claude **perceives** the action + measurable attributes; it never invents the impact |
| **Grounded Carbon Engine** | Deterministic kg CO₂e from **published emission factors** (EPA GHG Hub, EPA WARM, OWID/Poore-Nemecek) with formula + uncertainty range — the LLM cannot fabricate the number ([`utils/carbonEngine.js`](backend/utils/carbonEngine.js)) |
| **Measured Eval Gate** | The eco-action classifier is measured, not asserted: accuracy / FP / FN / adversarial-rejection / calibration ([`test/eco_eval/`](backend/test/eco_eval/), `npm run test:eval`) |
| **Adversarial Fraud Screen** | A second vision pass flags photo-of-screen / stock / AI-generated images; high suspicion rejects, low suspicion halves points ([`utils/integrityGates.js`](backend/utils/integrityGates.js)) |
| **Points Rubric Engine** | Comprehensive **server-side** scoring across 5 categories (transport, waste, energy, food, nature); the LLM cannot award points |
| **Social Feed** | Instagram-style cards with likes, comments, @mentions, reporting |
| **Personalized Daily Quests** | 5 quests/day generated from your **real last-30-day behavior** (targets neglected categories), 2× multiplier on completion |
| **Leaderboard** | Animated podium (3 styles), real-time ranking, reset timers |
| **Trash Spotter** | Report litter, AI rates severity 0-10, earn bonus points |
| **Organizer Dashboard** | Create/manage leaderboards, moderation queue, invite links |
| **Badges & Streaks** | Automated badge awards, streak tracking, bonus multipliers |

---

## 🛠 Tech Stack

- **Frontend:** React 19 + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **Auth:** JWT (httpOnly cookies) + bcrypt
- **AI:** Anthropic Claude vision (`ECO_MODEL`, default `claude-sonnet-4-6`) for eco analysis + a custom CNN (ONNX) for trash. Without an API key the server **rejects rather than fabricates** points; set `MOCK_ECO_ALWAYS_PASS=true` for a clearly-flagged demo.
- **Design:** Kahoot-inspired dark navy + neon (Fredoka + Nunito fonts)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd ecorise

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the template
cp .env.example .env

# Edit .env and add your Anthropic API key (optional — mock mode works without it)
```

### 3. Run Locally

```bash
# Start both frontend + backend
npm run dev

# OR — one-command judge demo: seed a populated board + login, then run
npm run demo
#   login: demo@ecorise.app / demo1234   (board "Greenfield High", invite DEMOECO)
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health check:** http://localhost:3001/api/health

### Or run separately:

```bash
# Terminal 1: Backend
cd backend && node server.js

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## 📁 Architecture

```
ecorise/
├── frontend/              React + Vite app
│   ├── src/
│   │   ├── components/    Reusable UI components (Icon, Avatar, Podium, etc.)
│   │   ├── pages/         Screen-level components (Home, Feed, Quests, etc.)
│   │   ├── styles/        Design tokens + global CSS + component styles
│   │   ├── utils/         API client
│   │   └── App.jsx        Root component with routing + state management
│   └── index.html
│
├── backend/               Express API server
│   ├── routes/            REST endpoints
│   │   ├── auth.js        Signup, login, logout, me
│   │   ├── leaderboard.js CRUD, join, ranking
│   │   ├── posts.js       Feed, likes, comments, reports
│   │   ├── quests.js      Daily quest generation + progress
│   │   ├── trashspotter.js AI severity analysis
│   │   └── users.js       Profiles, badges, notifications
│   ├── middleware/         Auth (JWT), upload (multer), rate limiting
│   ├── utils/
│   │   ├── rubric.js      Points calculation engine
│   │   ├── aiClient.js    Anthropic Claude API wrapper
│   │   └── pointsEngine.js Orchestration layer
│   ├── db.js              SQLite schema + initialization
│   └── server.js          Express entry point
│
├── .env                   Local secrets (never commit)
├── .env.example           Template with required keys
└── package.json           Root scripts
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account (email, password, name) |
| POST | `/api/auth/login` | Login (email, password) |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Get current user |

### Leaderboards
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leaderboards` | Create leaderboard |
| GET | `/api/leaderboards` | List user's leaderboards |
| GET | `/api/leaderboards/:id` | Get leaderboard with ranked members |
| PUT | `/api/leaderboards/:id` | Update settings (organizer) |
| POST | `/api/leaderboards/join` | Join via invite code (no board id needed) |
| POST | `/api/leaderboards/:id/join` | Join via invite code (legacy form) |

### Posts (Feed)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create post (image → AI → points) |
| GET | `/api/posts` | Get feed (optional `?leaderboardId=`) |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/comment` | Add comment |
| POST | `/api/posts/:id/report` | Report post |
| DELETE | `/api/posts/:id` | Remove post (organizer) |

### Quests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quests` | Get today's quests (auto-generates) |
| POST | `/api/quests/:id/progress` | Update quest progress |

### Trash Spotter
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trash` | Report trash (image → AI severity → points) |
| GET | `/api/trash` | Get reports |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile + badges |
| PUT | `/api/users/:id` | Update profile |
| GET | `/api/users/:id/notifications` | Get notifications |

---

## 🎨 Design System

Based on the Kahoot-inspired prototype created in Claude Design:

| Token | Value | Usage |
|-------|-------|-------|
| Navy 900 | `#16162B` | App background |
| Green | `#00E676` | Primary accent, CTAs |
| Purple | `#7C4DFF` | Secondary accent |
| Coral | `#FF6B6B` | Danger, trash spotter |
| Yellow | `#FFD23F` | Gold, quests |
| Display font | Fredoka | Headlines, buttons |
| Body font | Nunito | Body text, labels |

---

## 📝 Points Rubric

| Category | Max | Example Actions |
|----------|-----|-----------------|
| Transportation | 40 pts | Walking (15 + 1/mi), Biking (15 + 0.8/mi), Transit (10 + 0.5/mi) |
| Waste Reduction | 30 pts | Recycling (10-20), Composting (15), Zero-waste shopping (20) |
| Energy | 25 pts | Line drying (12), Natural light (8), Cold wash (8) |
| Food & Consumption | 30 pts | Plant-based meal (15), Growing food (20), Buying secondhand (15) |
| Nature & Community | 20 pts | Planting trees (20), Cleanup event (20), Educating others (15) |

**Bonus multipliers:** First action of day (1.1×) · 7-day streak (1.25×) · Quest completion (2×) · Tagged friends (+5 each, max 3)

---

## 🔒 Security

- All secrets in `.env` (never committed)
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens in httpOnly cookies (7-day expiry)
- AI endpoint rate limited: 20 analyses/user/day
- Image uploads validated (type + 5MB max)
- User inputs validated server-side (zod schemas) + parameterized SQL (no string-built queries)
- Reported posts are flagged for organizer moderation; only the post owner or leaderboard organizer can hide a post
