/**
 * Parse M-Pesa confirmation SMS into transaction rows.
 *
 * Pure and side-effect free so it can be unit tested against real message text
 * without a database. The receipt code (the 10-character token every M-Pesa
 * message opens with) is the natural idempotency key: Android redelivers
 * broadcasts, users reinstall, and a re-scan of the inbox re-reads messages we
 * have already imported. Without a stable key every re-sync would double-post
 * and silently corrupt account balances.
 */

const AMOUNT = String.raw`Ksh\s?([\d,]+(?:\.\d{1,2})?)`;
const num = (s) => Number(s.replace(/,/g, ""));

/** M-Pesa writes dates as D/M/YY and times as "10:30 AM", in EAT (UTC+3). */
function parseDate(body, fallback) {
  const m = body.match(/on (\d{1,2})\/(\d{1,2})\/(\d{2,4}) at (\d{1,2}):(\d{2}) ?([AP]M)/i);
  if (!m) return fallback;

  const [, d, mo, y, hh, mm, ap] = m;
  let hour = Number(hh) % 12;
  if (ap.toUpperCase() === "PM") hour += 12;
  const year = Number(y) < 100 ? 2000 + Number(y) : Number(y);

  // Built as a UTC instant with EAT's +3 offset removed, so the stored time is
  // correct regardless of the server's timezone.
  const date = new Date(Date.UTC(year, Number(mo) - 1, Number(d), hour - 3, Number(mm)));
  return isNaN(date) ? fallback : date;
}

// Ordered most-specific first: "sent to X for account Y" must beat plain "sent to".
const RULES = [
  {
    // Paybill: "Ksh1,000.00 sent to KPLC for account 12345 on 1/9/26"
    re: new RegExp(AMOUNT + String.raw` sent to (.+?) for account (.+?) on `, "i"),
    build: (m) => ({ type: "EXPENSE", amount: num(m[1]), description: `${m[2].trim()} (${m[3].trim()})`, category: "bills" }),
  },
  {
    // Send money: "Ksh1,000.00 sent to JOHN DOE 254712345678 on 1/9/26"
    re: new RegExp(AMOUNT + String.raw` sent to (.+?)(?: 2547\d{8}| 07\d{8})? on `, "i"),
    build: (m) => ({ type: "EXPENSE", amount: num(m[1]), description: `Sent to ${m[2].trim()}`, category: "other-expense" }),
  },
  {
    // Buy goods / till: "Ksh500.00 paid to NAIVAS. on 1/9/26"
    re: new RegExp(AMOUNT + String.raw` paid to (.+?)\.? ?on `, "i"),
    build: (m) => ({ type: "EXPENSE", amount: num(m[1]), description: m[2].trim(), category: "shopping" }),
  },
  {
    // Received: "You have received Ksh1,000.00 from JOHN DOE 254712345678 on"
    re: new RegExp(String.raw`received ` + AMOUNT + String.raw` from (.+?)(?: 2547\d{8}| 07\d{8})? on `, "i"),
    build: (m) => ({ type: "INCOME", amount: num(m[1]), description: `From ${m[2].trim()}`, category: "other-income" }),
  },
  {
    // Withdrawal: "Withdraw Ksh1,000.00 from 123456 - AGENT NAME New M-PESA"
    re: new RegExp(String.raw`Withdraw ` + AMOUNT + String.raw` from (.+?) New M-PESA`, "i"),
    build: (m) => ({ type: "EXPENSE", amount: num(m[1]), description: `Withdrawal ${m[2].trim()}`, category: "other-expense" }),
  },
  {
    // Airtime: "You bought Ksh100.00 of airtime"
    re: new RegExp(String.raw`bought ` + AMOUNT + String.raw` of airtime`, "i"),
    build: (m) => ({ type: "EXPENSE", amount: num(m[1]), description: "Airtime", category: "utilities" }),
  },
];

const FEE = new RegExp(String.raw`Transaction cost,? ?` + AMOUNT, "i");

/**
 * @param {string} body    raw SMS text
 * @param {Date}   [received]  when the handset got it; used only if the message
 *                             carries no parsable date of its own
 * @returns {Array} zero, one, or two rows (the second being the M-Pesa fee)
 */
export function parseMpesaSms(body, received = new Date()) {
  if (!body || typeof body !== "string") return [];

  // Every confirmation opens with the receipt code. No code, no idempotency
  // key, so we refuse it rather than import something we cannot de-duplicate.
  const code = body.trim().match(/^([A-Z0-9]{10})\b/);
  if (!code) return [];
  if (!/confirmed/i.test(body)) return [];

  for (const { re, build } of RULES) {
    const m = body.match(re);
    if (!m) continue;

    const date = parseDate(body, received);
    const row = { externalId: code[1], date, ...build(m) };
    if (!(row.amount > 0)) return [];

    const rows = [row];

    // The fee is a real, separately-categorisable expense, and folding it into
    // the transfer would make the description lie about the amount sent.
    const fee = body.match(FEE);
    if (fee && num(fee[1]) > 0) {
      rows.push({
        externalId: `${code[1]}-FEE`,
        type: "EXPENSE",
        amount: num(fee[1]),
        description: "M-Pesa transaction cost",
        category: "other-expense",
        date,
      });
    }
    return rows;
  }

  return []; // balance alerts, reversals, promos: nothing to import
}
