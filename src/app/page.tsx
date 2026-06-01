import AppLayout from "@/components/layout/app-layout";

export default function Home() {
  return (
    <AppLayout>
      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-500">
          Welcome to BJP Keep
        </p>
      </div>
    </AppLayout>
  );
}