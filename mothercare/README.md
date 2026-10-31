# MotherCare (working title)

A responsive web app for menstrual-cycle tracking, pregnancy progress and postpartum support.
The product name is configurable (`VITE_APP_NAME`).

> **Status: Phase 2 source written, NOT VERIFIED.**
> The type-check, the real unit-test run and the production build have **not** been executed
> (the authoring environment could not reach the npm registry). Run the commands below and fix anything they report
> before relying on this code. See [Verification status](#verification-status).

## What exists in Phase 2

- Responsive shell: bottom navigation on phones, sidebar on tablet/desktop, skip link, keyboard focus styles.
- Reusable design components (`src/components/ui`): Button, Card, TextField/SelectField/CheckboxField, Alert, ProgressRing.
- Registration and login with validation (zod). Supabase email/password when configured; otherwise a clearly labelled
  **development-only** fallback (see below).
- Optional onboarding/profile (every field optional, with explicit consent before anything reproductive is recorded).
- Stage-based dashboard: pregnancy (week + day, estimated due date, basis, progress, trimester, warning signs, daily
  checklist), cycle tracking (cycle day, next-period range, fertile-window estimate, history, log/remove a period start),
  postpartum (day/week and the 12-week bands, warning signs for mother and baby).
- Pure, unit-tested domain logic: `src/domain/{pregnancy,cycle,postpartum,onboarding}.ts` and `src/lib/dates.ts`.

Everything else is shown honestly as **"Not available yet"** (weekly content, journal, symptoms/mood, calendar,
medications, appointments, scanner, consultations, community, admin). No fake data or fake success states.

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

### Where data is stored in Phase 2 (important)

Profile and period data are stored **only in the browser on this device, unencrypted** (`localStorage`, keyed by user id),
even when Supabase auth is used. There is no database, no Row Level Security and no sync yet; those arrive in Phase 3.
"Sign out and erase data on this device" removes this user's local records. Do not use real health information
until server-side storage with access rules exists.

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
  stores/         zustand stores (session, profile)
  tests/unit/     Vitest tests
```

## Verification status

| Check | Status |
|---|---|
| `npm install` | **NOT VERIFIED** (registry unreachable where this was written) |
| `npm run typecheck` | **NOT VERIFIED** |
| `npm test` (real Vitest) | **NOT VERIFIED** |
| `npm run build` | **NOT VERIFIED** |
| Responsive layout / accessibility in a browser | **NOT VERIFIED** |
| Supabase sign-up/sign-in against a real project | **NOT VERIFIED** |

## Known gaps in Phase 2

See `LIMITATIONS.md`.
