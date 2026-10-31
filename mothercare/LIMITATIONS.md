# Known limitations after Phase 2

## Not implemented yet
- Server-side storage, database migrations and Row Level Security (Phase 3). Profile data is device-only and unencrypted.
- Server-side consent records, account deletion and data export (Phase 7). Only "erase data on this device" exists.
- PWA (manifest, service worker, offline support, installability).
- Weekly pregnancy content, postpartum guidance articles, journal, symptom/mood tracking, period calendar,
  feeding/sleep logs (Phase 3).
- Medication reminders, appointments (Phase 4); ingredient scanner (Phase 5); consultations and community (Phase 6);
  admin and content-review workflow (Phase 7).
- Notifications of any kind. The "reminders" checkbox in the profile only records a preference.
- Automated component, end-to-end, accessibility and database-policy tests (Phase 8).
- Editing a past period entry in place (it can be removed and re-logged), period end dates, flow, symptoms.
- Pregnancy: clearing a saved LMP/EDD from the profile form (leaving a field blank keeps the saved value).
- Localisation. The UI is English only, and warning-sign text is not region-specific.

## Design limits to be aware of
- Two period starts logged very close together are treated as a data error for statistics (gap < 15 days), but the later
  date is still used as the "last period". Users can remove a mistaken entry.
- The fertile-window estimate assumes a 14-day luteal phase and is withheld for irregular cycles.
- The consent checkbox and the privacy/terms summary are placeholders. The operator needs reviewed legal text, and a data
  protection assessment (e.g. Nigerian requirements) before serving real users. No compliance is claimed.
- Supabase's `user_metadata` (used for display name and terms acceptance time) can be edited by the signed-in user, so it
  is not a trustworthy consent record. A server-side `consent_records` table replaces it in Phase 3.

## Unverified
Nothing in Phase 2 has been run through the real toolchain. See the README verification table.
