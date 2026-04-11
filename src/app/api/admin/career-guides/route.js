import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const guides = await prisma.careerGuide.findMany({
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json({ success: true, guides });
  } catch (error) {
    console.error('Error fetching career guides:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const data = await req.json();
    const { sections, ...guideData } = data;

    const newGuide = await prisma.careerGuide.create({
      data: {
        ...guideData,
        type: guideData.type || "JOB",
        careerCategoryId: guideData.careerCategoryId || null,
        sections: {
          create: sections || []
        }
      },
      include: { sections: true }
    });
    return NextResponse.json({ success: true, guide: newGuide });
  } catch (error) {
    console.error('Error creating career guide:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const data = await req.json();
    const { id, sections, ...guideData } = data;

    // Delete existing sections to easily insert the re-ordered/newly edited ones
    await prisma.careerSection.deleteMany({
      where: { careerGuideId: id }
    });

    // Reconstruct sections ensuring no nested 'id' fields get pushed accidentally to prisma
    const cleanSections = (sections || []).map((s, index) => ({
      title: s.title,
      titleHi: s.titleHi || "",
      type: s.type,
      content: s.content,
      contentHi: s.contentHi || "",
      sortOrder: index + 1
    }));

    const updatedGuide = await prisma.careerGuide.update({
      where: { id: id },
      data: {
        ...guideData,
        type: guideData.type || "JOB",
        careerCategoryId: guideData.careerCategoryId || null,
        sections: {
          create: cleanSections
        }
      },
      include: { sections: true }
    });
    return NextResponse.json({ success: true, guide: updatedGuide });
  } catch (error) {
    console.error('Error updating career guide:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    await prisma.careerGuide.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting career guide:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
