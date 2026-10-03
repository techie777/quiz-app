import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

export async function POST(request) {
  try {
    let data = [];
    
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      // Smart Batching Mode
      const body = await request.json();
      data = body.rows || [];
    } else {
      // Traditional File Upload Mode
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      
      const buffer = await file.arrayBuffer();
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(sheet);
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No data found to import" }, { status: 400 });
    }

    let importedCount = 0;
    
    // Process unique categories in this batch
    const categoryNames = [...new Set(data.map(row => {
      const enName = row.Category?.trim();
      const hiName = row["Category (Hindi)"]?.trim();
      return enName || hiName;
    }).filter(Boolean))];
    
    const categoryMap = new Map();
    
    for (const name of categoryNames) {
      const row = data.find(r => (r.Category?.trim() || r["Category (Hindi)"]?.trim()) === name);
      const enName = row.Category?.trim() || name;
      const hiName = row["Category (Hindi)"]?.trim();
      const slug = enName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      let cat = await prisma.funFactCategory.findUnique({ where: { slug } });
      if (!cat) {
        cat = await prisma.funFactCategory.create({ 
          data: { 
            name: enName, 
            nameHi: hiName || null,
            slug,
            image: row["Category Image URL"] || null
          } 
        });
      }
      categoryMap.set(name, cat.id);
    }
    
    for (const row of data) {
      const type = (row["Type"] || row["type"] || "fact").toLowerCase().trim();
      const catNameRaw = row.Category?.trim() || row["Category (Hindi)"]?.trim() || "General";
      const catHi = row["Category (Hindi)"]?.trim() || null;
      const textEn = (row["Text EN"] || row["Text En"] || row["Fun Fact Description"] || row["Statement"] || "").trim();
      const textHi = (row["Text HI"] || row["Text Hi"] || row["Fun Fact Description (Hindi)"] || row["Statement (Hindi)"] || "").trim();
      const explEn = (row["Explanation EN"] || row["Explanation En"] || row["Explanation"] || "").trim();
      const explHi = (row["Explanation HI"] || row["Explanation Hi"] || "").trim();
      const illustrationKey = (row["Illustration Key"] || row["illustrationKey"] || "").trim();
      const source = (row["Source"] || row["source"] || "").trim();
      const imageUrl = row["Image URL"] || row["Category Image URL"] || null;

      if (!textEn && !textHi) continue;

      if (type === "tf" || type === "truefalse" || type === "true-false") {
        // True / False Upload
        const catSlug = catNameRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        let tfCat = await prisma.trueFalseCategory.findUnique({ where: { slug: catSlug } });
        if (!tfCat) {
          tfCat = await prisma.trueFalseCategory.create({
            data: {
              name: catNameRaw,
              nameHi: catHi,
              slug: catSlug,
              image: imageUrl
            }
          });
        }

        const rawAns = String(row["Answer (for tf)"] || row["Answer"] || "true").toLowerCase().trim();
        const correctAnswer = ["true", "1", "t", "yes", "y", "सही"].includes(rawAns);

        const existingTf = await prisma.trueFalseQuestion.findFirst({
          where: {
            categoryId: tfCat.id,
            OR: [
              { statement: textEn || textHi },
              ...(textHi ? [{ statementHi: textHi }] : [])
            ]
          }
        });

        if (!existingTf) {
          await prisma.trueFalseQuestion.create({
            data: {
              categoryId: tfCat.id,
              statement: textEn || textHi,
              statementHi: textHi || null,
              correctAnswer,
              explanation: explEn || null,
              explanationHi: explHi || null,
              image: imageUrl,
              views: 0,
              hidden: false
            }
          });
          importedCount++;
        }
      } else {
        // Fun Fact Upload
        const catId = categoryMap.get(catNameRaw);
        if (catId) {
          const existing = await prisma.funFact.findFirst({
            where: {
              categoryId: catId,
              OR: [
                { description: textEn || textHi },
                ...(textHi ? [{ descriptionHi: textHi }] : [])
              ]
            }
          });

          if (!existing) {
            await prisma.funFact.create({
              data: {
                categoryId: catId,
                description: textEn || textHi,
                descriptionHi: textHi || null,
                image: imageUrl,
                views: 0,
                hidden: false
              }
            });
            importedCount++;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      importedCount,
      message: `Successfully processed ${importedCount} items.`
    }, { status: 201 });

  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ 
      error: "Import failed", 
      details: error.message 
    }, { status: 500 });
  }
}
