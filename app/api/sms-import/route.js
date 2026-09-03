import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { request as arcjetRequest } from "@arcjet/next";
import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-user";
import { parseMpesaSms } from "@/lib/mpesa";

// One handset cannot plausibly have more unimported M-Pesa messages than this
// in a single sync, and it bounds the work a single request can cost us.
const MAX_MESSAGES = 500;

/**
 * Import M-Pesa SMS forwarded by the Android shell app.
 *
 * The request body carries message TEXT only. The owning user is resolved from
 * the Clerk session on the server - never from the payload - so a caller cannot
 * write transactions into somebody else's ledger by naming their id.
 */
export async function POST(req) {
  let user;
  try {
    user = await requireUser();
  } catch {
    // Same shape for "not signed in" and "no such user": never confirm which.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decision = await aj.protect(await arcjetRequest(), {
    userId: user.clerkUserId,
    requested: 1,
  });
  if (decision.isDenied()) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = payload?.messages;
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: `Too many messages; send at most ${MAX_MESSAGES}` },
      { status: 413 }
    );
  }

  // The importer only ever writes to the default account. Letting the client
  // name an account would be one more id to validate for nothing: the phone
  // has no idea what the user's accounts are called.
  const account = await db.account.findFirst({
    where: { userId: user.id, isDefault: true },
  });
  if (!account) {
    return NextResponse.json(
      { error: "No default account. Create one in the app first." },
      { status: 409 }
    );
  }

  // Parse, then collapse duplicates *within* the batch - the same message can
  // legitimately arrive twice in one inbox read.
  const byKey = new Map();
  for (const m of messages) {
    const received = m?.date ? new Date(Number(m.date) || Date.parse(m.date)) : new Date();
    for (const row of parseMpesaSms(m?.body, isNaN(received) ? new Date() : received)) {
      byKey.set(row.externalId, row);
    }
  }
  const parsed = [...byKey.values()];
  if (parsed.length === 0) {
    return NextResponse.json({ imported: 0, skipped: messages.length, reason: "nothing parsable" });
  }

  const already = await db.transaction.findMany({
    where: { userId: user.id, externalId: { in: parsed.map((r) => r.externalId) } },
    select: { externalId: true },
  });
  const seen = new Set(already.map((r) => r.externalId));
  const fresh = parsed.filter((r) => !seen.has(r.externalId));

  if (fresh.length === 0) {
    return NextResponse.json({ imported: 0, skipped: parsed.length });
  }

  const delta = fresh.reduce(
    (sum, r) => sum + (r.type === "EXPENSE" ? -r.amount : r.amount),
    0
  );

  try {
    // Insert and adjust the balance atomically. Deliberately WITHOUT
    // skipDuplicates: if a concurrent sync inserts one of these first, the
    // unique index aborts the whole transaction and we answer 409 rather than
    // silently dropping a row and leaving the balance overstated by its amount.
    await db.$transaction(async (tx) => {
      await tx.transaction.createMany({
        data: fresh.map((r) => ({
          userId: user.id,
          accountId: account.id,
          externalId: r.externalId,
          type: r.type,
          amount: r.amount,
          description: r.description,
          category: r.category,
          date: r.date,
          status: "COMPLETED",
        })),
      });

      // Atomic increment, not read-then-write: the balance we read before the
      // transaction may be stale by now, and computing `old + delta` in JS
      // would silently discard a concurrent write.
      await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: delta } },
      });
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Concurrent import; retry" },
        { status: 409 }
      );
    }
    console.error("sms-import:", error.message);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/account/${account.id}`);

  return NextResponse.json({
    imported: fresh.length,
    skipped: parsed.length - fresh.length,
    account: account.name,
  });
}
