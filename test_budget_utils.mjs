// Run: node test_budget_utils.mjs
import assert from "node:assert/strict";
import { crossedThreshold, monthRange } from "./lib/budget-utils.js";

// crosses 80% for the first time
assert.equal(crossedThreshold(700, 850, 1000), 80);
// crosses straight past both -> reports the higher one
assert.equal(crossedThreshold(700, 1100, 1000), 100);
// already over 80%, still under 100% -> no repeat alert
assert.equal(crossedThreshold(850, 900, 1000), null);
// already over budget -> silent on every later transaction
assert.equal(crossedThreshold(1100, 1300, 1000), null);
// exactly on the line counts as crossing it
assert.equal(crossedThreshold(799, 800, 1000), 80);
assert.equal(crossedThreshold(999, 1000, 1000), 100);
// no budget / zero limit never alerts (guards divide-by-zero)
assert.equal(crossedThreshold(0, 500, 0), null);
assert.equal(crossedThreshold(0, 500, -1), null);
// refunds moving spend down do not alert
assert.equal(crossedThreshold(900, 700, 1000), null);

// month boundaries are inclusive of the last instant of the last day
const { start, end } = monthRange(new Date(2026, 1, 14));
assert.equal(start.getDate(), 1);
assert.equal(end.getMonth(), 1);       // still February
assert.equal(end.getDate(), 28);       // 2026 is not a leap year
assert.equal(end.getHours(), 23);

console.log("budget-utils: all assertions passed");
