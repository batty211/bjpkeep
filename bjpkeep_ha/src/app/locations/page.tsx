import AppLayout from "@/components/layout/app-layout";
import RoomForm from "@/components/room-form";
import CabinetForm from "@/components/cabinet-form";
import { prisma } from "@/lib/prisma";
import { BaseLink } from "@/lib/ingress-utils";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const rooms = await prisma.room.findMany({
    include: {
      cabinets: {
        include: {
          items: true,
        },
      },
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Locations</h1>

        <details className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <summary className="cursor-pointer font-semibold">➕ Add Room</summary>

          <div className="mt-4">
            <RoomForm />
          </div>
        </details>

        <details className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <summary className="cursor-pointer font-semibold">🗄️ Add Cabinet</summary>

          <div className="mt-4">
            <CabinetForm rooms={rooms} />
          </div>
        </details>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <h2 className="mb-4 font-semibold">Rooms</h2>

          {rooms.map((room) => (
            <details key={room.id} className="mb-4 rounded border border-[var(--border-color)] p-4">
              <summary className="cursor-pointer list-none">
                <div className="font-bold">🏠 {room.name}</div>

                <div className="text-sm text-[var(--text-secondary)]">
                  {room.code} • {room.cabinets.length} cabinet(s)
                </div>
              </summary>

              <div className="mt-3 ml-4">
                <details className="mb-3 rounded border border-[var(--border-color)] p-3">
                  <summary className="cursor-pointer list-none text-sm font-medium">
                    ✏️ Edit Room
                  </summary>

                  <div className="mt-3">
                    <RoomForm
                      initialData={{
                        id: room.id,
                        name: room.name,
                        code: room.code,
                      }}
                    />
                  </div>
                </details>

                {room.cabinets.map((cabinet) => (
                  <details
                    key={cabinet.id}
                    className="mb-2 rounded border border-[var(--border-color)] p-2"
                  >
                    <summary className="flex cursor-pointer items-center justify-between list-none">
                      <BaseLink href={`/cabinets/${cabinet.id}`} className="hover:underline">
                        🗄️ {cabinet.name} ({cabinet.code}) ({cabinet.items.length})
                      </BaseLink>

                      <BaseLink
                        href={`/cabinets/${cabinet.id}/qr`}
                        className="rounded border border-[var(--border-color)] px-2 py-1 text-xs hover:bg-[var(--bg-hover)]"
                      >
                        🏷️ QR
                      </BaseLink>
                    </summary>

                    <div className="mt-2 ml-4">
                      <details className="mb-3 rounded border border-[var(--border-color)] p-3">
                        <summary className="cursor-pointer list-none text-sm font-medium">
                          ✏️ Edit Cabinet
                        </summary>

                        <div className="mt-3">
                          <CabinetForm
                            rooms={rooms}
                            initialData={{
                              id: cabinet.id,
                              roomId: cabinet.roomId,
                              name: cabinet.name,
                              code: cabinet.code,
                            }}
                          />
                        </div>
                      </details>

                      {cabinet.items.map((item) => (
                        <div key={item.id}>📦 {item.name}</div>
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
