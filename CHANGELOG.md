# Changelog

## 0.2.0 — 2026-10-21 (unreleased)

### Personalization
- Onboarding and Style & fit ask what you usually wear (men’s, women’s or both). Menswear leaves dresses and skirts out of picks, swaps, packing lists, onboarding examples and the sample closet.
- The + button opens a menu: Make an outfit, or Log or post a fit.
- Privacy & data → Clear wardrobe removes every piece, photo, saved outfit and wear history while keeping settings, events and trips.

### Adding clothes
- **Several pieces in one photo:** snap or pick one photo, drag a box around each piece, and each box becomes its own item with an on-device colour suggestion.
- **Find pieces for me (optional):** a Cloudflare Worker (`worker/detect`) uses Claude vision to draw the boxes and suggest category, colour and name. Off until deployed and `EXPO_PUBLIC_DETECT_URL` is set.
- AI suggestions now cover every detail: category, main and accent colours, a short detail (e.g. "Crewneck"), pattern, fit, style tags, dressiness, warmth and water resistance. Single photos get a **Fill in details for me** button. Suggested values survive a category change and open More details for review.
- New **Socks** category (Accessories): tracked in the closet and laundry, never added to outfits.
- Editor: new optional **Detail** field.
- Fixed the profile avatar initial being clipped on iOS.

### Platform
- Upgraded to Expo SDK 58 (React Native 0.88) for the current Expo Go.

### Social (demo backend)
- New **Social** tab (Following / Discover) replaces Plan on the tab bar. Plan now opens from Today and Profile.
- Feed, post detail, comments with replies, likes, saves and collections, search, profiles, follow requests, blocking, reporting, activity center, social settings, moderation queue prototype, community guidelines.
- Compose with camera (front/rear), library (up to 4), crop, caption, style tags, opt-in item tags (brand and name hidden by default), audience, preview, autosaved draft. Photos are re-encoded to strip metadata.
- Seeded demo accounts, labelled "Demo" and hideable.

### Recreate With My Closet
- Deterministic similarity engine with honest match levels, reasons, swaps, save and wear.

### Backend
- Supabase schema with RLS, private storage, rate limits, triggers and account deletion; 31 server-side tests; client adapter (not yet wired).

### Research
- Jev verified and benchmarked (harness); decision: experiment later behind a flag. Supabase chosen over Firebase. App Store and Play UGC requirements documented.

### Marketing
- Launch film v2 (45 s plus a 15 s teaser) with social and Recreate scenes; website, store screenshots and listing updated.


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
