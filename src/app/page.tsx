import AppLayout from "@/components/layout/app-layout";
import ItemSearch from "@/components/search/item-search";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user =
    await getCurrentUser();

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          BJP Keep
        </h1>

        <div className="rounded-xl border bg-white p-4">
          Logged in as:

          <strong className="ml-2">
            {String(user?.username)}
          </strong>
        </div>

        <ItemSearch />
      </div>
    </AppLayout>
  );
}