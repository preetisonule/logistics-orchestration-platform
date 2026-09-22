# ADR 001: Event-Driven Communication via Apache Kafka

## Context
In a multi-stage logistics workflow (Inventory → Warehouse → Carrier Selection → Shipment), synchronous REST calls between microservices introduce tight coupling, cascading downtime risks, and high latency.

## Decision
Adopt Apache Kafka as the central event bus for asynchronous cross-service communication using dedicated topics (`inventory-events`, `warehouse-events`, `carrier-events`, `shipment-events`).

## Consequences
- **Pros**: Loose coupling, high throughput, eventual consistency, message durability, and independent service scalability.
- **Cons**: Requires handling at-least-once delivery, out-of-order events, and eventual consistency in the user interface.
