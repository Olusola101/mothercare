# Known limitations after Phase 5

## Not implemented yet
- Account deletion and full data export for server data (Phase 7). Journal export exists; "erase data on this device" exists.
- PWA (manifest, service worker, offline support, installability).
- Journal photos.

  admin and content-review workflow (Phase 7).
- Notifications of any kind. The "reminders" checkbox only records a preference.
- Automated component, end-to-end, accessibility tests (Phase 8). Database policy tests exist (155 checks).
- Pregnancy: clearing a saved LMP/EDD from the profile form (leaving a field blank keeps the saved value).
- Localisation. English only; warning-sign text is not region-specific.
- Calendar days cannot be tapped to log; use the day form.

## Medicines and appointments
- No notifications or push reminders of any kind. Only a downloadable calendar file for appointments.
- No dose checking, interaction checking or medicine database. Everything is typed by the user.
- Medicine and appointment data reuse the single "reproductive health" consent record; there is no separate consent for them.
- No recurring appointments, no editing of past dose records other than undo, and no sharing with a clinician.
- Local mode and the database both refuse writes until the profile (with consent) exists.

## Ingredient check
- Only five ingredient groups are covered, all from unreviewed drafts. Most real products will come back "unable to assess".
- No live camera scanning; OCR is error-prone and the user must check the list; exact-match only, so spelling variants are not recognised.
- It cannot account for dose, pregnancy stage or individual health. No trimester logic exists yet.
- The knowledge base is a bundled file, not yet in the database or an admin screen (Phase 7). Two cited sources are an NHS Trust
  leaflet (its own review date, July 2026, has passed) and an NHS board page (2021); a clinician must review all of it.
- Barcode lookup depends on a third-party volunteer database and the browser's BarcodeDetector, which many browsers lack.

## Content
- All 17 articles are unreviewed drafts. No clinician has reviewed them and no source link has been checked by a person.
  The UI says so. Nothing may be labelled "reviewed" until a real reviewer approves it (the database enforces a named reviewer).

## Design limits
- Two period starts closer than 15 days are treated as a data error for statistics.
- The fertile-window estimate assumes a 14-day luteal phase and is withheld for irregular cycles. It is not contraception.
- Local mode is unencrypted device storage. Server mode relies on Supabase's standard protections; no field-level encryption.
- The consent checkbox and privacy summary are placeholders. Legal text and a Nigerian data-protection assessment are
  needed before real users. No compliance is claimed.
- Reading a stale consent: if consent is withdrawn in the database, writes are refused but the UI has no withdraw screen yet (Phase 7).

## Unverified
The React screens and the Supabase client code have never been run. See the README verification table.

## Phase 5b
- Camera/upload, Word export in Word itself, avatar resize, checklist, postpartum period UI and all new React code: NOT VERIFIED in a browser.
- The AI explanation function is a skeleton with a placeholder provider call; never deployed or run. Hosted AI is paid.
- Icon names are checked only against loose stand-ins, not the real lucide-react package.
- Remaining text reduction is partial; other pages still have long paragraphs.

## Phase 6
- Moderator screen added in Phase 7 (NOT VERIFIED).
- AI moderation is a skeleton with a placeholder provider call; paid; never run.
- Directory is empty by design. No emergency or helpline numbers are included.
- Community/Directory React pages and the Supabase client calls are NOT VERIFIED.

## Phase 7
- Staff screens (moderation queue, content review, audit log) and the privacy page are NOT VERIFIED in a browser or against a live Supabase project.
- No screen for assigning roles; use `admin_set_role()` in SQL. No article editor.
- The Nigerian data-protection assessment has NOT been done (see docs/PHASE7_ADMIN_PRIVACY.md). The consent wording is a placeholder.

## Phase 8
- Playwright specs, axe scans and the CSP have never run in a browser. Static audits found no issues, but they are not a security review or an accessibility test.
- No screen-reader, keyboard-only, zoom or colour-contrast testing done. No penetration test. `npm audit` not run.
- AI-calling edge functions have no per-user rate limit.

## Phase 9
- Nothing has been deployed. The deployment guide, CI workflow and hosting/Supabase steps are written from general knowledge and have never been run; provider pricing, limits and terms must be checked by you.
- No service worker: no offline use. Installable via the manifest only (not tested on devices).
- No managed backups are assumed; the guide describes manual `pg_dump` and a restore test you must do.
- The app is not ready for real users until the launch gate in docs/DEPLOYMENT.md is met.

## Phase 10A
- Navigation, week pages and dashboard week links are NOT VERIFIED: never compiled or rendered. See docs/PHASE10A.md.
- Week pages carry no baby-size or development data until sourced, person-checked entries are added.

