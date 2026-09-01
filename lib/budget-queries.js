import { db } from "@/lib/prisma";

/**
 * Spend per category for a month, as one groupBy rather than a query per
 * category. Returns a plain { [categoryId]: number }.
 *
 * Deliberately NOT a server action: it takes a userId, so it must only ever be
 * called from code that already resolved that id from the session.
 */
export async function getCategorySpend(userId, { start, end }, accountId) {
  const rows = await db.transaction.groupBy({
    by: ["category"],
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: start, lte: end },
      ...(accountId ? { accountId } : {}),
    },
    _sum: { amount: true },
  });

  return Object.fromEntries(
    rows.map((r) => [r.category, r._sum.amount?.toNumber() ?? 0])
  );
}
