# Narratives.XO — P2 (Revised) Walkthrough

This guide shows how to demo the **Entry Pathways → CCN → Mapping → (Optional Brand) → Cultural Retune → Generate → Export** flow.

## 1) Run locally
```bash
pnpm i
cp .env.example .env.local
pnpm dev
# open http://localhost:3000
```

## 2) Choose a mode
- **Creator** → short reel + caption
- **Agency** → storyboard/deck notes
- **Brand** → tone locks + compliance preview

## 3) Pick an Entry Pathway
- **Emotion‑First** (e.g., *Inspiring*)
- **Audience‑First** (e.g., *Urban Professionals*)
- **Scene‑First** (e.g., *Lagos Café*)
- **Story Seed** (paste a line)

XO will ask a **single CCN question** only if needed (low confidence).

## 4) (Optional) Add a Brand
Click **Add Brand** → enter a name.
This unlocks brand-aware mapping and the (stub) parser endpoint.

## 5) Cultural Retune
Toggle **✨ Make it feel more local** to apply market tone packs (NG/UK included).

## 6) Generate
Click **Generate** → this calls `/api/mapStory`, then applies retuning client-side (stub).

## 7) Outputs
- **Creator**: click **Generate Caption** (button in output) → shows a caption built from narrative fragments.
- **Agency**: storyboard/deck notes list.
- **Brand**: shows tone locks and brandApplied flag.

## 8) Export Audit
Click **Export Audit** → downloads `xo_audit.json` with need, archetype, tone, locale, brandApplied, etc.

## Notes
- This is a *lite demo* for P2.1: services are stubs by design.
- Swap `ng.json` / `uk.json` with real tone packs as they’re curated.
- Wire your existing brand parser to `/api/parseBrandGuide` when ready.
