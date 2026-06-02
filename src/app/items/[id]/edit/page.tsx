import AppLayout from "@/components/layout/app-layout";
import ItemForm from "@/components/items/item-form";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditItemPage({ params }: Props) {
  const { id } = await params;

  const [item, cabinets] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        cabinetId: true,
      },
    }),
    prisma.cabinet.findMany({
      include: {
        room: true,
      },
      orderBy: {
        code: "asc",
      },
    }),
  ]);

  if (!item) {
    return (
      <AppLayout>
        <div className="text-xl font-semibold text-[var(--foreground)]">Item not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Item</h1>

        <ItemForm
          cabinets={cabinets}
          initialData={{
            id: item.id,
            name: item.name,
            cabinetId: item.cabinetId,
          }}
        />
      </div>
    </AppLayout>
  );
}
