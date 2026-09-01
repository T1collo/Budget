"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget } from "@/actions/budget";
import { useCurrency } from "@/components/currency-provider";

export function BudgetProgress({ initialBudget, currentExpenses }) {
  const { format: currency } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const percentUsed = initialBudget?.amount
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;

  const tone =
    percentUsed >= 100 ? "over" : percentUsed >= 80 ? "warn" : "ok";
  const barClass = { ok: "bg-ok", warn: "bg-warn", over: "bg-over" }[tone];

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }

    await updateBudgetFn(amount);
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Overall cap updated");
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  return (
    <Card>
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">Overall monthly cap</CardTitle>
            <CardDescription className="mt-1">
              {initialBudget
                ? `${currency(currentExpenses)} of ${currency(
                    initialBudget.amount
                  )} spent on your default account`
                : "Optional ceiling across all categories"}
            </CardDescription>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateBudget();
                  if (e.key === "Escape") handleCancel();
                }}
                className="h-8 w-28"
                placeholder="Amount"
                autoFocus
                disabled={isLoading}
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Save cap"
                onClick={handleUpdateBudget}
                disabled={isLoading}
              >
                <Check className="text-ok size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Cancel"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Edit overall cap"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {initialBudget ? (
          <div className="space-y-2">
            {/* indicatorClassName, not className: the colour has to land on the
                bar, not the track behind it. */}
            <Progress
              value={Math.min(percentUsed, 100)}
              indicatorClassName={barClass}
            />
            <p className="text-muted-foreground text-right text-xs tabular-nums">
              {percentUsed.toFixed(0)}% used
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No cap set. Category budgets below work without one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
