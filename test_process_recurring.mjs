// Run: node test_process_recurring.mjs
import assert from "node:assert/strict";
import { calculateNextRecurringDate, WEEKDAY_MASK } from "./lib/recurring.js";

// From Monday, weekdays → Tuesday
{
  const next = calculateNextRecurringDate(
    new Date(2026, 9, 5), // Mon 5 Oct
    "WEEKDAYS",
    WEEKDAY_MASK
  );
  assert.equal(next.getDay(), 2);
  assert.equal(next.getDate(), 6);
}

// From Friday, weekdays → Monday
{
  const next = calculateNextRecurringDate(
    new Date(2026, 9, 9), // Fri 9 Oct
    "WEEKDAYS",
    WEEKDAY_MASK
  );
  assert.equal(next.getDay(), 1);
  assert.equal(next.getDate(), 12);
}

// Monthly advances one month
{
  const next = calculateNextRecurringDate(new Date(2026, 9, 8), "MONTHLY");
  assert.equal(next.getMonth(), 10);
  assert.equal(next.getDate(), 8);
}

console.log("process-recurring helpers: all assertions passed");
