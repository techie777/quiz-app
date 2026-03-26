export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Use the default import from your singleton file

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { 
        email: email.trim().toLowerCase() 
      },
      select: { 
        id: true, 
        email: true 
      },
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("Check user error:", error);
    // Log the actual error message to Vercel logs for better debugging
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message }, 
      { status: 500 }
    );
  }
}