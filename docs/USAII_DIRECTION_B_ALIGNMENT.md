# USAII Global AI Hackathon 2026 Direction B Alignment

## Direction

**Direction B: My School's Hidden Footprint**

EcoRise is an AI-powered school footprint coach. It helps a class, club, or school board discover which everyday habits are creating hidden environmental impact, then turns that discovery into source-backed learning and verified action.

## Core Demo Story

1. A student signs in and lands directly on the **AI Footprint Coach**.
2. The coach reads local board activity: verified actions, CO2e saved, and underrepresented action categories.
3. Retrieval-augmented AI pulls from approved environmental sources to produce a cited question, explanation, daily tip, and practical recommendation.
4. The student acts on the recommendation and logs a photo.
5. AI vision checks the submission, deterministic code calculates impact and points, and the leaderboard updates.

This gives judges a complete loop: **local input -> AI reasoning -> grounded insight -> real-world action -> measured impact**.

## Rubric Mapping

| Rubric area | How EcoRise addresses it |
| --- | --- |
| Problem Understanding, 30% | The problem is local and specific: students usually cannot see the hidden footprint of school habits like commuting, lunch waste, energy use, and campus cleanup. |
| AI Reasoning, 20% | AI is not decorative. It retrieves approved evidence, identifies weak local action categories, generates cited questions, and recommends next steps from the current school board data. |
| Solution Design, 20% | The main screen explains the system as input, AI reasoning, insight, and action. The app includes onboarding, coach, evidence panel, logging, feed, quests, and leaderboard. |
| Impact and Insight, 20% | EcoRise moves beyond awareness by tying insight to verified photo submissions, CO2e math, capped learning points, and visible leaderboard progress. |
| Responsible AI, 10% | Citations are visible, learning points are capped, source approval is human controlled, impact math is deterministic, and organizers moderate boards and posts. |

## Responsible AI Controls

- The LLM cannot directly award points.
- Learning points are intentionally small and capped to prevent quiz farming.
- AI-generated questions and tips must show sources.
- Impact estimates come from deterministic carbon math instead of free-form model claims.
- Human organizers approve boards, sources, and moderation decisions.
- Demo/mock modes are explicitly labeled so judges can tell what is simulated.

## Judge-Facing One-Liner

EcoRise uses AI to reveal a school's hidden environmental footprint, teach students from cited sources, and convert recommendations into verified local action.
