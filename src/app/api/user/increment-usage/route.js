import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await req.json();
    const updateData = {};

    if (type === "facts") updateData.factsReadCount = { increment: 1 };
    else if (type === "tf") updateData.tfAnsweredCount = { increment: 1 };
    else {
        return NextResponse.json({ error: "Invalid increment type" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: updateData
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Increment Usage API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
