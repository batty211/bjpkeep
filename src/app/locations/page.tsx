import AppLayout from "@/components/layout/app-layout";
import RoomForm from "@/components/room-form";
import CabinetForm from "@/components/cabinet-form";
import { prisma } from "@/lib/prisma";

export default async function LocationsPage() {
  const rooms = await prisma.room.findMany({
    include: {
        cabinets: true,
    },
    orderBy: {
        name: "asc",
    },
    });

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Locations
        </h1>

              <RoomForm />
              <CabinetForm rooms={rooms} />

        <div className="rounded-xl border bg-white p-4">
  <h2 className="mb-4 font-semibold">
    Rooms
  </h2>

  {rooms.map((room) => (
    <div
      key={room.id}
      className="mb-4 rounded border p-4"
    >
      <div className="font-bold">
        {room.name}
      </div>

      <div className="text-sm text-gray-500">
        {room.code}
      </div>

      <div className="mt-3 ml-4">
        {room.cabinets.map((cabinet) => (
          <div key={cabinet.id}>
            🗄️ {cabinet.name} ({cabinet.code})
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
      </div>
    </AppLayout>
  );
}