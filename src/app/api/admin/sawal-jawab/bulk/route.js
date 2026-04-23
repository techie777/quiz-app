import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Cache categories to avoid frequent DB lookups
    const categoryCache = new Map();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const catName = row["Category Name"];
      const question = row["Question (English)"];
      const questionHi = row["Question (Hindi)"];
      const answer = row["Answer (English)"];
      const answerHi = row["Answer (Hindi)"];

      if (!catName || !question || !answer) {
        errorCount++;
        errors.push(`Row ${i + 2}: Missing required fields (Category, Question, or Answer)`);
        continue;
      }

      try {
        let categoryId;
        if (categoryCache.has(catName)) {
          categoryId = categoryCache.get(catName);
        } else {
          // Find or create category
          const category = await prisma.sawalJawabCategory.upsert({
            where: { name: catName },
            update: {},
            create: {
              name: catName,
              slug: catName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              sortOrder: 0
            }
          });
          categoryId = category.id;
          categoryCache.set(catName, categoryId);
        }

        await prisma.sawalJawab.create({
          data: {
            categoryId,
            question,
            questionHi: questionHi || "",
            answer,
            answerHi: answerHi || ""
          }
        });
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    return NextResponse.json({
      message: "Bulk upload completed",
      summary: {
        total: data.length,
        success: successCount,
        failed: errorCount
      },
      errors: errors.slice(0, 10) // Only send first 10 errors
    }, { status: 200 });

  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
