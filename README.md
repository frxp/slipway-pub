# Slipway

Starter kit for a Laravel API plus a React SPA, with Docker and CI.

## Layout

- `api/` Laravel API with token auth (Sanctum)
- `web/` React + TypeScript SPA (Vite)
- `docker-compose.yml` local stack
- `.github/workflows/ci.yml` CI

## Run

```
docker compose up --build
```

API on http://localhost:8000, web on http://localhost:5173.
