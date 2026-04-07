import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    if (type === 'boards') {
      const boards = await prisma.schoolBoard.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { classes: true } } }
      });
      return NextResponse.json({ success: true, boards });
    }

    if (type === 'classes') {
      const boardId = searchParams.get('boardId');
      const classes = await prisma.schoolClass.findMany({
        where: { boardId },
        orderBy: { number: 'asc' },
        include: { _count: { select: { subjects: true } } }
      });
      return NextResponse.json({ success: true, classes });
    }

    if (type === 'subjects') {
      const classId = searchParams.get('classId');
      const subjects = await prisma.schoolSubject.findMany({
        where: { classId },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { chapters: true } } }
      });
      return NextResponse.json({ success: true, subjects });
    }

    if (type === 'chapters') {
      const subjectId = searchParams.get('subjectId');
      const chapters = await prisma.schoolChapter.findMany({
        where: { subjectId },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { questions: true } } }
      });
      return NextResponse.json({ success: true, chapters });
    }

    if (type === 'questions') {
      const chapterId = searchParams.get('chapterId');
      const questions = await prisma.schoolQuestion.findMany({
        where: { chapterId },
        orderBy: { createdAt: 'asc' }
      });
      return NextResponse.json({ success: true, questions });
    }

    return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('School Study Admin GET Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { type, ...payload } = data;

    let result;
    if (type === 'board') {
      result = await prisma.schoolBoard.create({ data: payload });
    } else if (type === 'class') {
      result = await prisma.schoolClass.create({ data: payload });
    } else if (type === 'subject') {
      result = await prisma.schoolSubject.create({ data: payload });
    } else if (type === 'chapter') {
      result = await prisma.schoolChapter.create({ data: payload });
    } else if (type === 'question') {
      result = await prisma.schoolQuestion.create({ data: payload });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('School Study Admin POST Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const data = await req.json();
    const { type, id, ...payload } = data;

    let result;
    if (type === 'board') {
      result = await prisma.schoolBoard.update({ where: { id }, data: payload });
    } else if (type === 'class') {
      result = await prisma.schoolClass.update({ where: { id }, data: payload });
    } else if (type === 'subject') {
      result = await prisma.schoolSubject.update({ where: { id }, data: payload });
    } else if (type === 'chapter') {
      result = await prisma.schoolChapter.update({ where: { id }, data: payload });
    } else if (type === 'question') {
      result = await prisma.schoolQuestion.update({ where: { id }, data: payload });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('School Study Admin PUT Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  try {
    if (type === 'board') {
      await prisma.schoolBoard.delete({ where: { id } });
    } else if (type === 'class') {
      await prisma.schoolClass.delete({ where: { id } });
    } else if (type === 'subject') {
      await prisma.schoolSubject.delete({ where: { id } });
    } else if (type === 'chapter') {
      await prisma.schoolChapter.delete({ where: { id } });
    } else if (type === 'question') {
      await prisma.schoolQuestion.delete({ where: { id } });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('School Study Admin DELETE Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
