import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true },
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
