# Infrastructure

AWS CDK (TypeScript). One stack, two parts:

- **Web:** private S3 bucket behind CloudFront, with SPA fallback to `index.html`.
- **API:** `api/Dockerfile.prod` on ECS Fargate behind an Application Load Balancer, public subnets only (no NAT gateway).

## Commands

```
cd web && VITE_API_URL=http://<alb-dns>/api pnpm build   # build the SPA first
cd infra
pnpm install
pnpm synth      # render CloudFormation
pnpm diff
pnpm deploy
```

`VITE_API_URL` is the `ApiUrl` stack output from a previous deploy, so the first deploy is two steps: deploy, read `ApiUrl`, rebuild the SPA, deploy again.

## Limits of this stack

- The ALB serves HTTP. Add a domain and an ACM certificate for HTTPS.
- The API uses SQLite inside the container, so data is lost when the task restarts. Swap in RDS for real use.
