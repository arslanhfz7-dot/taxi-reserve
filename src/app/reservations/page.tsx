export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ReservationList from "@/app/components/ReservationList";

export default async function ReservationsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/login");

  // We fetch a clean list; filtering happens client-side in ReservationList.
  const reservations = await prisma.reservation.findMany({
    where: { user: { email } },          // your schema uses user relation
    orderBy: { startAt: "desc" },
    take: 500,
    select: {
      id: true,
      startAt: true,
      endAt: true,                       // keep if exists (optional)
      pax: true,
      pickupText: true,
      dropoffText: true,
      notes: true,
      // you can keep extra fields if you later want them in details:
      // status: true,
      // priceEuro: true,
      // driver: true,
    },
  });

  // Map DB fields to the prop names used by ReservationList
  const items = reservations.map((r) => ({
    id: r.id,
    startAt: r.startAt,
    endAt: r.endAt ?? null,
    pax: r.pax ?? null,
    pickup: r.pickupText ?? null,
    dropoff: r.dropoffText ?? null,
    notes: r.notes ?? null,
  }));

  // Server action passed down for bulk delete (owner-guarded)
  async function deleteMany(ids: string[]) {
    "use server";
    const s = await getServerSession(authOptions);
    const ownerEmail = s?.user?.email;
    if (!ownerEmail) throw new Error("Unauthorized");
    await prisma.reservation.deleteMany({
      where: {
        id: { in: ids },
        user: { email: ownerEmail },
      },
    });
  }

  return <ReservationList reservations={items} onDeleteMany={deleteMany} />;
}
