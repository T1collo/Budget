-- Idempotency key for imported M-Pesa SMS (the receipt code).
-- Nullable: every pre-existing, manually entered row keeps NULL, and Postgres
-- allows unlimited NULLs in a unique index, so the constraint only binds rows
-- that actually came from an import.
ALTER TABLE "transactions" ADD COLUMN "externalId" TEXT;

CREATE UNIQUE INDEX "transactions_userId_externalId_key" ON "transactions"("userId", "externalId");
