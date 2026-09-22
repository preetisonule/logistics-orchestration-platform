# ADR 004: Service Database Isolation (Database-per-Service)

## Context
Shared databases break microservice encapsulation, allow illegal cross-service foreign keys, and make independent deployments impossible.

## Decision
Enforce strict Database-per-Service architecture. PostgreSQL hosts isolated databases (`inventory_db`, `warehouse_db`, `shipment_db`, `event_db`). Services NEVER perform cross-database queries.

## Consequences
- Clean microservice boundaries.
- Cross-service data correlation relies exclusively on event data payloads (`correlationId`, `causationId`) and REST APIs.
