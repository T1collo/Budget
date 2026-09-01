import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// No landing page: signed-in users land on the dashboard, everyone else on
// sign-up. Redirecting on the server avoids a flash of the wrong page.
export default async function Home() {
  const { userId } = await auth();
  redirect(userId ? "/dashboard" : "/sign-up");
}
