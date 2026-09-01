import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-2xl">
        <FileQuestion className="size-7" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
        That page doesn&apos;t exist or has moved. Your accounts and
        transactions are unaffected.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/transaction/create">Add a transaction</Link>
        </Button>
      </div>
    </div>
  );
}
