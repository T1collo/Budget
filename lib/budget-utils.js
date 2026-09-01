// Pure helpers - no db, no server-only imports, so they stay unit-testable.

/** First and last instant of the month containing `date`. */
export function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export const ALERT_THRESHOLDS = [100, 80];

/**
 * Which threshold (if any) a category crossed when spend moved `before` -> `after`.
 * Returns 100, 80, or null. Only reports the crossing itself, so a category
 * already over budget does not re-alert on every later transaction.
 */
export function crossedThreshold(before, after, limit) {
  if (!(limit > 0)) return null;
  return (
    ALERT_THRESHOLDS.find(
      (t) => after >= (limit * t) / 100 && before < (limit * t) / 100
    ) ?? null
  );
}
