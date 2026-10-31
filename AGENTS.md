# Agent guide

Laravel API in `api/`, React SPA in `web/`, Playwright tests in `e2e/`, AWS CDK in `infra/`.

## Commands

- Run everything: `docker compose up --build`
- API tests: `cd api && php artisan test` (SQLite in memory, no running stack needed)
- Format PHP: `cd api && vendor/bin/pint`
- Regenerate the OpenAPI spec: `cd api && composer openapi`
- Regenerate TypeScript types: `cd web && pnpm gen:api`
- Web checks: `cd web && pnpm lint && pnpm build`
- E2E (stack must be running): `cd e2e && pnpm test`
- Emails sent locally appear in Mailpit at http://localhost:8025

## Rules

- API changes that touch routes or responses must regenerate `api/openapi.json` and `web/src/schema.d.ts` in the same commit. CI fails otherwise.
- Add new API calls to `web/src/api.ts`. Do not call `fetch` from components.
- Use design tokens from `web/src/styles/tokens.css`. Do not hard-code colors, spacing or type sizes. See `/_design` in the dev stack.
- Add a Playwright test for every new user-facing flow.
- Pin third-party GitHub Actions to a full commit SHA with a version comment.
- Never commit `.env` files or secrets. Run `lefthook install` once per clone; the pre-commit hook runs gitleaks.
