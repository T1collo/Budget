// Pure helpers - no db, no server-only imports, so they stay unit-testable.

/** Every funded account type counts toward net worth. */
export const NET_WORTH_TYPES = ["CURRENT", "SAVINGS", "SPENDING"];

export const ACCOUNT_TYPE_LABELS = {
  CURRENT: "Current",
  SAVINGS: "Savings",
  SPENDING: "Spending",
};

export function isSpendingAccount(account) {
  return account?.type === "SPENDING";
}

/**
 * Net worth is the sum of every account balance (starting balance ± transactions).
 *
 * Balances arrive as numbers from the serialised action, but can be strings or
 * Prisma Decimals depending on the caller, so every value is coerced once here
 * rather than at each call site.
 */
export function summariseBalances(accounts = []) {
  let netWorth = 0;
  let spending = 0;

  for (const account of accounts ?? []) {
    const balance = Number(account?.balance);
    if (!Number.isFinite(balance)) continue;

    netWorth += balance;
    if (isSpendingAccount(account)) {
      spending += balance;
    }
  }

  return { netWorth, spending, total: netWorth };
}
