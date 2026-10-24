# LA CUEVA DEL CHANGO — OPERATIONAL RULES

> Permanent Markdown source of truth. Mirrors `public/menus/lacueva-knowledge-base.md` but optimized for developer/admin quick reference.
> Tenant: `lacuevadelchango` | PWA: La Cueva Del Chango PWA v1.0.0

## 1. Project & Infrastructure
- **Project manifest**: `/project_manifest.json` — holds `appName`, `restaurantId`, `baseTheme`, `devPort` (3003), branding paths
- **Dev server**: `npm run dev -- --port 3003` (vite.config.ts enforces 3003)
- **Teable tenant filter**: `restaurant_id = lacuevadelchango` on every config query (`restaurant_secrets`, `blackout_periods`, `reservations`, `menu_items`, etc. where tenant column exists). Legacy `restaurant` text column should use `'La Cueva Del Chango'` / `'lacuevadelchango'` interchangeably and be normalized to tenant id in future migration.
- **AI orchestration module**: `src/modules/ai-orchestration/` — see its `manifest.json`

## 2. Branding & Theme Tokens
- **Base theme** (placeholder — owner to supply final hex):
  ```json
  {
    "primary": "#1A2B1A",
    "primaryDark": "#0F1F0F",
    "primaryBeige": "#E8D3A7",
    "accent": "#C2B280",
    "secondary": "#8B5E3C",
    "background": "#FDFCF6"
  }
  ```
- **Brand assets** live only under `/images/branding/` (logos, favicons, PWA icons, hero). Core layout code never hardcodes image names outside that directory.
- **Index title / PWA short_name**: "La Cueva Del Chango" / "La Cueva"

## 3. Reservation Policy Source of Truth
| Rule | Value |
|---|---|
| Online notice | 24h minimum |
| Group 4–12 | 48h notice |
| Group 13+ | Manual via email (Name, Date, Time, Guests) |
| Weekend | Walk-in only (Sat/Sun) — to be confirmed |
| Grace period | 10 min + 5 min ext = 15 min max |
| Capacity seated | 100 |
| Capacity standing | ~125 |
| Blackout | Dec 24, Dec 31 |
| Daily specials | Contact restaurant directly |
| Factura deadline | Same calendar month |

Enforcement is in `server.ts` + `api/index.ts` (`RESERVATION_HOURS`, `NOTICE_HOURS`, `MAX_GUESTS`) and mirrored in AI prompt.

## 4. AI Orchestration Rules
- **Persona**: `src/modules/ai-orchestration/config/defaultPersona.ts` — welcoming, authentic, Playa-casual, trilingual-aware
- **Context anchor**: `src/modules/ai-orchestration/utils/contextAnchor.ts` — computes `America/Cancun` date and language mirroring prefix injected before every AI call
- **Handler**: `api/modules/ai-orchestration/handlers/processMessage.ts` — Teable config fetch scoped to `lacuevadelchango`, OpenAI/Gemini fallback, `<RESERVATION>` tag parsing
- **Prompt hygiene**: Never hallucinate menu prices/hours not in knowledge base; redirect to contacting restaurant

## 5. Knowledge Base Files
- **Public menu memory**: `public/menus/lacueva-knowledge-base.md` — editable by non-devs; AI can be pointed at it for menu answers
- **Legacy clone reference**: `public/menus/amate38-tinytalk-knowledge-base.md` — retained for comparison, not used in prod for La Cueva
- **Menu text files** (`public/menus/*.txt`) — raw menu exports; future ingest into Teable `menu_items`

## 6. Asset Separation
- **Branding folder**: `public/images/branding/` — all new La Cueva logos/icons must go here
- **Legacy gallery**: `public/images/Amate_*` — keep until La Cueva photography supplied, then swap via config only

## 7. Session & Permanent Memory Framework
- **Session summaries**: `wiki/summaries/YYYY-MM-DD-Session-Summary.md`
- **This file**: `wiki/operational_rules.md` — edit here to change ops behavior without code changes where possible
- **Module manifest**: `src/modules/ai-orchestration/manifest.json` — feature flags + guardrails

## 8. Lint & Build Gates
- `npm run lint` must pass (`tsc --noEmit`) — CI gate
- `npm run build` (`vite build`) must succeed
- Dev port 3003 isolation prevents collision with Amate 38 (3002)

## 9. Build Phases — Isolated Execution Plan (Source: 2026-08-31)

Phase 0 — Foundation (Done): project_manifest.json tenant `lacuevadelchango`, `package.json`/`index.html`/`public/manifest.json` rebrand, `public/menus/lacueva-knowledge-base.md` + `wiki/operational_rules.md` scaffolding, `src/modules/ai-orchestration/*` with Teable tenant filter, `public/images/branding/` isolation, `vite.config.ts:32` port 3003, lint/build verified.

Phase 1 — Tenant Data Provisioning: create `restaurant_secrets` row `restaurant_id=lacuevadelchango` in Teable, add `restaurant_id` column to reservations/blackout_periods/menu_items/chat_logs/reviews, create Teable views/filters, backfill.

Phase 2 — Branding & Theme Finalization: finalize `baseTheme` hex tokens in `project_manifest.json:11` → `src/index.css:13`, replace `/images/branding/*` placeholders, update `HISTORY_TEXT` in `src/constants.ts:38`.

Phase 3 — Knowledge Base & Menu Ingestion: populate menu URLs in `lacueva-knowledge-base.md:46`, ingest `public/menus/*.txt` via `scripts/sync_menus.ts` into Teable with tenant id, retire `src/menuData.ts:1`.

Phase 4 — AI Orchestration Tuning: refine `defaultPersona.ts:7` with owner questionnaire, ensure `contextAnchor.ts:11` America/Cancun anchor used in `api/modules/ai-orchestration/handlers/processMessage.ts`, migrate `server.ts:37` SYSTEM_INSTRUCTION to import persona.

Phase 5 — Frontend Tenant Logic: refactor `src/App.tsx:392` restaurant defaults, `RESERVATION_HOURS`/`WEEKEND_LOCKOUT`, AdminDashboard filters by `restaurant_id`.

Phase 6 — QA / Deploy: lint/build gates, port 3003 dev, Vercel `vercel.json:13` + Teable link, `.env` tenant split.

## 10. Future Tenant Migration Checklist
- [ ] Phase 1: Teable tenant row + filters (blocker)
- [ ] Phase 2: Final branding assets / theme tokens from owner
- [ ] Phase 3: Menu ingestion for La Cueva
- [ ] Phase 4-5: Persona + frontend tenant refactor
- [ ] Phase 6: Vercel domain `lacuevadelchango.com` + PWA icons regen