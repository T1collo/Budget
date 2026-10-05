/** Bit 0 is Sunday, matching Date#getDay(). Monday-first in the picker. */
export const WEEK_DAYS = [
  { index: 1, letter: "M", short: "Mon", name: "Monday" },
  { index: 2, letter: "T", short: "Tue", name: "Tuesday" },
  { index: 3, letter: "W", short: "Wed", name: "Wednesday" },
  { index: 4, letter: "T", short: "Thu", name: "Thursday" },
  { index: 5, letter: "F", short: "Fri", name: "Friday" },
  { index: 6, letter: "S", short: "Sat", name: "Saturday" },
  { index: 0, letter: "S", short: "Sun", name: "Sunday" },
];

export const WEEKDAY_MASK = (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5);
export const MON_SAT_MASK = WEEKDAY_MASK | (1 << 6);

const INTERVAL_LABELS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function dayBit(index) {
  return 1 << index;
}

export function selectedDayShorts(mask) {
  return WEEK_DAYS.filter((day) => mask & dayBit(day.index)).map(
    (day) => day.short
  );
}

/** Spoken schedule under the chips. Mon–Fri is "Every weekday". */
export function schedulePhrase(mask) {
  if (!mask) return "";
  if (mask === WEEKDAY_MASK) return "Every weekday";
  const days = selectedDayShorts(mask);
  return days.length ? `Every ${days.join(", ")}` : "";
}

/**
 * Ledger and export label. Mon–Fri is "Weekdays"; any other set lists the days.
 */
export function recurringLabel(interval, weekdays) {
  if (interval === "WEEKDAYS") {
    if (weekdays === WEEKDAY_MASK) return "Weekdays";
    const days = selectedDayShorts(weekdays ?? 0);
    return days.length ? days.join(", ") : "On selected days";
  }
  return INTERVAL_LABELS[interval] || "Recurring";
}

export function calculateNextRecurringDate(startDate, interval, weekdays) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      return date;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      return date;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      return date;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      return date;
    case "WEEKDAYS": {
      if (!weekdays) return null;
      for (let i = 0; i < 7; i++) {
        date.setDate(date.getDate() + 1);
        if (weekdays & dayBit(date.getDay())) return date;
      }
      return null;
    }
    default:
      return date;
  }
}
