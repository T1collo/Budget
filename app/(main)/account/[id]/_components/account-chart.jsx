"use client";

import { useState, useMemo } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/components/currency-provider";

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

export function AccountChart({ transactions }) {
  const { format: currency, symbol } = useCurrency();
  const [dateRange, setDateRange] = useState("1M");

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    // Filter transactions within date range
    const filtered = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    // Group transactions by date
    const grouped = filtered.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), "MMM dd");
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.type === "INCOME") {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc;
    }, {});

    // Convert to array and sort by date
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [transactions, dateRange]);

  // Calculate totals for the selected period
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-base font-normal">
          Transaction Overview
        </CardTitle>
        <Select defaultValue={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around mb-6 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Total Income</p>
            <p className="text-ok text-lg font-semibold tabular-nums">
              {currency(totals.income)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Total Expenses</p>
            <p className="text-over text-lg font-semibold tabular-nums">
              {currency(totals.expense)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Net</p>
            <p
              className={`text-lg font-semibold tabular-nums ${
                totals.income - totals.expense >= 0 ? "text-ok" : "text-over"
              }`}
            >
              {currency(totals.income - totals.expense)}
            </p>
          </div>
        </div>
        <div className="h-[240px] sm:h-[300px]">
          <BarChart
            data={filteredData}
            xDataKey="date"
            aspectRatio="16 / 9"
            className="h-full w-full"
            margin={{ top: 16, right: 8, bottom: 28, left: 48 }}
          >
            <Grid horizontal />
            <Bar dataKey="income" fill="var(--ok)" lineCap="round" />
            <Bar dataKey="expense" fill="var(--over)" lineCap="round" />
            <BarXAxis />
            <BarYAxis tickFormatter={(value) => `${symbol}${value}`} />
            <ChartTooltip />
          </BarChart>
        </div>

        {/* BarChart has no built-in legend, so the series are named here. */}
        <div className="text-muted-foreground mt-3 flex items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="bg-ok size-2.5 rounded-full"
            />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="bg-over size-2.5 rounded-full"
            />
            Expense
          </span>
        </div>
      </CardContent>
    </Card>
  );
}