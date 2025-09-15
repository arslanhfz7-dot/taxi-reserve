import { NextResponse } from "next/server";
import { sendReminder } from "@/lib/mailer";

export async function GET() {
  try {
    await sendReminder(
      process.env.SMTP_USER!,        // send to yourself
      "✅ Gmail SMTP Test",
      "<p>If you see this, Gmail SMTP is working!</p>"
    );
    return NextResponse.json({ ok: true, msg: "Email sent" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
