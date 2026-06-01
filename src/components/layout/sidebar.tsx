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
    <aside className="w-64 border-r bg-white">
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
  );
}