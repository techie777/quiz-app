import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/mongoDb';
import { ObjectId } from 'mongodb';

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    const body = await request.json();
    const { questionId, issue, details } = body;

    if (!questionId || !issue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();

    const reportDoc = {
      questionId: ObjectId.isValid(questionId) ? new ObjectId(questionId) : questionId,
      issue,
      details: details || issue,
      reportedBy: session?.user?.email || session?.user?.id || 'guest',
      reportedAt: now,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const res = await db.collection("QuestionReport").insertOne(reportDoc);

    return NextResponse.json({ 
      success: true, 
      reportId: res.insertedId.toString(),
      message: 'Report submitted successfully' 
    });

  } catch (error) {
    console.error('Error reporting question:', error);
    return NextResponse.json({ 
      error: 'Failed to submit report' 
    }, { status: 500 });
  }
}
