# Getup piece detector (Cloudflare Worker)

Turns one photo of several clothes into one entry per piece (category, colour,
short name, bounding box) using Claude vision. The app works without it: people
can always draw the boxes themselves. With it, **Find pieces for me** appears on
the "Several pieces" screen.

**Not deployed yet. Deploying and adding an API key needs the owner's approval.**

## How it works

- The app sends a ≤1024 px JPEG (base64) plus its own category and colour ids to `POST /detect`.
- The Worker asks `claude-opus-5-5` for category, colours, a short detail, pattern, fit, style tags, dressiness, warmth and water resistance per piece (low effort, JSON-schema structured output,
  server-side refusal fallback) and returns the cleaned-up pieces.
- The Anthropic key is a Worker secret. It is never in the app.
- Photos aren't stored. A per-IP rate limit (20/min) caps abuse.

Rough cost: about 1–2 US cents per photo at current Opus 5.5 prices. Set a monthly
spend limit in the Anthropic Console before going live.

## Set up (once approved)

```bash
cd worker/detect
npm install
npx wrangler login                        # free Cloudflare account
npx wrangler secret put ANTHROPIC_API_KEY # paste the key when asked
npx wrangler deploy                       # prints https://getup-detect.<you>.workers.dev
```

Then in the app's root `.env.local` (git-ignored):

```
EXPO_PUBLIC_DETECT_URL=https://getup-detect.<you>.workers.dev
```

and restart `npx expo start -c`.

## Develop

```bash
npm run typecheck
npm test          # offline: Claude API is mocked
```
