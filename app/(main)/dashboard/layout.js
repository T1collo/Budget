import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth-user";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";

export default async function Layout({ children }) {
  // The (main) layout already redirected anyone signed out. Uses the
  // request-cached DB row rather than a fresh network call to Clerk's API.
  const user = await getCurrentUser();
  const greetingName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Hello, {greetingName} <span aria-hidden="true">👋</span>
          </p>
        </div>
      </div>

      {/* Renders `children` - the previous version imported ./page and rendered
          it directly while discarding children, running every dashboard query
          twice per load. */}
      <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
    </div>
  );
}
