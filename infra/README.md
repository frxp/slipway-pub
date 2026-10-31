# Infrastructure

AWS CDK (TypeScript). One stack:

- **CloudFront:** one HTTPS origin. `/api/*` goes to the load balancer, everything else to S3, with paths that have no file falling back to `index.html`.
- **Web:** private S3 bucket.
- **API:** `api/Dockerfile.prod` on ECS Fargate (ARM64) behind an Application Load Balancer, in public subnets, so there is no NAT gateway.
- **Database:** RDS PostgreSQL 18 on `db.t4g.micro` in isolated subnets, reachable only from the API.
- **Secrets:** `APP_KEY` and the database credentials live in Secrets Manager.

## Commands

The stack has not been deployed. `cdk synth` runs in CI.

```
(cd web && VITE_API_URL=/api pnpm build)   # build the SPA first
cd infra
pnpm install
pnpm synth      # render CloudFormation
pnpm diff
pnpm deploy
```

`pnpm deploy` builds the API image with Docker. The `Url` stack output is the address of the application.

## Limits of this stack

- It costs money while it runs: RDS, Fargate, the load balancer, public IPv4 addresses and Secrets Manager all bill by the hour or month. `cdk destroy` removes it and keeps a final RDS snapshot.
- Traffic between CloudFront and the load balancer is plain HTTP, and the load balancer also answers on its own public address.
- CloudFront connects to the load balancer, so rate limits count per CloudFront edge node rather than per client.
- Email needs an SMTP provider. Set `MAIL_HOST` and the other `MAIL_*` variables on the task. Until then reset emails fail and are logged as errors.
- RDS runs in one availability zone.
