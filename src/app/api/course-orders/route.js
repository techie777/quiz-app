import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  const {
    packageId,
    parentName,
    childName,
    board,
    class: classNum,
    deliveryAddress,
    contactNumber,
    isWhatsApp,
    totalAmount,
    couponCode,
  } = body;

  if (!packageId || !parentName || !childName || !board || !classNum || !deliveryAddress || !contactNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const order = await prisma.courseOrder.create({
      data: {
        packageId,
        parentName,
        childName,
        board,
        class: parseInt(classNum, 10),
        deliveryAddress,
        contactNumber,
        isWhatsApp: !!isWhatsApp,
        totalAmount,
        status: "PAID", // Placeholder for actual payment integration
        userId: session?.user?.id || null,
        paymentId: `MOCK_${Math.random().toString(36).substring(7).toUpperCase()}`,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating course order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
