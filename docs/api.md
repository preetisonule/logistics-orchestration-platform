# REST API Documentation

## Inventory Service (Port 3000)

- `GET /products` — List all products.
- `POST /products` — Create product (`name`, `sku`, `weightKg`).
- `GET /warehouses` — List all warehouses (`id`, `name`, `location`, `createdAt`).
- `POST /warehouses` — Create warehouse (`name`, `location`).
- `GET /inventory` — List all inventory stock records.
- `POST /inventory` — Add stock (`productId`, `warehouseId`, `totalQuantity`).
- `POST /inventory/:id/reserve` — Reserve inventory stock (`quantity`, `serviceLevel`). Emits `INVENTORY_RESERVED`.
- `GET /health` — Service readiness health check.

## Warehouse Service (Port 3002)

- `GET /tasks` — List all warehouse picking tasks.
- `GET /tasks/:id` — Get task details by ID.
- `PATCH /tasks/:id/status` — Advance status (`PICKING_PENDING` → `PICKED` → `PACKED` → `PACKAGE_READY`). Status `PACKAGE_READY` writes Outbox event and publishes `PACKAGE_READY`.
- `GET /health` — Service readiness health check.

## Carrier Selection Service (Port 3003)

- `GET /health` — Service readiness health check.

## Shipment Service (Port 3004)

- `GET /shipments` — List all shipments.
- `GET /shipments/:trackingNumber` — Get shipment by tracking number.
- `PATCH /shipments/:trackingNumber/status` — Advance status (`CREATED` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`). Emits `SHIPMENT_STATUS_UPDATED`.
- `GET /health` — Service readiness health check.

## Event Store Service (Port 3005)

- `GET /events` — Retrieve event logs with optional parameters (`limit`, `eventType`, `source`, `correlationId`).
- `GET /health` — Service readiness health check.
