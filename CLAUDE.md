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

## Decisions (confirmed by the user on 2026-09-11)
- Stack A: custom Next.js + PostgreSQL. Capture audit and versions with DB triggers. The user rejected Payload CMS as the default.
- No approval workflow for now. Users with edit rights save directly. Audit Log and Version History still record every change.
- Prices vary by branch and by vehicle size. A service has base prices S/M/L/XL plus optional per-branch overrides (`branchPrices: { [branchId]: { S?, M?, L?, XL? } }`). A blank override means the base price applies.
- No per-branch permissions yet. There are 4 basic roles only: Admin, Manager, Marketing, Call Center. Only Admin deletes. Marketing cannot edit prices.

## Demo (mock, no backend)
- `demo/` holds a clickable mock with 14 menus. `index.html` has the markup, CSS, and login screen. `data.js` has constants, the permission matrix `P`, and mock seed data. `app.js` has the mock login, the generic list/form engine, audit, versions, import, and dashboard.
- Login is mock only. It matches the email against mock users and never checks or stores the password. Quick-login buttons exist for each role. After login the user lands on the Dashboard and can switch the viewed role in the top bar. Audit still records the real logged-in user.
- Published on GitHub Pages at https://webmasterwizard.github.io/web-app-wizard/demo/ and as an artifact at https://claude.ai/code/artifact/939e8e17-8f7e-4b3f-bc63-13f69cedbc44 (republish from `demo/index.html` with `files` data.js and app.js).
- State lives in the viewer's localStorage (`wizard-hub-demo-v2`, which includes `session`). The seed uses dates relative to today.
- To add a menu, add an entry to `MOD` in app.js (fields/cols/filters), add its permissions in `P`, and add it to `NAV`.

## Status
- 2026-09-11: Demo updated with mock login, direct save (no approval), and per-branch price overrides. Next: the user reviews it, then Phase 1 of the real app (needs Docker Desktop or PostgreSQL installed; Docker is not installed yet).
- Out of scope for now: LINE OA, AI Voice, AWS, Odoo, SIP, and production deployment. Local only.
