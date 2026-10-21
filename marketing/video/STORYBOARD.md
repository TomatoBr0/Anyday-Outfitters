# Getup launch film

**Status: rendered.** These files were produced from `src/launch.html` by `tools/video.mjs` (Playwright → ffmpeg):

| File | Format | Length |
|---|---|---|
| `getup-launch-vertical-1080x1920.mp4` | 9:16 (Reels, TikTok, Shorts) | 40 s |
| `getup-launch-horizontal-1920x1080.mp4` | 16:9 (web, decks) | 40 s |
| `getup-teaser-15s-vertical.mp4` | 9:16 teaser | 15 s |
| `audio/getup-theme-40s.wav`, `-15s.wav` | Original soundtrack (synthesized by `tools/music.py`) | |
| `thumbnails/*.png` | Static promo thumbnails | |

Every app screen in the film is a **real capture of the working app** (`captures/`), not a mockup. Nothing shown is unbuilt.

**What this version is not.** It has no live-action footage and no recorded voiceover. Those need a shoot and a voice actor; the plan for both is below. The current cut is a motion-graphics film with on-screen text.

## Storyboard and shot list (main 40 s)

| # | Time | Visual | On-screen text | Motion | Audio |
|---|---|---|---|---|---|
| 1 | 0.0–5.2 | Night ink background. A big Fraunces clock "7:42"; flat garment tiles drift in and slowly scatter (the closet chaos) | "7:42" → "Full closet." → "*Nothing* to wear." | Lines fade up 0.6 s apart; tiles drift and rotate with rising chaos | Low pad enters; swell starts at 3.8 s |
| 2 | 4.6–6.2 | **Sunrise transition**: a clay sun rises from the bottom and swells to fill the frame, then clears to linen | — | Ease-in-out scale; this is the brand motif | Swell peaks into a soft low bloom at 6.0 s |
| 3 | 5.6–10.0 | Logo reveal: hanger outline draws itself, the sun springs up inside it, the wordmark slides up | "getup" · "Get up. Get dressed. *Get going.*" | Stroke-dash draw (1.1 s), back-ease on the sun, 0.4 s word stagger | Arpeggio begins |
| 4 | 10–18 | Phone rises in; real **Closet** capture scrolls through 27 pieces | "Your closet, *organized.*" · chips: "27 pieces, all yours", "Search & filter", "Knows what's clean" | Back-ease entrance; chips pop with overshoot | |
| 5 | 18–23 | Real **Today** screen on a clear day | "An outfit, *ready.*" · "55° and clear", "Only clean clothes" | Crossfade between screens | |
| 6 | 23–28 | The forecast flips to rain: **real rain-day pick** ("Rainy-day uniform": rain shell + boots) | "Rain? Shell + boots." · "Explains every pick" | 0.5 s crossfade | |
| 7 | 28–35 | Tap ripple on **Wear today**, then the real "You're dressed" state with the Undo toast | "One tap. *Out the door.*" · "Laundry tracked", "History saved" | Clay ripple 0.7 s | |
| 8 | 35–40 | End card on linen: lockup, tagline, CTA pill | "Get up. Get dressed. *Get going.*" · "Coming soon to iPhone" | Staggered fade-ups | Second bloom at 35.4 s; music fades out |

**Teaser (15 s)** cuts from the master: logo reveal (3.5 s) → outfit + rain (5.5 s) → tap (2.5 s) → end card (3.5 s).

## Voiceover script (optional; for a recorded version)

> *(0–5)* Seven forty-two. A closet full of clothes… and nothing to wear.
> *(6–10)* Meet Getup.
> *(10–18)* Snap what you own. Getup keeps your whole closet organized — and knows what's clean.
> *(18–28)* Every morning, it builds a complete outfit from your clothes, for your weather and your plans. Rain? Shell and boots. And it tells you why.
> *(28–35)* One tap — and you're out the door.
> *(35–40)* Getup. Get up. Get dressed. Get going.

About 75 words, a conversational read. Voice direction: warm, unhurried, mid-20s to 30s, any gender, a smile in the voice, no announcer energy.

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
python3 -I music.py ../marketing/video/audio/getup-theme-40s.wav 40
node video.mjs vertical ../marketing/video/getup-launch-vertical-1080x1920.mp4 --audio ../marketing/video/audio/getup-theme-40s.wav
node video.mjs horizontal ../marketing/video/getup-launch-horizontal-1920x1080.mp4 --audio ../marketing/video/audio/getup-theme-40s.wav
node video.mjs vertical ../marketing/video/getup-teaser-15s-vertical.mp4 --teaser --audio ../marketing/video/audio/getup-theme-15s.wav
node video.mjs vertical /tmp/k.mp4 --keyframes 3,8,14,25,30,38   # stills for review
```
To swap in new app screens, re-run `tools/video-captures.mjs` against a fresh web export.
