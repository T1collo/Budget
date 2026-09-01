import { getUserAccounts, getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { getCategoryBudgets } from "@/actions/category-budget";
import { AccountCard } from "./_components/AccountCard";
import CreateAccount from "@/components/CreateAccount";
import { BudgetProgress } from "./_components/budget-progress";
import { CategoryBudgets } from "./_components/category-budgets";
import { NetWorthSummary } from "./_components/net-worth-summary";
import { DashboardOverview } from "./_components/transaction-overview";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  // Two waves, not a chain. Only getCurrentBudget genuinely depends on knowing
  // the default account, so everything else joins the same parallel batch.
  // Previously this was a Promise.all followed by a serial await, which cost
  // three extra ~190ms round trips to Neon on every render.
  const accounts = await getUserAccounts();
  const defaultAccount = accounts?.find((account) => account.isDefault);

  const [transactions, categoryBudgets, budgetData] = await Promise.all([
    getDashboardData(),
    getCategoryBudgets(),
    defaultAccount ? getCurrentBudget(defaultAccount.id) : null,
  ]);

  return (
    <div className="space-y-6">
      <NetWorthSummary accounts={accounts || []} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <BudgetProgress
          initialBudget={budgetData?.budget}
          currentExpenses={budgetData?.currentExpenses || 0}
        />
        <CategoryBudgets budgets={categoryBudgets} />
      </div>

      <DashboardOverview accounts={accounts} transactions={transactions || []} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Accounts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CreateAccount>
            <Card className="hover:border-primary/50 h-full cursor-pointer border-dashed transition-colors">
              <CardContent className="text-muted-foreground flex h-full flex-col items-center justify-center py-8">
                <Plus className="mb-2 size-8" />
                <p className="text-sm font-medium">Add New Account</p>
              </CardContent>
            </Card>
          </CreateAccount>

          {accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </section>
    </div>
  );
}
