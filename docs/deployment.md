# Production Deployment

This project runs as one Docker Compose stack on a Linux VM.

## Production topology

- Nginx/React dashboard: public HTTP port 80
- Inventory, Warehouse, Carrier Selection, Shipment, and Event Store: Docker-internal
- Kafka: Docker-internal
- PostgreSQL: Docker-internal

## First-time server setup

Install Docker and Git on the VM, then clone the repository:

```bash
git clone https://github.com/preetisonule/logistics-orchestration-platform.git
cd logistics-orchestration-platform
```

Create a server-side `.env` file. Do not commit it:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME_TO_A_LONG_URL_SAFE_PASSWORD
```

Use a password containing letters and numbers (and other URL-safe characters) because it is embedded in PostgreSQL connection URLs.

Start production:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Verify:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl http://127.0.0.1/
```

The public application is available at:

```
http://<VM_PUBLIC_IP>
```

## Automatic deployment

The repository contains a GitHub Actions workflow:

`.github/workflows/deploy.yml`

Every push to `main` can deploy the latest commit to the VM.

Configure these GitHub repository secrets:

- `DEPLOY_HOST` — VM public IP or hostname
- `DEPLOY_USER` — Linux SSH user
- `DEPLOY_SSH_KEY` — private SSH key for that VM
- `DEPLOY_KNOWN_HOSTS` — pinned SSH host key entry
- `DEPLOY_PATH` — e.g. `/opt/logistics-orchestration-platform`

The VM must have Docker permissions for `DEPLOY_USER`.

The VM also needs the production `.env` file. GitHub Actions does not store or overwrite that server-side secret.

Deployment flow:

```
git push
   ↓
GitHub Actions
   ↓
SSH to VM
   ↓
git fetch/reset origin/main
   ↓
docker compose up -d --build
   ↓
new version live
```

## Important

Do not expose these ports publicly in the cloud:

- 3000
- 3002
- 3003
- 3004
- 3005
- 5433
- 9092
- 9094

Only port 80 is required for the application.
