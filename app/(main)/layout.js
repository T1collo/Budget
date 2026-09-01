import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/actions/settings";
import { CurrencyProvider } from "@/components/currency-provider";

// Single auth gate for every /(main) route. Previously only the dashboard
// checked, so /transaction/create and /account/[id] threw "Unauthorized" and
// rendered a 500 to signed-out visitors instead of redirecting them.
const MainLayout = async ({ children }) => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Resolved once here so every money value below renders in the user's
  // chosen currency without each component fetching it.
  const { currency } = await getUserSettings();

  return (
    <CurrencyProvider currency={currency}>
      {/* pt-24 clears the fixed h-16 header; the old my-32 left 8rem of dead space. */}
      <div className="container mx-auto px-4 pt-24 pb-16 sm:px-6">
        {children}
      </div>
    </CurrencyProvider>
  );
};

export default MainLayout;
