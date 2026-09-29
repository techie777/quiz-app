import { ObjectId } from 'mongodb';

/**
 * Seeded PRNG (Mulberry32)
 * Generates deterministic pseudo-random numbers in [0, 1) given a string or numeric seed.
 */
export function createSeededRandom(seedStr) {
  let h = 2166136261 >>> 0;
  const str = String(seedStr || 'quizweb-seed');
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }

  return function next() {
    let t = (h += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic shuffle using a seeded random function
 */
export function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds the MongoDB filter query for Quiz Arena based on user selection
 */
export async function buildArenaFilter(db, params = {}) {
  const {
    categories,
    topics,
    difficulties,
    audience,
    language,
    exam,
    state,
    excludeIds,
    skipCorrect,
    onlyWrong,
    onlyBookmarked,
    userId,
  } = params;

  const query = { status: 'published' };

  // 1. Categories
  if (Array.isArray(categories) && categories.length > 0) {
    const catObjectIds = categories.map(c => {
      try { return new ObjectId(c); } catch { return c; }
    });
    query.$or = [
      { categoryId: { $in: catObjectIds } },
      { category_id: { $in: catObjectIds } },
      { topicId: { $in: categories } },
      { topic_id: { $in: categories } },
      { category: { $in: categories } }
    ];
  }

  // 2. Topics
  if (Array.isArray(topics) && topics.length > 0) {
    const topicObjectIds = topics.map(t => {
      try { return new ObjectId(t); } catch { return t; }
    });
    const topicConditions = [
      { topic_id: { $in: topicObjectIds } },
      { topicId: { $in: topics } }
    ];
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: topicConditions }];
      delete query.$or;
    } else {
      query.$or = topicConditions;
    }
  }

  // 3. Difficulties (multi-select: easy, medium, hard, expert or 1, 2, 3, 4)
  if (Array.isArray(difficulties) && difficulties.length > 0 && !difficulties.includes('all')) {
    const levelMap = { easy: 1, medium: 2, hard: 3, expert: 4 };
    const levels = [];
    const strings = [];

    difficulties.forEach(d => {
      const lower = String(d).toLowerCase();
      if (levelMap[lower]) {
        levels.push(levelMap[lower]);
        strings.push(lower);
      } else if (typeof d === 'number') {
        levels.push(d);
      }
    });

    const diffConditions = [];
    if (strings.length > 0) diffConditions.push({ difficulty: { $in: strings } });
    if (levels.length > 0) diffConditions.push({ difficulty_level: { $in: levels } });

    if (diffConditions.length > 0) {
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: diffConditions }];
        delete query.$or;
      } else {
        query.$or = diffConditions;
      }
    }
  }

  // 4. Audience
  if (audience && audience !== 'all') {
    if (audience === 'kids') {
      query.audience = 'kids';
    } else if (audience === 'students') {
      query.audience = { $in: ['students', 'all', null] };
    } else if (audience === 'adults' || audience === 'explorer') {
      query.audience = { $in: ['adults', 'all', null] };
    }
  }

  // 5. Language
  if (language === 'hi') {
    query.text_hi = { $exists: true, $ne: '' };
  } else if (language === 'en') {
    // English is primary, text or text_en exists
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { text_en: { $exists: true, $ne: '' } },
        { question: { $exists: true, $ne: '' } },
        { text: { $exists: true, $ne: '' } },
      ]
    });
  }

  // 6. Exam
  if (exam) {
    const examList = Array.isArray(exam) ? exam : [exam];
    if (examList.length > 0 && !examList.includes('all')) {
      query.exam = { $in: examList };
    }
  }

  // 7. State
  if (state) {
    const stateList = Array.isArray(state) ? state : [state];
    if (stateList.length > 0 && !stateList.includes('all')) {
      query.state = { $in: stateList };
    }
  }

  // 8. Exclude recently answered IDs or custom excludeIds
  const excludeList = [];
  if (Array.isArray(excludeIds) && excludeIds.length > 0) {
    excludeIds.forEach(id => {
      try { excludeList.push(new ObjectId(id)); } catch {}
    });
  }

  // 9. Advanced Filters with User History
  if (userId) {
    // A. Skip questions user already got right
    if (skipCorrect) {
      const correctHistory = await db.collection('QuestionHistory')
        .find({ userId, isCorrect: true }, { projection: { questionId: 1 } })
        .toArray();
      correctHistory.forEach(h => {
        if (h.questionId) excludeList.push(h.questionId);
      });
    }

    // B. Only questions previously answered wrong
    if (onlyWrong) {
      const wrongHistory = await db.collection('QuestionHistory')
        .find({ userId, isCorrect: false }, { projection: { questionId: 1 } })
        .toArray();
      const wrongIds = wrongHistory.map(h => h.questionId).filter(Boolean);
      query._id = { $in: wrongIds };
    }

    // C. Only bookmarked / favourites
    if (onlyBookmarked) {
      const bookmarks = await db.collection('Favourite')
        .find({ userId }, { projection: { questionId: 1 } })
        .toArray();
      const bookmarkIds = bookmarks.map(b => {
        try { return new ObjectId(b.questionId); } catch { return b.questionId; }
      }).filter(Boolean);
      
      if (query._id && query._id.$in) {
        const idSet = new Set(bookmarkIds.map(id => id.toString()));
        query._id.$in = query._id.$in.filter(id => idSet.has(id.toString()));
      } else {
        query._id = { $in: bookmarkIds };
      }
    }
  }

  if (excludeList.length > 0) {
    if (query._id && query._id.$in) {
      const excludeSet = new Set(excludeList.map(id => id.toString()));
      query._id.$in = query._id.$in.filter(id => !excludeSet.has(id.toString()));
    } else {
      query._id = { $nin: excludeList };
    }
  }

  return query;
}
