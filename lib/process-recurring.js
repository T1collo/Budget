import { endOfDay, format } from "date-fns";
import { db } from "@/lib/prisma";
import { calculateNextRecurringDate } from "@/lib/recurring";

/** Cap catch-up so a stuck daily template cannot flood the ledger. */
const MAX_OCCURRENCES_PER_TEMPLATE = 90;

function occurrenceExternalId(templateId, occurrenceDate) {
  return `recurring:${templateId}:${format(occurrenceDate, "yyyy-MM-dd")}`;
}

/**
 * Post every due occurrence for one recurring template (including catch-up),
 * update the account balance, and advance nextRecurringDate.
 */
export async function processRecurringTemplate(template, now = new Date()) {
  const cutoff = endOfDay(now);
  let posted = 0;
  let cursor = template.nextRecurringDate
    ? new Date(template.nextRecurringDate)
    : null;

  if (!cursor || !template.recurringInterval) {
    return { posted: 0, templateId: template.id };
  }

  for (let i = 0; i < MAX_OCCURRENCES_PER_TEMPLATE; i++) {
    if (cursor > cutoff) break;

    const occurrenceDate = new Date(cursor);
    const next = calculateNextRecurringDate(
      occurrenceDate,
      template.recurringInterval,
      template.weekdays
    );
    if (!next) break;

    const externalId = occurrenceExternalId(template.id, occurrenceDate);
    const balanceDelta =
      template.type === "EXPENSE"
        ? -template.amount.toNumber()
        : template.amount.toNumber();

    await db.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: {
          userId_externalId: {
            userId: template.userId,
            externalId,
          },
        },
      });

      if (!existing) {
        await tx.transaction.create({
          data: {
            type: template.type,
            amount: template.amount,
            description: template.description,
            date: occurrenceDate,
            category: template.category,
            status: "COMPLETED",
            isRecurring: false,
            externalId,
            userId: template.userId,
            accountId: template.accountId,
          },
        });

        await tx.account.update({
          where: { id: template.accountId },
          data: { balance: { increment: balanceDelta } },
        });
      }

      await tx.transaction.update({
        where: { id: template.id },
        data: {
          nextRecurringDate: next,
          lastProcessed: now,
        },
      });
    });

    posted += 1;
    cursor = next;
  }

  return { posted, templateId: template.id, accountId: template.accountId };
}

/**
 * Find every recurring template that is due on or before today and post
 * catch-up occurrences. Safe to run repeatedly (idempotent per day).
 */
export async function processDueRecurringTransactions(now = new Date()) {
  const cutoff = endOfDay(now);

  const due = await db.transaction.findMany({
    where: {
      isRecurring: true,
      nextRecurringDate: { lte: cutoff },
      recurringInterval: { not: null },
    },
  });

  const results = [];
  for (const template of due) {
    results.push(await processRecurringTemplate(template, now));
  }

  const posted = results.reduce((sum, r) => sum + r.posted, 0);
  return { templates: due.length, posted, results };
}
