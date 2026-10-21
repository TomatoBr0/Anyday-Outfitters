# Social platform & Recreate With My Closet

## What's built

| Area | Where | Status |
|---|---|---|
| Social tab (Following / Discover) | `src/app/(tabs)/social.tsx` | ✅ UI, pagination, pull-to-refresh, skeletons, empty states |
| Post card, carousel, flat-lay for photo-less posts | `src/features/social/components.tsx` | ✅ |
| Compose: camera (front/rear), library (≤4), crop, caption, style tags, opt-in item tags, audience, **preview before publish**, autosaved draft | `src/app/social/compose.tsx` | ✅ |
| Post detail, comments, one level of replies, delete, report, disable comments | `src/app/social/post/[id].tsx` | ✅ |
| Profiles: grid, followers/following, private accounts, edit, avatar | `src/app/social/user/[id].tsx`, `edit-profile.tsx` | ✅ |
| Follow, requests, approve/decline, remove follower, block/unblock | `src/state/social.ts`, `connections.tsx` | ✅ |
| Saved posts and private collections | `src/app/social/saved.tsx` | ✅ |
| Search (people, @usernames, #styles, pieces, captions) | `src/app/social/search.tsx` | ✅ |
| Activity center and notification preferences | `notifications.tsx`, `settings.tsx` | ✅ in-app. Push is not built (architecture-ready) |
| Reporting (posts, comments, accounts), moderation queue, community guidelines | `moderation.tsx`, `guidelines.tsx` | ✅ prototype |
| **Recreate With My Closet** | `src/engine/recreate.ts`, `src/app/social/recreate/[postId].tsx` | ✅ |
| Shared backend schema + RLS | `supabase/migrations/0001_social.sql` | ✅ written, **31 server-side tests pass** on Postgres 16 |
| Backend client adapter | `src/social/supabaseBackend.ts` | ⚠️ written. **Not wired to the UI**: needs a Supabase project (your approval) |

## Two backends, one shape

- **Demo backend (running now).** `src/state/social.ts` persists to AsyncStorage on the phone. Seeded accounts are fictional, flagged `demo`, labelled **"Demo"** in the UI, and can be hidden in Social settings. Their like counts are illustrative, not real engagement. Nothing is shared between devices.
- **Shared backend (next).** Supabase (Postgres + Auth + Storage), chosen in `docs/BACKEND_DECISION.md`. Every rule is enforced server-side by RLS and SECURITY DEFINER functions:
  - who can read a post: `can_view_post()`, covering author, audience, private accounts, blocks, suspensions and moderator removal;
  - follows to private accounts only via `request_follow()` / `respond_follow_request()`; direct inserts are refused (tested);
  - private wardrobe tables and the `wardrobe` bucket are owner-only;
  - `post-media` is a **private** bucket served by signed URLs, readable only if the post is visible;
  - rate limits by trigger (posts 10/h, comments 30/min, likes 60/min, follows 30/min, reports 20/h);
  - `delete_my_account()` cascades everything (App Store 5.1.1(v));
  - role and suspension columns can't be self-edited.
- The demo mirrors the same visibility rules in `src/social/rules.ts` (unit-tested), so the UI behaves the same when the backend is switched on.

Run the server-side tests: `bash supabase/tests/run.sh` (spins up a throwaway local Postgres).

## Recreate With My Closet

For each tagged piece in the inspiration post, every same-slot item in your closet is scored:

| Factor | Weight | Notes |
|---|---|---|
| Category | 0.34 | Same category 1.0; same layer (sweater↔hoodie) 0.7; same shoe kind 0.85; other same-slot 0.5 |
| Color | 0.30 | CIELAB distance with lightness half-weighted (light- vs mid-wash denim reads close) |
| Style | 0.16 | Best tag affinity (same tag / same family) |
| Formality | 0.10 | |
| Fit | 0.05 | |
| Pattern | 0.05 | |

**Match levels are never overstated:** *Exact* means same category and same color with no fit or pattern conflict. *Close* means the same family. *Stand-in* fills the role. *Missing* means nothing suitable, and the screen says what's missing rather than forcing a match. Dirty or unavailable items are never picked by default. Pieces aren't reused. Every match shows reasons, swaps re-score live, and the result is deterministic (unit-tested in `tests/recreate.test.ts`). It works offline and needs no image AI.

## Feed ranking (transparent, not engagement-maximizing)

- **Following:** reverse-chronological, from accounts you follow, plus your own posts.
- **Discover:** public posts scored as 0.45 × style match to your aesthetics + 0.25 × "you own similar pieces" + 0.30 × recency (72 h half-life). **Like counts are deliberately not an input.** Each card says why it's shown ("Matches your style", "You own similar pieces", "New"). The feed ends with "You're all caught up." There's no infinite autoplay.

## Privacy & safety specifics

- Social is **opt-in**. The wardrobe works with no account, and Social browsing works in demo without a profile.
- New profiles are **private by default** (recommended for teens). Style preferences are shown publicly only if the user picks them.
- Item tags carry category, color, pattern, fit and style. **Brand and item name are off unless the user turns them on per post.** Tags never link to the private wardrobe record.
- Photos are re-encoded on device before posting (`processImage`). This removes EXIF and GPS metadata.
- Blocking is silent, mutual and severs follows. A blocked account can't find the blocker, see their posts or media, or re-follow (tested server-side).
- The store requirements (Apple 1.2 UGC, 5.1.1(v), Google Play UGC, COPPA and state laws) are in `docs/UGC_STORE_REQUIREMENTS.md`. **Don't launch public social until the backend, a staffed moderation process and an age gate are live.**

## Tests

- `tests/social.test.ts`: visibility rules, ranking, validation, rate limiting, and the local service (posts, likes, comments, permissions, private accounts, blocking, pagination, collections, search, reports, demo filter).
- `tests/recreate.test.ts`: exact, close, stand-in and missing levels, dirty exclusion, no reuse, determinism, swaps, disclosure.
- `supabase/tests/rls_test.sql`: 31 server-side enforcement checks.
- `tools/qa-social.mjs`: 18 end-to-end checks in the real app UI.
