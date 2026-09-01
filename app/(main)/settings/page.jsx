import { getUserSettings } from "@/actions/settings";
import { CurrencyForm } from "./_components/currency-form";

export const metadata = { title: "Settings · BudgetIQ" };

export default async function SettingsPage() {
  const { currency, email, name } = await getUserSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Preferences for your BudgetIQ account.
        </p>
      </div>

      <CurrencyForm currency={currency} />

      <dl className="rounded-lg border p-5 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted-foreground">Signed in as</dt>
          <dd className="font-medium">{name || email}</dd>
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium break-all">{email}</dd>
        </div>
        <p className="text-muted-foreground mt-4 text-xs">
          Name, email and password are managed through your account menu in the
          header.
        </p>
      </dl>
    </div>
  );
}
