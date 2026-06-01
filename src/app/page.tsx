import AppLayout from "@/components/layout/app-layout";
import ItemSearch from "@/components/search/item-search";

export default function Home() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          BJP Keep
        </h1>

        <ItemSearch />
      </div>
    </AppLayout>
  );
}