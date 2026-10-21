# UGC and Store Requirements: Apple, Google Play, and Minors

Status: research summary, not legal advice. Research date: 2026-10-21. Confirm with counsel before launch, and re-check the live policy pages on submission day.

## 1. Sources

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple guideline 5.1.1 (account deletion reference): https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion
- Apple Upcoming Requirements: https://developer.apple.com/news/upcoming-requirements/
- Google Play User Generated Content policy: https://support.google.com/googleplay/android-developer/answer/9876937
- FTC COPPA Rule: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- Utah SB 142 (App Store Accountability Act) litigation, CCIA v. Brown, D. Utah No. 2:26-cv-00094: https://ccianet.org/litigation/ccia-v-brown/
- Texas SB 2420 (preliminarily enjoined Dec. 23, 2025): https://www.pillsburylaw.com/en/news-and-insights/app-store-accountability-act-texas.html

## 2. Apple App Store Review Guideline 1.2 (User-Generated Content)

Quoted from the guidelines page. Apps with UGC "must include":
- "A method for filtering objectionable material from being posted to the app"
- "A mechanism to report offensive content and timely responses to concerns"
- "The ability to block abusive users from the service"
- "Published contact information so users can easily reach you"

Additional points from 1.2:
- Responsibility to remove content that violates the guideline, ToS, or community standards is on the developer.
- Apps "primarily" used for pornography, random or anonymous chat, "hot-or-not" style objectification of real people, physical threats, or bullying "do not belong on the App Store and may be removed without notice."
- Failing to remediate after notice can lead to removal, and egregious or repeated behavior can lead to removal from the Developer Program.

Implication for this app: a feed of photos of real people with comments is squarely in scope. Ratings-style features ("hot or not", outfit rating that objectifies people) should be avoided or heavily gated.

## 3. Apple Guideline 5.1.1(v): Account Deletion

Quoted: "If your app supports account creation, you must also offer account deletion within the app."

