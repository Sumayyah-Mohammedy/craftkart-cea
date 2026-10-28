# CraftKart: Three-Tier Cloud Deployment on AWS

CraftKart is a multi-role e-commerce marketplace for buyers, sellers and admins. This repository packages it as a cloud-native three-tier application for the SE-490 Cloud Computing CEA:

| Tier | Technology | AWS placement |
|---|---|---|
| Web | React SPA served by **Nginx** (Docker image `craftkart-frontend`) | EC2 Auto Scaling Group in **private web subnets** behind a **public ALB** |
| Application | **Node.js 20 / Express** REST API (Docker image `craftkart-backend`) | EC2 Auto Scaling Group in **private app subnets** behind an **internal ALB** |
| Database | **PostgreSQL 16** | **Amazon RDS** in isolated **private DB subnets** |

Infrastructure is written as code with Terraform in `infra/terraform`. The CI/CD pipeline is GitHub Actions (`.github/workflows/ci-cd.yml`) and pushes images to Amazon ECR. The architecture diagram is in `docs/architecture.png`.

```
.
├── backend/                 Express API (PostgreSQL via `pg`), Dockerfile, Jest integration tests
│   ├── db/schema.sql        idempotent schema, applied automatically at start-up
│   ├── models/              SQL data-access layer (keeps the old Mongoose JSON shape for the UI)
│   └── tests/api.test.js    27 end-to-end API tests against a real PostgreSQL
├── frontend/                React app, multi-stage Dockerfile, nginx/default.conf.template
├── docker-compose.yml       local 3-tier stack (web + api + postgres)
├── infra/terraform/         VPC, subnets, NAT, SGs, NACL, ALBs, ASGs, RDS, ECR, Secrets Manager,
│                            CloudWatch, S3, GitHub OIDC role
├── scripts/rolling-deploy.sh  zero-downtime ASG instance-refresh deploy (used by CI/CD)
└── .github/workflows/ci-cd.yml
```

## What changed from the original CraftKart code

* **Database moved from MongoDB Atlas to PostgreSQL (Amazon RDS).** The CEA requires a managed SQL database that cannot be reached from the internet. The API routes and JSON responses stay the same, so the React app needed no changes. Orders now run inside a database transaction with an atomic stock check, so two app instances can never oversell the same stock.
* **The app tier is stateless.** It writes nothing to local disk and shuts down cleanly on SIGTERM, so it can run behind a load balancer and scale horizontally.
* **Security fixes:**
  * Anyone could register as `admin` before; that is now blocked.
  * Added Helmet security headers and rate limiting on login and register.
  * The API no longer leaks error details in production.
  * Secrets now come only from environment variables or AWS Secrets Manager. The original zip contained real `.env` files with a MongoDB password and a Stripe secret key, and those files have been removed.
* **Health endpoints** `/api/health` (liveness) and `/api/health/ready` (database check), plus structured JSON logs that ship to CloudWatch.
* **Frontend fixes:**
  * The site no longer crashes when Supabase is not configured.
  * The out-of-sync `package-lock.json` broke `npm ci`, and it has been regenerated.
  * The Docker build now passes every `REACT_APP_*` value.

> ⚠️ **Rotate the leaked keys.** The original zip contained a live MongoDB Atlas password and a Stripe test secret key. Change the Atlas password and roll the Stripe key in the Stripe dashboard, then use the new key in `terraform.tfvars`.

---

# How to run

## Option A: Run locally with Docker (≈5 minutes)

Prerequisites: Docker Desktop, or Docker Engine with the compose plugin.

```bash
cd craftkart
cp .env.example .env          # set DB_PASSWORD and JWT_SECRET (any long random strings)
docker compose up --build -d  # builds 2 images, starts postgres + api + web
docker compose ps             # all 3 should be "running"/"healthy"
docker compose exec backend node scripts/seedData.js   # demo data + admin account
```

Then open **http://localhost:8080**.

| Role | Login page | Credentials |
|---|---|---|
| Buyer | `/login` | `buyer1@example.com` / `Buyer@123` |
| Seller | `/seller/login` | `seller1@example.com` / `Seller@123` |
| Admin | `/admin/login` | `admin@craftkart.com` / `Admin@123456` |

Only port 8080 (the web tier) is published. The API and database sit on private Docker networks, which mirrors the subnet design in AWS. To stop the stack, run `docker compose down`. To also delete the database volume, add `-v`.

Product image upload uses Supabase Storage. To enable it, put your Supabase URL and anon key in `.env` before you build. Everything else works without it.

## Option B: Run without Docker (development)

```bash
# PostgreSQL 16 running locally, with a database "craftkart"
cd backend  && cp .env.example .env && npm install && npm run seed && npm run dev    # :5000
cd frontend && cp .env.example .env && npm install && npm start                      # :3000
# tests
cd backend  && DATABASE_URL=postgres://user:pass@localhost:5432/craftkart_test npm test
cd frontend && npm test -- --watchAll=false
```

---

## Option C: Deploy to AWS (the CEA deliverable)

