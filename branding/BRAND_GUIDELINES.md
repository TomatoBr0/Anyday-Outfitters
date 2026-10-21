# Getup brand guidelines

## Strategy

**Positioning.** For teens, students and young adults who care how they look but don't have time to think about it every morning, Getup is the outfit planner that dresses you from the clothes you already own. Unlike wardrobe apps that make you do the styling, Getup hands you a complete, weather-ready look in one tap and explains why it works.

**Promise.** Open the app. Get dressed. Get on with your day.

**Tagline.** *Get up. Get dressed. Get going.*
Alternates: "Your closet, styled." · "Dressed in one tap." · "Wear what you own. Better."

**Personality.** A sharp friend with good taste: warm, quick, a little witty, never judgmental. Confident, not pushy. Fashion-literate, not exclusive.

**Pillars.**
1. *Effortless*: one tap to dressed.
2. *Personal*: your clothes, your style, your weather.
3. *Honest*: shows its reasoning; no fake AI, no data grabs.
4. *Beautiful*: editorial calm, not tech clutter.

## Visual direction: three explored, one chosen

| Direction | Palette | Feel | Verdict |
|---|---|---|---|
| **A · Linen & Ink** ✅ | Warm linen, charcoal ink, muted sage, clay "sunrise" accent | Editorial, warm, tactile, gender-neutral; photos of clothes pop against linen | **Chosen.** Calm in the morning, premium without luxury coldness, works for streetwear and preppy alike |
| B · Midnight & Brass | Navy, brass, ivory | Classic menswear | Skews masculine and older |
| C · Bone & Cobalt | Off-white, electric cobalt, black | Gen-Z bold, techy | Cobalt fights with garment colors in photos; reads "fintech" |

## Logo

- **Mark.** A hanger whose bar is a horizon, with a clay sun rising through it. It means "get up" and "getup" at once. The hanger outline is the same weight as the UI icon stroke, so the logo and the icons feel like one family.
- **Primary logo.** Horizontal lockup (mark + wordmark): `logo/getup-lockup-horizontal.svg`.
- **Secondary logo.** Stacked lockup: `logo/getup-lockup-stacked.svg`.
- **Wordmark.** Lowercase "getup" in Fraunces SemiBold, outlined and tracked slightly tight: `logo/getup-wordmark.svg`.
- **Standalone icon.** `logo/getup-mark.svg`. App icon: `logo/getup-app-icon.svg` (linen) and `-dark` (night).
- **Variants.** `-reversed` (cream on dark), `-mono-black`, `-mono-white`. In mono the sun becomes solid.
- **Clear space.** The height of the sun (about ¼ of the mark height) on all sides.
- **Minimum size.** The mark at 20 px or 6 mm. The horizontal lockup at 90 px wide.
- **Don't** add gradients, sparkles, drop shadows or outlines. Don't rotate the mark, recolor the sun anything but clay or mono, put the mark on busy photos without a linen or ink plate, or set the wordmark in another font.

## Color

| Token | Hex | Use |
|---|---|---|
| Linen 100 | `#F5F1EA` | App background, icon tile |
| Linen 50 | `#FBF8F3` | Cards, surfaces |
| Linen 200 | `#EDE7DC` | Tiles behind garments, chips |
| Ink 900 | `#1C1B19` | Text, primary buttons, logo |
| Muted text | `#5E5850` | Secondary text (6.3:1 on linen, AA) |
| Subtle text | `#6F695F` | Captions, hints (4.8:1, AA) |
| Sage 600 | `#4F6249` | Confirm states, links, accent text (5.9:1 on linen, AA) |
| Clay 600 | `#B5583A` | **Logo sun only** (graphic; 4.2:1, which passes the 3:1 non-text rule) |
| Clay 700 | `#A24C31` | Clay as text: overlines, highlights (5.2:1 on linen, AA) |
| Night 950 | `#121110` | Dark mode background |

Ratio guide: about 70% linen, 20% ink, 7% sage, 3% clay. **Clay is the sunrise.** Use it sparingly so it stays special. Full tokens are in `tokens/tokens.json` and `tokens/tokens.css`. Every text/background pair used in the app was checked against WCAG 2.1 AA (4.5:1). Two early values failed (clay text at 4.2 and subtle grey at 3.2) and were darkened.

## Typography

- **Fraunces** (SIL OFL), a soft editorial serif, for headlines, the wordmark and big numbers. SemiBold 600 for display; Italic 400 for one accent word ("*Get going.*").
- **Inter** (SIL OFL) for everything functional. 400 body, 500 labels, 600 emphasis.
- Scale (size/line-height): Hero 40/44 · Display 32/38 · Title 24/30 · Heading 17/22 · Body 15/22 · Caption 13/18 · Overline 11/14 caps, +1.2 tracking.
- In the app, Dynamic Type is honored up to 1.6×.

## Iconography

Custom 24-grid line icons with a 1.75 stroke and round caps and joins (`src/components/Icon.tsx`). The "Today" icon is the sunrise-over-horizon motif; "Closet" is the hanger.

## Photography direction

- Flat-lays and hanging shots on **linen, oatmeal, or raw-wood** surfaces in soft window light, morning in tone.
- Real, varied people: different bodies, genders and styles, mid-gesture (pulling on a jacket, lacing boots), not posed catalog stills.
- Muted, warm grade. Let garment colors carry the saturation.
- Avoid neon, glossy studio sweeps, mannequins, and AI-looking sheen.

## Motion

- Purpose first: motion confirms an action or orients the user. It's never decoration.
- Durations: 140 ms (press), 220 ms (fades, toasts), 360 ms (screen-level). The spring is damping 18 / stiffness 220.
- Signature moments: outfits **fade up** when generated; the welcome screen **staggers** its lines in like a sunrise; buttons **scale to 97%** on press with a light haptic.
- Respect Reduce Motion (OS-level). No looping animation on screens people use daily.

## Voice

| Do | Don't |
|---|---|
| "Rain-ready layers." | "Our AI has curated a precipitation-optimized ensemble!" |
| "6 pieces in the hamper." | "You have 6 dirty items." |
| "Got it — showing something else." | "Feedback submitted successfully." |
| "Brings back your cream sweater." | "Item #4823 has low utilization." |

Short sentences. Second person. Light wit, never sarcasm about someone's body or style. Say what something does, not what it is.
