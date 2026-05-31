# Drite Guide Security Checklist

| Checked item | Status | Notes |
|---|---|---|
| Supabase service role key not exposed in Expo frontend | Passed | Frontend uses only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Service role appears only in Supabase Edge Function server env usage. |
| `.env.local` tracked by git | Passed | `.env*.local` is ignored; only `.env.example` is tracked. |
| Native auth token storage | Fixed | Added `expo-secure-store` and native SecureStore auth adapter. |
| Web auth token storage | Needs manual action | Web cannot use Expo SecureStore; use secure hosting, HTTPS, short JWT lifetimes, and avoid shared devices. |
| Signup validation | Fixed | Strong password and username validation already existed; sensitive signup logs removed. |
| Login validation | Fixed | Redirect URL handling now trusts only Drite Guide origins/app scheme paths. |
| Username login privacy | Needs manual action | Current RPC supports username login but can reveal username-to-email mapping. Decide whether to remove username login or move it behind a rate-limited backend. |
| Logout/session cleanup | Passed | Supabase signout is used; invalid refresh-token cleanup exists. |
| Email verification flow | Fixed | Debug logs removed; redirect handling restricted. |
| Password reset redirect | Needs manual action | Ensure Supabase Dashboard allowlists only production HTTPS and `driteguide://reset-password`. |
| Public profile data exposure | Fixed | Client selects public profile columns; migration restricts table column grants. |
| Owner-only profile edits | Fixed | Client strips protected fields; migration enforces update grants and trigger. |
| Saved places access | Fixed | Migration enforces owner-only select/insert/update/delete. |
| Trips read access | Fixed | Migration allows only members/owners to read trips. |
| Trips write access | Fixed | Client and migration enforce owner-only writes. |
| Trip join/invite bypass | Fixed | Migration blocks clients from inserting already-accepted non-owner members. Existing accept/decline RPC remains the controlled path. |
| Public tourism content write access | Fixed | Migration revokes anon/auth writes to categories, cities, places, and place images. |
| Admin-only data changes | Needs manual action | Use Supabase Dashboard/service-role backend only for admin content edits; do not add frontend admin writes without admin RLS policies. |
| Profile picture upload path isolation | Fixed | Client writes under `userId/...`; migration enforces authenticated user's folder. |
| Profile picture MIME/size validation | Fixed | Client validates JPG/PNG/WebP and 5 MB; migration sets bucket MIME/size limits. |
| Place/category/city image uploads | Needs manual action | Public read is okay; admin upload workflow must use service role or private admin tooling, not client anon/auth writes. |
| Unsafe external links | Fixed | Map links restricted to HTTPS Google/Apple Maps hosts. |
| Debug logs in production | Fixed | Sensitive logs removed; remaining diagnostics are `__DEV__` gated. |
| Hardcoded mock credentials | Fixed | Removed unused `src/data/mockUsers.js`. |
| Dependency vulnerabilities | Passed | `npm audit --audit-level=moderate` reports 0 vulnerabilities. |
| Dependency freshness | Fixed | Applied safe wanted patch/minor updates. Major framework upgrades deferred for separate QA. |
| Expo config asset validation | Fixed | Renamed PNG logo assets to `.png` and updated app references. |
| Expo Doctor | Needs manual action | 17/18 checks pass. Remaining Metro warning reports a custom config, but no workspace `metro.config.js` was found outside `node_modules` fixtures/templates. |
| Supabase migration applied | Needs manual action | Apply `supabase/migrations/20260531120000_security_hardening.sql`. |
| Real-device auth smoke test | Needs manual action | Test signup, verify e-mail, login, logout, password reset, profile picture upload, save place, and trip create after migration. |
