import { GoogleGenerativeAI } from "@google/generative-ai";
import { inngest } from "./client";
import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { defaultCategories } from "@/data/categories";
import { formatMoney } from "@/lib/currency";

const CATEGORY_NAMES = Object.fromEntries(
  defaultCategories.map((c) => [c.id, c.name])
);

function lastMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Ask Gemini for spending advice. Falls back to deterministic suggestions when
 * there is no API key or the call fails - the report still goes out.
 */
async function buildInsights(summary, currencyCode) {
  const fallback = summary.categories
    .filter((c) => c.budget && c.spent > c.budget)
    .slice(0, 3)
    .map(
      (c) =>
        `${c.name} came in ${Math.round(
          ((c.spent - c.budget) / c.budget) * 100
        )}% over its budget (${formatMoney(c.spent, currencyCode)} against ${formatMoney(
          c.budget,
          currencyCode
        )}). Consider raising the budget or trimming this category.`
    );

  if (!process.env.GEMINI_API_KEY) return fallback;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a personal finance coach. Given this month's data, give 3 short, specific, actionable suggestions for budgeting better next month. Refer to actual categories and numbers. No preamble.

Currency: ${currencyCode}
Income: ${summary.totalIncome.toFixed(2)}
Spent: ${summary.totalSpent.toFixed(2)}
By category (spent / budget, "none" means no budget set):
${summary.categories
  .map((c) => `- ${c.name}: ${c.spent.toFixed(2)} / ${c.budget ? c.budget.toFixed(2) : "none"}`)
  .join("\n")}

Return ONLY a JSON array of 3 strings, no markdown fences.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```(?:json)?/g, "").trim();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.slice(0, 3).map(String) : fallback;
  } catch (error) {
    console.error("Gemini insight generation failed, using fallback:", error);
    return fallback;
  }
}

/**
 * Monthly performance report with budgeting recommendations, on the 1st at 09:00.
 * Replaces the old 6-hourly alert job, which called sendEmail({}) with every
 * argument commented out - it sent nothing and then marked lastAlertSent.
 */
export const generateMonthlyReport = inngest.createFunction(
  { id: "generate-monthly-report", name: "Generate Monthly Report" },
  { cron: "0 9 1 * *" },
  async ({ step }) => {
    const users = await step.run("fetch-users", () =>
      db.user.findMany({
        select: { id: true, email: true, name: true, currency: true },
      })
    );

    const { start, end } = lastMonthRange();
    const month = start.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    for (const user of users) {
      const summary = await step.run(`summarise-${user.id}`, async () => {
        const [byCategory, totals, budgets] = await Promise.all([
          db.transaction.groupBy({
            by: ["category"],
            where: { userId: user.id, type: "EXPENSE", date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
          db.transaction.groupBy({
            by: ["type"],
            where: { userId: user.id, date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
          db.categoryBudget.findMany({ where: { userId: user.id } }),
        ]);

        const budgetByCategory = Object.fromEntries(
          budgets.map((b) => [b.category, b.amount.toNumber()])
        );
        const totalOf = (type) =>
          totals.find((t) => t.type === type)?._sum.amount?.toNumber() ?? 0;

        return {
          totalSpent: totalOf("EXPENSE"),
          totalIncome: totalOf("INCOME"),
          categories: byCategory
            .map((row) => {
              const spent = row._sum.amount?.toNumber() ?? 0;
              const budget = budgetByCategory[row.category] ?? null;
              return {
                name: CATEGORY_NAMES[row.category] ?? row.category,
                spent,
                budget,
                overBudget: budget != null && spent > budget,
              };
            })
            .sort((a, b) => b.spent - a.spent),
        };
      });

      // Nothing happened last month, so there is nothing worth emailing about.
      if (summary.categories.length === 0 && summary.totalIncome === 0) continue;

      const insights = await step.run(`insights-${user.id}`, () =>
        buildInsights(summary, user.currency)
      );

      await step.run(`email-${user.id}`, () =>
        sendEmail({
          to: user.email,
          subject: `Your ${month} BudgetIQ report`,
          react: EmailTemplate({
            userName: user.name || "there",
            type: "monthly-report",
            data: { month, ...summary, insights, currency: user.currency },
          }),
        })
      );
    }

    return { users: users.length, month };
  }
);
