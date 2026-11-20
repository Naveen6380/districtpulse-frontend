# DistrictPulse React frontend

The existing design system and CSS are preserved. Empty modules use the same components and call authenticated Spring Boot DTO endpoints. Default live mode uses MySQL-backed data; demo mode requires VITE_USE_MOCK_API=true.

Set VITE_API_BASE_URL in ignored `.env.local` (prepared environment: http://localhost:8091/api). Use `.env.example` as a template. `VITE_LIVE_API_BASE_URL` is obsolete for the new authenticated service layer.

Run `npm ci`, then `npm run dev -- --host 127.0.0.1 --port 8090 --strictPort`.

Checks: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

Production uses Nitro's Node server preset: `node .output/server/index.mjs`. API URLs are embedded at build time; set the deployment URL before building. Real login uses the administrator account configured in the backend; no public signup is provided.

See `docs/API.md`, `docs/DATASETS.md`, `docs/SOURCES.md`. Sources without compatible adapters show partial/not-connected status. Dataset imports require authorised source evidence. Browser visual QA remains pending because the preview browser could not connect; production build and API smoke checks are separate evidence.
