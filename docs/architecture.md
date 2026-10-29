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

## Password reset

`POST /api/forgot-password` always answers the same way, so it does not reveal which emails have accounts. The email link opens the SPA (`WEB_URL`), which posts the token to `/api/reset-password`. A successful reset revokes every token of the user. Locally, Mailpit catches the emails. Each auth route has its own named rate limiter, so one endpoint cannot use up another's budget.

## Typed contract

Laravel routes and `@response` annotations produce `api/openapi.json` (Scramble). `web/src/schema.d.ts` is generated from it, and `web/src/api.ts` uses it through `openapi-fetch`, so a changed response breaks the web build instead of the browser.

## Tests

Playwright drives the real stack (register, sign out, sign in, errors, route guard). CI starts Docker Compose and runs the same tests.

## Known gaps

- No email verification or 2FA yet.
- The AWS stack synthesizes in CI but has not been deployed.
