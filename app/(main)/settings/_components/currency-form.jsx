"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CURRENCIES, formatMoney } from "@/lib/currency";
import { updateCurrency } from "@/actions/settings";

export function CurrencyForm({ currency }) {
  const [optimisticCurrency, setOptimisticCurrency] = useOptimistic(currency);
  const [isPending, startTransition] = useTransition();

  const onChange = (code) => {
    startTransition(async () => {
      setOptimisticCurrency(code);
      const res = await updateCurrency(code);
      if (res?.success) {
        toast.success(`Currency set to ${code}`);
      } else {
        toast.error(res?.error || "Could not change currency");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Currency</CardTitle>
        <CardDescription>
          Used to display every amount across BudgetIQ. Existing amounts are
          not converted, only relabelled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label htmlFor="currency">Display currency</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={optimisticCurrency}
            onValueChange={onChange}
            disabled={isPending}
          >
            <SelectTrigger id="currency" className="h-11 w-full sm:h-10 sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(({ code, label }) => (
                <SelectItem key={code} value={code}>
                  <span className="font-medium">{code}</span>
                  <span className="text-muted-foreground ml-2">{label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            {!isPending && <Check className="text-ok size-4" />}
            Preview: {formatMoney(1234.5, optimisticCurrency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
