import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  generateMonthlyReport,
  processRecurringTransactions,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateMonthlyReport, processRecurringTransactions],
});
