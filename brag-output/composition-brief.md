# Hyperframes Composition Brief: The ANTS

## Objective
Create a short launch-style brag video for The ANTS.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `c:\Users\USER\Desktop\The-ANTS`
- Primary files read: `README.md`, `ARCHITECTURE.md`, `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/constants/homepage.ts`, `apps/web/src/components/homepage/BentoFeatures.tsx`
- Product name: The ANTS
- Tagline / strongest claim: Master Cambridge & Edexcel Exams. Plan, Focus, and Predict Your Grades. / Ace with us!
- Key UI or visual moment to recreate: Grade Boundary Predictor (Raw 168/200 → Predicted: A*); Pure Math 1 (WMA11) 82% Done; Pomodoro 25:00 Focus Block
- Copy that must appear verbatim:
  - Master Cambridge & Edexcel Exams.
  - Plan, Focus, and Predict Your Grades.
  - The ANTS
  - Predicted: A*
  - Ace with us.
  - Start Studying for Free
  - Built by Top Scholars for Myanmar International Students (short form OK)
- Logo asset: `apps/web/public/logo.png` (copy into composition assets)

## Creative Direction
- Tone preset: polished
- Creative direction: quiet amber academic studio film — confident, Myanmar-specific, never corporate SaaS
- Interpretation: Fewer scenes, longer holds; soft crossfades; JetBrains Mono for numbers; Fraunces + Quicksand; restraint over hype
- Angle: Built by Myanmar exam achievers for the exact boards students sit — plan, focus, predict
- Hook: Giant amber type — “Master Cambridge & Edexcel Exams.”
- Outro / punchline: Ace with us. / Start Studying for Free
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign
  - Clubs/classrooms (retired)
  - Real user PII

## Visual Identity
- Background: #f8fafc
- Text: #0f172a
- Accent: #d97706 / #f59e0b
- Display font: Fraunces (Google Fonts)
- Body font: Quicksand
- Mono: JetBrains Mono
- Visual references from the project: amber primary buttons, Predicted A* chip, syllabus progress bar, pomodoro timer readout, logo.png

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook claim — 3.0s — Master Cambridge & Edexcel Exams.
2. Brand reveal — 3.5s — Logo + The ANTS + Plan, Focus, and Predict Your Grades.
3. Predict the grade — 5.5s — Grade Boundary Predictor → Predicted: A*
4. Plan & focus — 4.5s — WMA11 82% + Pomodoro 25:00
5. Outro — 3.5s — Ace with us. / Start Studying for Free

## Audio
- Audio role: warm bed
- Audio arc: confident bed throughout; soft payoff on A*; fade under outro
- Music: happy-beats-business-moves-vol-1-by-ende-dot-app.mp3
- Music treatment: volume ~0.28; fade under final logo (~1.2s)
- Music cue guidance: bundled preset `c:\Users\USER\.agents\skills\brag\assets\music\cues\happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json` — strong cues ~5.03, 12.02, 17.02 for major moments; beat grid ~0.5s for sequential UI
- Audio-reactive treatment: subtle; amber glow / card presence breathe with RMS
- Audio-coupled moments:
  - Scene 3 A* badge — soft impact / announcement
  - Scene 4 progress fill — soft ticks / switch
  - Scene 5 logo — soft bell
- SFX selection guidance: sparse; match motion; prefer low HF-risk from sfx-analysis
- SFX analysis guidance: `c:\Users\USER\.agents\skills\brag\assets\sfx\sfx-analysis.md`
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music and any Hyperframes-selected SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`. /brag owns the product angle; do not enter the hyperframes entry-point intent interview or generic promo workflow.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet.
- Run `npx hyperframes check` before render — single gate.
