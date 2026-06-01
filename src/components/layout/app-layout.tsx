import { ReactNode } from "react";
import Sidebar from "./sidebar";

type Props = {
  children: ReactNode;
};

export default function AppLayout({
  children,
}: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 bg-gray-50 p-8">
        {children}
      </main>
    </div>
  );
}