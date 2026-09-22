# System Architecture

## Architecture Diagram

```mermaid
flowchart TD
    Dashboard["React Operations Dashboard (Vite + MUI)"]

    subgraph HTTP ["REST API Services"]
        IS["Inventory Service (Port 3000)"]
        WS["Warehouse Service (Port 3002)"]
        CS["Carrier Selection Service (Port 3003)"]
        SS["Shipment Service (Port 3004)"]
        ES["Event Store Service (Port 3005)"]
    end

    subgraph KafkaCluster ["Apache Kafka Event Bus"]
        IE[("inventory-events")]
        WE[("warehouse-events")]
        CE[("carrier-events")]
        SE[("shipment-events")]
    end

    subgraph Storage ["Isolated Databases (PostgreSQL)"]
        IDB[(inventory_db)]
        WDB[(warehouse_db)]
        SDB[(shipment_db)]
        EDB[(event_db)]
    end

    %% REST Connections
    Dashboard -->|POST /inventory/:id/reserve| IS
    Dashboard -->|GET /tasks, PATCH /tasks/:id/status| WS
    Dashboard -->|GET /shipments, PATCH /shipments/:id/status| SS
    Dashboard -->|GET /events| ES

    %% Database Isolation
    IS --- IDB
    WS --- WDB
    SS --- SDB
    ES --- EDB

    %% Outbox & Event Flow
    IS -->|Transactional Outbox| IE
    IE -->|Consume INVENTORY_RESERVED| WS
    WS -->|Transactional Outbox| WE
    WE -->|Consume PACKAGE_READY| CS
    CS -->|Publish CARRIER_SELECTED| CE
    CE -->|Consume CARRIER_SELECTED| SS
    SS -->|Transactional Outbox| SE

    %% Observability Event Store
    IE -->|Consumer Group event-store-group| ES
    WE -->|Consumer Group event-store-group| ES
    CE -->|Consumer Group event-store-group| ES
    SE -->|Consumer Group event-store-group| ES
```

## Microservice Boundaries

1. **Inventory Service** (`port: 3000`, `db: inventory_db`)
   - Manages Product, Warehouse, and Stock Inventory records.
   - Enforces stock reservation invariants (`available = total - reserved`).
   - Emits `INVENTORY_RESERVED` events via Transactional Outbox.

2. **Warehouse Service** (`port: 3002`, `db: warehouse_db`)
   - Consumes `INVENTORY_RESERVED` idempotently using `sourceEventId`.
   - Manages task lifecycle (`PICKING_PENDING` → `PICKED` → `PACKED` → `PACKAGE_READY`).
   - Emits `PACKAGE_READY` events via Transactional Outbox.

3. **Carrier Selection Service** (`port: 3003`)
   - Evaluates eligible carriers (Delhivery, BlueDart, DTDC) using weight, SLA, and deterministic priority.
   - Consumes `PACKAGE_READY` and emits `CARRIER_SELECTED` with `selectionReason`.

4. **Shipment Service** (`port: 3004`, `db: shipment_db`)
   - Consumes `CARRIER_SELECTED` idempotently using `taskId` and `sourceEventId`.
   - Generates unique tracking numbers (`LOG-2026-XXXXXX`).
   - Enforces sequential status state machine (`CREATED` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`).
   - Emits `SHIPMENT_CREATED` and `SHIPMENT_STATUS_UPDATED` via Transactional Outbox.

5. **Event Store Service** (`port: 3005`, `db: event_db`)
   - Observability service consuming all Kafka topics with `fromBeginning: true`.
   - Idempotently logs events and exposes `GET /events` REST endpoint for UI tracing.
