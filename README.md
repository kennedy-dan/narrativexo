# Narratives.XO — P2 (Revised)

## Install
pnpm i

## Env
cp .env.example .env.local
# add OPENAI_API_KEY or provider of choice

## Dev
pnpm dev

## What’s new
- Entry Pathways (Emotion | Audience | Scene | Story Seed)
- Cognitive Clarifier Node (CCN) API + prompt
- Cultural Retuning Layer with tone packs (NG/UK)
- Brand Context is optional; parser invoked only when brand is provided

## Demo Goals (P2.1 Lite)
- Create → Clarify (if needed) → Map → (Optional Brand) → Retune → Generate → Export
- Modes: Creator, Agency, Brand
- Markets: NG, UK (GH/KE/SA staged)


## Walkthrough
See **docs/WALKTHROUGH.md** for a step‑by‑step demo script (Creator | Agency | Brand).

## Key Endpoints
- POST `/api/clarifyEmotion` → CCN confidence + prompt options
- POST `/api/mapStory` → maps emotion/scene/audience to need/archetype/tone/locale
- POST `/api/generateCaption` → builds a caption from narrative fragments
- POST `/api/exportAudit` → returns JSON audit (downloadable)

## Structure Highlights
- `src/components` → EntryPathways, CCNPrompt, ModeSelector, BrandOptionalCard, CulturalRetuneToggle, OutputFormatter
- `src/lib` → confidence calc, mapping logic, cultural retune (stubs), compliance/palette utils (stubs)
- `src/data/toneData` → NG/UK tone packs


## High‑Fidelity Images & Cost Control
- Set `ALLOW_HIGH_FI=true` in `.env.local` to enable hi‑fi quality.
- Protect endpoints with `DEMO_PASSWORD` (send header `X-Demo-Pass`).
- Limit usage with `MAX_GENERATES` quota (in‑memory demo guard).

## Creator Reel Export
- In Creator mode, click **Export Creator Reel (WebM)** to download a text‑only WebM placeholder for demo.

## Contrast / Compliance
- Brand mode shows palette & fonts and a **Contrast Check (AA)** grid (white/black backgrounds) with ratios and pass/fail for normal/large text.
