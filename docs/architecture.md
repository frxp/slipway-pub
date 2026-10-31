# Architecture

## Shape

Two apps in one repo. The SPA talks to the API over JSON. The API keeps its state in Postgres.

```
browser -> web (Vite, :5173)
browser -> api (Laravel, :8000) -> Postgres
```

In the AWS stack the browser sees one origin: CloudFront sends `/api/*` to the API and everything else to S3.

## Decisions

- **Token auth (Sanctum), not cookies.** The SPA and API run on different origins locally. A bearer token avoids cross-origin cookie and CSRF setup. The token lives in `localStorage`, so an XSS bug could steal it. Tokens expire after 7 days (`SANCTUM_EXPIRATION`), and each login removes the user's expired ones.
- **CORS from one env var.** `WEB_URL` is the only allowed origin, so there is no wildcard in any environment.
- **Thin controllers.** Controllers validate inline and return JSON. There are no form request classes at this size.
- **Named rate limiters.** `login`, `register`, `forgot-password` and `password` each have a bucket, so one flow cannot use up another's budget. `/reset-password` and `/me/password` share `password`. Reading or changing a profile is not limited.
- **Postgres.** The same database runs in Compose and on RDS. API tests run on SQLite in memory for speed; the E2E tests run on Postgres.
- **Lower-case emails.** `NormalizeEmail` runs on the public auth routes before the rate limiter and validation.
- **Production images.** They read everything from the environment, require `APP_KEY`, run as `www-data` and log to stderr.
- **Pinned CI actions.** Every third-party action is pinned to a full commit SHA, with the version in a comment.
- **Plain CSS with tokens.** `tokens.css` holds colors, spacing and type sizes for light and dark themes; `index.css` uses them.

## Password reset

`POST /api/forgot-password` always gives the same answer and sends the email after the response, so neither the body nor the timing reveals which emails have accounts. `/api/reset-password` returns one error for any bad token or address. `/api/register` still reports a taken email, which only email verification could hide.

The email link opens the SPA (`WEB_URL`), which posts the token to `/api/reset-password`. A successful reset revokes every token of the user. Changing the password while signed in cancels any pending link. Locally, Mailpit catches the emails.

## Typed contract

Laravel routes and annotations produce `api/openapi.json` (Scramble). `web/src/schema.d.ts` is generated from it, and `web/src/api.ts` uses it through `openapi-fetch`, so a changed response breaks the web build instead of the browser. CI regenerates both files and fails if they differ from the commit.

## Tests

PHPUnit covers the API. Playwright drives the real stack: register, sign in and out, profile, password reset through Mailpit, route guards, rate-limit and connection errors. CI starts Docker Compose and runs the same tests.

## Known gaps

- Email addresses are not verified, and there is no two-factor auth.
- The AWS stack synthesizes in CI but has not been deployed. [infra/README.md](../infra/README.md) lists its limits.