Practical requirements (from Apple's guideline reference and developer forum guidance; verify on the live page):
- Deletion must be initiated inside the app, not only via a website or support email, unless the app is in a highly regulated industry.
- Deactivation is not enough; personal data must be removed except data the developer is legally required to keep.
- A confirmation step is allowed.
- If Sign in with Apple is used, revoke tokens via the Sign in with Apple REST API on deletion.

## 4. Google Play User Generated Content Policy

Paraphrased from the policy page (exact wording is on the page):
- Users must accept the app's terms of use and/or user policy before creating or uploading UGC.
- Objectionable content and behaviors must be defined and prohibited in those terms.
- Moderation must be ongoing and proportionate to the UGC type.
- Apps with publicly accessible UGC must provide in-app reporting of content and users, and in-app blocking of users. Apps with 1:1 interaction (messaging, tagging) must let users block others.
- Monetization must not encourage objectionable behavior.
- Incidental sexual content must be hidden by default behind filters that require at least two user actions to disable; sexual content that is illegal or child endangerment is never permitted.
- Children must be explicitly barred by an age screen where the content rating requires it.
- Content rating questionnaire answers about UGC must be accurate.
- Apps must have safeguards against threats, harassment, or bullying, "particularly toward minors."
- Apps whose primary purpose is featuring objectionable UGC are removed.

## 5. Minors: COPPA, Age Ratings, and State Age-Assurance Laws

### COPPA (federal, US)
- Applies to operators of services "directed to children under 13" and to general-audience services that have actual knowledge they collect personal information from a child under 13.
- Requires verifiable parental consent before collecting personal info from under-13s, plus a privacy notice.
- Policy choice: the simplest compliant approach is an age gate at signup that blocks under-13s from creating accounts and from posting. Do not collect a child's name, email, photos, or location.
- Note: FTC amended the COPPA Rule in 2025; check the Federal Register text for the compliance date. The 2026 FTC activity on age verification is a policy statement and should be reviewed by counsel.

### Teen users (13 to 17)
- Teen-specific protections are driven by state laws, platform policy, and general safety expectations. Default teen accounts to private profiles, limit DMs from non-followers, and do not expose teen location or full names publicly.
- Expect app-store age-rating questionnaires to classify a UGC social app at a higher rating (Apple and Google both ask about UGC, social features, and unrestricted web access).

### Apple age ratings and Google content ratings
- Answer the App Store Connect age-rating questionnaire accurately (it includes UGC and social features). Google Play requires an accurate IARC questionnaire response for UGC.
- Apple's 1.3 Kids Category (not applicable unless you target kids) requires no third-party analytics or ads for kids apps.

### State App Store Accountability Acts (2025-2026)
- **Utah SB 142 (App Store Accountability Act):** Key provisions were scheduled to take effect in May 2026. CCIA sued in February 2026 (D. Utah, No. 2:26-cv-00094) and asked for a preliminary injunction. This research did not find a ruling on that motion. Check the docket before relying on the law's status.
- **Texas SB 2420:** A federal court preliminarily enjoined enforcement on December 23, 2025, before it took effect (CCIA v. Paxton).
- **Louisiana and California:** Reported to have app-store age-assurance laws with later effective dates (reported Louisiana July 1, 2026; California January 1, 2027). Not verified against primary text in this research.
- Practical implication: these laws generally require app stores to verify age and pass age-category signals to developers, and developers to use them. Design the app so it can receive an age-range signal from the platform (Apple's Declared Age Range API, Google's Play Age Signals) without depending on it, and so it works if the signal is missing. Confirm the current status before implementation.

## 6. Pre-Launch Checklist

Content and safety
- [ ] Terms of Service and Community Guidelines define prohibited content and behavior (nudity, harassment, hate, self-harm, minors' sexualization, real-person objectification).
- [ ] Users accept the terms before first post or comment (recorded with timestamp and version).
- [ ] Pre-publication filtering: image scanning for nudity/sexual content and text blocklist for comments. Filtering action is logged.
- [ ] In-app "Report" on every post, comment, and profile, with reason categories.
- [ ] Reports reviewed; a documented SLA (aim for 24 hours for flagged abuse, faster for threats or minor safety) and an admin queue.
- [ ] Enforcement actions: remove content, warn, suspend, ban; reporter gets acknowledgment.
- [ ] In-app "Block user" that hides their content and prevents interaction both ways; blocks respected in feeds, comments, follows, and search.
- [ ] Published contact information in-app (support email or form) and on the store listing.
- [ ] Incidental sexual content hidden by default with at least two actions to reveal (Google requirement).
- [ ] Ban evasion and repeat-offender handling documented.
- [ ] Audit log of moderation actions.
- [ ] Mute/unfollow, and limit who can comment or DM.

Accounts and deletion
- [ ] In-app account deletion that removes profile, posts, images (storage objects), comments, likes, follows, and tokens. Confirm step included.
- [ ] Deletion propagates to backups within a stated window; document the window.
- [ ] Sign in with Apple token revocation on deletion, if Sign in with Apple is offered.
- [ ] Data export option if offered (recommended for GDPR).
- [ ] Deactivation is not a substitute for deletion.

Minors
- [ ] Age gate at signup (date of birth). Under-13 users are blocked from creating accounts; no personal data collected from them.
- [ ] Teen accounts (13 to 17) default to private profile, no public location, restricted DMs and comments from strangers.
- [ ] No sexualized content featuring minors; reports involving minors escalated immediately (and reported to NCMEC where required; confirm with counsel).
- [ ] Privacy policy describes how minors' data is handled (COPPA and state laws).
- [ ] Accurate App Store age rating and Google IARC questionnaire answers for UGC and social features.
- [ ] Platform age-signal integration is optional and tested with and without a signal.

Store submission
- [ ] App Store Connect age-rating questionnaire completed (UGC, social networking, unrestricted web access).
- [ ] Google Play Data safety section and UGC declaration completed.
- [ ] Privacy policy URL and support URL live.
- [ ] Demo account and instructions for App Review that show reporting, blocking, and deletion.
- [ ] Review notes explain moderation workflow and contact channel.

Backend (Supabase-specific, if chosen)
- [ ] RLS enabled on every table; policies tested for block lists and minors' visibility.
- [ ] Reports and blocks tables with foreign keys; deletion cascades tested.
- [ ] Storage bucket policies restrict uploads to the owner and delete on account removal.

## 7. Open Items

- Confirm Utah SB 142 injunction status on CourtListener (case 2:26-cv-00094).
- Read the full text of Google's UGC policy and Apple's 5.1.1 page; this document paraphrases and quotes only the parts retrieved.
- Confirm COPPA 2025 amendment compliance dates in the Federal Register.
- Confirm Apple's Declared Age Range and Google Play Age Signals API availability for your target OS versions.
- Legal review on minors' data and NCMEC reporting obligations.
