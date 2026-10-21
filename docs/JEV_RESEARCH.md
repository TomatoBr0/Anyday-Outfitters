# Jev by TypeSafe AI: Research and Evaluation

Researched 2026-10-21 (web only). Status: **PRODUCT VERIFIED** (it exists, with official docs, an API and an npm SDK). No official GitHub repo was found.

Legend: [DOC] = official documentation, [MKT] = vendor marketing claim, [PRESS] = press report, [UNVERIFIED] = not found.

## 1. Identity and sources
- TypeSafe AI Inc. (San Francisco). Jev is its first "System One" model. It was announced 2026-09-15 and is in early access. [PRESS] https://siliconangle.com/2026-09-16/typesafe-ai-exits-stealth-with-40m-to-build-ai-for-use-by-software/
- Funding: $40M seed led by DCVC. The $200M valuation comes from Forbes, citing an unnamed source. Founder and CEO is Diogo Almeida, ex-OpenAI. [PRESS] same SiliconANGLE URL.
- Official site: https://typesafe.ai
- Docs: https://docs.typesafe.ai (index at https://docs.typesafe.ai/llms.txt)
- API console: https://console.typesafe.ai/keys
- OpenAPI spec: https://api.typesafe.ai/openapi.json
- Also served via OpenRouter as `typesafe/jev-1.13` and `typesafe/jev-1.14`: https://openrouter.ai/provider/typesafe
- npm: `@typesafe-ai/sdk` [DOC] https://docs.typesafe.ai/introduction/quickstart
- PyPI: `typesafe-sdk` [DOC] same page.
- GitHub: not linked in the docs [DOC] https://docs.typesafe.ai/sdk.md. A community list, "awesome-jev" by Amal-David, exists, but I did not verify its URL [PRESS-search only].

## 2. How it works
- You POST a `state` (text or JSON) plus a map of typed questions. You get structured answers with no text generation. [DOC] https://docs.typesafe.ai/introduction.md
- Question types:
  - **Choice** returns a choice, probabilities and confidence.
  - **Score** returns a score, probabilities and confidence.
  - **Noul** returns a 0-1 truth value for a statement.
  - **Box** is image-region related; see https://docs.typesafe.ai/primitives/box.md and https://docs.typesafe.ai/images.md. I did not read these pages in detail. [DOC]
