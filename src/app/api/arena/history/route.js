import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongoDb';
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      userId = 'guest',
      attempts = [],
      quizType = 'arena',
      quizSessionId,
    } = body;

    if (!Array.isArray(attempts) || attempts.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const db = await getDb();

    // Ensure indexes on QuestionHistory
    await db.collection('QuestionHistory').createIndex({ userId: 1, questionId: 1 });
    await db.collection('QuestionHistory').createIndex({ userId: 1, next_review_at: 1 });
    await db.collection('QuestionHistory').createIndex({ userId: 1, isCorrect: 1 });

    const now = new Date();
    const bulkOps = [];
    const questionStatOps = [];

    for (const a of attempts) {
      if (!a.questionId) continue;

      let qId;
      try { qId = new ObjectId(a.questionId); } catch { qId = a.questionId; }

      // Spaced repetition interval: correct -> 3 days, incorrect -> 1 day
      const reviewIntervalDays = a.isCorrect ? 3 : 1;
      const nextReviewAt = new Date(now.getTime() + reviewIntervalDays * 24 * 60 * 60 * 1000);

      let topId = null;
      if (a.topicId) {
        try { topId = new ObjectId(a.topicId); } catch { topId = a.topicId; }
      }

      let catId = null;
      if (a.categoryId) {
        try { catId = new ObjectId(a.categoryId); } catch { catId = a.categoryId; }
      }

      bulkOps.push({
        updateOne: {
          filter: { userId, questionId: qId },
          update: {
            $set: {
              userId,
              questionId: qId,
              topicId: topId,
              categoryId: catId,
              isCorrect: Boolean(a.isCorrect),
              userAnswer: a.userAnswer ?? null,
              timeTaken: Number(a.timeTaken) || 0,
              attemptedAt: now,
              next_review_at: nextReviewAt,
              quizType,
              quizSessionId: quizSessionId || null,
            },
            $inc: {
              attemptCount: 1,
              correctCount: a.isCorrect ? 1 : 0,
            },
            $setOnInsert: {
              createdAt: now,
            },
          },
          upsert: true,
        },
      });

      // Update question aggregate attempts and correct count
      questionStatOps.push({
        updateOne: {
          filter: { _id: qId },
          update: {
            $inc: {
              attempts: 1,
              correct: a.isCorrect ? 1 : 0,
            },
          },
        },
      });
    }

    if (bulkOps.length > 0) {
      await db.collection('QuestionHistory').bulkWrite(bulkOps, { ordered: false });
    }

    if (questionStatOps.length > 0) {
      await db.collection('Question').bulkWrite(questionStatOps, { ordered: false }).catch(() => {});
    }

    // Free limit tracking: Record 1 set played today
    let dailySetQuotaUsed = 1;
    try {
      const todayStr = now.toISOString().slice(0, 10);
      const quotaRecord = await db.collection('DailySetUsage').findOneAndUpdate(
        { userId, date: todayStr },
        {
          $inc: { setsPlayed: 1 },
          $set: { updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, returnDocument: 'after' }
      );
      if (quotaRecord && quotaRecord.setsPlayed) {
        dailySetQuotaUsed = quotaRecord.setsPlayed;
      }
    } catch (e) {
      console.warn('Could not record daily set quota:', e.message);
    }

    return NextResponse.json({
      success: true,
      recordedAttempts: bulkOps.length,
      dailySetsPlayed: dailySetQuotaUsed,
    });

  } catch (error) {
    console.error('Error saving arena history:', error);
    return NextResponse.json({ error: 'Failed to record history' }, { status: 500 });
  }
}