### 0. Prerequisites (one time)
1. An AWS account. Create an IAM user or SSO login with admin rights for yourself. Do not use the root user.
2. Install [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), [Terraform ≥ 1.6](https://developer.hashicorp.com/terraform/install), Git and the [GitHub CLI `gh`](https://cli.github.com/).
3. Run `aws configure` with your access key, region `ap-south-1` and output `json`. Check it with `aws sts get-caller-identity`.
4. Run `gh auth login`.

### 1. Push the code to your own GitHub repository
```bash
cd craftkart
git init -b main
git add . && git commit -m "CraftKart three-tier cloud deployment"
gh repo create craftkart --public --source . --push     # or --private
```
Run `git status` before committing and confirm that no `.env` or `terraform.tfvars` file is listed. Both are git-ignored.

### 2. Provision the infrastructure with Terraform (≈15 min, RDS is the slow part)
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
#   edit: github_repository = "<your-github-username>/craftkart"
#         stripe_secret_key = "sk_test_..."   (optional)
#         alarm_email       = "you@example.com" (optional)
terraform init
terraform plan -out tfplan        # review what will be created
terraform apply tfplan
terraform output                  # app_url, ECR repos, ASG names, ...
```

The EC2 instances start right away, but they keep retrying `docker pull` until the pipeline pushes the first image. That is expected. The ASG may replace them once or twice before then.

### 3. Connect GitHub Actions to AWS (OIDC, no stored keys)
```bash
terraform output -raw github_setup_commands     # prints 10 `gh secret/variable set` lines
terraform output -raw github_setup_commands | bash    # run them from inside the repo folder
# optional: browser-upload of product images via Supabase
gh variable set REACT_APP_SUPABASE_URL --body "https://<project>.supabase.co"
gh secret   set REACT_APP_SUPABASE_ANON_KEY --body "<anon key>"
```
In GitHub, open **Settings → Environments** and create an environment called `production`. You can add yourself as a required reviewer if you want manual approval before each deploy.

### 4. Run the pipeline
```bash
git commit --allow-empty -m "trigger first deploy" && git push
gh run watch                      # or GitHub → Actions tab
```
The pipeline runs **API tests (PostgreSQL service) and React tests**, then **builds both images** and **pushes** them to ECR as `:<git-sha>` and `:latest`. Next it does a **rolling deploy of the app ASG and then the web ASG**, and finally a **smoke test** through the public ALB. The first run takes about 12–15 minutes.

### 5. Open the application
```bash
terraform output app_url                         # http://craftkart-prod-alb-public-xxxx.ap-south-1.elb.amazonaws.com
terraform output -json admin_login               # admin e-mail + generated password
```
The first app instance seeds the demo data automatically. The admin password is generated randomly and stored in Secrets Manager.

### 6. Prove continuous deployment works
Make any small visible change, for example in `frontend/src/pages/buyer/HomePage.jsx`. Commit and push it, watch the pipeline, then refresh the site. `GET /api/health` returns the deployed `version` (the git SHA) and the `instance` ID. Refresh it a few times and the instance ID changes, which shows load balancing across instances.

### 7. Optional: test auto scaling
```bash
# from your laptop (install `hey`: https://github.com/rakyll/hey)
hey -z 5m -c 50 "$(terraform output -raw app_url)/api/products"
```
Watch **EC2 → Auto Scaling Groups → craftkart-prod-asg-web → Activity** and the CloudWatch dashboard. The ASG adds instances when CPU or requests per target go above the target, and scales back in about 15 minutes after the load stops.

### 8. Tear down (avoid charges!)
```bash
cd infra/terraform && terraform destroy
```
The NAT gateway and the two ALBs bill by the hour (about $2.6 per day together), so destroy the stack when you finish taking screenshots. You can recreate it in about 15 minutes.

---

## Screenshot checklist (Deployment Evidence)

| # | Evidence | Where in the AWS Console / tool |
|---|---|---|
| 1 | VPC + 8 subnets, route tables, IGW, NAT | **VPC → Your VPCs → craftkart-prod-vpc → Resource map** (one screenshot shows everything), plus **Subnets** filtered by the VPC |
| 2 | Compute / container hosts | **EC2 → Instances** (filter `craftkart`), **EC2 → Auto Scaling Groups** (both ASGs, with Activity and Automatic scaling tabs) |
| 3 | Security groups | **EC2 → Security Groups** → the inbound rules of each `craftkart-prod-sg-*`. The sources point to other SGs, not 0.0.0.0/0 |
| 4 | Load balancers | **EC2 → Load Balancers** (public and internal), **Target Groups → tg-web / tg-app → Targets** showing healthy instances |
| 5 | Database | **RDS → Databases → craftkart-prod-postgres**: Connectivity tab showing *Publicly accessible: No* and the VPC SG, plus the Configuration tab |
| 6 | Images in registry | **ECR → Repositories → craftkart-backend / craftkart-frontend** showing the SHA tags and scan results |
| 7 | CI/CD run | **GitHub → Actions →** a green run with all 4 jobs, plus the deploy log and smoke-test output |
| 8 | Running app | A browser on `app_url` showing the shop, cart, seller dashboard and admin dashboard, plus `/api/health` |
| + | Secrets | **Secrets Manager → craftkart-prod/app** (show the overview only, not the values) |
| + | Monitoring | **CloudWatch → Dashboards → craftkart-prod-overview** and **Log groups → /craftkart/prod/app** |
| + | Terraform | Terminal showing `terraform apply` and `terraform output` |
| + | Cost | AWS Pricing Calculator estimate (see the report) |

To open a shell on an instance (SSH is disabled), go to **EC2 → Instance → Connect → Session Manager**. Then run `sudo docker ps` and `sudo docker logs craftkart-backend`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Target group shows *unhealthy* right after `terraform apply` | Expected until the first pipeline run pushes the images |
| Pipeline fails at "Configure AWS credentials" | Check that `github_repository` in tfvars exactly matches `owner/repo`, and that you pushed to `main` |
| `EntityAlreadyExists` for the OIDC provider | Your account already has one. Set `create_github_oidc_provider = false` |
| Error 502 on `/api/...` | Check the app logs: `aws logs tail /craftkart/prod/app --follow` |
| Card payment returns 503 | `stripe_secret_key` is empty. Set it in tfvars, run `terraform apply`, then re-run the deploy job |
