@AGENTS.md

# Comment Analyzer — Frontend

Next.js 16 frontend for a YouTube comment analysis SaaS. Users sign in with Google, paste a YouTube URL, and receive AI-generated insights about the video's comments. Credits are consumed per analysis.

## Stack

- **Next.js 16** with App Router, TypeScript, Tailwind CSS v4
- **next-auth v4** — Google OAuth, JWT sessions
- **FastAPI backend** — separate service, called only from Next.js API routes (never from the browser)

## Architecture

```
Browser  →  Next.js API routes  →  FastAPI backend
```

The browser never calls FastAPI directly. All backend requests go through Next.js API routes running server-side. This means:
- `BACKEND_URL` is never exposed to the browser
- `x-user-id` is always stamped from the verified session, never trusted from the browser
- `INTERNAL_API_SECRET` is never sent to the browser

## Environment variables

```
BACKEND_URL=http://localhost:8000        # FastAPI base URL
INTERNAL_API_SECRET=                     # Shared secret — empty = inactive (local dev). Set same value on both hosts in production.
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Backend security

Every server-side fetch to FastAPI goes through `lib/backend.ts`:

```ts
backendHeaders(userId?)  // returns { Authorization, x-user-id }
```

- Adds `Authorization: Bearer <INTERNAL_API_SECRET>` when the env var is set
- Adds `x-user-id` from the verified session
- The FastAPI `InternalAuthMiddleware` rejects any request missing or with a wrong Authorization header with 403
- To activate: set `INTERNAL_API_SECRET` to the same random string in both the FastAPI host env and the Next.js host env

## Key files

| File | Purpose |
|------|---------|
| `lib/backend.ts` | `backendHeaders()` helper — Authorization + x-user-id for every backend call |
| `lib/auth.ts` | next-auth config — Google provider, JWT strategy, syncs user to backend on sign-in |
| `app/page.tsx` | Main UI — analysis form, results, history, credit balance, pricing section |
| `app/api/analyze/route.ts` | POST — run analysis on a YouTube URL |
| `app/api/analyses/route.ts` | GET — list past analyses for the signed-in user |
| `app/api/analyses/[id]/route.ts` | GET — fetch a single full analysis |
| `app/api/credits/route.ts` | GET — credit balance + last 10 transactions |
| `app/api/payments/checkout/route.ts` | POST — create a Stripe Checkout session, returns `checkout_url` |
| `app/api/auth/[...nextauth]/route.ts` | next-auth handler |

## Backend API contract

All Next.js → FastAPI calls require:
- `Authorization: Bearer <INTERNAL_API_SECRET>` (when set)
- `x-user-id: <google-sub>` (on user-scoped endpoints)

### Endpoints proxied

| Next.js route | FastAPI route | Auth |
|---------------|---------------|------|
| POST `/api/analyze` | POST `/analyze` | session + secret |
| GET `/api/analyses` | GET `/analyses` | session + secret |
| GET `/api/analyses/[id]` | GET `/analyses/{id}` | session + secret |
| GET `/api/credits` | GET `/credits` | session + secret |
| POST `/api/payments/checkout` | POST `/payments/checkout` | session + secret |
| *(sign-in callback)* | POST `/users` | secret only |

### Notable response fields

`POST /analyze` returns `credits_remaining` — the UI updates the credit badge from this.

`POST /payments/checkout` returns `{ checkout_url }` — redirect the user to this Stripe URL.

### Error codes

| Status | Meaning |
|--------|---------|
| 401 | Missing x-user-id (not authenticated) |
| 402 | Insufficient credits — response includes `{ required, balance }` |
| 403 | Missing or wrong Authorization header |
| 404 | YouTube video not found |

## Credits

Credits are consumed per analysis based on comment count:

| Comments | Credits |
|----------|---------|
| 0–500 | 1 |
| 501–2,000 | 2 |
| 2,001–10,000 | 3 |
| 10,001+ | 5 |

## Pricing plans

| price_key | Type | Price | Credits |
|-----------|------|-------|---------|
| `pack_standard` | One-time | $7.99 | 10 |
| `sub_starter` | Monthly | $9.99/mo | 15/mo |
| `sub_pro` | Monthly | $19.99/mo | 40/mo |

## Auth flow

1. User signs in with Google via next-auth
2. `signIn` callback in `lib/auth.ts` POSTs to `/users` on the backend (creates or finds the user)
3. Google `sub` is stored as `session.user.id` via the JWT callback
4. All API routes read `session.user.id` and pass it as `x-user-id` to FastAPI
