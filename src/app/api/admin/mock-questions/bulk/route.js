import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const data = await request.json();
    const { paperId, rows } = data;

    if (!paperId || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Missing paperId or rows" }, { status: 400 });
    }

    // 1. Get existing sections for this paper to avoid duplicate creation logic in memory
    const existingSections = await prisma.mockSection.findMany({ where: { paperId } });
    const sectionMap = new Map();
    existingSections.forEach(s => sectionMap.set(s.name.toLowerCase(), s.id));

    let createdCount = 0;
    const errors = [];

    // Process each row
    for (const [index, row] of rows.entries()) {
      try {
        const sectionName = row["Section Name"] || "General";
        let sectionId = sectionMap.get(sectionName.toLowerCase());

        // Create section if not exists
        if (!sectionId) {
          const newSection = await prisma.mockSection.create({
            data: { paperId, name: sectionName, order: sectionMap.size }
          });
          sectionId = newSection.id;
          sectionMap.set(sectionName.toLowerCase(), sectionId);
        }

        // Prepare bilingual options
        const optionsEN = [
          row["Option 1 (EN)"] || "",
          row["Option 2 (EN)"] || "",
          row["Option 3 (EN)"] || "",
          row["Option 4 (EN)"] || ""
        ];
        const optionsHI = [
          row["Option 1 (HI)"] || "",
          row["Option 2 (HI)"] || "",
          row["Option 3 (HI)"] || "",
          row["Option 4 (HI)"] || ""
        ];

        // Format correct answer (Excel 1-4 to Index 0-3)
        let answerIndex = parseInt(row["Correct Answer (1-4)"]) - 1;
        if (isNaN(answerIndex) || answerIndex < 0) answerIndex = 0;

        await prisma.mockQuestion.create({
          data: {
            paperId,
            sectionId,
            text: row["Question (EN)"] || row["Question"] || "Missing Question",
            textHi: row["Question (HI)"] || null,
            options: JSON.stringify(optionsEN),
            optionsHi: JSON.stringify(optionsHI),
            answer: answerIndex,
            explanation: row["Explanation (EN)"] || row["Explanation"] || null,
            explanationHi: row["Explanation (HI)"] || null,
            image: row["Image URL"] || null,
            difficulty: "Medium",
            type: "MCQ"
          }
        });
        createdCount++;
      } catch (err) {
        console.error(`Error at row ${index + 1}:`, err);
        errors.push({ row: index + 1, error: err.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: createdCount, 
      errors: errors.length > 0 ? errors : null 
    });
  } catch (error) {
    console.error("Bulk Upload MockQuestions Error:", error);
    return NextResponse.json({ error: "Bulk upload failed" }, { status: 500 });
  }
}
