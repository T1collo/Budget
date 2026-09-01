"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultCategories } from "@/data/categories";
import {
  upsertCategoryBudget,
  deleteCategoryBudget,
} from "@/actions/category-budget";
import { useCurrency } from "@/components/currency-provider";

const EXPENSE_CATEGORIES = defaultCategories.filter((c) => c.type === "EXPENSE");
const CATEGORY_BY_ID = Object.fromEntries(
  defaultCategories.map((c) => [c.id, c])
);

/** Status drives both the bar colour and the label, from one place. */
function statusOf(percentUsed) {
  if (percentUsed >= 100) return { tone: "over", label: "Over budget" };
  if (percentUsed >= 80) return { tone: "warn", label: "Close to limit" };
  return { tone: "ok", label: "On track" };
}

const TONE_BAR = {
  ok: "bg-ok",
  warn: "bg-warn",
  over: "bg-over",
};
const TONE_TEXT = {
  ok: "text-ok",
  warn: "text-warn",
  over: "text-over",
};

function optimisticReducer(state, action) {
  switch (action.type) {
    case "upsert": {
      const existing = state.find((b) => b.category === action.category);
      const next = {
        id: existing?.id ?? `optimistic-${action.category}`,
        category: action.category,
        amount: action.amount,
        spent: existing?.spent ?? 0,
        percentUsed:
          action.amount > 0
            ? ((existing?.spent ?? 0) / action.amount) * 100
            : 0,
        pending: true,
      };
      return existing
        ? state.map((b) => (b.category === action.category ? next : b))
        : [...state, next].sort((a, b) => a.category.localeCompare(b.category));
    }
    case "remove":
      return state.filter((b) => b.category !== action.category);
    default:
      return state;
  }
}

export function CategoryBudgets({ budgets }) {
  const { format: currency } = useCurrency();
  const [optimisticBudgets, applyOptimistic] = useOptimistic(
    budgets,
    optimisticReducer
  );
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(null); // category id being edited
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const reduceMotion = useReducedMotion();

  const unbudgeted = useMemo(() => {
    const taken = new Set(optimisticBudgets.map((b) => b.category));
    return EXPENSE_CATEGORIES.filter((c) => !taken.has(c.id));
  }, [optimisticBudgets]);

  // Update the UI immediately, then reconcile with the server. On failure the
  // optimistic entry is dropped when the transition settles and we surface why.
  const save = (category, amount) => {
    startTransition(async () => {
      applyOptimistic({ type: "upsert", category, amount });
      const res = await upsertCategoryBudget(category, amount);
      if (res?.success) {
        toast.success(`${CATEGORY_BY_ID[category]?.name ?? category} budget set`);
      } else {
        toast.error(res?.error || "Could not save that budget");
      }
    });
  };

  const remove = (category) => {
    startTransition(async () => {
      applyOptimistic({ type: "remove", category });
      const res = await deleteCategoryBudget(category);
      if (!res?.success) toast.error(res?.error || "Could not remove that budget");
    });
  };

  const commitEdit = (category) => {
    const amount = parseFloat(draft);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    setEditing(null);
    save(category, amount);
  };

  const commitAdd = () => {
    const amount = parseFloat(newAmount);
    if (!newCategory) {
      toast.error("Pick a category");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    save(newCategory, amount);
    setNewCategory("");
    setNewAmount("");
    setAdding(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Category budgets</CardTitle>
          <CardDescription>
            This month&apos;s spending against each category limit
          </CardDescription>
        </div>
        {!adding && unbudgeted.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        <AnimatePresence initial={false}>
          {adding && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-lg border p-3">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {unbudgeted.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="w-32"
                  placeholder="Amount"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitAdd()}
                />
                <Button size="sm" onClick={commitAdd}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAdding(false);
                    setNewCategory("");
                    setNewAmount("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {optimisticBudgets.length === 0 && !adding ? (
          <div className="text-muted-foreground py-6 text-center text-sm">
            <p>No category budgets yet.</p>
            <p className="mt-1">
              Set one to get an alert the moment a category runs hot.
            </p>
          </div>
        ) : (
          <ul className="space-y-5">
            <AnimatePresence initial={false}>
              {optimisticBudgets.map((budget) => {
                const category = CATEGORY_BY_ID[budget.category];
                const status = statusOf(budget.percentUsed);
                const isEditing = editing === budget.category;

                return (
                  <motion.li
                    key={budget.category}
                    layout={!reduceMotion}
                    initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: budget.pending ? 0.6 : 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: category?.color }}
                        />
                        <span className="truncate text-sm font-medium">
                          {category?.name ?? budget.category}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            autoFocus
                            className="h-8 w-28"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit(budget.category);
                              if (e.key === "Escape") setEditing(null);
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Save budget"
                            onClick={() => commitEdit(budget.category)}
                          >
                            <Check className="text-ok size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Cancel"
                            onClick={() => setEditing(null)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-sm tabular-nums">
                            {currency(budget.spent)} / {currency(budget.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Edit ${category?.name ?? budget.category} budget`}
                            onClick={() => {
                              setDraft(String(budget.amount));
                              setEditing(budget.category);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive size-8"
                            aria-label={`Remove ${category?.name ?? budget.category} budget`}
                            onClick={() => remove(budget.category)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <Progress
                      value={Math.min(budget.percentUsed, 100)}
                      indicatorClassName={TONE_BAR[status.tone]}
                    />

                    <div className="flex justify-between text-xs">
                      <span className={TONE_TEXT[status.tone]}>{status.label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {budget.percentUsed.toFixed(0)}% used
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
