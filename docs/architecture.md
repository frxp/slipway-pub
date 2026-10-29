# Architecture

## Shape

Two apps in one repo. The SPA talks to the API over JSON. The API is stateless apart from the database.

```
browser -> web (Vite, :5173) -> api (Laravel, :8000) -> SQLite
```

## Decisions

- **Token auth (Sanctum), not cookies.** The SPA and API run on different origins locally. A bearer token avoids cross-origin cookie and CSRF setup. The token is kept in `localStorage`; moving to HttpOnly cookies on a shared parent domain is the next hardening step.
- **CORS from one env var.** `WEB_URL` is the only allowed origin, so there is no wildcard in any environment.
- **Thin controllers, validation in the request.** `AuthController` validates inline and returns JSON. Rate limiting (`throttle:10,1`) sits on register and login.
- **SQLite in the container.** Zero setup for a demo. Switching to Postgres or MySQL is an env change.
- **Pinned CI actions.** Every third-party action is pinned to a full commit SHA, with the version in a comment.
- **Plain CSS with tokens.** One stylesheet, colors as custom properties, light and dark themes.

## Known gaps

- No automated tests beyond Laravel's defaults.
- Dev servers in the containers, not production images.
- No email verification, password reset or 2FA yet.
