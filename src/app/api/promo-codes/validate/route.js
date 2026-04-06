import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promo || promo.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid or inactive code" }, { status: 404 });
    }

    // Check expiry
    if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) {
      return NextResponse.json({ error: "Code has expired" }, { status: 410 });
    }

    return NextResponse.json({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue
    });

  } catch (error) {
    console.error("Promo validation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
