# Changelog

## 0.1.0 — 2026-10-21 (MVP, unreleased)

First complete build of **Getup** (working title "AnyDay Outfitters").

### App
- Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · React Compiler.
- Onboarding: welcome, visual style picker, fit, temperature comfort, location (device or city search), first closet items (camera, library batch, manual or sample closet).
- **Today:** weather card, today's event, a complete outfit with reasons and warnings, occasion chips, regenerate, save, like/dislike/not-my-style, lock a piece and rebuild around it, alternatives carousel, "Wear today" with undo, and a dressed state.
- **Closet:** grid and list views, search, category/status/color/style filters, four sorts, item detail with stats, availability, mark clean/dirty, wear history, edit and delete.
- **Item editor:** batch photo queue, rotate, square crop, on-device color suggestion, category defaults, progressive "more details", per-item wash rule.
- **Create:** slot-by-slot builder with ranked candidates, lock/unlock, fill the rest, shuffle, a live match score with reasons, save and wear, and event planning mode.
- **Plan:** month calendar with event and worn markers, per-day weather, events (create/edit/delete, dress code), suggested and planned outfits, trips with forecast-aware packing lists (checklist, custom items, rebuild).
- **Profile:** insights (worn %, most worn, palette), saved outfits, history, laundry, style and fit, weather and location, laundry rules, theme (system/light/dark), haptics, Plus (planned features), privacy and data (export, remove samples, delete all), about.
- **Engine:** hard filters, a six-factor weighted score, diversity, decaying feedback learning, swaps, packing, laundry rules.
- **Services:** Open-Meteo forecast with a 30-minute cache, a stale cache up to 3 days, and a labelled seasonal estimate; geocoding; foreground location rounded to about 1 km; photo pipeline storing relative paths.
- **Accessibility:** labels and roles throughout, ≥44 pt targets, Dynamic Type up to 1.6×, every color pair verified against WCAG AA.

### Quality
- 53 Jest tests: engine, color detection, store/persistence, weather.
- 22-check Playwright end-to-end run on the web build: all pass, 0 console errors.
- `tsc` and ESLint (Expo + React Compiler rules) are clean.
- iOS Hermes bundle exports successfully.

### Brand & marketing
- Naming research (34 candidates, 5 finalists), strategy and guidelines; logo family (SVG and PNG, light/dark/mono); app icons; tokens.
- Landing page with privacy and support pages and a Cloudflare Pages Function for the waitlist.
- App Store screenshots, Play feature graphic, social assets, store listing copy.
- Launch film: 40 s vertical and horizontal plus a 15 s teaser, with an original soundtrack.
