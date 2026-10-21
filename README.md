# Getup — your closet, your weather, your outfit

> **Get up. Get dressed. Get going.**
> Getup turns the clothes you already own into a ready-to-wear outfit every morning. It weighs the weather, your plans, what's in the laundry and what you've worn lately. **Getup Social** adds outfit sharing and *Recreate With My Closet*: see a look you like, and get it from your own clothes.

*Working title was "AnyDay Outfitters". "Getup" is the provisional brand; see [`branding/NAMING.md`](branding/NAMING.md). To rename it, see [`docs/RENAMING.md`](docs/RENAMING.md).*

---

## What's in this repo

| Path | What |
|---|---|
| `src/app/` | Screens (Expo Router file-based routes) |
| `src/components/` | Design-system components (buttons, chips, cards, icons, logo, garment glyphs) |
| `src/features/` | Feature modules (closet, outfits, onboarding, weather, trips) |
| `src/engine/` | **Outfit recommendation engine.** Pure TypeScript, runs offline |
| `src/services/` | Weather (Open-Meteo), location, photo storage, on-device color suggestion |
| `src/storage/` | Local persistence (repository abstraction + migrations) |
| `src/state/` | App state (zustand) with debounced write-through persistence |
| `src/theme/` | Design tokens (colors, type, spacing, motion) and light/dark theming |
| `src/social/`, `src/state/social.ts` | Social rules, demo backend, Supabase adapter |
| `supabase/` | Shared-backend schema (RLS) + server-side tests |
| `bench/` | Reproducible recommendation benchmark (deterministic vs Jev) |
| `tests/` | Jest unit/integration tests (77 tests) |
| `tools/` | Asset rendering + end-to-end QA scripts (Playwright). Not shipped in the app |
| `branding/` | Naming research, brand guidelines, logo SVGs, exported icons, tokens |
| `website/` | Marketing landing page (static, ready for Cloudflare Pages) |
| `marketing/` | App Store copy, screenshots, launch video, social assets |
| `docs/` | Architecture, engine, privacy/terms drafts, testing, launch checklists |
| `legacy/` | The previous Vite prototype, kept for reference only |

## Run it on your iPhone (from Windows)

You need **Node.js 22 LTS** (22.13 or newer), a **free Expo account**, and the **Expo Go** app from the App Store.

```powershell
git clone https://github.com/TomatoBr0/Anyday-Outfitters.git
cd Anyday-Outfitters
git checkout rebuild/expo-mvp
npm install
npx expo login          # sign in with your Expo account
npx expo start
```

1. On the iPhone, open **Expo Go** → tap the avatar (top right) → sign in with the **same** Expo account. Expo Go now requires this.
2. Keep the phone and PC on the **same Wi-Fi**, then scan the QR code in the terminal with the iPhone **Camera** app.
3. If the phone can't reach your PC (a school or office network, or Windows Firewall), run `npx expo start --tunnel`.

**SDK version:** the project targets **Expo SDK 57**, which the App Store version of Expo Go supports as of October 2026. When Expo Go updates to SDK 58 (expected within weeks), it will say the project is incompatible. Upgrade with:

```powershell
npx expo install expo@^58.0.0 --fix
npx expo-doctor
```

No Xcode or Mac is needed for development. Publishing to the App Store later uses EAS Build in the cloud (see [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md)).

### Other ways to run it

```powershell
npx expo start --web     # browser preview (camera/photos/haptics are limited on web)
npm test                 # 77 Jest tests (engine, recreate, social, store, weather, color)
npm run typecheck        # TypeScript
npm run lint             # ESLint (expo config + React Compiler rules)
npm run check            # all three
```

## How it works (short version)

- **Local-first.** The closet, outfits, history, events and trips live in AsyncStorage, one key per collection. Photos are saved as resized JPEGs in the app's documents folder, stored by relative path. There's no account and no server.
- **Recommendations.** These are deterministic and explainable, not a paid LLM. Hard filters remove dirty or unavailable items and extreme weather mismatches. A weighted score covers style, color, weather, occasion, learned preference and rotation. Every pick comes with reasons. Details: [`docs/RECOMMENDATION_ENGINE.md`](docs/RECOMMENDATION_ENGINE.md).
- **Learning.** Likes, dislikes and wears adjust item and pair affinities with a 60-day half-life. It's transparent counting, not ML.
- **Weather.** This uses [Open-Meteo](https://open-meteo.com). There's a 30-minute cache, a stale cache for up to 3 days when offline, and a clearly labelled seasonal estimate otherwise. *Open-Meteo's free tier is non-commercial; see the launch checklist.*
- **Photos → color.** The main color is suggested on-device: the photo is resized to 32×32, the PNG is decoded in JS, the background is subtracted, and colors are matched to the palette. It's a suggestion the user confirms. Garment type isn't auto-detected yet, and the UI says so.

## Project status

Social details: [`docs/SOCIAL.md`](docs/SOCIAL.md). Jev evaluation: [`docs/JEV_RESEARCH.md`](docs/JEV_RESEARCH.md).

See [`PROGRESS.md`](PROGRESS.md) for what's done, test results, known issues and the exact next steps. [`CHANGELOG.md`](CHANGELOG.md) has the version history.
