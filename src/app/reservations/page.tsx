export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ReservationsFilters from "./ui/ReservationsFilters";
import ReservationsTable from "@/components/ReservationsTable";

type PageProps = {
  searchParams: {
    q?: string;
    status?: string;
    from?: string;
    to?: string;
    sort?: "asc" | "desc";
  };
};

export default async function ReservationsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const { q, status, from, to, sort } = searchParams;
  const where: any = { user: { email } };

  const allowed = new Set(["PENDING","ASSIGNED","COMPLETED","R_RECEIVED"]);
if (status && allowed.has(status)) where.status = status;

  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { notes: { contains: term, mode: "insensitive" } },
      { pickupText: { contains: term, mode: "insensitive" } },
      { dropoffText: { contains: term, mode: "insensitive" } },
      { driver: { contains: term, mode: "insensitive" } },
    ];
  }

  if (from) where.startAt = { ...(where.startAt ?? {}), gte: new Date(from) };
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    where.startAt = { ...(where.startAt ?? {}), lte: end };
  }

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { startAt: sort === "asc" ? "asc" : "desc" },
    take: 500,
    select: {
      id: true,
      startAt: true,
      pickupText: true,
      dropoffText: true,
      status: true,
      pax: true,
      notes: true,
      priceEuro: true,
      driver: true,
    },
  });

  const items = reservations.map((r) => ({ ...r, pickupAt: r.startAt }));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Your reservations</h1>
      <ReservationsFilters
        defaultValues={{
          q: q ?? "",
          status: status ?? "ALL",
          from: from ?? "",
          to: to ?? "",
          sort: (sort as "asc" | "desc") ?? "desc",
        }}
      />
      <ReservationsTable items={items as any} />
    </div>
  );
}
