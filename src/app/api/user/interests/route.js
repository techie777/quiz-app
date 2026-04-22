import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { interestedCategories: true }
  });

  return NextResponse.json({ interestedCategories: user?.interestedCategories || [] });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { interestedCategories } = await request.json();
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: { interestedCategories }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update interests:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
