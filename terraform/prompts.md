# Prompt Logs (prompts.md)

This document records the key prompts used to build, deploy, and troubleshoot the CI/CD Dashboard on GCP with Terraform, plus reusable prompt examples.

## Context
- Project: cicd-dashboard (Node/Express + React + Postgres + Redis)
- Infra: GCP Compute Engine (e2‑micro), VPC, firewall, static IP
- Provisioning: Terraform + instance startup script (Docker + Compose)
- Goals: Free‑tier friendly, automated boot, live metrics, Slack notifications

---

## Prompt Log (chronological highlights)

1) Goal and requirements gathering
- "Goal: As a Cloud Engineer, analyze the cicd-dashboard codebase to deploy the application to Google Cloud Platform (GCP) using Terraform-based Infrastructure-as-Code, ensuring minimal cost under the GCP Free Tier. Create the IaC terraform files and DO NOT DEPLOY it, share the steps. Also i need to showcase the live metrics on cicd health dashboard how can achieve this as well."

2) App analysis and containerization
- "Analyze the codebase structure, confirm ports, services, health checks, and Dockerfiles."
- "Confirm docker-compose services and environment variables for Postgres and Redis."

3) Terraform infra creation
- "Create Terraform for: VPC + subnet, firewall (80/443/22/internal), static IP, e2‑micro VM (Ubuntu 22.04), service account with logging/monitoring."
- "Use startup script to install Docker + Docker Compose and run docker-compose up at boot."

4) Startup script and deployment flow
- "Explain how the startup script deploys without git clone and uses existing docker-compose images."
- "Optimize startup script for reliability; reduce deployment time to under ~8 minutes."

5) Troubleshooting boot issues
- "Startup script didn’t run; check serial-port logs and confirm Docker installation and compose availability."
- "Create quick-deploy script for manual fallback while debugging."

6) Live metrics enablement
- "Design and implement live metrics generation and seeding so frontend shows live pipeline data."
- "Add scripts to seed pipelines/metrics/alerts and a generator that produces continuous updates."

7) Slack notifications
- "Integrate Slack Webhook to send deployment status with dashboard URL and health."
- "Add Terraform variable slack_webhook_url and document where to configure it."

8) Template/metadata fixes
- "templatefile() failed parsing; switch to file() and environment variable expansion."
- "Fix heredoc EOF and JSON payload construction in Slack script."

9) Postgres dependency and health checks
- "Docker-compose: increase Postgres healthcheck retries and start_period, stage startup: DB -> backend -> frontend."

10) Documentation requests
- "Provide Deployment Guide with `terraform apply` steps, configuration, and troubleshooting."
- "Provide Prompt Logs (this file) and AI prompt examples for reuse."

---

## Reusable Prompt Examples

### A) Create GCP Terraform for a single VM running a Dockerized app
"Create Terraform to provision a minimal-cost GCP setup (VPC/subnet, firewall 80/443/22/internal, static IP, e2‑micro VM). Provide a startup script that installs Docker + Docker Compose and runs my docker-compose file at boot. Output clear variables, outputs, and instructions."

### B) Harden a startup script for reliability
"Review this startup script and make it robust: add logging to /var/log, explicit retries for apt and Docker install, verify docker/docker-compose versions, stage service startup (database -> backend -> frontend), and add health checks with start_period and sufficient retries."

### C) Seed demo data and generate live metrics
"Add a seeding script that inserts pipelines, metrics, and alerts into Postgres, and a generator that periodically creates/updates pipelines and metrics so the dashboard always shows live data. Ensure commands run via docker-compose exec and include safe retries." 

### D) Add Slack deployment notifications
"Add a Slack notification script using a webhook URL (provided via environment variable). Include status (success/failed), dashboard URL, API health link, and counts (e.g., pipelines). Handle missing webhook by logging and skipping."

### E) Fix docker-compose dependency race conditions
"Adjust healthchecks and dependencies so Postgres has start_period and higher retries. Stage `docker-compose up` as: postgres+redis -> wait for pg_isready -> backend -> wait for /health -> frontend."

### F) Diagnose Terraform template errors
"Resolve templatefile() parsing errors in Terraform when embedding shell scripts with heredocs and JSON payloads. Prefer file() and pass variables via instance metadata/env. Fix heredoc delimiters and quoting."

---

## Short Prompts (copy/paste)

- "Show me the serial-port output for the GCE instance to debug startup-script failures."
- "Increase Postgres healthcheck retries and add start_period; stage service startup."
- "Convert this heredoc-based JSON payload to a safe quoted string for curl."
- "Add a Terraform variable for slack_webhook_url and wire it into the startup script via metadata/env."
- "Generate a seed script that inserts N pipelines, metrics, and alerts using docker-compose exec psql commands."
- "Write a bash loop that waits for pg_isready up to 30 attempts with 5s interval, then continues."

---

## Notes on Secrets and Safety
- Do not commit real Slack webhook URLs. Use Terraform variable `slack_webhook_url` or environment variables.
- Avoid hardcoding credentials in VCS; this demo includes local values for convenience—replace with secrets manager/VAULT in production.

---

## How to Use This Log
- Reuse the examples to request new infra features, fix boot issues, or extend monitoring/alerts.
- Keep app-specific values (project_id, zone, image names) updated before running.
