"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isSupportedCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { getCurrentUser } from "@/lib/auth-user";

export async function getUserSettings() {
  // Reuses the request-scoped user rather than issuing another round trip.
  const user = await getCurrentUser();

  return {
    email: user?.email,
    name: user?.name,
    currency: user?.currency || DEFAULT_CURRENCY,
  };
}

export async function updateCurrency(code) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Validate against our own list rather than trusting the posted value.
    if (!isSupportedCurrency(code)) throw new Error("Unsupported currency");

    // Scoped by the session's clerkUserId, so this can only ever update the
    // caller's own row.
    await db.user.update({
      where: { clerkUserId: userId },
      data: { currency: code },
    });

    revalidatePath("/", "layout");
    return { success: true, currency: code };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
