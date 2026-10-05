-- Selected-day recurrence. WEEKDAYS rows store which days in `weekdays`
-- (bit 0 = Sunday … bit 6 = Saturday). Existing intervals leave it null.
ALTER TYPE "RecurringInterval" ADD VALUE 'WEEKDAYS';

ALTER TABLE "transactions" ADD COLUMN "weekdays" INTEGER;
