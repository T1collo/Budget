"use client";

import { Wallet, PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/components/currency-provider";
import { summariseBalances } from "@/lib/accounts";

/**
 * Splits money into what you own and what you have to spend.
 *
 * Spending accounts are shown beside net worth rather than inside it, so
 * day to day float does not read as savings.
 */
export function NetWorthSummary({ accounts }) {
  const { format: currency } = useCurrency();
  const { netWorth, spending } = summariseBalances(accounts);

  const hasSpendingAccount = accounts?.some((a) => a.type === "SPENDING");

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-x-10 gap-y-4 py-5">
        <div className="min-w-0">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <PiggyBank className="size-3.5" />
            Net worth
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {currency(netWorth)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Current and savings accounts
          </p>
        </div>

        {hasSpendingAccount && (
          <>
            <div aria-hidden="true" className="bg-border hidden h-12 w-px sm:block" />
            <div className="min-w-0">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Wallet className="size-3.5" />
                Available to spend
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {currency(spending)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Not counted in net worth
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
