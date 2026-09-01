// Pure helpers - no db, no server-only imports, so they stay unit-testable.

/** Account types whose balances make up net worth. SPENDING is deliberately out. */
export const NET_WORTH_TYPES = ["CURRENT", "SAVINGS"];

export const ACCOUNT_TYPE_LABELS = {
  CURRENT: "Current",
  SAVINGS: "Savings",
  SPENDING: "Spending",
};

export function isSpendingAccount(account) {
  return account?.type === "SPENDING";
}

/**
 * Split account balances into net worth and day-to-day spending money.
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

    if (isSpendingAccount(account)) {
      spending += balance;
    } else if (NET_WORTH_TYPES.includes(account?.type)) {
      netWorth += balance;
    }
  }

  return { netWorth, spending, total: netWorth + spending };
}
