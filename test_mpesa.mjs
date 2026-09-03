// Run: node test_mpesa.mjs
import assert from "node:assert/strict";
import { parseMpesaSms } from "./lib/mpesa.js";

const one = (body) => {
  const rows = parseMpesaSms(body);
  assert.ok(rows.length >= 1, `no rows parsed from: ${body.slice(0, 40)}`);
  return rows[0];
};

// --- received ---
const recv = one(
  "TFG5H2K9L1 Confirmed.You have received Ksh1,000.00 from JOHN DOE 254712345678 on 1/9/26 at 10:30 AM New M-PESA balance is Ksh5,000.00."
);
assert.equal(recv.type, "INCOME");
assert.equal(recv.amount, 1000);
assert.equal(recv.externalId, "TFG5H2K9L1");
assert.equal(recv.description, "From JOHN DOE");
assert.equal(recv.category, "other-income");

// --- send money, with fee split out ---
const sent = parseMpesaSms(
  "TFG5H2K9L2 Confirmed. Ksh1,000.00 sent to JANE DOE 254712345678 on 1/9/26 at 10:30 AM. New M-PESA balance is Ksh4,000.00. Transaction cost, Ksh13.00."
);
assert.equal(sent.length, 2);
assert.equal(sent[0].type, "EXPENSE");
assert.equal(sent[0].amount, 1000);
assert.equal(sent[0].description, "Sent to JANE DOE");
assert.equal(sent[1].amount, 13);
assert.equal(sent[1].externalId, "TFG5H2K9L2-FEE");
// the fee must never collide with its parent transaction
assert.notEqual(sent[0].externalId, sent[1].externalId);

// --- paybill keeps the account number, and lands in bills ---
const bill = one(
  "TFG5H2K9L3 Confirmed. Ksh2,500.00 sent to KPLC PREPAID for account 12345678 on 1/9/26 at 8:05 PM New M-PESA balance is Ksh1,500.00. Transaction cost, Ksh0.00."
);
assert.equal(bill.category, "bills");
assert.equal(bill.description, "KPLC PREPAID (12345678)");
// a zero fee must not create a phantom second row
assert.equal(parseMpesaSms(
  "TFG5H2K9L3 Confirmed. Ksh2,500.00 sent to KPLC PREPAID for account 12345678 on 1/9/26 at 8:05 PM New M-PESA balance is Ksh1,500.00. Transaction cost, Ksh0.00."
).length, 1);

// --- buy goods ---
const till = one(
  "TFG5H2K9L4 Confirmed. Ksh500.00 paid to NAIVAS SUPERMARKET. on 1/9/26 at 1:15 PM.New M-PESA balance is Ksh3,500.00. Transaction cost, Ksh0.00."
);
assert.equal(till.category, "shopping");
assert.equal(till.description, "NAIVAS SUPERMARKET");

// --- withdrawal ---
const wd = one(
  "TFG5H2K9L5 Confirmed.on 1/9/26 at 10:30 AM Withdraw Ksh1,000.00 from 123456 - AGENT SHOP New M-PESA balance is Ksh2,500.00. Transaction cost, Ksh28.00"
);
assert.equal(wd.type, "EXPENSE");
assert.equal(wd.amount, 1000);

// --- airtime ---
assert.equal(one("TFG5H2K9L6 Confirmed.You bought Ksh100.00 of airtime on 1/9/26 at 9:00 AM.New M-PESA balance is Ksh2,400.00.").category, "utilities");

// --- dates: D/M/YY read as EAT (UTC+3), not M/D ---
// 1/9/26 10:30 AM EAT == 2026-09-01T07:30Z
assert.equal(recv.date.toISOString(), "2026-09-01T07:30:00.000Z");
assert.equal(bill.date.toISOString(), "2026-09-01T17:05:00.000Z"); // 8:05 PM EAT
// midday/midnight must not wrap: 12:30 PM is 12:30, not 00:30
const noon = one("TFG5H2K9L7 Confirmed. Ksh10.00 paid to SHOP. on 2/10/26 at 12:30 PM.New M-PESA balance is Ksh1.00.");
assert.equal(noon.date.toISOString(), "2026-10-02T09:30:00.000Z");

// --- things we must NOT import ---
// balance enquiry: no money moved
assert.deepEqual(parseMpesaSms("TFG5H2K9L8 Confirmed.Your M-PESA balance was Ksh5,000.00 on 1/9/26 at 10:30 AM."), []);
// marketing with no receipt code, so no idempotency key
assert.deepEqual(parseMpesaSms("Dear customer, buy Ksh100.00 of airtime and win!"), []);
// not a confirmation
assert.deepEqual(parseMpesaSms("TFG5H2K9L9 Failed. Ksh100.00 sent to JOHN on 1/9/26 at 10:30 AM."), []);
// junk in, empty out (never throws)
assert.deepEqual(parseMpesaSms(""), []);
assert.deepEqual(parseMpesaSms(null), []);
assert.deepEqual(parseMpesaSms(undefined), []);
assert.deepEqual(parseMpesaSms(12345), []);

// --- same message parsed twice yields the same key (the dedupe contract) ---
const a = one("TFG5H2K9LA Confirmed. Ksh50.00 paid to DUKA. on 1/9/26 at 7:00 AM.New M-PESA balance is Ksh10.00.");
const b = one("TFG5H2K9LA Confirmed. Ksh50.00 paid to DUKA. on 1/9/26 at 7:00 AM.New M-PESA balance is Ksh10.00.");
assert.equal(a.externalId, b.externalId);

console.log("mpesa parser: all assertions passed");
