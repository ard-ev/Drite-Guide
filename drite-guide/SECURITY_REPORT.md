# Drite Guide Security Report

Audit date: 2026-05-31

## Executive Status

Deployment status: **Not ready until the Supabase migration is applied and dashboard settings are verified.**

The codebase is materially safer after this pass: auth tokens are moved to SecureStore on native builds, profile e-mail exposure is reduced, debug logs were removed/gated, profile picture uploads are validated, trip writes are owner-bound in the client, and a Supabase hardening migration was added.

## Critical / High Findings

### Fixed: Public profile reads could expose private fields

Severity: **High**

Affected files/tables:
- `public.user_profile`
- `src/services/profileService.js`
- `src/services/tripsService.js`
- `src/services/authService.js`
- `supabase/migrations/20260531120000_security_hardening.sql`

Risk:
The app previously selected `user_profile.*` in several public/profile flows. If table grants allowed it, attackers could enumerate e-mail addresses, roles, and verification status.

Fix:
- Frontend profile reads now request only public profile columns.
- New migration revokes broad `user_profile` grants and grants only safe public columns.
- Protected profile fields are blocked by update grants and a trigger.

Manual action:
Apply `supabase/migrations/20260531120000_security_hardening.sql` before deployment.

### Fixed: Native auth sessions were stored in AsyncStorage

Severity: **High**

Affected files:
- `src/lib/supabase.js`
- `package.json`
- `package-lock.json`

Risk:
AsyncStorage is not an encrypted token store. A compromised device backup or local filesystem access could expose Supabase refresh/access tokens.

Fix:
Added `expo-secure-store` and a chunked SecureStore auth-storage adapter for native builds. Web still uses AsyncStorage because SecureStore is native-only.

Manual action:
After release, require users to sign in again if you want to invalidate old AsyncStorage-backed mobile sessions.

### Fixed: Debug logs could leak auth/profile details

Severity: **High**

Affected files:
- `App.js`
- `src/context/AuthContext.js`
- `src/screens/SignupScreen.js`
- `src/screens/ExploreScreen.native.js`
- `src/screens/ExploreScreen.web.js`
- `src/screens/PlaceDetailScreen.js`
- `src/context/FavoritesContext.js`
- `src/screens/NotificationSettingsScreen.js`
- `src/utils/logger.js`

Risk:
Signup/auth errors and runtime stacks could leak sensitive values or implementation details in production logs.

Fix:
Removed sensitive auth/signup logs and routed non-sensitive diagnostics through a `__DEV__`-gated logger.

### Fixed: Profile picture uploads lacked strict client validation

Severity: **High**

Affected files/tables:
- `src/services/profileService.js`
- `storage.buckets`
- `storage.objects`
- `supabase/migrations/20260531120000_security_hardening.sql`

Risk:
Users could attempt unexpected file types or oversized uploads.

Fix:
Client now allows only JPG, PNG, and WebP profile pictures up to 5 MB. The migration also sets bucket MIME and size limits and restricts profile-picture object paths to the authenticated user's folder.

Manual action:
Verify the `profile-pictures` bucket has a 5 MB limit and allowed MIME types after applying the migration.

## Medium Findings

### Fixed: Trip place mutations relied too much on RLS alone

Severity: **Medium**

Affected files:
- `src/services/tripsService.js`
- `supabase/migrations/20260531120000_security_hardening.sql`

Risk:
Client calls for trip place add/update/remove did not include an owner filter on every write query.

Fix:
Client writes now include `owner_id = authenticated user`. RLS still remains the source of truth. The migration also adds a trigger that blocks non-owner client trip writes and prevents clients from silently adding already-accepted non-owner members.

### Needs manual decision: Username login still requires resolving username to e-mail

Severity: **Medium**

Affected files/tables:
- `src/services/authService.js`
- `public.resolve_login_email`

Risk:
Supabase password auth signs in with e-mail, not username. The new `resolve_login_email` RPC avoids broad profile-table e-mail exposure, but an attacker could still call the function to map a valid username to an e-mail address.

Recommended fix:
Choose one before production:
- Prefer privacy: remove username login and require e-mail login only.
- Prefer username login: move username login behind a rate-limited backend/Edge Function with abuse monitoring, CAPTCHA or device attestation, and generic responses.

Current mitigation:
Bulk public profile reads no longer include e-mail addresses.

### Needs manual action: Supabase Auth redirect allowlist

Severity: **Medium**

Affected settings:
- Supabase Dashboard > Authentication > URL Configuration

Risk:
Loose redirect URLs can enable auth link/session confusion.

Fix in code:
Auth redirect handling now accepts only configured Drite Guide HTTPS origins or `driteguide://auth/callback` / `driteguide://reset-password`.

Manual action:
Allowlist only production URLs and app scheme URLs:
- `https://driteguide.com`
- `https://driteguide.com/auth/callback`
- `driteguide://auth/callback`
- `driteguide://reset-password`

Remove localhost/preview URLs before production unless they are needed for a separate dev project.

## Low Findings

### Fixed: Hardcoded mock credentials existed in source

Severity: **Low**

Affected file:
- `src/data/mockUsers.js`

Risk:
Mock credentials can be mistaken for real test accounts and normalize unsafe patterns.

Fix:
Removed the unused mock user file.

### Fixed: Unsafe external map URL handling

Severity: **Low**

Affected file:
- `src/screens/PlaceDetailScreen.js`

Risk:
Untrusted URL schemes from place data could be opened by the device.

Fix:
Map URLs are normalized and restricted to HTTPS Google Maps / Apple Maps hosts.

## Supabase SQL Added

Migration file:
- `supabase/migrations/20260531120000_security_hardening.sql`

What it covers:
- RLS enabled on user/profile/follow/saved/trip/public-content tables.
- Restricted public profile column grants.
- Owner-only profile update policy and protected-field trigger.
- Saved places owner policies.
- Trip member read and owner write/delete policies.
- Public tourism content read-only grants.
- Storage bucket size/MIME limits.
- Profile picture storage policies scoped to the authenticated user's folder.
- `resolve_login_email` RPC for current username-login compatibility.

## Dependency Audit

Commands run:
- `npm audit --audit-level=moderate`: passed, 0 vulnerabilities.
- `npm outdated`: checked with network access.

Fixes:
- Added `expo-secure-store`.
- Updated safe Expo/React Navigation/Supabase patch/minor wanted versions.
- Fixed misnamed PNG logo assets that were referenced as `.jpeg` and failed Expo config validation.

Remaining:
Major upgrades such as Expo SDK 56 / React Native 0.85 are intentionally not applied in this security pass because they require a full framework migration and regression QA.

Expo Doctor:
- 17/18 checks passed after fixes.
- Remaining failure: Expo Doctor reports a custom `metro.config.js`, but no workspace `metro.config.js` exists outside package fixtures/templates under `node_modules`. Treat this as a manual follow-up if the warning persists in your local environment.

## Manual Deployment Gate

Before deployment:
1. Apply `supabase/migrations/20260531120000_security_hardening.sql`.
2. Verify Supabase Auth redirect allowlist.
3. Verify Storage bucket MIME and size settings in Dashboard.
4. Decide whether username login privacy tradeoff is acceptable.
5. Rotate Supabase anon key if `.env.local` was ever shared outside the local machine.
6. Run a real-device login/signup/password-reset smoke test after applying the migration.
7. Rerun `npx expo-doctor`; investigate the Metro warning if it still appears in your machine state.
