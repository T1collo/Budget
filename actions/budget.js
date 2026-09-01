"use server";

import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-user";
import { monthRange } from "@/lib/budget-utils";

export async function getCurrentBudget(accountId) {
  try {
    const user = await requireUser();

    const { start: startOfMonth, end: endOfMonth } = monthRange();

    // These two are independent: running them serially cost an extra ~190ms
    // round trip to Neon on every dashboard render.
    const [budget, expenses] = await Promise.all([
      db.budget.findFirst({ where: { userId: user.id } }),
      db.transaction.aggregate({
        where: {
          userId: user.id,
          type: "EXPENSE",
          date: { gte: startOfMonth, lte: endOfMonth },
          accountId,
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

export async function updateBudget(amount) {
  try {
    const user = await requireUser();
    // Update or create budget
    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount,
      },
      create: {
        userId: user.id,
        amount,
      },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}