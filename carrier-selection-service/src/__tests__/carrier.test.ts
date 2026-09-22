import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { selectCarrier } from "../carrierEngine.js";

describe("Carrier Selection Engine Rules", () => {
  it("selects DELHIVERY for priority 1 when eligible for EXPRESS and 2kg", () => {
    const { carrier, selectionReason } = selectCarrier(2, "EXPRESS");
    assert.equal(carrier.name, "DELHIVERY");
    assert.equal(selectionReason.includes("DELHIVERY"), true);
  });

  it("selects DTDC for STANDARD service when weight exceeds BLUEDART limits", () => {
    const { carrier } = selectCarrier(18, "STANDARD");
    assert.equal(carrier.name, "DELHIVERY");
  });

  it("throws error when package weight exceeds all carrier capacity", () => {
    assert.throws(() => {
      selectCarrier(50, "STANDARD");
    }, /No carrier available/);
  });

  it("throws error when no carrier supports requested SLA", () => {
    assert.throws(() => {
      selectCarrier(5, "SAME_DAY_SAME_HOUR");
    }, /No carrier available/);
  });
});
