import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const materialId = searchParams.get('materialId');

  if (!materialId) return NextResponse.json({ error: "Missing materialId" }, { status: 400 });

  try {
    const subjects = await prisma.studySubject.findMany({
      where: { materialId },
      orderBy: { sortOrder: 'asc' },
      include: {
        chapters: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Admin Fetch Study Hierarchy Error:", error);
    return NextResponse.json({ error: "Failed to fetch hierarchy" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { action, payload } = data; // action: 'saveSubject', 'saveChapter', 'deleteSubject', 'deleteChapter'
    
    if (action === 'saveSubject') {
      const { id, name, sortOrder, materialId } = payload;
      let subject;
      if (id) {
        subject = await prisma.studySubject.update({
          where: { id }, data: { name, sortOrder: Number(sortOrder) }
        });
      } else {
        subject = await prisma.studySubject.create({
          data: { name, sortOrder: Number(sortOrder), materialId }
        });
      }
      return NextResponse.json(subject);
    }
    
    if (action === 'saveChapter') {
      const { id, title, slug, content, videoId, sortOrder, subjectId, practiceId } = payload;
      let chapter;
      if (id) {
        chapter = await prisma.studyChapter.update({
          where: { id },
          data: { title, slug, content, videoId, sortOrder: Number(sortOrder), subjectId, practiceId: practiceId || null }
        });
      } else {
        chapter = await prisma.studyChapter.create({
          data: { title, slug, content, videoId, sortOrder: Number(sortOrder), subjectId, practiceId: practiceId || null }
        });
      }
      return NextResponse.json(chapter);
    }
    
    if (action === 'deleteSubject') {
      await prisma.studySubject.delete({ where: { id: payload.id } });
      return NextResponse.json({ success: true });
    }
    
    if (action === 'deleteChapter') {
      await prisma.studyChapter.delete({ where: { id: payload.id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
  } catch (error) {
    console.error("Admin Hierarchy API Error:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
