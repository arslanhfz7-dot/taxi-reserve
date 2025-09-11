export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ReservationList from "@/components/ReservationsList"; // ✅ CORRECT ALIAS
import ReservationsList from "@/components/ReservationsList";

export default async function ReservationsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/login");

  // Fetch; client does filtering
  const reservations = await prisma.reservation.findMany({
    where: { user: { email } },
    orderBy: { startAt: "desc" },
    take: 500,
    select: {
      id: true,
      startAt: true,
      endAt: true,
      pax: true,
      pickupText: true,
      dropoffText: true,
      notes: true,
    },
  });

  const items = reservations.map((r) => ({
    id: r.id,
    startAt: r.startAt,
    endAt: r.endAt ?? null,
    pax: r.pax ?? null,
    pickup: r.pickupText ?? null,
    dropoff: r.dropoffText ?? null,
    notes: r.notes ?? null,
  }));

  // Bulk delete as a server action
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
