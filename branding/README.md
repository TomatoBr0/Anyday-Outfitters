# Branding

| File / folder | What |
|---|---|
| `NAMING.md` | 34 name candidates, 5 finalists scored, domain/App Store/trademark checks, recommendation |
| `BRAND_STRATEGY.md` | Market review, audience, positioning, differentiators |
| `BRAND_GUIDELINES.md` | Visual directions explored, logo usage, color, type, icons, photography, motion, voice |
| `logo/` | SVG masters: mark, wordmark (outlined Fraunces), horizontal and stacked lockups, app icon, each in color / reversed / mono-black / mono-white |
| `exports/` | PNG exports of the logo family and social avatar |
| `icons/` | App icon set as shipped (iOS 1024, Android adaptive foreground/background/monochrome, favicon) |
| `tokens/` | `tokens.json` and `tokens.css`, mirroring `src/theme/tokens.ts` |

Regenerate the exports with `cd tools && node brand.mjs`, and the app icons with `node icons.mjs ../assets/images`.
