# EcoRise — Privacy, FERPA & COPPA (Phase 2)

EcoRise is used by students, some of whom are minors. Privacy is built as an engine,
not a settings page. This document is the design + the model/data card. The live,
machine-readable version is served at `GET /api/privacy/policy` and rendered in-app
under **Profile → Privacy & data**.

## 1. Tenant model (data isolation)

The tenant boundary is the **leaderboard** (a class/board), not a separate `school_id`.
A board is a closed group:

- Every board-scoped read/write is gated by membership (`isBoardMember` /
  `isMemberOrOrganizer`). A non-member gets `403`.
- The unscoped feed only returns board-less posts plus boards you belong to
  (`routes/posts.js`).
- Member lists deliberately **omit `email`** — no PII leaks to other members
  (`routes/leaderboard.js`).
- Cross-board access (reading another board's audit log, changing its policy,
  reviewing its posts) is denied. Proven by `test/privacy.test.js`
  ("cross-board isolation").

A dedicated `school_id` column on every table was evaluated and **rejected as
redundant churn**: membership already enforces isolation. We hardened and tested the
existing boundary instead of adding a parallel one.

## 2. Consent (COPPA/FERPA) — enforced before capture

Each board has a `consent_mode`; consent is recorded per `(board, member)` in
`consent_records` and **checked before any photo is accepted** — before any paid AI
call (`consentSatisfied` in `utils/privacy.js`, gate in `routes/posts.js` +
`routes/trashspotter.js`). A blocked upload returns `403 { reason: 'needs_consent' }`.

| Mode | Meaning | What satisfies it |
|------|---------|-------------------|
| `demo` | Synthetic/demo board, no real student PII | always |
| `classroom` (default) | Teacher attests roster-level consent | a member's `attested` or `granted` record |
| `parent` | Per-student parent-approved (strictest) | a `granted` record only |

- New boards default to `classroom` (privacy-forward). The **demo board is seeded as
  `demo`** so judging is frictionless.
- The board **organizer (teacher) is auto-consented** on board creation — they are an
  adult opting into their own participation.
- A student may self-attest (`attested`) or revoke their own consent. **Granting**
  parent-tier consent, or acting on behalf of another student, requires the organizer.

## 3. Image retention — minimize by default

After the AI analyzes a photo, `applyRetention` (`utils/privacy.js`) decides what — if
anything — is persisted. The dedup hash + perceptual hash are computed from the **full**
image first, so anti-fraud is unaffected by what we choose to keep.

| Mode | Stored | Notes |
|------|--------|-------|
| `minimize` (default) | a downscaled thumbnail (jimp, ≤128px) | never the full-resolution original |
| `standard` | the full image | teacher opt-in, shown with a warning |
| `24h` | full image, then purged | `purgeExpiredImages` sweeps on boot + every 60s |
| `do_not_store` | nothing (label + hash only) | the feed renders a designed action tile |

When no image is stored, the feed shows a designed action-typed gradient + the
`derived_label`, not a broken image (`Pages.jsx`).

## 4. Teacher review before publication

A board can set `review_required`. Then a new eco post is held as `status='pending'`:

- It is **hidden from the feed and the public leaderboard view** until approved.
- Points are computed but **reversed exactly on rejection** — the review route reads the
  `point_events` row by `source_id = postId` and claws back the credited points, so a
  rejected post cannot inflate a rank (`routes/privacy.js`,
  proven by `test/privacy.test.js`).
- The author is notified of the decision.

> Known tradeoff: during the pending window the author's points are credited (and
> reversed on rejection) rather than withheld. This keeps the common award path in
> `pointsEngine` untouched; review is OFF by default.

## 5. Data-subject rights

- `GET /api/privacy/export` — downloads everything we hold about the requester as JSON.
- `POST /api/privacy/account/delete` (`{confirm:true}`) — irreversibly erases the user.
  Boards they organize are deleted first (cascading those boards' members/posts/trash),
  then the user row cascades the rest. The session cookie is cleared.

## 6. Audit log

Every privacy-relevant action (consent change, policy change, post review, export,
delete) is written to `audit_log`. It has **no foreign key on the actor**, so the
"who-did-what" trail **survives an account deletion**. Organizers can read their board's
trail at `GET /api/privacy/audit`.

## 7. Model / data card

| Model | Use | Limits |
|-------|-----|--------|
| OpenAI `gpt-4o-mini` (vision + text) | Perceives the photo, proposes an action label + attributes. **Never** awards points or computes CO₂e. | May misclassify unusual photos; gated by a confidence floor + adversarial fraud screen. |
| `text-embedding-3-small` | Embeds the approved research corpus for retrieval. | Retrieval is brute-force cosine over the corpus — a documented demo-scale choice. |
| In-repo ONNX litter CNN | Offline fallback for trash detection (no API key). | Trained on a public litter dataset; coarse severity only. |

**Responsible-AI thesis:** perception (the LLM) and calculation (a deterministic carbon
engine using cited EPA/OWID factors) are split. The model proposes; the server disposes.
Points are computed server-side and capped; the LLM cannot mint them.

## 8. Honest limitations (not faked)

- `classroom`/`parent` consent records the school's attestation; it is **not** a
  substitute for the school's own signed parental-consent forms. We record and enforce
  the state, we do not collect the legal document.
- The demo board is intentionally open (`demo` mode) for judging.
- Retrieval is brute-force (no vector index yet) — fine at demo scale, documented as a
  migration path.
- No real classroom pilot has run; all footprint figures ship with honest confidence
  labels.

## Endpoint reference

| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| GET | `/api/privacy/policy` | public | model/data card |
| GET | `/api/privacy/consent?leaderboardId=` | member | my consent state |
| POST | `/api/privacy/consent` | member / organizer | record/attest/grant/revoke consent |
| POST | `/api/privacy/boards/:id/privacy` | organizer | set consent mode, retention, review |
| GET | `/api/privacy/boards/:id/review-queue` | organizer | pending posts |
| POST | `/api/privacy/posts/:id/review` | organizer | approve / reject (reverses points) |
| GET | `/api/privacy/audit?leaderboardId=` | organizer | board audit trail |
| GET | `/api/privacy/export` | self | download all my data |
| POST | `/api/privacy/account/delete` | self | erase my account |
