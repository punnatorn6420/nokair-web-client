# nokair-web-client

## Security + SSR POC (Next.js App Router)

### Task A - Added file structure

- `src/app/ssr-check/page.tsx`: SSR proof page that renders server-generated timestamp + request id, reads HttpOnly cookie status, and performs server-side fetch to mock API.
- `src/app/api/mock-search/route.ts`: Mock API endpoint with input validation, in-memory rate limiting, sanitized JSON errors, and slight artificial delay.
- `src/app/api/auth/mock-login/route.ts`: Mock login endpoint that sets HttpOnly cookie (`SameSite=Lax`, `Secure` in production).
- `src/app/api/auth/mock-logout/route.ts`: Mock logout endpoint that clears the mock session cookie.
- `src/lib/security/rate-limit.ts`: In-memory limiter and IP extraction helper (`x-forwarded-for` / `x-real-ip`).
- `src/lib/security/validation.ts`: Input validator for `q` query.
- `src/lib/security/headers.ts`: Baseline security header helper.
- `src/lib/security/auth.ts`: Shared cookie name + mock session value helper.
- `src/middleware.ts`: Lightweight middleware to apply security headers globally and disable API caching.

### Task C - Step-by-step verification

1. Start dev server:

```bash
npm run dev
```

2. Verify SSR at `/ssr-check`:
   - Open `http://localhost:3000/ssr-check`.
   - Check terminal logs for `[SSR_CHECK_RENDER]` on each refresh.
   - Use **View Page Source** and confirm `Server Rendered At` + `Request ID` appear in raw HTML.
   - Disable JavaScript in browser and refresh; rendered content should still appear.
   - In DevTools Network, inspect the **document** response and verify rendered values exist in server HTML.

3. Verify rate limit on `/api/mock-search`:

```bash
for i in {1..8}; do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/mock-search?q=test"; done
```

- First few requests should return `200`, then `429` once over limit.

4. Verify cookie-based mock auth (no localStorage token):

```bash
curl -i -X POST http://localhost:3000/api/auth/mock-login -H 'content-type: application/json' -d '{"username":"poc-user"}'
```

- Confirm `Set-Cookie: mock_session=...; HttpOnly; SameSite=Lax` is returned.
- In browser DevTools Application tab:
  - Check **Cookies** for `mock_session`.
  - Check `localStorage` / `sessionStorage` do **not** contain auth token from this POC.

Logout:

```bash
curl -i -X POST http://localhost:3000/api/auth/mock-logout
```

5. Verify production-like behavior:

```bash
npm run build && npm run start
```

- Re-check `/ssr-check` and `/api/mock-search` after starting production server.

### Task D - Security notes for team presentation

- Tailwind CSS and shadcn/ui are UI layers; they do not directly control backend security.
- Primary security posture comes from architecture choices: SSR/data-fetching strategy, API validation, session handling, middleware headers, and abuse protection.
- This POC demonstrates baseline controls only (SSR proof + basic validation + in-memory rate limit + HttpOnly cookie pattern).
- In-memory rate limiting is suitable only for local/demo or single-instance deployments.
- Production should use distributed rate limiting (e.g., Redis), WAF/CDN/DDoS protection, observability (logs/metrics/alerts), and resiliency controls (timeouts/circuit breakers).
