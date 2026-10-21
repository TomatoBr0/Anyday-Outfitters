# PROGRESS — Getup (formerly AnyDay Outfitters)

_Last updated: 2026-10-21 · branch `rebuild/expo-mvp`_

## Where things stand

The MVP app is **built, tested in a browser at iPhone size, and bundles for iOS**. It has **not yet been run on a physical iPhone**: the cloud environment has no device. That's the first next step, and it's yours (about 10 minutes, see below).

## Acceptance criteria (Part 23)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Expo app launches | ✅ Web build launches; iOS Hermes bundle exports cleanly | `npx expo export --platform ios` OK; Playwright run |
| 2 | Onboarding completes | ✅ | e2e: name, styles, fit, temp, city, sample closet |
| 3 | Add clothing from photos | ⚠️ Built; **needs a device to verify** camera/library | Editor, rotate/crop, color suggestion (unit-tested decoder) |
| 4 | Edit clothing details | ✅ | Editor in edit mode; e2e mark-dirty |
| 5 | Clothing survives restart | ✅ | `store.test.ts` restart simulation; e2e reload |
| 6 | Browse and filter closet | ✅ | e2e: category, search, hamper, list/grid |
| 7 | Generate complete outfits | ✅ | 32 engine tests; e2e |
| 8 | Dirty clothing excluded | ✅ | Engine tests ×3 |
| 9 | Weather influences picks | ✅ | Engine weather tests; e2e rain run yields "Rain-ready" |
| 10 | Save outfits | ✅ | e2e |
| 11 | Mark outfits worn | ✅ | e2e; undo tested |
| 12 | Outfit history preserved | ✅ | Store test + e2e reload |
| 13 | Cohesive, polished UI | ✅ Reviewed via 30+ screenshots | `marketing/screens`, `marketing/app-store` |
| 14 | Critical automated tests pass | ✅ **53/53 Jest**, **22/22 e2e**, tsc and ESLint clean | See below |
| 15 | Usable setup instructions | ✅ | `README.md` |
| 16 | Testable on a physical iPhone | ⚠️ Ready; blocked only on device access | Expo Go SDK 57 + login steps in README |

## Test results (this session)

- `npm test`: **53 passed** (engine 32, color detection 6, store/persistence 8, weather 7).
- `npx tsc --noEmit`: clean. `npx eslint src tests`: clean (Expo + React Compiler rules).
- `tools/qa.mjs` against the web export: **22/22 checks, 0 console errors**.
- iOS export: `entry-*.hbc` (4.4 MB) built.

## Completed

- **App:** every tab and screen in `CHANGELOG.md` (onboarding, Today, Closet, Create, Plan with calendar, events and trips, Profile, settings, laundry, history, saved outfits, item editor).
- **Engine:** hard constraints, a six-factor explainable score, variety, decaying feedback learning, swaps, packing, laundry.
- **Brand:** naming research, strategy, guidelines, logo family (SVG/PNG), icons, tokens. AA contrast verified and fixed.
- **Marketing:** website (static, ready for Cloudflare Pages, waitlist function), five App Store screenshots, Play feature graphic, social set, store copy, the **rendered** launch film (vertical, horizontal, teaser) with an original soundtrack.
- **Docs:** architecture, engine, testing, launch checklists, privacy and terms drafts, premium plan, renaming guide.
- **Brand presentation (shareable):** https://claude.ai/artifact/73AXPA1R98rY95CJniqeDG (private until you share it).

## Unresolved issues / known limits

1. **Device-only paths are unverified:** camera, photo library, the iOS permission prompts, haptics, `Alert` action sheets, VoiceOver and Dynamic Type at the largest sizes. Use the manual checklist in `docs/TESTING.md`.
2. **Expo Go SDK timing.** The project is on SDK 57, which App Store Expo Go supports today. When Expo Go moves to SDK 58 (Expo says "within a few weeks" of Oct 15), upgrade with `npx expo install expo@^58.0.0 --fix`. Note SDK 58's `File.write()` becomes async; the app doesn't call it.
3. **Open-Meteo's free tier is non-commercial.** It's fine for the MVP and beta. Switch before monetizing.
4. **Garment-type auto-detection isn't implemented.** Only color is suggested, and the UI says so. Background removal is labelled "planned".
5. **Live Open-Meteo calls weren't exercised** from the sandbox (the host is blocked). Parsing is tested against recorded responses.
6. Typed routes: `.expo/types` is generated on the first `expo start`. `tsc` passes without it.
7. `npm audit` reports advisories in transitive dev-tooling dependencies of the Expo template. They don't ship in the app bundle. Revisit at the SDK 58 upgrade.

## Exact next task

**Run it on your iPhone** (Windows PowerShell):

```powershell
git clone https://github.com/TomatoBr0/Anyday-Outfitters.git
cd Anyday-Outfitters
git checkout rebuild/expo-mvp
npm install
npx expo login
npx expo start            # or: npx expo start --tunnel
```

In Expo Go, sign in with the same account and scan the QR code. Then work through `docs/TESTING.md` § Manual (17 steps) and note anything off.

## After that (suggested order)

1. Fix anything the device pass finds.
2. Decide on the name (trademark search) → domain → deploy `website/` to Cloudflare Pages with a KV waitlist (commands in `website/README.md`).
3. Upgrade to SDK 58 once App Store Expo Go supports it.
4. Make an EAS development build (needed later for payments, background removal and calendar sync).
5. Plus features: analytics, then sync (Supabase repository), then calendar import.

## Commands to resume development

```bash
npm install
npm run check                    # typecheck + lint + 53 tests
npx expo start                   # dev server (scan with Expo Go)
npx expo start --web             # browser preview

# QA / assets (tools/)
npx expo export --platform web --output-dir /tmp/web
cd tools && npm install && node serve.mjs /tmp/web 8081 &
node qa.mjs http://localhost:8081 ./qa-out          # 22 e2e checks
node screens.mjs http://localhost:8081 ../marketing/screens light
node promo.mjs                                      # store + social graphics
node brand.mjs                                      # logo PNG exports
node icons.mjs ../assets/images                     # app icons
```
