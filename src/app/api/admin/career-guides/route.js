import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
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
  try {
    const data = await req.json();
    const { sections, ...guideData } = data;

    const newGuide = await prisma.careerGuide.create({
      data: {
        ...guideData,
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
      type: s.type,
      content: s.content,
      sortOrder: index + 1
    }));

    const updatedGuide = await prisma.careerGuide.update({
      where: { id: id },
      data: {
        ...guideData,
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
