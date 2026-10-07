import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongoDb';
import { buildArenaFilter, createSeededRandom, seededShuffle } from '@/lib/arenaHelper';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      count = 20,
      seed,
      weightWeakTopics = true,
      userId,
    } = body;

    const db = await getDb();
    const query = await buildArenaFilter(db, body);

    // Fetch up to 250 candidate questions matching the filters
    const candidates = await db.collection('Question')
      .find(query)
      .limit(250)
      .toArray();

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        questions: [],
        count: 0,
        message: 'No questions match the current criteria',
      });
    }

    let orderedCandidates = [...candidates];

    // Weak topics weighting
    if (weightWeakTopics && userId) {
      try {
        // Aggregate user accuracy per topic
        const topicStats = await db.collection('QuestionHistory').aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: "$topicId",
              total: { $sum: 1 },
              correct: { $sum: { $cond: ["$isCorrect", 1, 0] } }
            }
          }
        ]).toArray();

        const weakTopicIds = new Set();
        topicStats.forEach(t => {
          if (t._id && t.total >= 3) {
            const acc = t.correct / t.total;
            if (acc < 0.65) weakTopicIds.add(t._id.toString());
          }
        });

        if (weakTopicIds.size > 0) {
          const weakPool = [];
          const otherPool = [];
          candidates.forEach(c => {
            const tId = c.topic_id ? c.topic_id.toString() : null;
            if (tId && weakTopicIds.has(tId)) {
              weakPool.push(c);
            } else {
              otherPool.push(c);
            }
          });

          // Interleave or prioritize weak questions
          orderedCandidates = [...weakPool, ...otherPool];
        }
      } catch (err) {
        console.warn('Could not weight weak topics:', err.message);
      }
    }

    // Shuffling (seeded or random)
    let finalSelection;
    if (seed) {
      const rng = createSeededRandom(seed);
      finalSelection = seededShuffle(orderedCandidates, rng).slice(0, Math.min(count, orderedCandidates.length));
    } else {
      finalSelection = shuffle(orderedCandidates).slice(0, Math.min(count, orderedCandidates.length));
    }

    // Format questions consistently
    const formattedQuestions = finalSelection.map(q => {
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
        topicId: q.topic_id ? q.topic_id.toString() : null,
        categoryId: (q.categoryId || q.category_id) ? (q.categoryId || q.category_id).toString() : null,
        category: q.category || q.categoryName || q.category_name || (q.categoryId || q.category_id ? (q.categoryId || q.category_id).toString() : null),
        categoryName: q.categoryName || q.category_name || q.category || q.topicName || q.topic_name || null,
        categoryNameHi: q.categoryNameHi || q.category_name_hi || q.topicNameHi || q.topic_name_hi || null,
        topic: q.topic || q.topicName || q.topic_name || null,
        topicName: q.topicName || q.topic_name || q.topic || null,
        topicNameHi: q.topicNameHi || q.topic_name_hi || null,
        subTopic: q.subTopic || q.sub_topic || null,
      };
    });

    return NextResponse.json({
      count: formattedQuestions.length,
      questions: formattedQuestions,
      seed: seed || null,
    });

  } catch (error) {
    console.error('Error selecting arena questions:', error);
    return NextResponse.json({ error: 'Failed to select questions' }, { status: 500 });
  }
}
