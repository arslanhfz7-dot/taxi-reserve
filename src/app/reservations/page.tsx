export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ReservationsList from "@/components/ReservationsList";
import ReservationsFilters from "@/components/ReservationsFilters";
import type { ReservationStatus } from "@/app/reservations/actions";

type Search = { from?: string; to?: string; status?: string; sort?: "asc" | "desc" };

const DB_TO_UI: Record<"PENDING" | "ASSIGNED" | "COMPLETED" | "R_RECEIVED", ReservationStatus> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  COMPLETED: "Completed",
  R_RECEIVED: "R received",
};

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
  if (searchParams.status && searchParams.status !== "ALL") {
    where.status = searchParams.status;
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
      status: true,
      userEmail: true,
    },
  });

  const items = reservations.map((r) => ({
    ...r,
    startAt: r.startAt.getTime(), // ✅ epoch ms
    endAt: null as number | null,
    status: DB_TO_UI[r.status as keyof typeof DB_TO_UI],
  }));

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Reservations</h1>
      <ReservationsFilters />
      <ReservationsList items={items} />
    </div>
  );
}
