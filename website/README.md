# Getup website

A static landing page (no build step) plus one Cloudflare Pages Function for the waitlist.

```
website/
  index.html  privacy.html  support.html  styles.css  app.js  _headers
  assets/            images (webp screenshots, logo SVGs, OG image, icons)
  functions/api/waitlist.js   POST /api/waitlist → KV (binding: WAITLIST)
```

## Preview locally

```bash
npx wrangler pages dev website      # serves pages and the function at http://localhost:8788
```

## Deploy to Cloudflare Pages (needs your approval — publishes publicly)

```bash
npx wrangler login
npx wrangler pages project create getup-web --production-branch main
npx wrangler kv namespace create WAITLIST          # then bind it in Pages → Settings → Functions → KV
npx wrangler pages deploy website --project-name getup-web
```

Or connect the GitHub repo in the Cloudflare dashboard: framework preset "None", build command empty, output directory `website`.

Pages and KV free tiers cover a pre-launch waitlist. A custom domain is optional and **not purchased**.

Read the waitlist with `npx wrangler kv key list --binding WAITLIST`.
