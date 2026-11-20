# DistrictPulse AI — Roadmap

## Stage 1 — Foundation
- [x] Design system, fonts, tokens
- [x] Types, mock data (fictional demo district), service layer (Axios + mock switch)
- [x] Auth (demo mock), login, forgot password, role-aware nav
- [x] App layout: collapsible sidebar, header (district selector, search, notifications, sync time, profile)
- [x] Reusable components
- [x] Overview dashboard

## Stage 2 — Modules (user's order)
Rules: use src/components/dp + src/lib/queries.ts + existing services; never edit src/services, src/types, src/lib/format.ts; categories may include unknown values (public_safety, governance, other) — labels via CATEGORY_LABEL with fallback, never a hardcoded category list; unresolved locations shown separately; keep demo badges.
- [ ] 1. Incidents (filters: category, priority, taluk, date, verification) + detail (AI summary, source links, history, verification)
- [ ] 2. News Intelligence (articles, clusters, insights, 30-day view)
- [ ] 3. Custom Dashboard (drag & drop, save/reset)
- [ ] 4. Data Sources (table, add/edit with URL + optional credentials, test connection, sync logs)
- [ ] 5. Map Intelligence
- [ ] 6. Action Tracker
- [ ] 7. Reports & Briefings
- [ ] 8. Weather, Agriculture, Leave, Departments (+ detail), Settings

## Stage 3 — Verification
- [x] Tests for KPI derivations
- [ ] Route smoke test in browser
