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
    
    const factsToCreate = [];
    for (const row of data) {
      const catNameRaw = row.Category?.trim() || row["Category (Hindi)"]?.trim() || "General";
      const desc = row["Fun Fact Description"]?.trim();
      const descHi = row["Fun Fact Description (Hindi)"]?.trim();
      const imageUrl = row["Image URL"] || row["Category Image URL"];
      
      const catId = categoryMap.get(catNameRaw);
      
      if (catId) {
        factsToCreate.push({
          categoryId: catId,
          description: desc || descHi || "New Fact", // Ensure description is never empty
          descriptionHi: descHi || null,
          image: imageUrl || null,
          views: 0,
          hidden: false
        });
      }
    }
    
    if (factsToCreate.length > 0) {
      for (const factData of factsToCreate) {
        try {
          await prisma.funFact.create({ data: factData });
          importedCount++;
        } catch (err) {
          console.error("Error creating individual fact:", err);
          // Continue with next fact
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      importedCount,
      message: `Successfully processed ${importedCount} facts.`
    }, { status: 201 });

  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ 
      error: "Import failed", 
      details: error.message 
    }, { status: 500 });
  }
}
