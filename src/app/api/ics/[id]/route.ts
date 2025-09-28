import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEvent, type EventAttributes } from "ics";

export const runtime = "nodejs"; // ensure Node runtime (not Edge)

function toDateParts(d: Date): [number, number, number, number, number] {
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
  ];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const resv = await prisma.reservation.findUnique({
    where: { id: params.id },
    select: { id: true, startAt: true },
  });

  if (!resv) return new NextResponse("Not found", { status: 404 });

  const start = new Date(resv.startAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h default

  const event: EventAttributes = {
    start: toDateParts(start),
    end: toDateParts(end),
    startInputType: "utc",
    endInputType: "utc",
    title: "Assign booking",
    description: "You have a booking to assign in 45 minutes",
    alarms: [
      {
        action: "display",
        trigger: { minutes: 45, before: true },
        description: "You have a booking to assign in 45 minutes",
      },
    ],
    uid: `appreserve-${resv.id}@taxivanbarcelona`,
    productId: "AppReserve",
    status: "CONFIRMED",
  };

  return await new Promise<NextResponse>((resolve) => {
    createEvent(event, (error: Error | undefined, value: string) => {
      if (error || !value) {
        resolve(new NextResponse("Failed to build ICS", { status: 500 }));
        return;
      }
      resolve(
        new NextResponse(value, {
          status: 200,
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="booking-${resv.id}.ics"`,
            "Cache-Control": "public, max-age=300",
          },
        })
      );
    });
  });
}
