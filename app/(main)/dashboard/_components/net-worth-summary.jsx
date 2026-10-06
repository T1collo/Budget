"use client";

import { PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/components/currency-provider";
import { summariseBalances } from "@/lib/accounts";

/**
 * Remaining money across every account: starting balances plus later txs.
 */
export function NetWorthSummary({ accounts }) {
  const { format: currency } = useCurrency();
  const { netWorth } = summariseBalances(accounts);

  return (
    <Card>
      <CardContent className="py-5">
        <div className="min-w-0">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <PiggyBank className="size-3.5" />
            Net worth
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {currency(netWorth)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Total remaining across all accounts
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
