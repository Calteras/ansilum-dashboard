# Email verification

## Repository findings and implementation

TerraPOS uses React 19, Vite, TanStack Router file routes, TanStack Query, Zustand, react-hook-form/Zod, shadcn components, and Sonner. Tests use Vitest, jsdom, and Testing Library. `package.json` declares Better Auth `^1.3.34`; the installed SDK is **1.4.7**. Its `dist/client/proxy.mjs` accepts per-call `fetchOptions` (including headers), but the existing active email-auth implementation already uses `fetch`. This change retains that implementation so HTTP status, `Retry-After`, and the backend's generic signup response remain available.

`API_BASE_URL` is `/api`. Vite proxies it to `VITE_API_URL`; Vercel and Netlify rewrite it to `https://api.ansilum.com/app/terrapos`. Calls use `/api/auth/...`, mapping to `/app/terrapos/auth/...` exactly once. All authentication requests use `credentials: 'include'`. No bearer token is created or persisted by signup. Logout and tenant switching retain their existing endpoints.

Previously, signup expected an authenticated user and entered business onboarding immediately. The unused signup form and password-reset form were demos that logged form values. There was no CAPTCHA integration. The authenticated layout also needed an explicit unauthenticated redirect after session restoration. These paths now use the verification flow and fail closed without a confirmed session.

## Environment and deployment

- Set **`VITE_TURNSTILE_SITE_KEY`** in `.env.local`, a mode-specific `.env.<mode>.local`, or the deployment build environment. This is a public key embedded at build time. Rebuild after changing it.
- Keep the existing **`VITE_API_URL`** configuration (origin plus `/app/terrapos`) for Vite dev/preview. Production rewrites remain in `vercel.json` / `netlify.toml`.
- Never put `TURNSTILE_SECRET_KEY` or `RESEND_API_KEY` in frontend environment variables. Configure these only on the backend.

Create a Turnstile widget in Cloudflare and allow the deployed frontend hostnames. Allow localhost only for the intended development setup, using separate development configuration. Supply its public site key to Vite and the matching secret to the backend. Production must use real configured keys; there is no frontend bypass. A missing site key disables protected submissions with an accessible error.

The widget loads Cloudflare's explicit-rendering script, handles expiry, timeout, load failure and challenge failure, and removes widgets on cleanup. Each request consumes a token synchronously; the widget is removed during the request and recreated afterward, including failed/uncertain requests. Do not cache the script yourself. If deployment uses CSP, allow Cloudflare's required script/frame sources according to the [Turnstile client-side documentation](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/).

Backend/deployment requirements:

- Enable verification-required email login and the documented generic signup behavior, including duplicate signup.
- Configure emailed verification links to point to the backend and redirect to the deployed frontend origin plus **`/auth/email-verified`**. Requests intentionally omit `callbackURL`; no URL comes from user query parameters.
- Disable automatic sign-in after email verification; users must explicitly sign in here.
- Allow frontend origins in Better Auth and preserve session cookies through the proxy. Keep the existing cookie attributes appropriate to deployment.
- Preserve `Retry-After` response headers through the proxy. The UI supports seconds and HTTP-date values, including hourly waits; invalid/missing values fall back to 60 seconds.
- Serve the SPA for direct visits to both public verification routes. Existing Netlify/Vercel fallback rewrites cover these paths.
- Keep server-side CAPTCHA validation, resend/IP limits, and the shared delivery budget enabled. Frontend countdowns are only UX.
- Password-reset requests now call `/request-password-reset` with CAPTCHA and generic feedback. This repository has no implemented reset-password completion route; backend email/reset destination configuration is still required. The unrelated demo OTP page is not used by this request flow.

## Routes and behavior

