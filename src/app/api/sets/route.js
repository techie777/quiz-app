import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongoDb';
import { ObjectId } from 'mongodb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const setId = searchParams.get('setId');
    const topicId = searchParams.get('topicId');
    const categoryId = searchParams.get('categoryId');
    const examSlug = searchParams.get('examSlug');
    const stateSlug = searchParams.get('stateSlug');

    const db = await getDb();

    // 1. Fetch single set with populated questions
    if (setId) {
      let query = {};
      try {
        query._id = new ObjectId(setId);
      } catch {
        query._id = setId;
      }
      const quizSet = await db.collection('QuizSet').findOne(query);
      if (!quizSet) {
        return NextResponse.json({ error: 'Quiz set not found' }, { status: 404 });
      }

      // Populate questions in their exact frozen order
      const qObjectIds = (quizSet.questionIds || []).map(id => {
        try { return new ObjectId(id); } catch { return id; }
      });

      const rawQuestions = await db.collection('Question').find({
        _id: { $in: qObjectIds }
      }).toArray();

      const qMap = new Map();
      rawQuestions.forEach(q => {
        qMap.set(q._id.toString(), q);
      });

      // Preserve exact frozen sequence
      const populatedQuestions = (quizSet.questionIds || [])
        .map(id => qMap.get(id.toString()))
        .filter(Boolean)
        .map(q => {
          const opts = Array.isArray(q.options_list) && q.options_list.length > 0
            ? q.options_list
            : (Array.isArray(q.options) ? q.options : []);

          let correctIdx = typeof q.correct_index === 'number' ? q.correct_index : 0;
          let correctText = opts[correctIdx] || q.correctAnswer || opts[0] || '';

          return {
            id: q._id.toString(),
            _id: q._id.toString(),
            text: q.text_en || q.question || q.text || '',
            text_en: q.text_en || q.question || q.text || '',
            text_hi: q.text_hi || '',
            options: opts,
            options_list: opts,
            correctAnswer: correctText,
            correct_index: correctIdx,
            difficulty: q.difficulty || (q.difficulty_level === 3 ? 'hard' : q.difficulty_level === 2 ? 'medium' : 'easy'),
            difficulty_level: q.difficulty_level || 1,
            explanation: q.explanation || q.explanation_en || '',
            explanation_hi: q.explanation_hi || '',
          };
        });

      return NextResponse.json({
        set: {
          ...quizSet,
          _id: quizSet._id.toString(),
          questions: populatedQuestions,
        }
      });
    }

    // 2. Fetch list of sets for a topic, category, exam, or state
    const filter = { status: 'published' };
    if (topicId) {
      try { filter.topicId = new ObjectId(topicId); } catch { filter.topicId = topicId; }
    } else if (examSlug) {
      filter.examSlug = examSlug;
    } else if (stateSlug) {
      filter.stateSlug = stateSlug;
    } else if (categoryId) {
      try { filter.categoryId = new ObjectId(categoryId); } catch { filter.categoryId = categoryId; }
      filter.topicId = null;
    }

    const sets = await db.collection('QuizSet')
      .find(filter)
      .sort({ setIndex: 1 })
      .toArray();

    const formattedSets = sets.map(s => ({
      _id: s._id.toString(),
      setIndex: s.setIndex,
      title: s.title,
      titleHi: s.titleHi,
      questionCount: s.questionCount,
      difficultyBreakdown: s.difficultyBreakdown || { easy: 7, medium: 7, hard: 6 },
      isFrozen: s.isFrozen,
      topicId: s.topicId ? s.topicId.toString() : null,
      categoryId: s.categoryId ? s.categoryId.toString() : null,
      examSlug: s.examSlug || null,
      stateSlug: s.stateSlug || null,
    }));

    return NextResponse.json({
      count: formattedSets.length,
      sets: formattedSets
    });

  } catch (error) {
    console.error('Error fetching sets:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz sets' }, { status: 500 });
  }
}
