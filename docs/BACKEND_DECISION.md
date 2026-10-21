# Backend Decision: Supabase vs Firebase

Status: recommendation, pending review. Research date: 2026-10-21.
Scope: React Native / Expo social fashion app, teen and young-adult users, with follows, likes, comments, feeds, and image uploads.

Sources (accessed 2026-10-21):
- Supabase pricing: https://supabase.com/pricing
- Supabase docs (RLS): https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Supabase Storage: https://supabase.com/docs/guides/storage
- Firebase pricing (Spark/Blaze): https://firebase.google.com/pricing
- Firebase Auth limits: https://firebase.google.com/docs/auth/limits
- Firestore security rules: https://firebase.google.com/docs/firestore/security/get-started
- Firestore quotas and limits: https://firebase.google.com/docs/firestore/quotas

Verification caveats: Supabase and Firebase free-tier numbers below were read from the official pages. Firebase's behavior on hitting Spark quota is not confirmed by official docs in this research (secondary sources disagree), so treat it as unknown. Pricing changes often; re-check before committing.

## 1. Summary

| Area | Supabase | Firebase |
|---|---|---|
| Core data model | Postgres (relational) | Firestore (document) |
| Access control | Row Level Security (SQL policies) | Security Rules (custom DSL) |
| Auth | GoTrue-based, email/OAuth/phone | Firebase Auth, email/OAuth/phone, mature SDKs |
| Storage | S3-compatible Storage with RLS | Cloud Storage with security rules |
| Realtime | Postgres changes, broadcast, presence | Native realtime listeners |
| Free tier MAU | 50,000 | 50,000 (Auth on Identity Platform) |
| Expo support | Official JS client, works in Expo | Official SDKs; native modules needed for some setups |
| Lock-in | Low (open-source Postgres) | Higher (proprietary document model) |

## 2. Auth

- **Supabase:** Email/password, magic link, OAuth providers, phone (SMS billed separately). Users live in `auth.users`, which you can join against app tables. Refresh tokens and sessions are handled by the SDK. Sign in with Apple is supported as an OAuth provider, which is required if you offer other social logins on iOS.
- **Firebase:** Email, phone, Google, Apple, and anonymous auth. Auth is Identity Platform-backed. Mature React Native support via `@react-native-firebase`, but that needs native builds (not Expo Go), so you need a development build either way for many native features.
- **Fit:** Both are adequate. Firebase is slightly more battle-tested for mobile social login; Supabase is simpler to tie to a SQL user table.

## 3. Data model fit: follows, likes, comments, feeds

This is the decisive area.

- **Follows / likes / comments are relational.** Follower graphs, "who liked this", counts, joins across users and posts, and unique constraints (one like per user per post) are natural in Postgres (`follows(follower_id, followee_id)` primary key, `likes` with unique index, foreign keys with cascade deletes).
- **Feeds** are a join plus ordering: posts from followed users, sorted by time, paginated. In Postgres this is one indexed query, with a materialized view or fan-out table if scale demands it.
- **Firestore** works with denormalization: you store follower lists per user, duplicate display names into comments, and maintain counters with transactions or distributed counters. Feeds usually need a fan-out-on-write collection per user. This is workable but requires more code and careful write costs, and cross-document consistency is weaker.
- **Deletion cascades** (account deletion, which Apple requires; see the UGC doc) are simpler in SQL than in Firestore, where you must find and delete every denormalized copy.

Verdict: Postgres fits this domain better.

## 4. Image storage

- **Supabase Storage:** Buckets with RLS policies on `storage.objects`. Free: 1 GB file storage. Pro: 100 GB included, then $0.0213/GB.
- **Firebase Cloud Storage:** Spark: 5 GB-months stored, 100 GB/month downloaded, 5K upload ops/month, 50K download ops/month (US regions only, for the newer bucket type). Blaze has usage billing.
- **Both** need an image pipeline: client-side resize/compress before upload, thumbnail generation, and moderation scanning before publication. Neither provides a full UGC moderation pipeline out of the box (see section 10).
- **Egress is the hidden cost** for a feed-heavy image app. Supabase Free allows 5 GB egress; Pro 250 GB then $0.09/GB. Firebase Spark allows 10 GiB/month Firestore egress and 100 GB/month Cloud Storage downloads. A photo feed will exhaust free egress quickly either way. Plan a CDN and thumbnail sizes.

Verdict: roughly even. Storage cost is driven by image delivery, not the choice of backend.

## 5. Access control

- **Supabase RLS:** Policies are SQL, e.g. "a user can insert a like only with their own `user_id`" and "a post is visible unless its author blocked the viewer". Works with joins, and you can express block lists and age-gated visibility in the database itself. Risk: a table without RLS enabled is readable through the public API key, so enable RLS on every table and test it.
- **Firebase Security Rules:** Path-based rules with `request.auth`. Rules cannot do arbitrary joins; cross-document checks (for example, "viewer is not blocked by author") require extra reads inside rules and are limited in what they can express. Complex rules become hard to reason about.
- **Fit:** RLS is more expressive for social graph rules (blocks, follower-only posts, age-based visibility).

Verdict: Supabase.

## 6. Realtime

