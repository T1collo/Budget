"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DeleteAccount, updateDefaultAccount } from "@/actions/account";
import { isSpendingAccount } from "@/lib/accounts";
import { useCurrency } from "@/components/currency-provider";

export function AccountCard({ account }) {
  const { format: currency } = useCurrency();
  const { name, type, balance, id, isDefault, _count } = account;
  const [isDeleting, startDelete] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async () => {
    if (isDefault) {
      toast.warning("You need at least one default account");
      return;
    }
    await updateDefaultFn(id);
  };

  const handleDelete = () => {
    startDelete(async () => {
      const res = await DeleteAccount(id);
      if (res?.success) {
        // No router.refresh(): DeleteAccount already calls revalidatePath,
        // which refreshes this route. Doing both rendered the page twice.
        toast.success(`${name} deleted`);
      } else {
        toast.error(res?.error || "Failed to delete account");
        setConfirming(false);
      }
    });
  };

  useEffect(() => {
    if (updatedAccount?.success) toast.success("Default account updated");
  }, [updatedAccount]);

  useEffect(() => {
    if (error) toast.error(error.message || "Failed to update default account");
  }, [error]);

  return (
    <Card className="group relative flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          {/* Only the title links out. The switch and delete button used to sit
              inside the <Link>, which nests controls inside an anchor. */}
          <Link
            href={`/account/${id}`}
            className="focus-visible:ring-ring min-w-0 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <h3 className="truncate font-medium capitalize">{name}</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {type.charAt(0) + type.slice(1).toLowerCase()} account
            </p>
          </Link>

          {isDefault && (
            <span className="text-primary bg-primary/10 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
              <Star className="size-3 fill-current" />
              Default
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <Link href={`/account/${id}`} className="block" tabIndex={-1}>
          <div className="text-2xl font-semibold tabular-nums">
            {currency(balance)}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {_count?.transactions ?? 0} transaction
            {_count?.transactions === 1 ? "" : "s"}
            {isSpendingAccount(account) && " · not in net worth"}
          </p>
        </Link>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="flex items-center gap-2">
          <Switch
            id={`default-${id}`}
            checked={isDefault}
            onCheckedChange={handleDefaultChange}
            disabled={updateDefaultLoading || isDefault}
          />
          <Label
            htmlFor={`default-${id}`}
            className="text-muted-foreground cursor-pointer text-xs"
          >
            Default
          </Label>
        </div>

        <div className="flex items-center gap-1">
          {confirming ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/account/${id}`}>
                  Open
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              {/* Deleting an account cascades to its transactions, so it asks
                  first rather than firing on a single click. */}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-9"
                aria-label={`Delete ${name}`}
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
