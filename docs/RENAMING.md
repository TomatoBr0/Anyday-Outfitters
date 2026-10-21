# Renaming the app

"Getup" is provisional. To rename before publishing:

1. `src/config/brand.ts`: `name`, `tagline`, `promise`, `supportEmail`.
2. `app.json`: `expo.name`, `slug`, `scheme`, `ios.bundleIdentifier`, `android.package`, and the permission strings under `plugins` that mention "Getup".
3. Search for user-facing copy: `grep -rn "Getup" src website marketing branding`. Most UI copy reads from `BRAND.name`. A few permission/onboarding strings are literal.
4. Wordmark: `src/components/Logo.tsx` (`Wordmark` renders the name in Fraunces). Regenerate `branding/logo/*wordmark*.svg` with `node tools/brand.mjs`.
5. Storage keys use the `getup:v1:` prefix. **Don't change these after real users exist.** Before launch it's harmless.
6. Regenerate icons only if the mark changes: `cd tools && node icons.mjs ../assets/images`.
