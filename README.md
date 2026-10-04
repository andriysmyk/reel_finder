# Reel Finder — TV Show Catalog

A **Next.js 16 + TypeScript** application for searching TV shows through the public [TVmaze API](https://www.tvmaze.com/api), viewing show details, and accessing a REST API and health endpoint. The application deploys to **AWS (EC2 + ECR)** through **GitHub Actions** using **OIDC** authentication, with infrastructure managed by **Terraform**.

## Architecture

```text
 Browser ──▶ Next.js (EC2, Docker) ──▶ api.tvmaze.com
              │  /api/search?q=...
              │  /api/shows/:id
              │  /api/health
              └─▶ CloudWatch Logs (/reel_finder/app)

 git push to main ──▶ GitHub Actions
                       1. Type check + build
                       2. OIDC → IAM role (no AWS access keys)
                       3. Docker build → ECR (tag = Git SHA)
                       4. SSM Run Command → EC2: pull + restart
                       5. Smoke test: /api/health reports the new version
```

## Project Structure

```text
app/
  page.tsx, SearchView.tsx     Search interface (client component)
  shows/[id]/page.tsx         Show details
  api/search/route.ts         GET /api/search?q=
  api/shows/[id]/route.ts      GET /api/shows/:id
  api/health/route.ts          GET /api/health
lib/
  tvmaze.ts                   TVmaze client, timeouts, error mapping
  http.ts                     HTTP error responses and logging
  log.ts                      JSON logging
  types.ts                    TypeScript types
Dockerfile                    Multi-stage build, non-root user, HEALTHCHECK
.github/workflows/deploy.yml  CI/CD
infra/                        Terraform infrastructure
```

## API

| Endpoint | Success | Errors |
|---|---|---|
| `GET /api/search?q=sherlock` | `200 { query, results[] }` | `400` for queries shorter than 2 characters; `502/503/504` for TVmaze failures |
| `GET /api/shows/335` | `200 { ...show details }` | `400` for a nonnumeric ID; `404` if the show does not exist; `502/503/504` for TVmaze failures |
| `GET /api/health` | `200 { status, version, uptimeSeconds }` | — |

## Local Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # Check TypeScript types
```

To run the application in Docker:

```bash
docker build -t reel_finder .
docker run --rm -p 3000:3000 -e APP_VERSION=local reel_finder
```

## AWS Deployment

### 1. Provision the infrastructure

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # Set your repository owner and name
terraform init
terraform apply
```

If the AWS account already has a GitHub OIDC provider, set `create_oidc_provider = false`.

### 2. Configure GitHub

In the repository, go to **Settings → Environments**, create a `production` environment, and add the following **Variables** using the values from `terraform output`:

`AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`, `ECR_REPOSITORY`, `EC2_INSTANCE_ID`, `LOG_GROUP`, `APP_URL`

AWS access key secrets are not required: OIDC provides temporary credentials for each workflow run.

### 3. Deploy

Push to `main` to trigger deployment. Pull requests run validation checks without deploying.

### Infrastructure costs and removal

The deployment provisions a t3.micro instance, an Elastic IP address, and a 20 GB gp3 volume. Costs depend on usage, AWS Region, and Free Tier eligibility.

To remove the infrastructure when it is no longer needed:

```bash
cd infra
terraform destroy
```

## Security

- **OIDC authentication:** GitHub does not store long-lived AWS access keys. The deployment role can only be assumed by this repository's `production` environment.
- **Least privilege:** The deployment role can push images to one ECR repository and send SSM commands to one EC2 instance.
- **SSM access:** Port 22 is closed. Server access uses SSM Session Manager, with auditing through CloudTrail.
- **Instance and container security:** IMDSv2 is required, the disk is encrypted, and the container runs as a non-root user.
- **Image integrity:** ECR uses immutable image tags based on the Git SHA and image scanning.
- **HTTP security headers:** `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.

## Monitoring and Troubleshooting

Use browser **DevTools** to inspect requests in the **Network** tab and correlate failures with application logs.

### Request validation

Search queries shorter than two characters return `400` with a JSON error response. A request to `/shows/abc` returns `400` for an invalid ID, while `/shows/99999999` returns `404` if the show does not exist.

### Upstream connectivity

To verify error handling when the upstream service is unavailable, run locally with an invalid TVmaze URL:

```bash
TVMAZE_BASE_URL=https://invalid.example npm run dev
```

Requests that depend on TVmaze return `502`. Inspect the application logs for the corresponding error.

Use **DevTools → Network → Throttling → Slow 3G** to inspect the loading state and request timing under slow network conditions.

### HTTP responses and deployed version

Inspect response headers and status codes:

```bash
curl -i "$APP_URL/api/search?q=office"
```

Check the deployed version and compare it with the expected commit SHA:

```bash
curl "$APP_URL/api/health"
```

### CloudWatch logs

Run this Logs Insights query against the `/reel_finder/app` log group to find recent errors:

```text
fields @timestamp, @message
| filter @message like /"level":"error"/
| sort @timestamp desc
| limit 20
```

### Deployment validation and rollback

Pull request checks validate TypeScript and build the application before deployment. If a deployment fails, inspect the GitHub Actions logs.

To roll back, run the deployment workflow manually (`workflow_dispatch`) using the previous commit, then verify the restored version through `/api/health`.

## Potential Improvements

- HTTPS through ALB + ACM or CloudFront.
- A Content-Security-Policy header.
- CloudWatch alarms for application errors.
- Route 53 health checks.
