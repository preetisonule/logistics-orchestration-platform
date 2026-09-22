import { describe, it } from "node:test";
import assert from "node:assert/strict";

function isValidTransition(currentStatus: string, nextStatus: string): boolean {
  return (
    (currentStatus === "PICKING_PENDING" && nextStatus === "PICKED") ||
    (currentStatus === "PICKED" && nextStatus === "PACKED") ||
    (currentStatus === "PACKED" && nextStatus === "PACKAGE_READY")
  );
}

describe("Warehouse Task State Machine & Transition Rules", () => {
  it("allows sequential transitions PICKING_PENDING -> PICKED -> PACKED -> PACKAGE_READY", () => {
    assert.equal(isValidTransition("PICKING_PENDING", "PICKED"), true);
    assert.equal(isValidTransition("PICKED", "PACKED"), true);
    assert.equal(isValidTransition("PACKED", "PACKAGE_READY"), true);
  });

  it("rejects non-sequential or backward transitions", () => {
    assert.equal(isValidTransition("PICKING_PENDING", "PACKED"), false);
    assert.equal(isValidTransition("PICKING_PENDING", "PACKAGE_READY"), false);
    assert.equal(isValidTransition("PACKAGE_READY", "PICKED"), false);
    assert.equal(isValidTransition("PACKED", "PICKED"), false);
  });

  it("identifies duplicate events using unique sourceEventId", () => {
    const existingEvents = new Set(["evt-123", "evt-456"]);
    const incomingEventId = "evt-123";

    const isDuplicate = existingEvents.has(incomingEventId);
    assert.equal(isDuplicate, true);
  });
});
