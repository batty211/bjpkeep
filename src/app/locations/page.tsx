import AppLayout from "@/components/layout/app-layout";
import RoomForm from "@/components/room-form";
import CabinetForm from "@/components/cabinet-form";
import ShelfForm from "@/components/shelf-form";
import { prisma } from "@/lib/prisma";

export default async function LocationsPage() {
  const rooms = await prisma.room.findMany({
  include: {
    cabinets: {
      include: {
        shelves: true,
      },
    },
  },
  });
    
    const cabinets = rooms.flatMap(
  (room) => room.cabinets
);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Locations
        </h1>

              <details className="rounded-xl border bg-white p-4">
                <summary className="cursor-pointer font-semibold">
                  ➕ Add Room
                </summary>

                <div className="mt-4">
                  <RoomForm />
                </div>
              </details>

              <details className="rounded-xl border bg-white p-4">
                <summary className="cursor-pointer font-semibold">
                  🗄️ Add Cabinet
                </summary>

                <div className="mt-4">
                  <CabinetForm rooms={rooms} />
                </div>
              </details>

              <details className="rounded-xl border bg-white p-4">
                <summary className="cursor-pointer font-semibold">
                  📦 Add Shelf
                </summary>

                <div className="mt-4">
                  <ShelfForm cabinets={cabinets} />
                </div>
              </details>

        <div className="rounded-xl border bg-white p-4">
  <h2 className="mb-4 font-semibold">
    Rooms
  </h2>

  {rooms.map((room) => (
  <details
    key={room.id}
    className="mb-4 rounded border p-4"
  >
    <summary className="cursor-pointer list-none">
      <div className="font-bold">
        🏠 {room.name}
      </div>

      <div className="text-sm text-gray-500">
        {room.code} • {room.cabinets.length} cabinet(s)
      </div>
    </summary>

    <div className="mt-3 ml-4">
      {room.cabinets.map((cabinet) => (
        <details
          key={cabinet.id}
          className="mb-2 rounded border p-2"
        >
          <summary className="cursor-pointer">
            🗄️ {cabinet.name} ({cabinet.code})
          </summary>

          <div className="mt-2 ml-4">
            {cabinet.shelves.map((shelf) => (
              <div key={shelf.id}>
                📦 {shelf.code}
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  </details>
))}
</div>
      </div>
    </AppLayout>
  );
}