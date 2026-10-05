import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "../_components/create-transaction";
import { getTransaction } from "@/actions/transaction";

export default async function AddTransactionPage({ searchParams }) {
  const accounts = await getUserAccounts();
  const editId = searchParams?.edit;

  let initialData = null;
  if (editId) {
    const transaction = await getTransaction(editId);
    initialData = transaction;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex justify-center md:justify-normal">
      <h1 className="animate-gradient bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent sm:text-5xl">
          Add Transaction
      </h1>

      </div>
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      />
    </div>
  );
}