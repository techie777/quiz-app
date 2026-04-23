import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    // Define columns
    const columns = [
      "Category Name",
      "Question (English)",
      "Question (Hindi)",
      "Answer (English)",
      "Answer (Hindi)"
    ];

    // Sample data
    const sampleData = [
      {
        "Category Name": "General Knowledge",
        "Question (English)": "What has keys but can't open locks?",
        "Question (Hindi)": "वह क्या है जिसके पास चाबियां हैं लेकिन ताले नहीं खोल सकता?",
        "Answer (English)": "A Piano",
        "Answer (Hindi)": "एक पियानो"
      },
      {
        "Category Name": "Logic",
        "Question (English)": "What comes once in a minute, twice in a moment, but never in a thousand years?",
        "Question (Hindi)": "क्या है जो एक मिनट में एक बार आता है, एक पल में दो बार, लेकिन एक हजार साल में कभी नहीं?",
        "Answer (English)": "The letter 'M'",
        "Answer (Hindi)": "अक्षर 'M'"
      }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData, { header: columns });
    XLSX.utils.book_append_sheet(wb, ws, "Sawal-Jawab");

    // Write to buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="sawal_jawab_template.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}
