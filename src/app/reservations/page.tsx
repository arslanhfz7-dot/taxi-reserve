// src/app/reservations/page.tsx
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ReservationsList from "@/components/ReservationsList";

type Search = { from?: string; to?: string; status?: string; sort?: "asc" | "desc" };

export default async function ReservationsPage({ searchParams }: { searchParams?: Search }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const where: any = { user: { email } };

  if (searchParams?.from || searchParams?.to) {
    where.startAt = {};
    if (searchParams.from) where.startAt.gte = new Date(searchParams.from + "T00:00:00");
    if (searchParams.to)   where.startAt.lte = new Date(searchParams.to + "T23:59:59");
  }
  if (searchParams?.status && searchParams.status !== "ALL") where.status = searchParams.status;

  const sortDir: "asc" | "desc" = searchParams?.sort === "asc" ? "asc" : "desc";

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
      status: true,
    },
  });

  const items = reservations.map((r) => ({
    ...r,
    startAt: r.startAt.toISOString(),
    endAt: null as string | null, // keep prop shape stable for the list
  }));

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Reservations</h1>
      <ReservationsList items={items} />
    </div>
  );
}
