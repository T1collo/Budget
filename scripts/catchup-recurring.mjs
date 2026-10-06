/**
 * One-shot catch-up for due recurring templates.
 * Run: node --import tsx scripts/catchup-recurring.mjs
 * (or: npx tsx scripts/catchup-recurring.mjs)
 */
import { config } from "dotenv";
config();

import { endOfDay, format } from "date-fns";
import { PrismaClient } from "../lib/generated/prisma/index.js";
import { calculateNextRecurringDate } from "../lib/recurring.js";

const db = new PrismaClient();
const MAX = 90;

function occurrenceExternalId(templateId, occurrenceDate) {
  return `recurring:${templateId}:${format(occurrenceDate, "yyyy-MM-dd")}`;
}

async function processTemplate(template, now) {
  const cutoff = endOfDay(now);
  let posted = 0;
  let cursor = template.nextRecurringDate
    ? new Date(template.nextRecurringDate)
    : null;
  if (!cursor || !template.recurringInterval) {
    return { posted: 0, templateId: template.id };
  }

  for (let i = 0; i < MAX; i++) {
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
        ? -Number(template.amount)
        : Number(template.amount);

    await db.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: {
          userId_externalId: { userId: template.userId, externalId },
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
        data: { nextRecurringDate: next, lastProcessed: now },
      });
    });

    posted += 1;
    cursor = next;
  }

  return { posted, templateId: template.id, accountId: template.accountId };
}

const now = new Date();
const due = await db.transaction.findMany({
  where: {
    isRecurring: true,
    nextRecurringDate: { lte: endOfDay(now) },
    recurringInterval: { not: null },
  },
});

const results = [];
for (const template of due) {
  results.push(await processTemplate(template, now));
}

const posted = results.reduce((s, r) => s + r.posted, 0);
console.log(JSON.stringify({ templates: due.length, posted, results }, null, 2));

const rows = await db.transaction.findMany({
  where: { externalId: { startsWith: "recurring:" } },
  orderBy: { date: "desc" },
  select: {
    description: true,
    date: true,
    amount: true,
    externalId: true,
    account: { select: { name: true, balance: true } },
  },
});
console.log(
  "posted rows",
  JSON.stringify(
    rows.map((t) => ({
      description: t.description,
      date: t.date,
      amount: Number(t.amount),
      account: t.account.name,
      balance: Number(t.account.balance),
      externalId: t.externalId,
    })),
    null,
    2
  )
);

await db.$disconnect();
