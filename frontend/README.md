# EcoRise Frontend

React + Vite mobile-first client for EcoRise.

## Product Direction

The interface uses the **Botanical Ledger** design system: white paper surfaces, moss-green hierarchy, restrained seed-gold accents, and subtle source-card texture. It should feel credible enough for educators and polished enough for a hackathon demo.

## Key Screens

- `Home.jsx`: points, climate fact, Coach entry, leaderboard preview, quick actions, quests.
- `Coach.jsx`: cited AI Eco Coach questions, explanations, caps, guidance, and daily tips.
- `Pages.jsx`: feed, leaderboard, profile, organizer moderation/settings.
- `Modals.jsx`: photo logging and Trash Spotter flows.
- `AIEvidence.jsx`: judge-facing AI reasoning panel after submissions.

## Design Rules

- Keep green as the primary accent. Use seed-gold for prizes and clay only for warning/destructive states.
- Do not reintroduce dark-neon or purple-gradient styling.
- Preserve the sliding screen transition and scroll reset behavior in `App.jsx`.
- Keep auth fields label-associated for accessibility and testability.
- Never let the client supply points. Points shown in the UI must come from server responses.

## Local Commands

```bash
npm run dev
npm run lint
npm run build
```
