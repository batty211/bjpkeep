"use client";
import Link from "next/link";

const menu = [
  { name: "Dashboard", href: "/" },
  { name: "Inventory", href: "/inventory" },
  { name: "Locations", href: "/locations" },
  { name: "Assets", href: "/assets" },
  { name: "Activity", href: "/activity" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 border-b bg-white lg:hidden">
        <details>
          <summary className="cursor-pointer list-none p-4 font-semibold">
            ☰ BJP Keep
          </summary>

          <div className="space-y-1 border-t p-2">
            {menu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded px-3 py-2 hover:bg-gray-100"
              >
                {item.name}
              </Link>
            ))}


          </div>
        </details>
      </div>

      <aside className="hidden w-64 border-r bg-white lg:block">
        <div className="p-6">
          <h1 className="text-xl font-bold">
            BJP Keep
          </h1>

          <p className="text-sm text-gray-500">
            Store • Track • Find
          </p>
        </div>

        <nav className="space-y-1 px-3">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-4 py-2 hover:bg-gray-100"
            >
              {item.name}
            </Link>
          ))}
       
        </nav>
      </aside>
    </>
  );
}