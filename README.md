# Slipway

Starter kit for a Laravel API plus a React SPA, with Docker and CI.

## Stack

- **API:** Laravel 13, PHP 8.5, Sanctum token auth, SQLite
- **Web:** React 19, TypeScript, Vite, React Router
- **Local stack:** Docker Compose
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

## Layout

- `api/` Laravel application
- `web/` React application
- `docs/architecture.md` design notes
- `.github/workflows/ci.yml` API tests, web lint and build

