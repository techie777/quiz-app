import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

/**
 * GET /api/b2b/tests/template
 * Generates an official, pre-formatted Excel template (.xlsx) for teachers and institutes.
 */
export async function GET() {
  try {
    const wb = XLSX.utils.book_new();

    const headers = [
      "Question (English or Hindi)",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Correct Answer (A/B/C/D)",
      "Marks",
      "Negative Marks",
      "Explanation (Optional)"
    ];

    const sampleRows = [
      {
        "Question (English or Hindi)": "What is the SI unit of electric current?",
        "Option A": "Volt",
        "Option B": "Ampere",
        "Option C": "Ohm",
        "Option D": "Watt",
        "Correct Answer (A/B/C/D)": "B",
        "Marks": 4,
        "Negative Marks": 1,
        "Explanation (Optional)": "The SI unit of electric current is Ampere (A)."
      },
      {
        "Question (English or Hindi)": "विद्युत धारा का SI मात्रक क्या है?",
        "Option A": "वोल्ट",
        "Option B": "एम्पीयर",
        "Option C": "ओम",
        "Option D": "वाट",
        "Correct Answer (A/B/C/D)": "B",
        "Marks": 4,
        "Negative Marks": 1,
        "Explanation (Optional)": "विद्युत धारा (Current) का SI मात्रक एम्पीयर (Ampere) होता है।"
      },
      {
        "Question (English or Hindi)": "Which gas is most abundant in the Earth's atmosphere?",
        "Option A": "Oxygen",
        "Option B": "Carbon Dioxide",
        "Option C": "Nitrogen",
        "Option D": "Argon",
        "Correct Answer (A/B/C/D)": "C",
        "Marks": 4,
        "Negative Marks": 1,
        "Explanation (Optional)": "Nitrogen makes up approximately 78% of Earth's atmosphere."
      },
      {
        "Question (English or Hindi)": "प्रकाश वर्ष (Light Year) किसका मात्रक है?",
        "Option A": "समय",
        "Option B": "दूरी",
        "Option C": "प्रकाश की गति",
        "Option D": "ऊर्जा",
        "Correct Answer (A/B/C/D)": "B",
        "Marks": 4,
        "Negative Marks": 1,
        "Explanation (Optional)": "प्रकाश वर्ष खगोलीय दूरी (Distance) मापने की इकाई है।"
      },
      {
        "Question (English or Hindi)": "If x + 5 = 12, what is the value of 2x + 3?",
        "Option A": "14",
        "Option B": "17",
        "Option C": "19",
        "Option D": "21",
        "Correct Answer (A/B/C/D)": "B",
        "Marks": 4,
        "Negative Marks": 0,
        "Explanation (Optional)": "x = 12 - 5 = 7. Therefore, 2(7) + 3 = 14 + 3 = 17."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });

    // Set practical column widths for clean readability
    ws["!cols"] = [
      { wch: 45 }, // Question
      { wch: 20 }, // Option A
      { wch: 20 }, // Option B
      { wch: 20 }, // Option C
      { wch: 20 }, // Option D
      { wch: 26 }, // Correct
      { wch: 10 }, // Marks
      { wch: 16 }, // Negative Marks
      { wch: 40 }  // Explanation
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Test Questions");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Teacher_Live_Test_Template.xlsx"'
      }
    });
  } catch (err) {
    console.error("Failed to generate test template:", err);
    return NextResponse.json({ error: "Failed to generate Excel template" }, { status: 500 });
  }
}
