# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # start dev server on :3000
npm run build     # production build
npm run lint      # ESLint (no test suite exists)
```

There are no automated tests. Verify changes by running the dev server and exercising the UI.

## Stack

- **Next.js 16** App Router, TypeScript, Tailwind CSS v4, React 19
- **next-auth v4** — Google OAuth, JWT sessions (no database adapter)
- **FastAPI backend** — separate service at `BACKEND_URL`, never called directly from the browser

## Architecture

```
Browser  →  Next.js API routes  →  FastAPI backend
```

All backend calls are server-side only through Next.js API routes. `BACKEND_URL` and `INTERNAL_API_SECRET` are never exposed to the browser. `x-user-id` is always stamped from the verified session server-side.

### Key files

| File | Role |
|------|------|
| `lib/backend.ts` | `backendHeaders(userId?)` — adds `Authorization` + `x-user-id` to every backend call |
| `lib/auth.ts` | next-auth config — Google provider, JWT strategy, syncs user on sign-in via `POST /users` |
| `app/layout.tsx` | Root layout — wraps `SessionProvider`, renders `<Navbar />` |
| `app/providers.tsx` | `SessionProvider` wrapper |
| `app/components/Navbar.tsx` | Sticky header — credit badge (links to `/credits`), avatar dropdown with "Buy credits" → `/credits`, `credits-updated` custom event listener |
| `app/components/VideoCard.tsx` | Card component + `AnalysisSummary` type — handles pending/error/done states |
| `app/page.tsx` | Main page — splits on auth status: shows `<LandingPage />` when unauthenticated, analysis form + history grid when authenticated; 402 error shows "You're out of credits" card with link to `/credits` |
| `app/credits/page.tsx` | Credits page — balance, 3 pack cards (Starter/Standard/Pro), transaction history |
| `app/history/page.tsx` | Full analysis history grid |
| `app/analysis/[id]/page.tsx` | Full analysis report — 6 insight sections, sentiment bar, top comments, "Re-analyze" button |
| `app/admin/page.tsx` | Admin panel (gated by `NEXT_PUBLIC_ADMIN_EMAIL`) |

### API routes proxied to FastAPI

| Next.js route | FastAPI | Notes |
|---|---|---|
| `POST /api/analyze` | `POST /analyze` | Returns `{ job_id }` immediately — analysis is async |
| `GET /api/analyze/status/[jobId]` | `GET /analyze/status/{jobId}` | Returns `{ status: "pending"/"done"/"failed", result?, error? }` |
| `GET /api/analyses` | `GET /analyses` | Summary list (no `stats`/`insights`) |
| `GET /api/analyses/[id]` | `GET /analyses/{id}` | Full analysis with `stats` + `insights` |
| `GET /api/credits` | `GET /credits` | Balance + last 10 transactions |
| `POST /api/payments/checkout` | `POST /payments/checkout` | Validates `price_key` ∈ `{pack_starter, pack_standard, pack_pro}`, returns `{ checkout_url }` |
| `POST /api/admin/credits` | `POST /admin/credits` | Requires `ADMIN_SECRET` |
| `GET /api/admin/user/[userId]` | `GET /credits` with userId | Admin only |

## Analysis flow (async polling)

1. `POST /api/analyze` → backend returns `{ job_id }` immediately; job ID is saved to `sessionStorage` under `"activeJobId"`
2. `app/page.tsx` polls `GET /api/analyze/status/<jobId>` every 1.5 s via `setInterval`
3. A `pending: true` placeholder `AnalysisSummary` is shown in the history grid as a skeleton/spinner
4. When poll returns `status: "done"`, polling stops, the placeholder is replaced with the real card, and a `credits-updated` custom event is dispatched so `Navbar` refreshes the credit badge
5. On page reload, `sessionStorage` is checked on mount to restore the polling state without losing the in-progress job

### Force re-analyze

The backend accepts `force: true` in the `POST /analyze` body to bypass the cached result and re-run the AI analysis. The "Re-analyze" button in `app/analysis/[id]/page.tsx` uses this: it POSTs with `force: true`, writes the returned `job_id` to `sessionStorage["activeJobId"]`, then navigates to `/`. The home page picks up the job on mount and enters the normal polling flow.

## Credit badge refresh

`Navbar` listens for the `credits-updated` browser custom event (`window.dispatchEvent(new Event("credits-updated"))`). Fire this event from any component that triggers a credit change (analysis complete, payment success).

## Auth flow

1. User signs in with Google
2. `signIn` callback in `lib/auth.ts` calls `POST /users` on the backend (creates/finds user) — sign-in succeeds even if backend is unreachable
3. `token.sub` (Google's unique user ID) is stored in the JWT and exposed as `session.user.id`
4. All API routes call `getServerSession(authOptions)` and pass `session.user.id` as `x-user-id` to FastAPI

## Environment variables

```
BACKEND_URL=http://localhost:8000
INTERNAL_API_SECRET=           # empty = inactive in local dev; same value as backend in prod
ADMIN_SECRET=                  # same value as backend ADMIN_SECRET
NEXT_PUBLIC_ADMIN_EMAIL=       # email address gating /admin (checked client- and server-side)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

## Error codes from FastAPI

| Status | Meaning |
|--------|---------|
| 401 | No/invalid session |
| 402 | Insufficient credits — response includes `{ required, balance }` |
| 403 | Wrong `INTERNAL_API_SECRET` |
| 404 | YouTube video not found |
| 503 | Backend semaphore full (3 concurrent jobs max) |

## Git workflow

- **Always create a new branch** for every change — no direct pushes to `main`
- Push the branch, wait for review and merge on GitHub, then delete local and remote branch

## Deployment

| Service | URL |
|---------|-----|
| Frontend | https://comment-analyzer-frontend-murex.vercel.app |
| Backend | https://web-production-47395.up.railway.app |

Auto-deploys on push to `main`. Railway free tier sleeps after ~15 min idle (first request takes 20–30 s). Vercel free tier times out API routes at 10 s — `POST /api/analyze` will time out on long analyses without Vercel Pro + `export const maxDuration = 60`.
