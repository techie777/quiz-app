import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const adminCheck = await requireAdmin({ masterOnly: true });
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const formData = await request.formData();
    const categoryId = formData.get("categoryId");
    const files = formData.getAll("images");

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const created = [];
    const errors = [];

    for (const file of files) {
      if (!file || typeof file === "string") continue;

      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: Not a valid image`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: File size exceeds 5MB`);
        continue;
      }

      try {
        // Save image to disk
        const timestamp = Date.now();
        const rand = Math.random().toString(36).substring(2, 8);
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
        const filename = `${timestamp}_${rand}_${safeName}`;
        const filepath = join(uploadsDir, filename);
        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        const imageUrl = `/uploads/${filename}`;

        // Create a draft question with just the image and placeholder data
        const question = await prisma.question.create({
          data: {
            text: `[Image Quiz] ${file.name.replace(/\.[^.]+$/, "")}`, // filename as placeholder title
            textHi: null,
            options: JSON.stringify(["Option A", "Option B", "Option C", "Option D"]),
            optionsHi: null,
            correctAnswer: "Option A",
            difficulty: "easy",
            image: imageUrl,
            explanation: null,
            categoryId: categoryId,
          },
        });

        created.push({
          id: question.id,
          image: imageUrl,
          originalName: file.name,
        });
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      errors,
      questions: created,
    });
  } catch (error) {
    return NextResponse.json({ error: "Bulk image upload failed: " + error.message }, { status: 500 });
  }
}
