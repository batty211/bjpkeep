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

      <div className="flex-1">
        <main className="bg-gray-50 p-4 pt-20 md:p-8 md:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}