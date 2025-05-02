"use client";

import { ArrowUpRight, ArrowDownRight, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { DeleteAccount, updateDefaultAccount } from "@/actions/account";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;
  const [selectedIds, setSelectedIds] = useState([]);

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault(); // Prevent navigation

    if (isDefault) {
      toast.warning("You need atleast 1 default account");
      return; // Don't allow toggling off the default account
    }

    await updateDefaultFn(id);
  };

  useEffect(() => {
    console.log(updatedAccount); 
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium capitalize">
            {name}
          </CardTitle>
          <Switch
            checked={isDefault}
            onClick={handleDefaultChange}
            disabled={updateDefaultLoading}
          />
          <Button
          className="cursor-pointer"
            size="sm"
            onClick={async (e) => {
              e.preventDefault(); // Prevents navigation due to wrapping <Link />
              const res = await DeleteAccount(id);
              if (res.success) {
                toast.success("Account deleted successfully");
                // Optionally: refresh the UI or route here if needed
              } else {
                toast.error(res.error || "Failed to delete account");
              }
            }}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete Account
          </Button>

        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${parseFloat(balance).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}