# PROGRESS — Getup (formerly AnyDay Outfitters)

_Last updated: 2026-10-21 · branch `rebuild/expo-mvp` · version 0.2.0 (unreleased)_

**Bottom line.** The wardrobe MVP and the social MVP are built and tested in the browser at iPhone size, and the iOS bundle compiles. Social runs on a **local demo backend**, clearly labelled. The shared Supabase backend schema is written and its security is **tested on real Postgres**, but it isn't connected to the UI yet: it needs a Supabase project, which needs your approval. **Nothing has run on a physical iPhone yet.**

## Test results (this session)

| Suite | Result |
|---|---|
| Jest unit/integration (`npm test`) | **77/77**: engine 32, recreate 9, social 15, store 8, weather 7, color 6 |
| Server-side RLS (`bash supabase/tests/run.sh`) | **31/31** on Postgres 16 |
| E2E core (`tools/qa.mjs`) | **22/22**, 0 console errors |
| E2E social (`tools/qa-social.mjs`) | **18/18**, 0 console errors |
| Benchmark (`npm run bench`) | Deterministic engine: 55/55 objective checks over 11 scenarios, p50 28 ms. Jev and local ML not run (see below) |
| `tsc`, ESLint (Expo + React Compiler rules) | Clean |
| iOS export (Hermes) | Builds |

## Status by area

### Core wardrobe — ✅ MVP complete (device check pending)
Onboarding, closet (photos, batch, rotate/crop, color suggestion, filters, search), laundry, calendar, trips, persistence, themes, accessibility. Plan moved off the tab bar and now opens from Today's calendar button and Profile.

### Outfit recommendations — ✅
Deterministic, explainable, offline engine; 32 tests; benchmark harness in `bench/`.

### Social interface — ✅ MVP (demo data)
Social tab (Following/Discover), feed with pagination, pull-to-refresh, skeletons and empty states; post cards; compose (camera front/rear, library ≤4, crop, caption, style tags, opt-in item tags, audience, preview, autosaved draft); post detail with comments and replies; profiles; follow/requests/approve/remove/block; saved posts and collections; search; activity center; social settings; Share entry points from Today and Create. Details in `docs/SOCIAL.md`.

### Social backend — ⚠️ schema done and tested; not live
- `supabase/migrations/0001_social.sql`: every table you asked for, with foreign keys, unique constraints and indexes, RLS on all tables, private storage buckets, rate limits, triggers and account deletion.
- `supabase/tests/`: 31 server-side checks (audience, private accounts, approval-only follows, blocking both ways, media access, moderator-only reports, removal, rate limits, comment disabling, admin-field protection, account deletion).
- `src/social/supabaseBackend.ts`: client adapter (email OTP auth, feed, publish with uploads, likes, follows, comments, reports). **Not wired into the UI yet.**
- Multi-user acceptance criteria 13–20 are therefore **not met**. Don't treat the demo as production.

### Recreate With My Closet — ✅
`src/engine/recreate.ts` scores category, CIELAB color, style, formality, fit and pattern. It labels each match honestly (exact, close, stand-in or missing), never picks dirty items, never reuses a piece, explains why, supports live swaps, and is deterministic. UI at `/social/recreate/[postId]`; save, wear or fine-tune in Create. 9 tests.

### Jev research — ✅ decided: experiment later behind a flag; don't adopt now
Jev by TypeSafe AI is **verified** (docs.typesafe.ai, REST API, npm SDK, early access since Sept 2026). It's a paid, online-only, text-only decision model with no documented free tier or SLA. The deterministic engine already passes every objective check offline at $0. The harness is ready for a paid trial: set `JEV_API_KEY` and run `npm run bench`. **The request shape is unverified; check it against the docs first.** See `docs/JEV_RESEARCH.md`.

### Privacy & moderation — ⚠️ built and tested; operational process not staffed
Report post, comment or account; silent mutual block; private profiles (default for new profiles); delete own content; disable comments; community guidelines and agreement at sign-up; moderation queue (prototype); rate limits on client and server; EXIF/GPS stripped from photos; private wardrobe never exposed. Store requirements are in `docs/UGC_STORE_REQUIREMENTS.md`. **Still needed before a public launch:** an age gate (COPPA under 13; state laws, two currently enjoined or litigated), a staffed moderation workflow with response times, a published contact, and an automated nudity/abuse filter for images, which isn't built.

### Branding — ✅ updated
Name kept: "Getup" fits social ("post your getup"). Trademark caveat unchanged; Kitted is the fallback. New line: *See it. Recreate it.* Strategy and guidelines updated for social principles. The logo is unchanged; the mark still fits.

### Marketing — ✅ updated
Website gains a "See it. Recreate it." section and safety FAQ. Two new App Store screenshots (06 recreate, 07 social) and a new Instagram graphic. The store listing's social section is marked "publish only once the backend is live".

### Launch video — ✅ re-rendered (v2, 45 s + 15 s teaser)
Adds the social feed and a Recreate tap-through, using real captures and demo accounts. Storyboard, VO script and source are updated. Use "coming soon" framing until the community is live.

## Exact next tasks

1. **You:** run it on your iPhone (commands below), then go through `docs/TESTING.md` § Manual.
2. **Approve or decline** creating a free Supabase project. If approved: `supabase db push` the migration, set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, then wire `supabaseBackend.ts` behind `backendConfigured` (swap the actions in `src/state/social.ts`).
3. Add an age gate and parental-consent flow, then a moderation SOP and an image-safety filter.
4. Optionally, a paid Jev trial through a Worker proxy (decision rules in `docs/JEV_RESEARCH.md`).

## Commands

```powershell
# Run on iPhone (Windows)
git clone https://github.com/TomatoBr0/Anyday-Outfitters.git
cd Anyday-Outfitters; git checkout rebuild/expo-mvp; npm install
npx expo login; npx expo start        # or --tunnel
```
```bash
npm run check                         # tsc + lint + 77 tests
npm run bench                         # recommendation benchmark
bash supabase/tests/run.sh            # 31 RLS tests (needs local Postgres)
npx expo export --platform web --output-dir /tmp/web
cd tools && npm install && node serve.mjs /tmp/web 8082 &
node qa.mjs http://localhost:8082 ./qa && node qa-social.mjs http://localhost:8082 ./qas
```
