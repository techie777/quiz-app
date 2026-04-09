import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const sections = await prisma.section.findMany({
      include: {
        subSections: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    // Sort sub-sections by order as well
    const sortedSections = sections.map((section) => ({
      ...section,
      subSections: section.subSections.sort((a, b) => a.order - b.order),
    }));

    return NextResponse.json(sortedSections);
  } catch (error) {
    console.error("Failed to fetch sections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const { sections } = await request.json();

    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Use a transaction to ensure atomic update
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing sub-sections and sections
      // Since we use onDelete: Cascade, deleting sections will delete sub-sections
      await tx.subSection.deleteMany({});
      await tx.section.deleteMany({});

      // 2. Re-create all sections and sub-sections with their current state
      for (let i = 0; i < sections.length; i++) {
        const sectionData = sections[i];
        
        const createdSection = await tx.section.create({
          data: {
            name: sectionData.name,
            isVisible: sectionData.isVisible,
            order: sectionData.order || i + 1,
          },
        });

        if (sectionData.subSections && Array.isArray(sectionData.subSections)) {
          for (let j = 0; j < sectionData.subSections.length; j++) {
            const subSectionData = sectionData.subSections[j];
            await tx.subSection.create({
              data: {
                name: subSectionData.name,
                isVisible: subSectionData.isVisible,
                order: subSectionData.order || j + 1,
                quizIds: subSectionData.quizIds || [],
                sectionId: createdSection.id,
              },
            });
          }
        }
      }
    });

    // Log the activity
    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.admin.id,
        action: "update_sections",
        details: "Updated sections and sub-sections configuration",
      },
    });

    return NextResponse.json({ message: "Sections updated successfully" });
  } catch (error) {
    console.error("Failed to update sections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
