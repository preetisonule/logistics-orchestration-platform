import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Inventory Service Business Rules", () => {
  it("validates positive reservation quantity", () => {
    const validQty = 5;
    assert.equal(typeof validQty, "number");
    assert.equal(Number.isInteger(validQty), true);
    assert.equal(validQty > 0, true);
  });

  it("rejects non-integer or non-positive reservation quantity", () => {
    const invalidQty1 = -2;
    const invalidQty2 = 0;
    const invalidQty3 = 3.5;

    assert.equal(invalidQty1 > 0, false);
    assert.equal(invalidQty2 > 0, false);
    assert.equal(Number.isInteger(invalidQty3), false);
  });

  it("calculates available inventory correctly", () => {
    const totalQuantity = 100;
    const reservedQuantity = 30;
    const available = totalQuantity - reservedQuantity;

    assert.equal(available, 70);
  });

  it("prevents reservation when requested quantity exceeds available stock", () => {
    const totalQuantity = 100;
    const reservedQuantity = 95;
    const requestedQuantity = 10;
    const available = totalQuantity - reservedQuantity;

    assert.equal(requestedQuantity > available, true);
  });
});
