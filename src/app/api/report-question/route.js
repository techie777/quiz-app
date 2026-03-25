import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId, issue } = await request.json();

    if (!questionId || !issue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prepare report object
    const report = {
      questionId,
      issue,
      reportedBy: session.user.id || session.user.email,
      reportedAt: new Date(),
      status: 'pending'
    };

    // For now, we'll just log it and return success
    // TODO: Add Report model to prisma/schema.prisma and save it
    console.log('Question Report Received:', report);

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