- Due-date calculator (`/journey/due-date`) is NOT VERIFIED in a browser; no cycle-length adjustment.
- Baby movement counter (`/journey/kicks`): screen, store and Supabase calls NOT VERIFIED. Database rules passed on a scratch PostgreSQL 16 (not real Supabase). Safety wording needs clinician review. An unfinished session is lost if the page closes.
- Contraction timer (`/journey/contractions`): screen, store and Supabase calls NOT VERIFIED; database rules passed on scratch PostgreSQL 16 only. Safety wording needs clinician review. An unfinished session is lost if the page closes.
- Weight tracker (`/journey/weight`): screen, chart, store and Supabase calls NOT VERIFIED; database rules passed on scratch PostgreSQL 16 only. Kilograms only. Wording needs clinician review.

- Hospital bag: suggested items are generic and unreviewed by a clinician; the screen, store actions and Supabase calls have not been run against real dependencies (NOT VERIFIED).

- Birth plan: topic prompts are unreviewed by a clinician; printing relies on the browser print dialog and has not been tried in any browser (NOT VERIFIED).

- To-do list: the screen, store actions and Supabase calls have not been run against real dependencies (NOT VERIFIED). There are no reminders or notifications yet (planned for 10E).

- Baby shopping list: the screen, store actions and Supabase calls have not been run against real dependencies (NOT VERIFIED). One currency per install (configurable); no per-item currency, no kobo.

- Calendar: the .ics export has only been checked against its own unit tests, not imported into any real calendar app (NOT VERIFIED). Timed items use floating local time. No reminders or notifications (planned for 10E).

- Baby logs (`/health/baby`): entries cannot be edited yet; Supabase loads only the newest 1000 logs; no growth, immunisation or recovery tracking yet; the screen, store and Supabase calls are NOT VERIFIED; the safety wording needs clinician review.

- Baby growth (`/health/baby/growth`): no reference charts or centiles (none sourced); measurements cannot be edited yet; the screen, charts, store and Supabase calls are NOT VERIFIED; the safety wording needs clinician review.

- Vaccinations (`/health/baby/vaccinations`): the bundled Nigerian schedule is an UNVERIFIED DRAFT taken from an unofficial source and must be checked against the current official NPHCDA schedule and reviewed by a clinician before launch; only one country list exists; records cannot be edited (remove and re-add); the screen, store and Supabase calls are NOT VERIFIED; the safety wording needs clinician review.

- Recovery diary (`/health/recovery`): entries cannot be edited except by saving the same date again (it replaces); no mood or bleeding fields and no summaries, by design; the screen, store and Supabase calls are NOT VERIFIED; the safety wording needs clinician review.

- Partner sharing (`/journey/partner`): the database rules are tested only on a scratch PostgreSQL server with a stand-in for Supabase auth, never on real Supabase (NOT VERIFIED there); the screens and Supabase calls are NOT VERIFIED; the invite code travels outside the app, so anyone who obtains it within 48 hours before the partner can use it; there is no log of what a partner viewed; a partner label is the other person's display name; medications, recovery and baby data cannot be shared; the privacy wording needs review and the sharing of health information needs the data-protection assessment.

- Directory workflow (`/staff` Directory tab): database rules tested only on a scratch PostgreSQL server, never on real Supabase; the staff screen and Supabase calls are NOT VERIFIED; the verification date is the UTC date; the app has no process to re-check entries later or accept public corrections; no roles exist yet in a real project until an admin is created in the database; the directory is empty until real, checked entries are added.

- Photo journal (`/journey/photos`): photos live only in this browser (not encrypted, not backed up, not synced, not in the data download); the storage and resize code was checked in Chromium through a scratch harness, the screen, Safari and Firefox were NOT; EXIF orientation of real phone photos was not tested; no caption editing.

## Reminders (Phase 10E)
- Reminders are browser notifications shown only while MotherCare is open in a tab or window. There is no service worker, no push server and no background delivery, so nothing arrives when the app is closed and a reminder can be missed. They must not be relied on for anything that matters.
- Settings and the list of reminders already shown are kept in this browser only (`mothercare.reminders.<userId>`), are not synced between devices, and are removed by sign-out with erase. They are not in the data export.
- Notification text is generic by default; details (appointment title, medicine name, never the dose) are opt-in.
- Medication reminders appear for 15 minutes from the scheduled time and stop once the dose is recorded; the app never says a dose was missed or late.
- The reminders screen, the hook, notification display and permission prompt are NOT VERIFIED in a browser. Only the due-reminder logic is covered by unit tests.
- Web push and offline/PWA support remain unbuilt. They need a decision on never caching account or health responses.

## Settings hub (Phase 10E)
- `/settings` only links to existing screens (profile, reminders, partner sharing, privacy, and staff tools for staff). It holds no settings of its own. The screen is NOT VERIFIED in a browser; the link list and the highlighted tab are unit tested.

## Offline page (Phase 10E)
- A service worker shows a plain offline page when a page load fails. The app does not work offline and keeps nothing for offline use. It is registered only in production builds.
- Verified in real Chromium against a plain static server with a copy of `sw.js` (controlled page, one cached file, offline navigation shows the offline page, other requests untouched). NOT VERIFIED: the registration in `src/main.tsx`, the real Vite build, the deployed headers/CSP, and `/sw.js` cache-control on a real host.
