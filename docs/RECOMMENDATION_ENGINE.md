# Recommendation engine

Source: `src/engine/`. Pure TypeScript with no React or network calls, so it runs offline in a few milliseconds and is covered by `tests/engine.test.ts`.

## Pipeline

```
items ──► hard filters ──► per-slot pools ──► top-K pre-rank ──► enumerate structures
          (filters.ts in      (top, bottom,      (12 tops, 12        (top+bottom | one-piece)
           generate.ts)        one-piece,         bottoms, 6 shoes,    × shoes × (none | outer)
                               outer, shoes,      4 outers)
                               accessories)
      ──► weighted score + jitter ──► diversity pick (≥2 different pieces) ──► accessories ──► reasons/warnings
```

### 1. Hard constraints (never violated unless the user overrides)

| Rule | Behavior |
|---|---|
| Item is dirty (`clean = false`) | Excluded |
| Availability is `lent`, `repair` or `storage` | Excluded |
| Pinned/locked item | Always included, even if dirty. A warning explains why |
| Effective temp < 5 °C | Excludes warmth-1 bottoms (shorts) and sandals, **only if an alternative exists** |
| Effective temp ≥ 27 °C | Excludes heavy outerwear (warmth ≥ 4) and warm tops (≥ 3), only if alternatives exist |
| Rain (≥ 50% or rain/snow/storm code) | Excludes sandals if alternatives exist |
| Effective temp ≥ 24 °C and dry | Outer layers aren't combined at all |

When an alternative doesn't exist, the item stays in and a `weatherFallback` issue is surfaced. The user gets a compromise outfit with an explanation instead of nothing.

### 2. Soft score (0–1 per dimension)

| Dimension | Weight | What it measures |
|---|---|---|
| Weather | **0.22** | Upper-body warmth (top + outer) vs. a band for the effective temp; bottom warmth vs. its band; rain-ready shoes and outerwear; wind |
| Style | **0.22** | Pairwise style-tag affinity (same tag 1.0, same family 0.8, else 0.4); match to user's chosen aesthetics; formality spread penalty; double-oversized penalty; per-category fit preference bonus |
| Color | **0.20** | Pairwise palette harmony (neutral pairs, analogous, complementary, the clash zone of 35–110° between two vivid hues); > 2 statement colors penalty; two busy patterns penalty |
| Occasion | **0.14** | Average core formality vs. the occasion's band (or the event's explicit dress code); athletic share for workouts |
| Preference | **0.12** | Learned item and pair affinity (sigmoid of summed feedback), favorites |
| Rotation | **0.10** | Items worn within the repeat window are penalized (less so for shoes and outerwear); exact-outfit repeats within 14 days are strongly penalized; forgotten pieces (21+ days) get a reason line |

**Why these weights.** The brief's starting weights were 25/20/20/15/10/10. Weather was raised to equal style because a wrong-for-the-weather outfit is a practical failure, while a slightly off-style outfit is only a taste miss. Style dropped to 22 because the style dimension already includes the user's stated preferences, which overlaps with the preference weight. All six weights are in one object (`WEIGHTS` in `scoring.ts`) and the tests pin behavior, not numbers, so they can be retuned safely.

**Effective temperature** = forecast feels-like (day-weighted 60% high / 40% low, blended with current conditions for today) + personal offset (runs cold −4 °C, runs warm +4 °C) + wind chill (−1 to −2 °C).

### 3. Variety

- **Seeded jitter** (±0.02) breaks ties. Regenerate changes the seed *and* excludes every signature shown so far in the session, so you never see the same combination twice.
- **Diversity pick.** Each additional suggestion must differ from earlier ones by at least 2 pieces. The rule relaxes to 1, then 0, for small closets.

### 4. Learning (honest version)

`buildAffinity()` turns feedback into numbers:

| Signal | Value |
|---|---|
| Like | +1 to each item and each pair in the outfit |
| Dislike | −1 |
| Not my style | −1.5 |
| Actually wore it | +0.3 |

Each signal decays with a 60-day half-life, so taste can change. This is a transparent counting model, not machine learning. The app never claims otherwise.

### 5. Outputs

Each `Recommendation` has `itemIds`, `bySlot`, `score` (0–100), the full `breakdown`, a `title`, up to four `reasons` and any `warnings` (rain without an outer layer, a pinned dirty item, no shoes). `EngineResult.issues` explains empty or partial results: an empty closet, a missing category, everything in the laundry.

### 6. Other engine modules

- `packing.ts` builds a trip capsule: versatile neutral bottoms first, then tops ranked by harmony with those bottoms, then outer layer, shoes and accessories by forecast and activities, plus essentials. Duplicate colors are avoided. Shorts are excluded on cold trips when anything else exists.
- `laundry.ts` handles per-item wears-before-wash, opt-in auto-hamper by category, and wash resets.
- `colorDetect.ts` picks a dominant garment color from pixels: border-estimated background subtraction, center weighting, and nearest palette color in CIELAB.

## Tests

`npm test` runs these engine cases: dirty exclusion, unavailable exclusion, pinned override, structure, one-pieces, locking, empty closet, missing category, everything-in-laundry, no shoes, tiny closet, nothing suitable, freezing, cold layering, heat, rain, temperature sensitivity, interview formality, everyday casualness, color pair ordering, harmonious-over-clashing, no repeat of yesterday, regenerate freshness, in-result distinctness, learning from dislikes, swap candidates, laundry rules (×3), packing (×2), signatures.
