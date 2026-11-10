# MotherCare (working title)

A responsive web app for menstrual-cycle tracking, pregnancy progress and postpartum support.
The product name is configurable (`VITE_APP_NAME`).

> **Status: all nine phases are written. NOTHING has been verified with the real toolchain.**
> The type-check, the real unit-test run, the production build and the browser tests have **not** been executed
> (the authoring environment could not reach the npm registry). Run the commands below and fix anything they report
> before relying on this code. It is **not** ready for real users: see [Launch gate](docs/DEPLOYMENT.md#0-gate-do-not-deploy-until-these-are-true).

## What exists (Phases 2 to 9)

- Responsive shell: bottom navigation on phones, sidebar on tablet/desktop, skip link, keyboard focus styles.
- Reusable design components (`src/components/ui`): Button, Card, TextField/SelectField/CheckboxField, Alert, ProgressRing.
- Registration and login with validation (zod). Supabase email/password when configured; otherwise a clearly labelled
  **development-only** fallback (see below).
- Optional onboarding/profile (every field optional, with explicit consent before anything reproductive is recorded).
- Stage-based dashboard: pregnancy (week + day, estimated due date, basis, progress, trimester, warning signs, daily
  checklist), cycle tracking (cycle day, next-period range, fertile-window estimate, history, log/remove a period start),
  postpartum (day/week and the 12-week bands, warning signs for mother and baby).
- Pure, unit-tested domain logic: `src/domain/{pregnancy,cycle,postpartum,onboarding}.ts` and `src/lib/dates.ts`.

Later phases add: weekly education (unreviewed drafts), journal, symptom/mood and baby logs, medicines and appointments,
an ingredient checker, a referral directory (empty until real, checked entries are added), a moderated community
(server accounts only), staff tools, privacy tools, and deployment config. No fake data or fake success states.

## Install and run

Requires Node.js 20 or newer.

```bash
npm install
npm test            # Vitest unit tests
npm run typecheck   # tsc --noEmit
npm run build       # type-check + production build into dist/
npm run dev         # development server
```

Copy `.env.example` to `.env` to configure (all values optional in development):

| Variable | Purpose |
|---|---|
| `VITE_APP_NAME` | Product name shown in the UI (default `MotherCare`). |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Your Supabase project (Settings → API). Only the public **anon** key belongs here. Never put a service-role key in any `VITE_*` variable. |
| `VITE_ALLOW_DEV_AUTH` | Leave `false`. See below. |

### Authentication modes

1. **Supabase configured** → real email/password accounts. Depending on your project's settings, a confirmation
   email may be required. The app validates the session with the server on load.
2. **Supabase not configured, `npm run dev`** → **development sign-in. Not secure.**
   Passwords are neither stored nor checked (any non-empty password works), accounts are kept unencrypted in this
   browser's `localStorage`, and the session lives in `sessionStorage`. A warning banner is always shown.
   Use fictional data only.
3. **Supabase not configured, production build** → the login and register pages explain that authentication is not
   configured. The dev fallback is off unless you deliberately set `VITE_ALLOW_DEV_AUTH=true` (not recommended).

### Where data is stored (Phase 3)

All reads and writes go through `src/data` (`HealthRepository`).

- **Supabase configured:** data is saved to Postgres (`supabase/migrations/0001_phase3_core.sql`) with Row Level Security.
  A consent record is written first; the database refuses reproductive-health writes without a granted consent row.
  The client code for this is **NOT VERIFIED against a real Supabase project**.
- **Dev fallback / no Supabase:** data stays **only in this browser, unencrypted** (`localStorage`). "Sign out and erase
  data on this device" removes it. Not backed up, not synced.

Do not enter real health information until a data-protection assessment has been done. No compliance is claimed.

### Database setup (Supabase)
1. Create a free Supabase project and run `supabase/migrations/0001_phase3_core.sql` in the SQL editor.
2. Optional: `node scripts/generate-seed.mjs` regenerates `supabase/seed.sql` (17 **unreviewed draft** articles); run it in the SQL editor.
3. Put the project URL and anon key in `.env` (see `.env.example`). Never put the service-role key in the app.
4. Local policy tests (needs PostgreSQL 14+ and `psql`): `PGURL=postgres://user@host:port/db bash supabase/tests/run-local.sh`
   (it uses a stand-in for Supabase's auth schema, in `supabase/tests/00_local_supabase_stub.sql`).

## How the calculations work (and their limits)

- **Gestational age** counts from the first day of the last menstrual period (LMP). **EDD = LMP + 280 days.**
  A clinician-confirmed EDD overrides an LMP; an LMP overrides a self-entered EDD; a "weeks pregnant" answer is
  converted to an approximate LMP and labelled as approximate. Trimesters: 1 = weeks 0–13, 2 = 14–27, 3 = 28+.
  More than 43 weeks is treated as implausible and the user is asked to check their dates.
- **Cycle predictions** use period start dates. Gaps under 15 or over 90 days are excluded as likely data errors;
  statistics use the six most recent plausible cycles. "Regular" means the shortest and longest recent cycle differ by
  7 days or less, and needs at least three cycles. Predictions are shown as a **range**, never a single certainty,
  with a confidence label. The fertile window is estimated as ovulation (expected period − 14 days) −5 to +1 days, and is
  **withheld for irregular cycles**. It must not be used as contraception.
- **Postpartum**: delivery day is day 1. Bands: days 1–7, 8–28 (weeks 2–4), 29–56 (weeks 5–8), 57–84 (weeks 9–12).
- All dates are plain `YYYY-MM-DD` calendar dates handled in UTC arithmetic, and "today" is computed in the user's
  chosen time zone, so results do not shift with the device's zone or daylight-saving changes.

## Medical content

The warning-sign lists in `src/components/EmergencyBanner.tsx` are **general guidance and have not been clinically
reviewed.** Before launch a qualified clinician must review them and add region-specific guidance (including the local
emergency number). No weekly or postpartum educational content is shipped yet; it will only appear with sources and an
honest review status.

## Project layout

```
src/
  app/            shell + route guards
  components/     ui primitives and shared components
  config/         app configuration
  domain/         pure logic (pregnancy, cycle, postpartum, onboarding)
  features/       auth, onboarding, dashboard, placeholder
  lib/            dates, storage, auth (supabase + dev), validation
  stores/         zustand stores (session, profile, tracking)
  data/           repositories (local and Supabase), sanitizers
  content/        draft articles and sources (JSON)
  tests/unit/     Vitest tests
```

## Phase 3 features
Cycle day log (flow, cramps, mood, symptoms), accessible month calendar, optional period end dates; pregnancy symptom/mood
log and week-by-week information; postpartum feeding/sleep/nappy log and stage information; private journal (weekly
prompt, search/filter, grouped by week, edit, delete, export as text/JSON, delete all); Learn page. Every numeric
input accepts whole numbers only (no letters, decimals or signs).
Content is **draft and not clinically reviewed**; no reviewer has approved anything. Journal photos are not supported.

## Phase 4 features
Care page: medicines (name, dose copied by the user from the label, up to 12 times a day, start/end dates, pause, delete), a
"today's doses" list where the user marks each dose taken or skipped (with a factual 7-day count; no score), and appointments
(type, date, optional time, place, notes; mark attended or cancelled; "Add to my calendar app" downloads a .ics file so the
user's own calendar sends the reminder). **The app sends no notifications.** It never suggests, calculates or checks doses
and does not check interactions. Database: `supabase/migrations/0002_phase4_care.sql`.

## Phase 5: ingredient check (`/scan`)
Product type (food, cosmetic, skincare, supplement, medicine) → ingredients (typed/pasted, photo of the label read by OCR on
the device, or a barcode lookup) → the user must tick that the list matches the label → result.
- **Knowledge base** (`src/content/ingredients.json`): five entries (alcohol, caffeine, liver products, vitamin A in supplements,
  raw milk), each written only from the two NHS sources it cites, each marked **unreviewed draft**. Evidence strength is
  "not stated" because the sources do not state it. Everything else, including topical retinoids and all skincare, is
  **not covered**, and the app says "unable to assess" for it. Nothing is ever called safe because it was not found.
- Matching is exact after normalisation (no fuzzy matching), medicines are never assessed, and "no flagged concern" is
  only possible when every ingredient is covered by a clinician-REVIEWED entry (none exist yet).
- Nothing is stored: no photos, no scan history.

**Outside services and new dependency (all free; please review):**
- `tesseract.js` (Apache-2.0): OCR in the browser. On first use it downloads English language data from a public CDN.
  The photo is not uploaded.
- Open Food Facts (free, ODbL): barcode lookup. Only the barcode number is sent, only when the user presses the button.
  Data is volunteer-edited and can be wrong.
- Browser `BarcodeDetector` (where it exists) for reading a barcode from a photo. There is no live camera scanner.

## Verification status

| Check | Status |
|---|---|
| `npm install` | **NOT VERIFIED** (registry unreachable where this was written) |
| `npm run typecheck` | **NOT VERIFIED**. A strict check against loose stand-ins for React, router, zustand, Supabase and lucide is clean apart from 3 stand-in-only complaints. |
| `npm test` (real Vitest) | **NOT VERIFIED**. A home-made stand-in runner ran the pure-logic tests: 328/328 passed. That is not Vitest. |
| `npm run build` | **NOT VERIFIED** |
| `npm run test:e2e` (Playwright + axe) | **NOT VERIFIED**: specs written and type-checked against real Playwright types, never run |
| SQL migrations, RLS and constraints | Ran on a scratch PostgreSQL 16 with a stand-in for Supabase auth: 236/236 checks passed. Not run on real Supabase. |
| `scripts/security-audit.mjs`, `a11y-audit.mjs`, `predeploy-check.mjs` | Ran here and pass; each was shown to catch planted problems. They are not a security review or an accessibility test. |
| React screens, Supabase client code, OCR, camera, barcode, edge functions, CSP | **NOT VERIFIED** (never rendered or run) |
| Screen-reader, keyboard, contrast, real devices, penetration test, `npm audit` | **NOT DONE** |

## Known gaps
See `LIMITATIONS.md`.

## Phase 5b changes (improvement list)
- Scanner photos: separate **Camera** (live capture) and **Upload** (existing file) icon buttons. NOT VERIFIED in a browser.
- Journal: export is **Text** or **Word (.docx)** only; one-row search (keyword, week, mood); date and week on one line.
- Onboarding: weeks and extra days side by side with icons.
- Wellness checklist: **Done** button once every item is ticked, then a commendation.
- Optional name and picture (Profile → "About you"); greeting and avatar use them. Migration `0003_account_avatar.sql`.
- Postpartum: log and view periods after birth (no predictions; dates before birth refused).
- AI ingredient explanations: design and guarded skeleton, off by default. See `docs/AI_INGREDIENT_EXPLANATIONS.md`. Paid API; NOT VERIFIED.
- More icons, fewer visible paragraphs (details moved behind ⓘ).

## Phase 6 (community and referral directory)
See `docs/COMMUNITY_AND_DIRECTORY.md`. Migration `0004_phase6_community.sql`; tests `supabase/tests/phase6_rls.test.sql`.
Directory ships empty. Community needs a server account and a moderation function that is a skeleton. NOT VERIFIED in a browser or against Supabase.

## Phase 7 (staff, privacy, content management)
See `docs/PHASE7_ADMIN_PRIVACY.md`. Migration `0005_phase7_admin_privacy.sql`; tests `supabase/tests/phase7_rls.test.sql`. Screens NOT VERIFIED.

## Phase 8 (E2E, accessibility, security)
See `docs/PHASE8_QUALITY_SECURITY.md`. New scripts: `audit:security`, `audit:a11y`, `headers`, `test:e2e`. E2E specs, CSP and axe results are NOT VERIFIED.

## Phase 9 (deployment)
See `docs/DEPLOYMENT.md`. Added: `scripts/predeploy-check.mjs`, `.github/workflows/ci.yml`, `supabase/bootstrap-admin.sql`, web manifest and icons
(no service worker), `public/_redirects`. Nothing has been deployed.

## Phase 10A (first slice)
Five-tab navigation, `/journey`, `/health`, week pages `/journey/week/1..40`. See `docs/PHASE10A.md`. NOT VERIFIED beyond static checks and stand-in unit tests.

## Phase 10 (so far)
Pregnancy and postpartum features added on top of Phase 9: kick counter, contraction timer, weight log, hospital bag, birth plan (printable), to-dos, baby shopping, calendar with .ics export, baby profiles and feed/sleep/nappy logs, baby growth, vaccination record (unverified draft schedule), recovery diary, partner sharing with one-time codes, a directory verification workflow, and dashboard cards, in-app reminders (only while the app is open), a Settings hub and an offline page. Migrations `0006` to `0019`.

**Run everything on a machine with npm:** `npm install && npm run typecheck && npm test && npm run build && npm run test:e2e`, and `PGURL=postgres://... bash supabase/tests/run-local.sh` for the database rules. New optional settings: `VITE_CURRENCY_CODE` (default NGN) and `VITE_COUNTRY_CODE` (default NG).

**Read first:** `docs/PRODUCTION_READINESS.md` (what is and is not verified, and what only people can decide), `docs/PHASE10A.md` (each slice), `LIMITATIONS.md`, `docs/DEPLOYMENT.md`.
