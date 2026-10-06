// Run: node test_accounts.mjs
import assert from "node:assert/strict";
import { summariseBalances, isSpendingAccount } from "./lib/accounts.js";

const a = (type, balance) => ({ type, balance });

// every account balance counts toward net worth
{
  const s = summariseBalances([a("CURRENT", 100), a("SAVINGS", 400), a("SPENDING", 50)]);
  assert.equal(s.netWorth, 550);
  assert.equal(s.spending, 50);
  assert.equal(s.total, 550);
}

// only spending accounts -> net worth is the spending total
{
  const s = summariseBalances([a("SPENDING", 80), a("SPENDING", 20)]);
  assert.equal(s.netWorth, 100);
  assert.equal(s.spending, 100);
}

// no accounts at all, and the nullish cases
assert.deepEqual(summariseBalances([]), { netWorth: 0, spending: 0, total: 0 });
assert.deepEqual(summariseBalances(), { netWorth: 0, spending: 0, total: 0 });
assert.deepEqual(summariseBalances(null), { netWorth: 0, spending: 0, total: 0 });

// balances may arrive as strings; junk must not turn a total into NaN
{
  const s = summariseBalances([a("CURRENT", "250.50"), a("SPENDING", "9.50")]);
  assert.equal(s.netWorth, 260);
  assert.equal(s.spending, 9.5);
}
{
  const s = summariseBalances([a("CURRENT", 100), a("CURRENT", undefined), a("SAVINGS", "oops")]);
  assert.equal(s.netWorth, 100, "unparseable balances are skipped, not NaN");
  assert.equal(Number.isNaN(s.total), false);
}

// negative balances (overdrawn) still count
assert.equal(summariseBalances([a("CURRENT", -40), a("SAVINGS", 100)]).netWorth, 60);

// unknown types still count — net worth is remaining money on every account
{
  const s = summariseBalances([a("CURRENT", 100), a("CRYPTO", 999)]);
  assert.equal(s.netWorth, 1099);
  assert.equal(s.spending, 0);
}

assert.equal(isSpendingAccount(a("SPENDING", 0)), true);
assert.equal(isSpendingAccount(a("CURRENT", 0)), false);
assert.equal(isSpendingAccount(undefined), false);

console.log("accounts: all assertions passed");
