# Getup launch film

**Status: rendered.** These files were produced from `src/launch.html` by `tools/video.mjs` (Playwright → ffmpeg):

| File | Format | Length |
|---|---|---|
| `getup-launch-vertical-1080x1920.mp4` | 9:16 (Reels, TikTok, Shorts) | 45 s |
| `getup-launch-horizontal-1920x1080.mp4` | 16:9 (web, decks) | 45 s |
| `getup-teaser-15s-vertical.mp4` | 9:16 teaser | 15 s |
| `audio/getup-theme-45s.wav`, `-15s.wav` | Original soundtrack (synthesized by `tools/music.py`) | |
| `thumbnails/*.png` | Static promo thumbnails | |

Every app screen in the film is a **real capture of the working app** (`captures/`). The social posts in it come from clearly fictional **demo** accounts, because the shared community isn't live yet. Don't run this film as a paid ad claiming a live community until the backend launches. Until then, use it with "coming soon" framing (the end card already says "Coming soon to iPhone").

## Storyboard and shot list (v2, 45 s, with social)

| # | Time | Visual (real captures) | On-screen text | Motion | Audio |
|---|---|---|---|---|---|
| 1 | 0.0–5.2 | Night ink; "7:42" clock; flat garment tiles drift and scatter | "7:42" → "Full closet." → "*Nothing* to wear." | Staggered fade-ups, rising chaos | Low pad; swell from 3.8 s |
| 2 | 4.6–6.2 | Clay sunrise fills the frame → linen | — | Brand-motif transition | Bloom at 6.0 s |
| 3 | 5.6–10.0 | Hanger draws itself, sun rises, wordmark | "getup" · "Get up. Get dressed. *Get going.*" | Stroke draw, back-ease | Arpeggio enters |
| 4 | 10–14.6 | Closet scrolls through 27 pieces | "Your closet, *organized.*" · chips | Phone rises in | |
| 5 | 14.6–18 | Rain-day pick: shell + boots | "An outfit, *ready.*" · "Rain? Shell + boots." · "Explains every pick" | Crossfade | |
| 6 | 18–25 | **Social Discover feed** scrolling | "Share your *style.*" · "Follow friends", "Discover looks", "Private by default" | Slow scroll | |
| 7 | 25–27.2 | A post: cream hoodie + light jeans; a clay ripple taps **Recreate with my closet** | "See it. *Recreate it.*" | Tap ripple at 26.2 s | |
| 8 | 27.2–38 | **Recreate screen**: 88% similar, close and exact match labels with reasons | "88% similar", "Honest match labels", "Swap any piece", "Wear it or save it" | Chips pop | |
| 9 | 38–45 | End card | Lockup · "See it. *Recreate it.* Get going." · "Coming soon to iPhone" | Staggered fade-ups | Second bloom at 38.4 s; fade out |

**Teaser (15 s):** logo (3.2 s) → social feed (3 s) → tap + recreate (6 s) → end card (2.8 s).

## Voiceover script (optional; for a recorded version)

> *(0–5)* Seven forty-two. A closet full of clothes… and nothing to wear.
> *(6–10)* Meet Getup.
> *(10–14)* Snap what you own. Getup keeps your closet organized.
> *(18–28)* Every morning, it builds a complete outfit from your clothes, for your weather and your plans. Rain? Shell and boots. And it tells you why.
> *(18–25)* Share your style. Follow friends. Find looks you love.
> *(25–38)* See an outfit you like? Tap Recreate — Getup builds it from your own closet, and tells you exactly how close it is.
> *(38–45)* Getup. See it. Recreate it. Get going.

About 85 words, a conversational read. Voice direction: warm, unhurried, mid-20s to 30s, any gender, a smile in the voice, no announcer energy.

## Music direction

- The included track is **original**, synthesized in code (`tools/music.py`): an Fmaj9–Dm9–B♭maj9–Csus2 pad at about 96 bpm, a plucked arpeggio from the reveal, and soft low accents on the logo and end card. It's safe to use anywhere.
- For a premium cut, license a track with a morning-light, lo-fi or indie-electronic feel: soft keys and a gentle beat, building from 0:06, with no vocals under the VO. Use Artlist, Musicbed or Epidemic Sound **with a license that covers paid social ads**. Never use commercial chart music.

## Live-action plan (for a v2 shoot)

| Shot | Description |
|---|---|
| A | Close-up: alarm at 7:42, hand reaching over |
| B | Over-the-shoulder: an open closet, a person flicking through hangers and sighing |
| C | Hands photographing a sweater laid flat on a linen bed (cut to the in-app editor) |
| D | Phone in hand at a window, morning light, the Today screen |
| E | Pulling on a rain shell and lacing boots; rain on the window |
| F | Door closing, a person stepping into the street; end card |

Cast 2–3 people with different styles (streetwear, smart-casual, preppy) and body types, chosen without gendered assumptions. Grade warm and muted, matching the photography direction in `branding/BRAND_GUIDELINES.md`.

## Re-render

```bash
cd tools
python3 -I music.py ../marketing/video/audio/getup-theme-45s.wav 45
node video.mjs vertical ../marketing/video/getup-launch-vertical-1080x1920.mp4 --audio ../marketing/video/audio/getup-theme-45s.wav
node video.mjs horizontal ../marketing/video/getup-launch-horizontal-1920x1080.mp4 --audio ../marketing/video/audio/getup-theme-45s.wav
node video.mjs vertical ../marketing/video/getup-teaser-15s-vertical.mp4 --teaser --audio ../marketing/video/audio/getup-theme-15s.wav
node video.mjs vertical /tmp/k.mp4 --keyframes 3,8,14,25,30,38   # stills for review
```
To swap in new app screens, re-run `tools/video-captures.mjs` against a fresh web export.
