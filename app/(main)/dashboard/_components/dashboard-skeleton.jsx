import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Shimmer({ className = "" }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />;
}

/** Section-level skeleton that mirrors the real dashboard layout. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-2">
            <Shimmer className="h-4 w-40" />
            <Shimmer className="h-3 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Shimmer className="h-2 w-full" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Shimmer className="h-3 w-32" />
                <Shimmer className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Shimmer className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Shimmer key={i} className="h-3 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Shimmer className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