| Route | Behavior |
| --- | --- |
| `/sign-up` | Name, email, password and CAPTCHA. Successful and duplicate signup both open check-email, without auth state or business setup. Password fields clear when submission starts. Network/503 errors offer retry or verification resend without assuming registration completed. |
| `/auth/check-email` | Public email/resend form, sign-in and return-to-signup links, inbox/spam reminder. Works without saved state. |
| `/auth/email-verified` | Public display-only success, expired, invalid, or generic failure. Errors offer resend, including in another browser. On load, never calls verification/session APIs or changes authentication. Explicit conflict recovery can sign out an existing session. |
| `/sign-in`, `/sign-in-2` | CAPTCHA required. `EMAIL_NOT_VERIFIED` opens check-email preserving only email and makes no extra resend call. Successful login fetches a fresh backend session before updating auth and selecting a tenant. |
| `/onboarding` | Requires a confirmed session; starts at business details. Login with an empty tenant list enters this flow. Existing outlet/employee/completion steps remain. |
| `/forgot-password` | CAPTCHA-protected reset request with generic feedback and rate-limit handling. |

Successful signup and resend start a 60-second resend cooldown. Deadlines use absolute timestamps, survive refresh in sessionStorage with the pending email, and honor longer server delays. A resend requires an explicit click; mounts, reloads and timers never send mail. The stored email/deadline is a UI convenience and has no authentication meaning. Storage failure does not break the flow; refresh recovery is unavailable in that case.

The callback handles only allowlisted error codes. Startup removes its entire query and fragment before router creation; only a safe error category is retained in browser history state so reload preserves the correct message. There is currently no page-view analytics integration. Any future analytics must initialize after this sanitization and record pathname only, excluding authentication form data and query strings. A no-referrer policy prevents verification queries leaking via external-resource referrers. Generic auth errors omit backend diagnostics, raw request bodies, emails and tokens; auth-related console logging was removed. Do not configure infrastructure request logging to capture these sensitive values.

If resend returns `EMAIL_MISMATCH`, an existing cookie session belongs to a different account. The UI explains the conflict and offers **Sign out of current account**. It calls the existing cookie-based sign-out endpoint only after that action, then cancels and clears cached queries and clears auth/tenant state. The pending email remains on the page and in sessionStorage. A fresh CAPTCHA and explicit resend are required afterward; sign-out never sends email automatically. Failed or uncertain sign-out leaves a retry action and does not claim success. Cookie handling remains enabled for authentication requests.

## Validation

Automated tests cover generic/null signup responses, no signup authentication/onboarding, login and tenant selection, unverified login without resend, session rejection/restoration, duplicate submissions, CAPTCHA expiry/error/load recovery and fresh retry tokens, explicit resend, 60-second and hourly waits, HTTP-date/seconds parsing, uncertain network/503 recovery, callback states, absent saved state, callback query sanitization, timer cleanup, and password-reset headers.

Run:

```sh
npm run test:run
npm run type-check
npm run lint
npm run build
```

Validation completed locally:

- `npm run test:run`: **70 tests passed across 10 files**.
- `npm run type-check`: passed; the final production build also reran TypeScript successfully.
- ESLint for every created/modified TypeScript file: passed, no warnings.
- `npm run build`: passed. Vite reports large bundle chunks; no build errors.
- `git diff --check`: passed.
- `npm run lint`: 42 errors / 16 warnings in existing, unchanged files. A separate clean `HEAD` checkout using the same dependencies reports 44 errors / 17 warnings. No new lint failures remain in changed files.

Actual inbox delivery, deployed cookie behavior, and real Turnstile validation were not exercised locally; those require the configured backend, credentials, and allowed frontend domains.

## Manual end-to-end checklist

