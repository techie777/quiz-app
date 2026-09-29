import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { DEFAULT_APPEAL_TEXT } from "@/lib/monetizationConfig";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const exportCsv = searchParams.get("export") === "csv";

    const db = await getDb();
    const donations = await db
      .collection("donations")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    if (exportCsv) {
      const headers = "ID,Donor Name,Amount,Email,Payment ID,Tier,Created At\n";
      const rows = donations
        .map(
          (d) =>
            `"${d._id}","${(d.donorName || "").replace(/"/g, '""')}",${d.amount},"${d.email || ""}",${d.paymentId || ""},"${d.tier || ""}",${new Date(d.createdAt).toISOString()}`
        )
        .join("\n");

      return new NextResponse(headers + rows, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="quizweb_donations.csv"',
        },
      });
    }

    // Also get appeal text from settings or default
    const settingsDoc = await db.collection("app_settings").findOne({ key: "donation_appeal" });
    const appealText = settingsDoc?.value || DEFAULT_APPEAL_TEXT;

    const totalAmount = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    return NextResponse.json({
      success: true,
      donations,
      totalCount: donations.length,
      totalAmount,
      appealText,
    });
  } catch (err) {
    console.error("Admin donations GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { appealText } = body;

    const db = await getDb();
    await db.collection("app_settings").updateOne(
      { key: "donation_appeal" },
      { $set: { key: "donation_appeal", value: appealText, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Appeal text updated successfully" });
  } catch (err) {
    console.error("Admin appeal text update error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
