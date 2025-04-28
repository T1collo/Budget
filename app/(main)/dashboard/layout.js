import { Suspense } from "react";
import DashboardPage from "./page";
import { BarLoader } from "react-spinners";

export default function Layout() {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
      <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient">
         Dashboard
      </h1>
      </div>
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <DashboardPage />
      </Suspense>
    </div>
  );
}