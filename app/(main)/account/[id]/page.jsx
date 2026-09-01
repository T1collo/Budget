import { Suspense } from "react";
import { getAccountWithTransactions } from "@/actions/account";
import { TransactionTable } from "./_components/transaction-table";
import { notFound } from "next/navigation";
import { AccountChart } from "./_components/account-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserSettings } from "@/actions/settings";
import { formatMoney } from "@/lib/currency";

function SectionSkeleton({ height = "h-64" }) {
  return (
    <div
      className={`bg-muted ${height} w-full animate-pulse rounded-lg`}
      aria-busy="true"
    />
  );
}

export default async function AccountPage({ params }) {
  // Next 15: params is a promise and must be awaited before use.
  const { id } = await params;
  const [accountData, { currency }] = await Promise.all([
    getAccountWithTransactions(id),
    getUserSettings(),
  ]);

  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="gradient-title truncate text-3xl font-semibold tracking-tight capitalize sm:text-4xl">
              {account.name}
            </h1>
            {account.isDefault && <Badge variant="secondary">Default</Badge>}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()} account
          </p>
        </div>

        <Card className="shrink-0">
          <CardContent className="px-5 py-3 text-right">
            <div className="text-2xl font-semibold tabular-nums">
              {formatMoney(account.balance, currency)}
            </div>
            <p className="text-muted-foreground text-xs">
              {account._count.transactions} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <AccountChart transactions={transactions} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="h-96" />}>
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}
