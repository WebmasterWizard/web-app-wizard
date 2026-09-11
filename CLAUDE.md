# Wizard Web Admin

A custom web admin for Wizard Auto Care, built around the business's own workflows rather than a generic CMS. Staff in every department add, edit, update, and review Wizard data in one system. Later, LINE OA, AI Voice, and other systems will read from the same central database.

Blueprint: [docs/design.html](docs/design.html). It is published as an artifact at https://claude.ai/code/artifact/d5fd6ba0-8dd0-48ce-a8a7-e447b483414e. Update both whenever a decision changes.

Repo: https://github.com/WebmasterWizard/web-app-wizard (branch `main`). The repo is **PUBLIC** (the user chose that on 2026-09-11 to enable GitHub Pages). Never commit secrets, `.env` files, real customer data, or credentials.
Live site (GitHub Pages, deployed from `main` at `/`): https://webmasterwizard.github.io/web-app-wizard/. The root `index.html` is the landing page, `demo/` is the demo, and `docs/design.html` is the blueprint. Pushing to `main` redeploys the site within about a minute. This machine has no `gh` CLI. To push from a non-interactive shell, set `GIT_TERMINAL_PROMPT=1` and `GCM_INTERACTIVE=always` so Git Credential Manager can open its sign-in window.

## Principles (from the user)
- Business workflow comes before technology.
- Keep structured business data (prices, branches, promotions, services, business rules) separate from knowledge documents. When they conflict, the structured data wins.
- The system is the single source of truth. No one re-enters data in LINE or Voice.
- It must handle large data volumes, and it needs login, permissions, an audit log, and version history with restore.
- Write the blueprint and any user-facing docs in plain Thai that non-developers can read.

## Demo (mock, no backend)
- `demo/` holds a clickable mock with 14 menus. `index.html` has the markup and CSS, `data.js` has constants, the permission matrix `P`, and mock seed data, and `app.js` has the generic list/form engine plus approval, audit, versions, import, and dashboard.
- Published as an artifact at https://claude.ai/code/artifact/939e8e17-8f7e-4b3f-bc63-13f69cedbc44. Republish from `demo/index.html` with `files` data.js and app.js.
- State lives in the viewer's localStorage (`wizard-hub-demo-v1`). The seed uses dates relative to today.
- To add a menu, add an entry to `MOD` in app.js (fields/cols/filters), add its permissions in `P`, and add it to `NAV`.

## Status
- 2026-09-11: Blueprint revised (workflow-first, 13 menus). Waiting for the user to confirm the blueprint. Do not write application code until the user confirms.
- Recommended stack is A: custom Next.js + PostgreSQL (local via Docker), with audit/versions captured by DB triggers. It is not confirmed yet. The user explicitly rejected Payload CMS as the default.
- 2026-09-11: Built the clickable demo (mock data). Waiting for the user to review it before starting the next phase.
- Out of scope for now: LINE OA, AI Voice, AWS, Odoo, SIP, and production deployment. Local only.
