import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name: name || null, email, password: hash }
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
