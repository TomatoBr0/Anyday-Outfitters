# Free vs. Plus

Principle: **everything needed to get dressed every day is free.** Plus adds power and convenience, never basics.

| Feature | Tier | Status |
|---|---|---|
| Unlimited closet with photos | Free | ✅ Available |
| Daily outfit, alternatives, regenerate, lock & swap | Free | ✅ |
| Outfit builder, saved outfits, history | Free | ✅ |
| Laundry tracking with per-item rules | Free | ✅ |
| Calendar planning, trip packing lists | Free | ✅ |
| Basic insights (worn %, most worn, palette) | Free | ✅ |
| Advanced analytics (cost-per-wear, gaps, trends) | Plus | Planned |
| Cross-device sync & backup | Plus | Planned |
| Background removal | Plus | Planned |
| Apple/Google Calendar import | Plus | Planned |
| AI styling chat (optional cloud LLM) | Plus | Planned |
| Voice assistant | Plus | Planned |

Implementation: `src/config/features.ts` (`FEATURES`, `hasFeature()`, `isPlus = false`). **No payment SDK is installed.** When approved, the recommendation is RevenueCat with StoreKit 2 / Play Billing. It needs a development build (it doesn't run in Expo Go), App Store Connect products, and the subscription-terms copy that Apple requires.

Suggested pricing to validate: $3.99/month or $24.99/year, with a 7-day trial. Students are the core audience, so test a lower annual price.