- [ ] Configure real Turnstile keys/allowed domains and backend callback settings; build and deploy.
- [ ] Create a new account after completing CAPTCHA. Confirm the exact check-email message, shown email, cleared password, 60-second wait, and no session/dashboard/business creation.
- [ ] Repeat signup for the same address. Confirm identical UI and no account-existence disclosure.
- [ ] While signed into account A, request verification for account B. Confirm the conflict message and no automatic logout. Click sign out; confirm the email stays, cached account data clears, and resend requires a new CAPTCHA. Test failed sign-out and duplicate clicks.
- [ ] Sign in while unverified. Confirm verification-required feedback, check-email navigation and no second automatic resend request in the network panel.
- [ ] Open the emailed backend link, including from a different browser. Confirm callback success and an explicit sign-in action; visiting the callback directly must not grant dashboard access.
- [ ] Try expired, invalid and unknown callback errors. Confirm safe messages and an editable email/resend form with no saved state.
- [ ] Verify the callback query/fragment is removed and an error callback stays an error after refresh.
- [ ] Resend explicitly after the countdown. Confirm generic wording, a fresh CAPTCHA token, and no resend on reload, mount, timer expiry or back navigation.
- [ ] Exercise a 429 with seconds and HTTP-date `Retry-After`, including an hourly wait. Switch tabs and refresh; the remaining time must follow the absolute deadline.
- [ ] Block the Turnstile script, expire/fail a challenge, and double-click submit. Confirm disabled/accessible recovery states and at most one request per completed challenge.
- [ ] Simulate a lost network response and 503 during signup. Confirm uncertainty wording, no automatic retry, cleared passwords, and fresh CAPTCHA before retry or resend.
- [ ] Sign in after verification. Confirm backend session lookup, existing active-tenant selection/switching, or business/outlet/employee onboarding for an account without tenants.
- [ ] Refresh a protected route, expire the cookie, and log out. Confirm protected content never renders without session confirmation.
- [ ] Request password reset. Confirm CAPTCHA header, generic feedback and backend-configured reset destination.
- [ ] Inspect telemetry/logging configuration: exclude credentials, cookies, email values, CAPTCHA tokens and verification URLs. Verify existing employee/POS and tenant-switch workflows against the backend.

## Files created and modified

Created:

- `docs/email-verification.md`
- `src/components/layout/authenticated-layout.test.tsx`
- `src/features/auth/components/turnstile-challenge.test.tsx`
- `src/features/auth/components/turnstile-challenge.tsx`
- `src/features/auth/forgot-password/components/forgot-password-form.test.tsx`
- `src/features/auth/hooks/use-challenge.test.tsx`
- `src/features/auth/hooks/use-challenge.ts`
- `src/features/auth/hooks/use-cooldown.ts`
- `src/features/auth/hooks/use-session-restore.test.tsx`
- `src/features/auth/verification/callback-location.ts`
- `src/features/auth/verification/pages.tsx`
- `src/features/auth/verification/pending-email.ts`
- `src/features/auth/verification/resend-form.tsx`
- `src/features/auth/verification/verification.test.tsx`
- `src/lib/turnstile.test.ts`
- `src/lib/turnstile.ts`
- `src/routes/(auth)/auth.check-email.tsx`
- `src/routes/(auth)/auth.email-verified.tsx`

Modified:

- `.env.example`
- `README.md`
- `index.html`
- `src/components/layout/authenticated-layout.tsx`
- `src/features/auth/api/auth.api.test.ts`
- `src/features/auth/api/auth.api.ts`
- `src/features/auth/api/auth.queries.ts`
- `src/features/auth/forgot-password/components/forgot-password-form.tsx`
- `src/features/auth/hooks/use-login.test.tsx`
- `src/features/auth/hooks/use-login.ts`
- `src/features/auth/hooks/use-session-restore.ts`
- `src/features/auth/onboarding/components/business-step-form.tsx`
- `src/features/auth/onboarding/components/signup-step-form.tsx`
- `src/features/auth/onboarding/index.tsx`
- `src/features/auth/sign-in/components/user-auth-form.tsx`
- `src/features/auth/sign-up/components/sign-up-form.tsx`
- `src/features/auth/sign-up/index.tsx`
- `src/lib/handle-server-error.ts`
- `src/main.tsx`
- `src/routeTree.gen.ts`
