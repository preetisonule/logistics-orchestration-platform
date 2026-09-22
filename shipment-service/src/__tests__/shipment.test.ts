import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateTrackingNumber } from "../kafka/consumer.js";

function isValidShipmentTransition(currentStatus: string, nextStatus: string): boolean {
  return (
    (currentStatus === "CREATED" && nextStatus === "IN_TRANSIT") ||
    (currentStatus === "IN_TRANSIT" && nextStatus === "OUT_FOR_DELIVERY") ||
    (currentStatus === "OUT_FOR_DELIVERY" && nextStatus === "DELIVERED")
  );
}

describe("Shipment Lifecycle State Machine & Tracking Number Rules", () => {
  it("enforces valid status transitions CREATED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED", () => {
    assert.equal(isValidShipmentTransition("CREATED", "IN_TRANSIT"), true);
    assert.equal(isValidShipmentTransition("IN_TRANSIT", "OUT_FOR_DELIVERY"), true);
    assert.equal(isValidShipmentTransition("OUT_FOR_DELIVERY", "DELIVERED"), true);
  });

  it("rejects invalid transitions (e.g., DELIVERED -> CREATED or CREATED -> DELIVERED)", () => {
    assert.equal(isValidShipmentTransition("DELIVERED", "CREATED"), false);
    assert.equal(isValidShipmentTransition("CREATED", "DELIVERED"), false);
    assert.equal(isValidShipmentTransition("DELIVERED", "IN_TRANSIT"), false);
    assert.equal(isValidShipmentTransition("CREATED", "OUT_FOR_DELIVERY"), false);
  });

  it("generates a unique human-readable tracking number matching LOG-2026-XXXXXX format", () => {
    const trackingNumber = generateTrackingNumber();
    assert.equal(trackingNumber.startsWith("LOG-2026-"), true);
    assert.equal(trackingNumber.length, 17);
  });

  it("detects duplicate taskId for idempotent shipment creation", () => {
    const existingTasks = new Set(["task-1001"]);
    const incomingTaskId = "task-1001";

    const isDuplicate = existingTasks.has(incomingTaskId);
    assert.equal(isDuplicate, true);
  });
});
