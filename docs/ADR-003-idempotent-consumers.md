# ADR 003: Idempotent Event Consumers

## Context
Apache Kafka provides at-least-once message delivery. Transient network retries or consumer restarts can deliver duplicate messages to downstream consumers.

## Decision
Design every Kafka consumer to be strictly idempotent. Each event contains a unique `eventId`. Downstream tables (`WarehouseTask`, `Shipment`, `EventLog`) store `sourceEventId` or task references backed by database-level `@unique` constraints.

## Consequences
- Duplicate message consumption is detected before database write or safely ignored upon unique constraint violation without crashing processes or producing corrupt data.
