import AppLayout from "@/components/layout/app-layout";
import RoomForm from "@/components/room-form";
import { prisma } from "@/lib/prisma";

export default async function LocationsPage() {
  const rooms = await prisma.room.findMany({
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

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 font-semibold">
            Rooms
          </h2>

          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="rounded border p-3"
              >
                <div className="font-medium">
                  {room.name}
                </div>

                <div className="text-sm text-gray-500">
                  {room.code}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}