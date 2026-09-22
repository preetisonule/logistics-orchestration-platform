# Kafka Event Contracts

Every event published to Apache Kafka follows a standardized, versioned event envelope structure.

## Event Envelope Schema

```typescript
interface EventEnvelope<T> {
  eventId: string;        // Unique event identifier (UUID v4)
  eventType: string;      // Canonical event type
  version: number;        // Schema version (currently 1)
  occurredAt: string;     // ISO-8601 timestamp
  source: string;         // Emitting microservice identifier
  correlationId: string; // Workflow correlation trace ID
  causationId?: string;  // Triggering parent event ID
  data: T;                // Event domain payload
}
```

## Event Topics & Payloads

### 1. `inventory-events`

**Event Type**: `INVENTORY_RESERVED`

```json
{
  "eventId": "123e4567-e89b-12d3-a456-426614174000",
  "eventType": "INVENTORY_RESERVED",
  "version": 1,
  "occurredAt": "2026-09-19T12:00:00.000Z",
  "source": "inventory-service",
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "inventoryId": "inv-001",
    "productId": "prod-001",
    "warehouseId": "wh-001",
    "quantity": 2,
    "weightKg": 12.5,
    "serviceLevel": "EXPRESS"
  }
}
```

### 2. `warehouse-events`

**Event Type**: `PACKAGE_READY`

```json
{
  "eventId": "987f6543-e21b-34c5-d678-987654321000",
  "eventType": "PACKAGE_READY",
  "version": 1,
  "occurredAt": "2026-09-19T12:05:00.000Z",
  "source": "warehouse-service",
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "causationId": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "taskId": "task-789",
    "productId": "prod-001",
    "warehouseId": "wh-001",
    "quantity": 2,
    "weightKg": 12.5,
    "serviceLevel": "EXPRESS"
  }
}
```

### 3. `carrier-events`

**Event Type**: `CARRIER_SELECTED`

```json
{
  "eventId": "456e7890-a12b-45c6-d789-012345678901",
  "eventType": "CARRIER_SELECTED",
  "version": 1,
  "occurredAt": "2026-09-19T12:05:02.000Z",
  "source": "carrier-selection-service",
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "causationId": "987f6543-e21b-34c5-d678-987654321000",
  "data": {
    "taskId": "task-789",
    "productId": "prod-001",
    "warehouseId": "wh-001",
    "quantity": 2,
    "carrier": "DELHIVERY",
    "serviceLevel": "EXPRESS",
    "weightKg": 12.5,
    "selectionReason": "Selected DELHIVERY (Priority 1): Eligible for EXPRESS service and weight limit 12.5kg <= 30kg"
  }
}
```

### 4. `shipment-events`

**Event Type**: `SHIPMENT_CREATED` & `SHIPMENT_STATUS_UPDATED`

```json
{
  "eventId": "321f6549-c87b-65d4-e321-109876543210",
  "eventType": "SHIPMENT_CREATED",
  "version": 1,
  "occurredAt": "2026-09-19T12:05:05.000Z",
  "source": "shipment-service",
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "causationId": "456e7890-a12b-45c6-d789-012345678901",
  "data": {
    "shipmentId": "ship-001",
    "trackingNumber": "LOG-2026-A1B2C3D4",
    "taskId": "task-789",
    "carrier": "DELHIVERY",
    "serviceLevel": "EXPRESS",
    "weight": 12.5,
    "status": "CREATED"
  }
}
```
