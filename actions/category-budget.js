"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { defaultCategories } from "@/data/categories";
import { monthRange } from "@/lib/budget-utils";
import { getCategorySpend } from "@/lib/budget-queries";
import { requireUser } from "@/lib/auth-user";

const EXPENSE_CATEGORY_IDS = new Set(
  defaultCategories.filter((c) => c.type === "EXPENSE").map((c) => c.id)
);

// Every action in here resolves the user from the session. Nothing accepts a
// userId from the client, and every query is scoped by the resolved id.
/** Budgets joined with this month's spend, one row per budgeted category. */
export async function getCategoryBudgets() {
  const user = await requireUser();

  const [budgets, spendByCategory] = await Promise.all([
    db.categoryBudget.findMany({
      where: { userId: user.id },
      orderBy: { category: "asc" },
    }),
    getCategorySpend(user.id, monthRange()),
  ]);

  return budgets.map((b) => {
    const amount = b.amount.toNumber();
    const spent = spendByCategory[b.category] ?? 0;
    return {
      id: b.id,
      category: b.category,
      amount,
      spent,
      percentUsed: amount > 0 ? (spent / amount) * 100 : 0,
    };
  });
}

export async function upsertCategoryBudget(category, amount) {
  try {
    const user = await requireUser();

    if (!EXPENSE_CATEGORY_IDS.has(category)) {
      throw new Error("Unknown category");
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Budget must be greater than zero");
    }

    const budget = await db.categoryBudget.upsert({
      where: { userId_category: { userId: user.id, category } },
      update: { amount: value },
      create: { userId: user.id, category, amount: value },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategoryBudget(category) {
  try {
    const user = await requireUser();

    // Scoped by userId, so this cannot delete another user's budget even if
    // the category string is guessed.
    await db.categoryBudget.deleteMany({ where: { userId: user.id, category } });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
