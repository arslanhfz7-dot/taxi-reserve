// src/app/reservations/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// UI labels shown in your dropdown
export type ReservationStatus = "Pending" | "Assigned" | "Completed" | "R received";

// DB enum codes stored by Prisma
type DbCode = "PENDING" | "ASSIGNED" | "COMPLETED" | "R_RECEIVED";

const UI_TO_DB: Record<ReservationStatus, DbCode> = {
  Pending: "PENDING",
  Assigned: "ASSIGNED",
  Completed: "COMPLETED",
  "R received": "R_RECEIVED",
};

const DB_CODES: DbCode[] = ["PENDING", "ASSIGNED", "COMPLETED", "R_RECEIVED"];

async function getUserEmailBySession() {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

/**
 * Update a single reservation's editable fields.
 * Ownership is validated by userEmail.
 *
 * `status` accepts either UI labels (e.g., "Pending")
 * or DB codes (e.g., "PENDING").
 */
export async function updateReservationField(
  id: string,
  patch: {
    notes?: string | null;
    pax?: number;
    driver?: string | null;
    status?: ReservationStatus | DbCode;
  }
) {
  const email = await getUserEmailBySession();
  if (!email) throw new Error("Unauthorized");

  const owned = await prisma.reservation.findFirst({
    where: { id, userEmail: email },
    select: { id: true },
  });
  if (!owned) throw new Error("Not found");

  const data: Record<string, unknown> = {};

  if ("notes" in patch) {
    const text = (patch.notes ?? "").toString().slice(0, 2000);
    data.notes = text.length ? text : null;
  }

  if ("pax" in patch) {
    const n = Number(patch.pax);
    if (!Number.isFinite(n) || n < 1 || n > 99) throw new Error("Invalid pax");
    data.pax = n;
  }

  if ("driver" in patch) {
    const v = (patch.driver ?? "").toString().trim();
    if (v.length > 100) throw new Error("Driver too long");
    data.driver = v || null;
  }

  if (typeof patch.status !== "undefined") {
    const asDb: DbCode =
      (DB_CODES.includes(patch.status as DbCode)
        ? (patch.status as DbCode)
        : UI_TO_DB[patch.status as ReservationStatus]) ?? (null as never);

    if (!asDb) throw new Error("Invalid status");
    data.status = asDb;
  }

  await prisma.reservation.update({ where: { id }, data });
  return { ok: true };
}
