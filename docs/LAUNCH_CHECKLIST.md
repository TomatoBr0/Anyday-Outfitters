# Launch checklists

> Nothing here has been done yet. Every item that costs money, creates an account, or publishes something **needs your approval first**. Requirements were checked in October 2026. Re-verify before submitting, because Apple and Google change them often.

## Blocking decisions (you)

- [ ] **Final name.** "Getup" is provisional. Trademark clearance is needed: a "GET UP" mark is registered in Class 25 (apparel), and the app would file in Classes 9/42. Get an attorney search before investing in the name.
- [ ] **Domain.** RDAP lookups on 2026-10-21 showed `getupcloset.com`, `mygetup.app` and `wearthegetup.com` as unregistered. That isn't a guarantee. Not purchased.
- [ ] **Weather provider for commercial launch.** Open-Meteo's free API is **non-commercial only**. Before charging money or showing ads, either buy an Open-Meteo plan (Standard tier, about 1M calls/month) or switch to Apple WeatherKit (iOS, included with the developer program up to a quota). Only `fetchForecast()` in `src/services/weather.ts` needs to change.
- [ ] **Legal review** of `docs/PRIVACY_POLICY_DRAFT.md` and `docs/TERMS_DRAFT.md`. The audience includes teenagers, so check COPPA (US, under 13), GDPR-K (EU, under 16 in some states), and the age-assurance laws in several US states.

## Apple App Store

- [ ] Apple Developer Program membership ($99/yr). **Paid; needs approval.**
- [ ] Builds must use the **iOS 26 SDK / Xcode 26 or later**, required for uploads since April 28, 2026. EAS Build's default macOS images satisfy this; check `eas.json` `image`.
- [ ] `eas build -p ios --profile production`, then `eas submit -p ios`. Both run in the cloud, so no Mac is needed.
- [ ] Bundle ID `app.getup.wardrobe` (or the final name).
- [ ] **App Privacy ("nutrition label").** Data is *not collected* by the developer: everything is on-device, with no analytics or ads. Weather requests send approximate coordinates to a third party (Open-Meteo) and aren't linked to identity. Declare this accurately.
- [ ] **Privacy manifest** (`PrivacyInfo.xcprivacy`). Expo generates required-reason API entries for its modules. Review the generated manifest in the EAS build logs.
- [ ] Permission strings (camera, photos, location when in use) are in `app.json`. Each explains the purpose.
- [ ] Age rating questionnaire. Apple revised its rating tiers in 2025–2026; answer the current questionnaire. The expected rating is the lowest tier (no objectionable content, no user-generated sharing).
- [ ] Screenshots: 6.9" (1320×2868 or 1290×2796) and 13" iPad if `supportsTablet` stays true. Templates are in `marketing/app-store/`.
- [ ] Support URL and privacy policy URL (the website hosts both; see `website/`).
- [ ] No account system, so the account-deletion requirement doesn't apply. "Delete all data" exists anyway.
- [ ] TestFlight internal test on a real device before review.

## Google Play

- [ ] Play Console account ($25 one-time). **Paid; needs approval.**
- [ ] Target **API level 36 (Android 16)** for new apps and updates (deadline Aug 31, 2026; extension possible to Nov 1, 2026). SDK 57/58 templates target this. Verify in the EAS build output.
- [ ] Personal developer accounts must run a closed test with at least 12 testers for 14 days before production. Confirm the current rule in Play Console.
- [ ] Data safety form: mirrors the Apple privacy answers.
- [ ] Feature graphic 1024×500, icon 512×512 (`marketing/play/`).
- [ ] `eas build -p android --profile production` (AAB) → upload.

## Pre-submission QA

- [ ] Run `npm run check` (typecheck, lint, 53 tests).
- [ ] Run through `docs/TESTING.md` on a physical iPhone, including permission-denied paths.
- [ ] Test the cold start with the network off: the weather estimate shows a label, and the app still works.
- [ ] Remove the sample closet option? Probably keep it; it's useful for reviewers.
- [ ] Bump `version` in `app.json` and record it in `CHANGELOG.md`.
