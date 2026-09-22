# Local Development & Testing Guide

## Prerequisites

- Node.js 22+
- Docker & Docker Compose v2+
- PostgreSQL 17 (if running outside Docker)

## Docker Setup (Recommended)

1. Build & Start Infrastructure & Microservices:
   ```bash
   docker compose up --build -d
   ```
2. Verify all 6 containers are healthy:
   ```bash
   docker compose ps
   ```
3. Run Seeding Script to populate demo stock:
   ```bash
   node scripts/seed-demo.mjs
   ```
4. Start Dashboard:
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser.

## Running Unit Tests

Run automated unit tests for each service:
```bash
cd inventory-service && npm test
cd warehouse-service && npm test
cd carrier-selection-service && npm test
cd shipment-service && npm test
cd event-service && npm test
```
