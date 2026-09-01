import Link from "next/link";
import { GiFluffyFlame } from "react-icons/gi";
import { PieChart, Bell, ScanLine } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: PieChart,
    title: "Budget by category",
    body: "Set a limit per category and watch the month against it, not just one lump total.",
  },
  {
    icon: Bell,
    title: "Know the moment you go over",
    body: "An alert the instant a transaction pushes a category past its limit.",
  },
  {
    icon: ScanLine,
    title: "Scan a receipt",
    body: "Point at a receipt and the amount, date and category fill themselves in.",
  },
];

const AuthLayout = ({ children }) => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Form side. First on mobile so the sign-up form is what you land on. */}
      <div className="flex flex-col justify-center px-5 pt-24 pb-10 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 self-center lg:self-start"
        >
          <GiFluffyFlame className="text-primary text-2xl" />
          <span className="text-lg font-semibold tracking-tight">BudgetIQ</span>
        </Link>

        <div className="flex w-full justify-center">{children}</div>
      </div>

      {/* Value panel. Hidden below lg so small screens get the form alone. */}
      <div className="bg-muted/40 relative hidden border-l lg:flex lg:flex-col lg:justify-center lg:px-12">
        <div
          aria-hidden="true"
          className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent"
        />
        <div className="relative max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Know where the money went, before the month ends.
          </h2>
          <ul className="mt-8 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
