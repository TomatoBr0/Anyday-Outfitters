# Testing

## Automated (run before every push)

```bash
npm run check        # tsc + eslint + jest
```

| Suite | Tests | Covers |
|---|---|---|
| `tests/engine.test.ts` | 32 | Hard constraints, structure, fallbacks, weather, occasion, color, variety, learning, swap, laundry, packing |
| `tests/colorDetect.test.ts` | 6 | PNG decoding (RGB/RGBA), palette matching, garment-vs-background detection, stripes |
| `tests/store.test.ts` | 8 | Persistence across a simulated restart, corrupt-data recovery, undo, delete cascades, dedupe, samples, reset, migrations |
| `tests/weather.test.ts` | 7 | WMO codes, parsing, day snapshot, missing fields, offline estimate, cache fallback, seasonal model |

### End-to-end (web build + Playwright)

`tools/qa.mjs` drives the real app at iPhone size (390×844 @3x) in headless Chromium, with Open-Meteo mocked. It runs 22 checks: onboarding (name, styles, fit, temperature, city search, sample closet) → Today → regenerate → occasion → save → wear → **reload persistence** → closet filter/search/list → item detail and mark dirty → builder fill and swap → event creation → trip packing → profile insights → laundry → settings → dark mode → rain forecast changes the outfit. Screenshots go to the output folder.

```bash
npx expo export --platform web --output-dir /tmp/web
cd tools && npm install && node serve.mjs /tmp/web 8081 &
node qa.mjs http://localhost:8081 ./qa-out
```

Last run: **22/22 passed, 0 console errors** (see PROGRESS.md).

## Manual: physical iPhone (Expo Go)

These can't be automated from the cloud environment. Please run them once on your phone.

| # | Step | Expected |
|---|---|---|
| 1 | Fresh install → onboarding → "Use my current location" | iOS prompt appears with Getup's explanation; Allow → city name shown |
| 2 | Same, but tap **Don't Allow** | Friendly message; city search still works |
| 3 | Closet step → **Take photos** | Camera permission prompt → camera → square crop → editor opens |
| 4 | In the editor | "Suggested from photo" color badge appears within about a second; you can change it |
| 5 | Pick a category → Add to closet | Item appears in Closet with your photo |
| 6 | Add → **Choose from library**, select 3 photos | Editor walks through "Item 1 of 3" → "Save & next" |
| 7 | Rotate / Square crop before saving | Saved photo reflects rotation and crop |
| 8 | Force-quit Expo Go, reopen the project | Closet, photos, outfits and history are all still there |
| 9 | Today → tap a garment tile | Action sheet: Lock / Swap / View |
| 10 | Lock a piece → refresh | New outfits keep the locked piece |
| 11 | Wear today → Undo in the toast | Wear count and hamper state restored |
| 12 | Airplane mode → pull to refresh on Today | Weather shows cached data or "estimate"; outfits still generate |
| 13 | Settings → Dark | Whole app switches theme; Light/System work |
| 14 | iOS Settings → Accessibility → Larger Text (max) | Text scales up to 1.6×; no overlapping controls on Today or Closet |
| 15 | VoiceOver on → swipe through Today | Weather, outfit pieces, buttons and tabs all announce meaningful labels |
| 16 | Delete an item that's in a saved outfit | Outfit keeps the remaining pieces |
| 17 | Profile → Privacy & data → Delete all data | Returns to onboarding; closet empty; photos removed |

## Known limits of the test setup

- Camera, photo library, haptics, the iOS permission dialogs and `Alert` action sheets are native-only. The web QA can't exercise them; the manual checklist covers them.
- Open-Meteo is blocked from the build sandbox, so automated tests use recorded responses. Live calls were not exercised from CI.
