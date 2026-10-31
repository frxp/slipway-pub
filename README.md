# Slipway

Starter kit for products with a Laravel API and a React SPA. One command creates a renamed project with token auth, password reset, a typed API client, Docker, Playwright tests, CI and an AWS stack.

To start a new project from this one, run `scripts/new-project.sh my-app`.

## Stack

- **API:** Laravel 13, PHP 8.5, Sanctum token auth, PostgreSQL 18
- **Web:** React 19, TypeScript, Vite, React Router
- **Containers:** Docker Compose for local work; production images on FrankenPHP and nginx
- **Contract:** OpenAPI spec from Laravel (Scramble), typed TypeScript client
- **Tests:** PHPUnit unit and feature tests, Playwright end-to-end tests
- **Infra:** AWS CDK (CloudFront, S3, ECS Fargate, RDS)
- **CI:** GitHub Actions, actions pinned to commit SHAs

## Run

Docker is all you need.

```
docker compose up --build
```

- API: http://localhost:8000/api/health
- Web: http://localhost:5173
- Design tokens: http://localhost:5173/_design
- Mailpit (catches emails): http://localhost:8025

To run the production images (API on `:8000`, web on `:8080`):

```
APP_KEY="base64:$(openssl rand -base64 32)" docker compose -f docker-compose.prod.yml up --build
```

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | no | liveness |
| POST | `/api/register` | no | create account, returns token |
| POST | `/api/login` | no | sign in, returns token |
| POST | `/api/logout` | token | revoke current token |
| GET | `/api/me` | token | current user |
| PATCH | `/api/me` | token | change name |
| PUT | `/api/me/password` | token | change password, revokes other tokens |
| POST | `/api/forgot-password` | no | email a reset link |
| POST | `/api/reset-password` | no | set a new password with the emailed token |

## Development

Running the checks outside Docker takes PHP 8.5, Composer, Node 22 with Corepack (`corepack enable`), plus lefthook and gitleaks for the commit hook.

Once per clone:

```
lefthook install        # scan for secrets before each commit
cd api
composer install
cp .env.example .env
php artisan key:generate
```

In `api/`:

```
php artisan test        # unit and feature tests
vendor/bin/pint         # format PHP
composer openapi        # regenerate openapi.json
```

In `web/`:

```
pnpm install
pnpm gen:api            # regenerate TypeScript types
pnpm lint && pnpm build
```

In `e2e/`, with the stack running:

```
pnpm install
pnpm test
```

## Layout

- `api/` Laravel application
- `web/` React application
- `e2e/` Playwright tests
- `infra/` AWS CDK stack, see [infra/README.md](infra/README.md)
- `scripts/new-project.sh` project generator
- `docs/architecture.md` design notes
- `.github/workflows/ci.yml` API tests, web lint and build, contract checks, E2E, CDK synth