- **Supabase:** Postgres changes via logical replication, broadcast channels, and presence. Free: 2M realtime messages/month and 200 concurrent connections; Pro: 5M messages then $2.50/million, 500 concurrent connections then $10/1,000.
- **Firebase:** Native realtime listeners, very low-latency and well-proven for chat-like features. Cost is per document read, and a listener on a busy collection can burn read quota quickly (every changed document is a read).
- **Fit:** For a feed and comment counts, Firestore listeners are excellent; for most social use, polling or Supabase Realtime is also fine. Firestore's per-read billing makes listeners on large feeds expensive.

Verdict: Firebase is slightly better at realtime UX; Supabase is more predictable on cost.

## 7. Free-tier limits (exact, from official pages)

Supabase Free (per supabase.com/pricing, 2026-10-21):
- Database: 500 MB per project
- Egress: 5 GB; cached egress 5 GB
- File storage: 1 GB
- MAU: 50,000
- Projects: 2 active
- Realtime: 2M messages/month, 200 concurrent connections
- Inactive projects pause after 1 week of inactivity

Firebase Spark (per firebase.google.com/pricing, 2026-10-21):
- Firestore: 1 GiB stored; 10 GiB/month egress; 20K writes/day; 50K reads/day; 20K deletes/day
- Cloud Storage (new buckets, US regions): 5 GB-months stored; 100 GB/month downloaded; 5K upload ops/month; 50K download ops/month
- Authentication: 50K MAU (Identity Platform); phone auth billed per SMS, no free quota listed
- Hosting: 10 GB storage; 360 MB/day transfer
- Auth on Spark: account creation limited to 100 per hour per IP; password-reset emails 150/day (https://firebase.google.com/docs/auth/limits)

Note: Firestore's daily read/write caps are a real constraint for a feed app. Listeners and naive feed queries burn reads fast.

## 8. Paid pricing

- **Supabase Pro:** from $25/month per org. Overages: DB $0.125/GB; egress $0.09/GB; cached egress $0.03/GB; MAU $0.00325 each over 100K; file storage $0.0213/GB; realtime $2.50/million messages.
- **Firebase Blaze:** pay-as-you-go. Spark quotas are included; overage billed per Google Cloud rate for each service. Firestore is billed per document read/write/delete and storage; Auth beyond 50K MAU is billed per MAU (verify current rates on the pricing page). A $300 new-account credit may apply.
- **Cost predictability:** Supabase's monthly base plus overages is easier to forecast. Firestore cost scales with reads, which spikes with feed usage.

## 9. Developer experience, Expo, and scaling

- **Expo:** Supabase JS client works in Expo with `expo-secure-store` or AsyncStorage for sessions. Firebase requires `@react-native-firebase` (native build) or the web SDK (limited persistence on native). Expo Go is not sufficient for either native-module setup; use development builds with EAS.
- **Dev experience:** Supabase has a local CLI with Docker-based local stack, migrations, and generated TypeScript types. Firebase has a strong emulator suite for Firestore, Auth, and rules testing.
- **Scaling:** Postgres scales vertically and with read replicas; very large social graphs need care (indexes, pagination, possibly partitioning). Firestore scales horizontally by design but requires denormalization and per-document limits (1 MiB document size, write rate limits per document).
- **Portability:** Supabase is Postgres, so you can migrate off it with `pg_dump`. Firestore export is more work.

## 10. Moderation tooling

Neither platform ships a complete UGC moderation product. Plan to build or integrate:
- Image scanning on upload (for example, a Google Cloud Vision SafeSearch or a third-party moderation API) before the post becomes visible. Not verified in this research; check current pricing.
- Text filtering for comments (blocklists plus a moderation API).
- A reports table (Supabase) or reports collection (Firestore) with an admin review queue, block tables, and audit logs.
- Firebase has an Extensions marketplace that may include moderation extensions; their current availability was not verified here.

Verdict: Postgres makes the reports/blocks/audit tables and the enforcement queries simpler, which matters for App Store and Google Play requirements (see UGC_STORE_REQUIREMENTS.md).

## 11. Recommendation

**Use Supabase (Postgres + Auth + Storage + Realtime) for this app.**

Reasoning:
1. The data is relational (follows, likes, comments, blocks), and feeds are queries, not document reads. Postgres avoids heavy denormalization.
2. RLS expresses social access rules (blocks, follower-only content, age-gated visibility) directly and enforceably.
3. Account deletion (App Store 5.1.1(v)) and block/report cascades are simpler with foreign keys.
4. Cost is more predictable: the free tier is generous for launch (50K MAU, 500 MB DB, 1 GB storage), and Pro overages are published per unit.
5. Lower lock-in: standard Postgres can be exported or moved.

Accepted trade-offs:
- Realtime is less polished than Firestore listeners for high-frequency feeds; start with polling or broadcast for counts.
- Free tier egress (5 GB) and storage (1 GB) will be exhausted almost immediately by image content; budget for Pro ($25/month) before a public launch and use a CDN and resized thumbnails.
- Supabase Free pauses after 1 week of inactivity; not an issue in production but must be on Pro for launch.

When to choose Firebase instead: if the team already runs on Google Cloud, needs best-in-class realtime chat, or relies on Firebase Extensions for specific features. Re-evaluate if feed fan-out needs exceed Postgres at scale.

## 12. Next steps

- Prototype the follow graph, feed query, and block-aware RLS policies in a Supabase branch before committing.
- Model egress: estimate images per user per day times average size times thumbnail strategy.
- Set up EAS development builds to verify auth and storage in Expo.
- Re-verify pricing and free-tier numbers the week of launch.
