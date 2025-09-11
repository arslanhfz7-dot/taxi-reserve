export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ReservationsList from "@/components/ReservationsList";

export default async function ReservationsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const reservations = await prisma.reservation.findMany({
    where: { user: { email } },
    orderBy: { startAt: "desc" },
    take: 500,
    select: {
      id: true,
      startAt: true,        // Date
      pax: true,            // number
      pickupText: true,     // string | null
      dropoffText: true,    // string | null
      notes: true,          // string | null
    },
  });

  // Normalize to the props that <ReservationsList /> expects (all strings)
  const items = reservations.map((r) => ({
    id: r.id,
    startAt: r.startAt.toISOString(),
    pax: r.pax ?? 1,
    pickup: r.pickupText ?? "",
    dropoff: r.dropoffText ?? "",
    notes: r.notes ?? "",
  }));

  // Server action for bulk delete
  async function deleteMany(ids: string[]) {
    "use server";
    const s = await getServerSession(authOptions);
    const ownerEmail = s?.user?.email;
    if (!ownerEmail) throw new Error("Unauthorized");

    await prisma.reservation.deleteMany({
      where: { id: { in: ids }, user: { email: ownerEmail } },
    });
  }

  return <ReservationsList reservations={items} onDeleteMany={deleteMany} />;
}
