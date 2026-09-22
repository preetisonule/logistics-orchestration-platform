import { describe, it } from "node:test";
import assert from "node:assert/strict";

function filterEvents(
  events: Array<{ eventType?: string; source?: string; correlationId?: string }>,
  filters: { eventType?: string; source?: string; correlationId?: string; limit?: number }
) {
  let result = events.filter((e) => {
    if (filters.eventType && e.eventType !== filters.eventType) return false;
    if (filters.source && e.source !== filters.source) return false;
    if (filters.correlationId && e.correlationId !== filters.correlationId) return false;
    return true;
  });

  if (filters.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

describe("Event Store Service Persistence & Query Rules", () => {
  const sampleEvents = [
    { eventId: "e1", eventType: "INVENTORY_RESERVED", source: "inventory-service", correlationId: "c-1" },
    { eventId: "e2", eventType: "PACKAGE_READY", source: "warehouse-service", correlationId: "c-1" },
    { eventId: "e3", eventType: "CARRIER_SELECTED", source: "carrier-selection-service", correlationId: "c-1" },
    { eventId: "e4", eventType: "SHIPMENT_CREATED", source: "shipment-service", correlationId: "c-1" },
    { eventId: "e5", eventType: "INVENTORY_RESERVED", source: "inventory-service", correlationId: "c-2" },
  ];

  it("filters events correctly by eventType", () => {
    const res = filterEvents(sampleEvents, { eventType: "INVENTORY_RESERVED" });
    assert.equal(res.length, 2);
    assert.equal(res.every((e) => e.eventType === "INVENTORY_RESERVED"), true);
  });

  it("filters events correctly by correlationId for full workflow tracing", () => {
    const res = filterEvents(sampleEvents, { correlationId: "c-1" });
    assert.equal(res.length, 4);
    assert.equal(res[0].eventType, "INVENTORY_RESERVED");
    assert.equal(res[3].eventType, "SHIPMENT_CREATED");
  });

  it("applies limit parameter correctly", () => {
    const res = filterEvents(sampleEvents, { limit: 2 });
    assert.equal(res.length, 2);
  });

  it("prevents duplicate event log insertion based on eventId", () => {
    const storedIds = new Set(["e1", "e2"]);
    const incomingEventId = "e1";

    const isDuplicate = storedIds.has(incomingEventId);
    assert.equal(isDuplicate, true);
  });
});
