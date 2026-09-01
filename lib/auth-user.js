import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

/**
 * The signed-in user's DB row, fetched at most ONCE per request.
 *
 * Every action used to run its own `db.user.findUnique`, so a single dashboard
 * render fetched the same row five times, each one a serial ~190ms round trip
 * to Neon before the action's real query could start. React's `cache()` is
 * request-scoped, so concurrent callers share one in-flight promise.
 */
export const getCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  return db.user.findUnique({ where: { clerkUserId: userId } });
});

/** Same, but throws the way the actions already expect. */
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await getCurrentUser();
  if (!user) throw new Error("User not found");

  return user;
}
