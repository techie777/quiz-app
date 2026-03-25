import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Question from '@/models/Question';

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId, issue } = await request.json();

    if (!questionId || !issue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Connect to database
    await connectDB();

    // Save the report
    const report = {
      questionId,
      issue,
      reportedBy: session.user.id,
      reportedAt: new Date(),
      status: 'pending'
    };

    // You could save this to a reports collection or send an email
    // For now, we'll just log it and return success
    console.log('Question Report:', report);

    // TODO: Save to database or send notification to admin
    // await Report.create(report);

    return NextResponse.json({ 
      success: true, 
      message: 'Report submitted successfully' 
    });

  } catch (error) {
    console.error('Error reporting question:', error);
    return NextResponse.json({ 
      error: 'Failed to submit report' 
    }, { status: 500 });
  }
}
