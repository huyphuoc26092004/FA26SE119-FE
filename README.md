# CareerPilot Web — FA26SE119

Frontend-only foundation for **Intelligent CV Matching AI Agent**. All application data is **mock data**. No backend, payments, scraping, or LLM calls are implemented.

## Requirements
- Node.js >= 20.19 (Node 22 LTS recommended)
- npm 10+

## Quick start
```bash
npm ci               # if package-lock.json exists; otherwise npm install
npm run dev
npm run lint
npm run build
```
Open http://localhost:5173.

## Mock accounts (development only)
| Role | Email | Password |
| --- | --- | --- |
| Candidate | candidate@example.com | Demo123! |
| Consultant | consultant@example.com | Demo123! |
| Admin | admin@example.com | Demo123! |

Mock sessions are stored in sessionStorage. This is **not real authentication** and must never be used for production security.

## Architecture
- `src/app`: router, providers, query client
- `src/layouts`: public + role-based shells
- `src/components/ui`: shared visual primitives
- `src/pages`: initial screens + planned feature placeholders
- `src/mocks/data`: centralized demo fixtures
- `src/mocks/services`: asynchronous mock services
- `src/services`: real Axios client (not used while mocks are enabled)
- `src/stores`: small global auth state
- `src/types`: domain models
- `src/constants`: role navigation

## Mock → API migration
1. Implement typed API functions in `src/services/` using `apiClient` and `endpoints`.
2. Change each TanStack Query `queryFn` from `getJobs` etc. to the real API adapter.
3. Connect auth store to real login/refresh/logout endpoints and replace sessionStorage mock token handling.
4. Configure `VITE_API_BASE_URL` per environment and set `VITE_USE_MOCKS=false` once API adapters are ready.
5. Add error handling and tests for the new contract. **VITE_USE_MOCKS is documentation for the future switch; this milestone deliberately uses mock services directly.**

## Team workflow
- Keep `main` stable; each developer creates `feature/<feature-name>` branches.
- Run lint/build before opening a pull request.
- Do not commit secrets, `.env.local`, or `node_modules`.
- Commit `package-lock.json` after successful `npm install` so teammates can run `npm ci`.
- Configure SPA fallback to `index.html` on production hosting for React Router deep links.

## Milestone 1 scope
Implemented: public landing, mock login, candidate dashboard, profile view, CV list, job search/details, assistant demo chat, consultant/admin dashboard shells, responsive layouts, role guards, 403/404. Registration/reset and remaining features are **explicit placeholders**.
