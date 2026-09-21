# Permanent fix for system-admin password changes

## Goal
System administrators must always be able to set a user's password while their signed-in access token is still valid, without failures caused by refresh-token rotation between browser tabs or preview windows.

## Changes
- Replace the password function's session-row lookup with cryptographic JWT verification using the platform's signing keys.
- Keep all existing authorization boundaries: only system administrators can change any user; company administrators remain limited to their own company and cannot change system-admin passwords.
- Stop forcing a refresh immediately before password changes, because concurrent refresh-token rotation is the source of the recurring failure.
- Use one shared client helper for both password-change buttons so they cannot drift apart again.
- Preserve clear server error messages in both interfaces.

## Verification
- Deploy the password function.
- Verify an authenticated system administrator reaches request validation instead of receiving 401.
- Verify unauthenticated requests still receive 401.
- Verify the project builds successfully.
- Do not change another customer's password during testing.

## Technical details
`getClaims(jwt)` verifies signature and expiry without requiring the token's old session row to remain present after another tab rotates the refresh token. Role and company authorization continue to be checked server-side from `user_roles` and `profiles`; the service client is never used for authentication.
