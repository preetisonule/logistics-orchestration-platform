# Running the Platform with GitHub Codespaces

This project can be run as a complete Docker Compose stack inside a GitHub Codespace.

## Why Codespaces

The repository contains Kafka consumers, PostgreSQL, and background automation workers. Codespaces lets us run the existing Docker Compose architecture without splitting services across different hosting platforms.

GitHub personal accounts currently include 120 Codespaces core-hours and 15 GB-month of Codespaces storage on the Free plan. Usage beyond the included quota is blocked when no payment method is configured.

## Start a Codespace

On the repository page:
1. Click Code.
2. Open the Codespaces tab.
3. Click Create codespace on main.

Use a machine size that can run the full stack. The project contains Kafka, PostgreSQL, six application containers, and background workers.

## Start the complete application

From the Codespaces terminal:

    cd /workspaces/logistics-orchestration-platform
    printf 'POSTGRES_USER=postgres\nPOSTGRES_PASSWORD=codespace-demo-password\n' > .env
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

The .env file is local to the Codespace and must not be committed.

## Verify

    docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

Inspect logs if needed:

    docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100

## Open the dashboard

The production dashboard runs on port 80 inside the Codespace.

In the VS Code PORTS panel:
1. Find port 80.
2. Change its visibility to Public.
3. Copy the forwarded URL.

GitHub provides a forwarded URL ending in .app.github.dev for a public port.

## Seed demo data

From the repository root:

    node scripts/seed-demo.mjs

Then open the dashboard and run a workflow.

## Recommended demo

Set Autonomous Pipeline Mode to ON and reserve inventory.

The backend should progress asynchronously:

    PICKING_PENDING
      ↓
    PICKED
      ↓
    PACKED
      ↓
    PACKAGE_READY
      ↓
    CARRIER_SELECTED
      ↓
    CREATED
      ↓
    IN_TRANSIT
      ↓
    OUT_FOR_DELIVERY
      ↓
    DELIVERED

## Important limitation

A Codespace is a cloud development environment, not a permanent 24/7 production server. The public forwarded URL depends on the Codespace and services remaining available, and Codespaces usage is subject to GitHub's monthly quota.

For a long-lived deployment later, move the same Docker Compose stack to a persistent VM or container host.

## Development flow

Code changes are committed and pushed normally:

    git add .
    git commit -m "change"
    git push

Codespaces does not automatically redeploy every GitHub push like Vercel. For changes made in the current Codespace, rebuild/restart the Compose stack after pulling the latest code.