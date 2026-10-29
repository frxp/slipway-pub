# Slipway

Starter kit for a Laravel API plus a React SPA, with Docker and CI.

## Stack

- **API:** Laravel 13, PHP 8.5, Sanctum token auth, SQLite
- **Web:** React 19, TypeScript, Vite, React Router
- **Local stack:** Docker Compose; production images (FrankenPHP, nginx)
- **Types:** OpenAPI spec from Laravel (Scramble), typed TypeScript client
- **Tests:** Playwright end-to-end
- **Infra:** AWS CDK (S3 + CloudFront, ECS Fargate)
- **CI:** GitHub Actions, actions pinned to commit SHAs

## Run

```
docker compose up --build
```

- API: http://localhost:8000/api/health
- Web: http://localhost:5173

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | no | liveness |
| POST | `/api/register` | no | create account, returns token |
| POST | `/api/login` | no | sign in, returns token |
| POST | `/api/logout` | token | revoke current token |
| GET | `/api/me` | token | current user |

## Commands

```
docker compose up --build                       # dev stack
docker compose -f docker-compose.prod.yml up    # production images
cd api && composer openapi                      # regenerate openapi.json
cd web && pnpm gen:api                          # regenerate TypeScript types
cd e2e && pnpm test                             # end-to-end tests (stack running)
scripts/new-project.sh my-app                   # start a new project from this one
```

The design tokens are on http://localhost:5173/_design.

## Layout

- `api/` Laravel application
- `web/` React application
- `e2e/` Playwright tests
- `infra/` AWS CDK stack
- `scripts/new-project.sh` project generator
- `docs/architecture.md` design notes
- `.github/workflows/ci.yml` API tests, web lint and build, E2E, CDK synth