- Questions are evaluated independently and in parallel against the same state. The docs advise one well-scoped question at a time, with results combined in your own code (https://docs.typesafe.ai/patterns/composite-scoring.md). [DOC]
- It is trained with "Reinforcement Learning for Calibrated Decisions". [MKT/PRESS]
- Text input only (images are handled separately). [DOC] https://docs.typesafe.ai/models.md
- Documented weaknesses [DOC] https://docs.typesafe.ai/model-jaggedness/jev-1.13.md:
  - unreliable at counting, math and dates;
  - accuracy drops with irrelevant state;
  - bias toward the first Choice option;
  - poorly calibrated score levels for interpolating exact values;
  - not hostile-input safe.
- Press notes that valid structured output does not prove a decision is correct. Users must check calibration on their own data. [PRESS] SiliconANGLE URL above.

## 3. API, SDKs, runtimes
- Endpoint: `POST https://api.typesafe.ai/v1/systemone`, with `Authorization: Bearer <key>`. [DOC] https://docs.typesafe.ai/introduction/quickstart
- Models: `jev-1.14.0` (from 2026-10-14) and `jev-1.13.0`. `jev-latest` points to 1.13 and `jev-preview` to 1.14. Pin a versioned ID. [DOC] https://docs.typesafe.ai/models.md
- TypeScript/JS: `@typesafe-ai/sdk` ships ESM, CJS and type declarations. [DOC] https://docs.typesafe.ai/sdk/javascript.md
  - It requires Node 22 or newer. The quickstart says Node 20 or newer, so the docs are inconsistent.
  - Releases: v0.5.7 on 2026-09-11 (initial release), v0.6.0 on 2026-09-15, v0.7.0 on 2026-10-14. Still pre-1.0. [DOC] https://docs.typesafe.ai/sdk/javascript/changelog.md
  - The SDK has a `Fetch` type alias and the API is plain HTTPS/JSON, so the raw HTTP API works from any runtime. [DOC] sdk.md
- **React Native:** [UNVERIFIED]. The SDK page does not mention it. The raw HTTP API would work through `fetch`. But a key embedded in an app is exposed, so a backend proxy is required in practice. The docs do not discuss browser or mobile key safety.
- **Cloudflare Workers:** [UNVERIFIED]. The SDK docs do not list Workers, Deno or Bun. Plain `fetch` to the REST API should work, but I have not tested it. SDK zstd compression is Node-only, so other runtimes send uncompressed bodies. [DOC] sdk/javascript.md
- Server deployment: there is no self-hosting or on-prem option in the public docs. It is a hosted API only. [UNVERIFIED for enterprise]

## 4. Pricing, limits, reliability
- Price: $42 per billion input tokens ($0.042 per million). Output tokens are free. Both models cost the same. [DOC] https://docs.typesafe.ai/models.md
- Free tier or credits: [UNVERIFIED]. None documented. Access is called "early access" on https://typesafe.ai.
- Context: 64k tokens per request and 32k per question. A long-context header raises both to 262k, with lower accuracy. [DOC] models.md
- Rate limits: set per organization in tokens per second and requests per second. No numbers are published. Higher limits need custom or enterprise plans. [DOC] models.md and https://docs.typesafe.ai/api/errors.md
- Request body is at most 32 MiB. Error 529 means overloaded. The SDK retries automatically. [DOC] errors.md
- Latency: 70-500 ms and under 100 ms are vendor claims [MKT/PRESS]. The site chart shows 0.114 s versus 8.566 s for "LLMs" on a vendor workflow (https://typesafe.ai). The "193.6x faster" and "445x cheaper" figures are vendor-reported and not independently verified.
- Reliability and SLA: [UNVERIFIED]. No status page or SLA found. The company is weeks old.
- Deprecation policy: not described [DOC] models.md. The model aliases move, so pin versions.

## 5. Privacy, license, lock-in, maintenance
- Privacy policy states a commitment "not to train models on user data". Retention is covered by the DPA. Zero data retention is for enterprise only, via sales. [DOC] https://docs.typesafe.ai/legal.md. Legal pages: https://typesafe.ai/legal/privacy-policy, /legal/data-processing, /legal/mca. I did not read the full terms.
- SDK license: [UNVERIFIED]. The model is proprietary and API-only. Commercial terms are in the Master Customer Agreement, which I did not review.
- Lock-in: high. The model is proprietary, hosted by one young vendor, and outputs are model-version-specific. Mitigation: the question and answer shape (choice, score, probabilities) is simple to wrap behind our own interface and replace.
- Maintenance: SDK released three times in five weeks and the model moved from 1.13 to 1.14. Active, but very early. No public commit history was found.

## 6. Fit for Anyday Outfitters (offline-first)
Note: Jev is a cloud API for decision scoring. It does not do image recognition. Offline use is impossible, so it can only be a an online enhancement.

| Feature | Fit | Reasoning |
|---|---|---|
| Outfit compatibility ranking | Low-medium | Semantic judgments ("do these clash?") are plausible as Score questions. But the engine already handles this deterministically, and Jev score levels are weak for fine ranking. |
| Weather matching | Poor | This is numeric (temperature, rain). The docs say numbers should be handled in code. Keep it deterministic. |
| Occasion matching | Medium | Fuzzy semantics ("is this smart-casual enough for a gallery opening?") suit Noul/Score. This is the best candidate. |
| Personalization from feedback | Poor | Jev does not learn from our data. Local logistic regression is better here. |
| Social feed ranking | Poor | It is high-volume and per-item, which costs money and adds latency. Collaborative signals fit a purpose-built ranker better. |
| Clothing attribute classification | Poor | Needs vision. Jev takes text only (Box/images exist but are unreviewed). Use an on-device vision model or user tags. |
| Moderation decisions | Medium | Docs have a guardrails cookbook (https://docs.typesafe.ai/cookbooks/llm_guardrails.md) and a chat filter cookbook. Confidence-gated routing to human review fits. Caution: adversarial content can shift answers. [DOC] |

## 7. Comparison

Cost assumption (mine, illustrative, not a benchmark): 1,500 input tokens and 100 output tokens per recommendation, one call each.

| Dimension | (1) Deterministic on-device TS engine | (2) Local ML (logistic regression or small model on feedback) | (3a) Jev | (3b) Small hosted LLM (Claude Haiku 5.5 as example) |
|---|---|---|---|---|
| Quality | Predictable, hand-tuned, no personalization | Learns per-user taste once feedback exists; cold start needs priors | Good on fuzzy semantics; weak on numbers/dates; unproven for fashion | Strong general semantics, can explain; non-deterministic |
| Latency | Microseconds-ms, local | ms, local | 70-500 ms claimed [MKT] plus network | Typically hundreds of ms or more plus network (not measured here) |
| Cost per 1,000 recs | $0 | $0 (training cost is our own compute) | 1.5M input tokens x $0.042/M = about $0.063 | 1.5M x $0.10/M + 0.1M x $0.50/M = about $0.20 (before caching or batch discounts) |
| Reliability | Highest | Highest | Unknown SLA, new vendor, rate limits unpublished | Mature vendor, SLAs depend on plan |
| Offline | Yes | Yes | No | No |
| Integration complexity | Already built | Moderate: feature pipeline, training loop, on-device inference runtime | Low-moderate: needs a backend proxy and key handling | Low-moderate: same proxy need |
| Privacy | Data stays on device | Data stays on device | Wardrobe/feedback sent to vendor; no-training commitment; ZDR is enterprise only | Same exposure; terms vary by vendor |
| Scalability | Scales free with devices | Scales free | Scales with spend and org rate limits | Scales with spend and rate limits |

Pricing sources: Jev https://docs.typesafe.ai/models.md; Haiku 5.5 $0.10/MTok input and $0.50/MTok output (prompts up to 100k tokens) https://platform.claude.com/docs/en/about-claude/pricing. The per-1,000 arithmetic uses my assumed token counts; real cost scales with the state we send and the number of questions per recommendation.

## 8. Recommendation: **Experiment behind a feature flag** (narrow scope), otherwise do not adopt

- Do not adopt for core ranking, weather, personalization or feed ranking. The deterministic engine is offline, free, fast and private, and local ML is the better route to personalization.
- Experiment, online-only and flag-gated, on two features: (a) occasion-fit "second opinion" scoring and (b) moderation triage with confidence-gated human review. Both are semantic, text-only and low-volume per user.
- Guardrails:
  1. Call it only through our own backend proxy. Never embed the key in the app.
  2. Wrap it behind an interface so the deterministic engine is the instant fallback on any failure (offline, 429/529, timeout).
  3. Pin `jev-1.13.0` or `jev-1.14.0`.
  4. Measure agreement with human labels and confidence calibration on our own data before any rollout. Vendor performance numbers are unverified.
  5. Read the MCA and DPA before sending user data. Confirm pricing is not "temporary or subsidized" (an unanswered FAQ on typesafe.ai).
- Open items to resolve with the vendor: Cloudflare Workers/React Native support, SDK license, SLA, free tier, published rate limits.
