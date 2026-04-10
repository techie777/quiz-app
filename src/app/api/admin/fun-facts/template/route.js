import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const headers = [
      "Category", 
      "Category (Hindi)", 
      "Category Image URL",
      "Fun Fact Description", 
      "Fun Fact Description (Hindi)", 
      "Image URL"
    ];

    const sampleData = [
      {
        "Category": "Science",
        "Category (Hindi)": "विज्ञान",
        "Category Image URL": "https://example.com/science.jpg",
        "Fun Fact Description": "Water can boil and freeze at the same time.",
        "Fun Fact Description (Hindi)": "पानी एक ही समय में उबल और जम सकता है।",
        "Image URL": "https://example.com/triple-point.jpg"
      },
      {
        "Category": "Space",
        "Category (Hindi)": "अंतरिक्ष",
        "Category Image URL": "",
        "Fun Fact Description": "One day on Venus is longer than one year on Earth.",
        "Fun Fact Description (Hindi)": "शुक्र ग्रह पर एक दिन पृथ्वी के एक वर्ष से अधिक लंबा होता है।",
        "Image URL": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FunFactsTemplate");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="FunFacts_Template.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Template generation error:", error);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}
