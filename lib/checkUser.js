import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-user";

/**
 * Ensure the signed-in Clerk user has a row in our DB.
 *
 * Runs in the Header on every render, so the common path (row already exists)
 * must be cheap: `getCurrentUser()` is the request-cached lookup that the rest
 * of the page needs anyway, and `currentUser()` - a network call to Clerk's
 * API - is now only made on the one render where we actually create the row.
 */
export const checkUser = cache(async () => {
  const existing = await getCurrentUser();
  if (existing) return existing;

  const user = await currentUser();
  if (!user) return null;

  try {
    return await db.user.create({
      data: {
        clerkUserId: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(" "),
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });
  } catch (error) {
    // A concurrent render may have created it first; fall back to reading it.
    console.error("checkUser:", error.message);
    return db.user.findUnique({ where: { clerkUserId: user.id } });
  }
});
