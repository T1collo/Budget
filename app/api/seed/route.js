import { seedTransactions } from "../../../actions/seed";

// Development-only utility: it writes transactions for a hardcoded user id and
// has no authorization of its own, so it must never be reachable in production.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const result = await seedTransactions();
  return Response.json(result);
}
