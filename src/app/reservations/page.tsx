export const runtime = "nodejs";
export const revalidate = 0; // ⬅️ add this at the very top

// or alternatively:
// export const dynamic = "force-dynamic";


import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ReservationsList from "@/components/ReservationsList";
import SortControls from "@/components/SortControls"; // ⬅️ add this
import Link from "next/link";

// ❌ removed: ReservationsFilters + ReservationStatus type

type Search = { from?: string; to?: string; sort?: "asc" | "desc" };

export default async function ReservationsPage({ searchParams = {} as Search }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const where: any = { userEmail: email };

  if (searchParams.from || searchParams.to) {
    where.startAt = {};
    if (searchParams.from) where.startAt.gte = new Date(searchParams.from + "T00:00:00");
    if (searchParams.to) where.startAt.lte = new Date(searchParams.to + "T23:59:59");
  }

  const sortDir: "asc" | "desc" = searchParams.sort === "asc" ? "asc" : "desc";

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { startAt: sortDir },
    take: 500,
    select: {
      id: true,
      startAt: true,
      pickupText: true,
      dropoffText: true,
      pax: true,
      priceEuro: true,
      phone: true,
      flight: true,
      notes: true,
      userEmail: true,
      // ❌ removed: status
    },
  });

  const items = reservations.map((r) => ({
    ...r,
    startAt: r.startAt.getTime(), // ✅ epoch ms
    endAt: null as number | null,
    // ❌ removed: status mapping
  }));

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Reservations</h1>
      {/* ❌ removed <ReservationsFilters /> */}
      <ReservationsList items={items} />
    </div>
    
  );
  (
  <div className="mx-auto max-w-2xl p-4">
    <h1 className="mb-4 text-2xl font-semibold">Reservations</h1>
    <SortControls />  {/* ⬅️ new sort control */}
    <ReservationsList items={items} />
  </div>
);
}
