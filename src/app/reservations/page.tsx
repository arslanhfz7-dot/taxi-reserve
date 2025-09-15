// src/app/reservations/page.tsx
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ReservationsList from "@/components/ReservationsList";

type Search = {
  from?: string;
  to?: string;
  status?: string;
  sort?: "asc" | "desc";
};

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams?: Search;
}) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/login");

  // Use relation filter (works regardless of whether FK column is userId or userEmail)
  const where: any = { user: { email } };

  // Date filter
  if (searchParams?.from || searchParams?.to) {
    where.startAt = {};
    if (searchParams.from) where.startAt.gte = new Date(searchParams.from + "T00:00:00");
    if (searchParams.to) where.startAt.lte = new Date(searchParams.to + "T23:59:59");
  }

  // Status filter (ALL = no filter)
  if (searchParams?.status && searchParams.status !== "ALL") {
    where.status = searchParams.status;
  }

  const sortDir: "asc" | "desc" = searchParams?.sort === "asc" ? "asc" : "desc";

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { startAt: sortDir },
    take: 500,
    select: {
      id: true,
      startAt: true,
      endAt: true,
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

  // Serialize dates for the client component
  const items = reservations.map((r) => ({
    ...r,
    startAt: r.startAt.toISOString(),
    endAt: r.endAt ? r.endAt.toISOString() : null,
  }));

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Reservations</h1>
      <ReservationsList items={items} />
    </div>
  );
}
