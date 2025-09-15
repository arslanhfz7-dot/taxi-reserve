// src/components/ReservationsList.tsx
"use client";
import { useState } from "react";

type Reservation = {
  id: string;
  startAt: string;
  endAt?: string | null;
  pickupText?: string | null;
  dropoffText?: string | null;
  pax: number;
  priceEuro?: number | null;
  phone?: string | null;
  flight?: string | null;
  notes?: string | null;
  status: string;
};

export default function ReservationsList({ items }: { items: Reservation[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="grid gap-3">
      {items.map((r) => {
        const start = new Date(r.startAt);
        const date = start.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        const time = start.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <li key={r.id} className="rounded-lg border border-neutral-800">
            <button
              onClick={() => setOpenId(openId === r.id ? null : r.id)}
              className="w-full flex justify-between items-center px-4 py-2"
            >
              <span>
                <span className="font-semibold">{date}</span>{" "}
                <span className="text-sm text-neutral-400">{time}</span>
              </span>
              <span className="text-sm">{openId === r.id ? "▲" : "▼"}</span>
            </button>

            {openId === r.id && (
              <div className="px-4 pb-3 text-sm leading-6 space-y-1">
                {r.pickupText && (
                  <div>
                    <span className="font-semibold">Pickup:</span> {r.pickupText}
                  </div>
                )}
                {r.dropoffText && (
                  <div>
                    <span className="font-semibold">Drop-off:</span> {r.dropoffText}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Pax:</span> {r.pax}
                </div>
                {typeof r.priceEuro === "number" && (
                  <div>
                    <span className="font-semibold">Price:</span> {r.priceEuro}€
                  </div>
                )}
                {r.phone && (
                  <div>
                    <span className="font-semibold">Phone:</span> {r.phone}
                  </div>
                )}
                {r.flight && (
                  <div>
                    <span className="font-semibold">Flight:</span> {r.flight}
                  </div>
                )}
                {r.notes && (
                  <div className="whitespace-pre-wrap">
                    <span className="font-semibold">Notes:</span> {r.notes}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Status:</span> {r.status}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
