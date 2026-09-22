# ADR 002: Transactional Outbox Pattern for Reliable Event Publishing

## Context
Directly publishing to Kafka inside an Express route or database operation creates a dual-write failure window: if the DB transaction commits but Kafka publish fails (or vice versa), state becomes inconsistent.

## Decision
Implement the Transactional Outbox Pattern in `inventory-service`, `warehouse-service`, and `shipment-service`. State updates and `OutboxEvent` insertions occur inside a single ACID database transaction. A separate background publisher polls unpublished outbox records and emits them to Kafka.

## Consequences
- Guarantees at-least-once event publication without dual-write inconsistencies.
- Outbox publishers run non-overlapping loops with failure logging and retry counters (`attempts`).
