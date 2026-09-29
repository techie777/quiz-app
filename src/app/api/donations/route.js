import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongoDb";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { amount, donorName, note, paymentId, tier } = body;

    const donationAmount = Number(amount);
    if (!donationAmount || donationAmount < 1) {
      return NextResponse.json({ success: false, error: "Invalid donation amount" }, { status: 400 });
    }

    const db = await getDb();
    const doc = {
      amount: donationAmount,
      currency: "INR",
      donorName: donorName?.trim() || session?.user?.name || "Kind Supporter",
      email: session?.user?.email || null,
      note: note?.trim() || "",
      tier: tier || "all",
      paymentId: paymentId || `pay_don_${Date.now()}`,
      status: "completed",
      createdAt: new Date(),
    };

    const result = await db.collection("donations").insertOne(doc);

    return NextResponse.json({
      success: true,
      donationId: result.insertedId,
      message: "Thank you for supporting QuizWeb!",
    });
  } catch (err) {
    console.error("Donation creation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const db = await getDb();
    const donationsCol = db.collection("donations");

    const totalDonations = await donationsCol.countDocuments();
    const totalAmountAgg = await donationsCol
      .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray();

    const totalAmount = totalAmountAgg[0]?.total || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalDonations,
        totalAmount,
      },
    });
  } catch (err) {
    console.error("Donation fetch error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
