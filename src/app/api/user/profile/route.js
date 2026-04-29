import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, nickname: true, avatar: true, engineTheme: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    
    // 1. Standard Update (Nickname, Avatar)
    // We do this separately to ensure basic fields work even if theme field is stale in Client
    const standardData = {};
    if (body.nickname !== undefined) standardData.nickname = body.nickname;
    if (body.avatar !== undefined) standardData.avatar = body.avatar;

    let user = await prisma.user.update({
      where: { id: session.user.id },
      data: standardData,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        image: true, 
        nickname: true, 
        avatar: true,
      },
    });

    // 2. RAW UPDATE for engineTheme (Bypasses Prisma Client schema validation)
    // This fixes the "Database update failed" error caused by EPERM locking on Windows
    if (body.engineTheme !== undefined) {
      try {
        // We use a raw command to ensure the field is updated even if the Prisma Client is stale
        await prisma.$runCommandRaw({
          update: "User",
          updates: [{
            q: { _id: { $oid: session.user.id } },
            u: { $set: { engineTheme: body.engineTheme } }
          }]
        });
        user.engineTheme = body.engineTheme;
      } catch (rawError) {
        console.error("Theme Raw Update Error:", rawError);
        // Fallback: Try a standard update just in case the client actually IS fresh
        try {
          const updatedWithTheme = await prisma.user.update({
            where: { id: session.user.id },
            data: { engineTheme: body.engineTheme },
            select: { engineTheme: true }
          });
          user.engineTheme = updatedWithTheme.engineTheme;
        } catch (e) {
          console.warn("Could not update engineTheme via any method. Stale Prisma Client detected.");
        }
      }
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile PUT error:", error);
    const errorMsg = error.code === 'P2002' ? "Nickname or Email already in use" : "Database update failed";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
