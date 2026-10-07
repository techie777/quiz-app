import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongoDb';
import { ObjectId } from 'mongodb';
import { getAdminFromRequest, requireAdmin } from '@/lib/adminSessionServer';

export const dynamic = 'force-dynamic';

async function verifyAuth() {
  const admin = await getAdminFromRequest();
  if (admin) return { ok: true, admin };
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true, admin: { role: 'master', username: 'dev-admin' } };
  }
  const check = await requireAdmin();
  return check;
}

// Helper to safely cast to ObjectId or string
function toObjectId(id) {
  if (!id) return null;
  if (ObjectId.isValid(id)) {
    try {
      return new ObjectId(id);
    } catch {
      return id;
    }
  }
  return id;
}

// In-memory cache for admin sets (TTL: 60s)
const ADMIN_SETS_CACHE = globalThis.__ADMIN_SETS_CACHE__ || (globalThis.__ADMIN_SETS_CACHE__ = new Map());

// --------------------------------------------------------------------------
// GET /api/admin/sets?categoryId=...&subCategoryId=...
// --------------------------------------------------------------------------
export async function GET(req) {
  try {
    const auth = await verifyAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const subCategoryId = searchParams.get('subCategoryId') || searchParams.get('topicId');
    const nocache = searchParams.get('nocache') === 'true' || searchParams.get('refresh') === 'true';

    if (!categoryId && !subCategoryId) {
      return NextResponse.json({ error: 'categoryId or subCategoryId is required' }, { status: 400 });
    }

    const cacheKey = `${categoryId || ''}:${subCategoryId || ''}`;
    const cached = ADMIN_SETS_CACHE.get(cacheKey);
    if (!nocache && cached && Date.now() - cached.timestamp < 30000) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const db = await getDb();
    const catObjId = toObjectId(categoryId);
    const subCatObjId = toObjectId(subCategoryId);

    // If viewing at the category level (no subcategory specified), check if the category has linked subcategories
    let childSubCatIds = [];
    if (!subCatObjId && catObjId) {
      const childCats = await db.collection('Category').find({
        $or: [
          { parentId: catObjId },
          { parentId: String(categoryId) },
        ],
        hidden: { $ne: true }
      }).project({ _id: 1 }).toArray();
      childSubCatIds = childCats.map(c => c._id);
    }

    const allTargetCatIds = [
      catObjId,
      String(categoryId),
      ...childSubCatIds,
      ...childSubCatIds.map(id => String(id)),
    ].filter(Boolean);

    // Build filter for QuizSet
    const setFilter = {};
    if (subCatObjId) {
      setFilter.$or = [
        { topicId: subCatObjId },
        { topicId: String(subCategoryId) },
        { categoryId: subCatObjId },
        { categoryId: String(subCategoryId) },
      ];
    } else if (catObjId) {
      setFilter.$or = [
        { categoryId: { $in: allTargetCatIds } },
        { topicId: { $in: allTargetCatIds } },
      ];
    }

    let existingSets = await db.collection('QuizSet')
      .find(setFilter)
      .sort({ setIndex: 1 })
      .toArray();

    // If no QuizSets exist yet, check if questions exist in Question collection
    // and materialize them into sets of 20
    if (existingSets.length === 0) {
      const qFilter = subCatObjId
        ? {
            $or: [
              { categoryId: subCatObjId },
              { categoryId: String(subCatObjId) },
              { category_id: subCatObjId },
              { category_id: String(subCatObjId) },
              { topicId: subCatObjId },
              { topicId: String(subCatObjId) },
              { topic_id: subCatObjId },
              { topic_id: String(subCatObjId) },
            ]
          }
        : {
            $or: [
              { categoryId: { $in: allTargetCatIds } },
              { category_id: { $in: allTargetCatIds } },
              { topicId: { $in: allTargetCatIds } },
              { topic_id: { $in: allTargetCatIds } },
            ]
          };

      const rawQuestions = await db.collection('Question')
        .find(qFilter, {
          projection: {
            _id: 1,
            text: 1,
            text_en: 1,
            text_hi: 1,
            options: 1,
            options_list: 1,
            correctAnswer: 1,
            correct_index: 1,
            difficulty: 1,
            difficulty_level: 1,
            tags: 1,
            questionType: 1,
            subCategory: 1,
            subject: 1,
          }
        })
        .sort({ _id: 1 })
        .toArray();

      if (rawQuestions.length > 0) {
        // Chunk into 20-question sets
        const chunkSize = 20;
        const now = new Date();
        const createdSets = [];

        for (let i = 0; i < rawQuestions.length; i += chunkSize) {
          const chunk = rawQuestions.slice(i, i + chunkSize);
          const setIndex = Math.floor(i / chunkSize) + 1;

          let easy = 0, medium = 0, hard = 0, expert = 0;
          chunk.forEach(q => {
            const diff = (q.difficulty || '').toLowerCase();
            if (diff === 'expert') expert++;
            else if (diff === 'hard') hard++;
            else if (diff === 'medium') medium++;
            else easy++;
          });

          const setDoc = {
            _id: new ObjectId(),
            categoryId: catObjId || subCatObjId,
            topicId: subCatObjId || null,
            setIndex,
            title: `Set ${setIndex}`,
            titleHi: `सेट ${setIndex}`,
            questionIds: chunk.map(q => q._id),
            questionCount: chunk.length,
            difficultyBreakdown: { easy, medium, hard, expert },
            isFrozen: true,
            status: 'published',
            createdAt: now,
            updatedAt: now,
          };

          await db.collection('QuizSet').insertOne(setDoc);
          createdSets.push(setDoc);
        }

        existingSets = createdSets;
      }
    }

    // Self-healing 1: If any existing set has > 20 questions, automatically split into 20-question chunks
    const oversizedSets = existingSets.filter(s => (s.questionIds || []).length > 20);
    if (oversizedSets.length > 0) {
      for (const overSet of oversizedSets) {
        const qids = overSet.questionIds || [];
        const originalId = overSet._id;
        const setCreatedAt = overSet.createdAt || new Date();

        const firstChunk = qids.slice(0, 20);
        await db.collection('QuizSet').updateOne(
          { _id: originalId },
          {
            $set: {
              questionIds: firstChunk,
              questionCount: firstChunk.length,
              updatedAt: new Date(),
            }
          }
        );
        overSet.questionIds = firstChunk;
        overSet.questionCount = firstChunk.length;

        let nextIdx = existingSets.reduce((max, s) => Math.max(max, s.setIndex || 0), 0) + 1;
        for (let i = 20; i < qids.length; i += 20) {
          const chunk = qids.slice(i, i + 20);
          const newDoc = {
            _id: new ObjectId(),
            categoryId: overSet.categoryId,
            topicId: overSet.topicId,
            setIndex: nextIdx,
            title: `Set ${nextIdx}`,
            titleHi: `सेट ${nextIdx}`,
            questionIds: chunk,
            questionCount: chunk.length,
            difficultyBreakdown: { easy: 0, medium: 0, hard: 0, expert: 0 },
            isFrozen: true,
            status: 'published',
            createdAt: setCreatedAt,
            updatedAt: new Date(),
          };
          await db.collection('QuizSet').insertOne(newDoc);
          existingSets.push(newDoc);
          nextIdx++;
        }
      }
      existingSets.sort((a, b) => (a.setIndex || 0) - (b.setIndex || 0));
    }

    // Self-healing 2: Check if any questions in Question collection are unassigned to sets
    const assignedQIdSet = new Set();
    existingSets.forEach(s => {
      (s.questionIds || []).forEach(qid => assignedQIdSet.add(qid.toString()));
    });

    const unassignedQFilter = subCatObjId
      ? {
          $or: [
            { categoryId: subCatObjId },
            { categoryId: String(subCatObjId) },
            { category_id: subCatObjId },
            { category_id: String(subCatObjId) },
            { topicId: subCatObjId },
            { topicId: String(subCatObjId) },
            { topic_id: subCatObjId },
            { topic_id: String(subCatObjId) },
          ]
        }
      : {
          $or: [
            { categoryId: { $in: allTargetCatIds } },
            { category_id: { $in: allTargetCatIds } },
            { topicId: { $in: allTargetCatIds } },
            { topic_id: { $in: allTargetCatIds } },
          ]
        };

    const unassignedQuestions = await db.collection('Question')
      .find({
        ...unassignedQFilter,
        _id: { $nin: Array.from(assignedQIdSet).map(id => toObjectId(id)).filter(Boolean) }
      }, {
        projection: {
          _id: 1,
          difficulty: 1,
          createdAt: 1,
        }
      })
      .sort({ _id: 1 })
      .toArray();

    if (unassignedQuestions.length > 0) {
      let maxSetIndex = existingSets.reduce((max, s) => Math.max(max, s.setIndex || 0), 0);
      const chunkSize = 20;
      const now = new Date();
      const newlyCreatedSets = [];

      for (let i = 0; i < unassignedQuestions.length; i += chunkSize) {
        const chunk = unassignedQuestions.slice(i, i + chunkSize);
        maxSetIndex++;

        let easy = 0, medium = 0, hard = 0, expert = 0;
        chunk.forEach(q => {
          const diff = (q.difficulty || '').toLowerCase();
          if (diff === 'expert') expert++;
          else if (diff === 'hard') hard++;
          else if (diff === 'medium') medium++;
          else easy++;
        });

        const setDoc = {
          _id: new ObjectId(),
          categoryId: catObjId || subCatObjId,
          topicId: subCatObjId || null,
          setIndex: maxSetIndex,
          title: `Set ${maxSetIndex}`,
          titleHi: `सेट ${maxSetIndex}`,
          questionIds: chunk.map(q => q._id),
          questionCount: chunk.length,
          difficultyBreakdown: { easy, medium, hard, expert },
          isFrozen: true,
          status: 'published',
          createdAt: chunk[0]?.createdAt || now,
          updatedAt: now,
        };

        await db.collection('QuizSet').insertOne(setDoc);
        newlyCreatedSets.push(setDoc);
      }

      existingSets = [...existingSets, ...newlyCreatedSets].sort((a, b) => (a.setIndex || 0) - (b.setIndex || 0));
    }

    // Now populate questions for all sets
    const allQuestionIds = [];
    existingSets.forEach(s => {
      (s.questionIds || []).forEach(qid => {
        allQuestionIds.push(toObjectId(qid));
      });
    });

    const questionsList = await db.collection('Question')
      .find({ _id: { $in: allQuestionIds } }, {
        projection: {
          _id: 1,
          text: 1,
          text_en: 1,
          text_hi: 1,
          options: 1,
          options_list: 1,
          correctAnswer: 1,
          correct_index: 1,
          difficulty: 1,
          difficulty_level: 1,
          tags: 1,
          questionType: 1,
          subCategory: 1,
          subject: 1,
        }
      })
      .toArray();

    const qMap = new Map();
    questionsList.forEach(q => {
      qMap.set(q._id.toString(), q);
    });

    const formattedSets = existingSets.map(s => {
      const populatedQuestions = (s.questionIds || [])
        .map(qid => {
          const q = qMap.get(qid.toString());
          if (!q) return null;

          const opts = Array.isArray(q.options_list) && q.options_list.length > 0
            ? q.options_list
            : (Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options || '[]') : []));

          const correctIdx = typeof q.correct_index === 'number' ? q.correct_index : 0;
          const correctText = opts[correctIdx] || q.correctAnswer || opts[0] || '';

          return {
            _id: q._id.toString(),
            id: q._id.toString(),
            text: q.text || q.text_en || q.question || '',
            text_en: q.text_en || q.text || q.question || '',
            text_hi: q.text_hi || '',
            options: opts,
            correctAnswer: correctText,
            correct_index: correctIdx,
            difficulty: q.difficulty || (q.difficulty_level === 3 ? 'hard' : q.difficulty_level === 2 ? 'medium' : 'easy'),
            difficulty_level: q.difficulty_level || 1,
            tags: q.tags || [],
            type: q.type || 'MCQ',
            subject: q.subject || q.subjectName || '',
            topic: q.topic || q.topicName || '',
            explanation: q.explanation || q.explanation_en || '',
          };
        })
        .filter(Boolean);

      return {
        _id: s._id.toString(),
        setIndex: s.setIndex,
        title: s.title || `Set ${s.setIndex}`,
        titleHi: s.titleHi || `सेट ${s.setIndex}`,
        questionCount: populatedQuestions.length,
        difficultyBreakdown: s.difficultyBreakdown || { easy: 0, medium: 0, hard: 0, expert: 0 },
        status: s.status || 'published',
        isFrozen: s.isFrozen ?? true,
        categoryId: s.categoryId?.toString() || null,
        topicId: s.topicId?.toString() || null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        questions: populatedQuestions,
      };
    });

    const payload = {
      success: true,
      count: formattedSets.length,
      sets: formattedSets,
    };
    ADMIN_SETS_CACHE.set(cacheKey, { data: payload, timestamp: Date.now() });

    return NextResponse.json(payload, {
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (error) {
    console.error('Error fetching admin sets:', error);
    return NextResponse.json({ error: 'Failed to fetch sets', details: error.message }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// POST /api/admin/sets: Create a new set from 20 parsed questions
// --------------------------------------------------------------------------
export async function POST(req) {
  try {
    const auth = await verifyAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const body = await req.json();
    const {
      categoryId,
      subCategoryId,
      categoryName,
      subCategoryName,
      questions,
      title,
      titleHi,
    } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'At least 1 question is required' }, { status: 400 });
    }

    const db = await getDb();
    let catObjId = toObjectId(categoryId);
    let subCatObjId = toObjectId(subCategoryId);

    // If categoryId wasn't passed, try to look up by name
    let categoryDoc = null;
    if (catObjId) {
      categoryDoc = await db.collection('Category').findOne({ _id: catObjId });
    } else if (categoryName) {
      categoryDoc = await db.collection('Category').findOne({
        topic: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') }
      });
      if (categoryDoc) catObjId = categoryDoc._id;
    }

    // If subCategoryId wasn't passed, try to look up subcategory by name
    let subCategoryDoc = null;
    if (subCatObjId) {
      subCategoryDoc = await db.collection('Category').findOne({ _id: subCatObjId });
    } else if (subCategoryName) {
      subCategoryDoc = await db.collection('Category').findOne({
        topic: { $regex: new RegExp(`^${subCategoryName.trim()}$`, 'i') },
        parentId: catObjId,
      });
      if (subCategoryDoc) subCatObjId = subCategoryDoc._id;
    }

    // Determine target category for Question documents
    const targetCatId = subCatObjId || catObjId;
    const catNameResolved = subCategoryDoc?.topic || categoryDoc?.topic || categoryName || 'General';

    // Find the next available setIndex
    const highestSet = await db.collection('QuizSet')
      .find({
        $or: [
          { categoryId: targetCatId },
          { categoryId: String(targetCatId) },
          ...(subCatObjId ? [{ topicId: subCatObjId }, { topicId: String(subCatObjId) }] : [])
        ]
      })
      .sort({ setIndex: -1 })
      .limit(1)
      .toArray();

    const nextSetIndex = (highestSet[0]?.setIndex || 0) + 1;
    const now = new Date();

    // Prepare Question documents
    let easyCount = 0, mediumCount = 0, hardCount = 0, expertCount = 0;

    const questionDocs = questions.map(q => {
      const qId = new ObjectId();
      const diff = (q.difficulty || 'easy').toLowerCase();
      let diffLevel = 1;
      if (diff === 'expert') { diffLevel = 4; expertCount++; }
      else if (diff === 'hard') { diffLevel = 3; hardCount++; }
      else if (diff === 'medium') { diffLevel = 2; mediumCount++; }
      else { diffLevel = 1; easyCount++; }

      const options = Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'];
      const correctIdx = typeof q.correct_index === 'number' && q.correct_index >= 0 && q.correct_index < options.length
        ? q.correct_index
        : 0;
      const correctText = q.correctAnswer || options[correctIdx] || options[0] || '';

      const isHindi = /[\u0900-\u097F]/.test(q.question || q.text || '');

      return {
        _id: qId,
        text: q.question || q.text || '',
        text_en: q.question || q.text || '',
        text_hi: isHindi ? (q.question || q.text || '') : (q.text_hi || ''),
        options: JSON.stringify(options),
        options_list: options,
        correctAnswer: correctText,
        correct_index: correctIdx,
        correct: correctIdx,
        difficulty: diff,
        difficulty_level: diffLevel,
        type: q.questionType || q.type || 'MCQ',
        tags: Array.isArray(q.keywords) ? q.keywords : (Array.isArray(q.tags) ? q.tags : []),
        subject: q.subject || q.subjectName || '',
        subjectName: q.subject || q.subjectName || '',
        topic: q.topic || q.topicName || '',
        topicName: q.topic || q.topicName || '',
        categoryId: targetCatId,
        category_id: targetCatId,
        category: catNameResolved,
        masterCategory: categoryDoc?.topic || 'General',
        topicId: subCatObjId ? subCatObjId : null,
        topic_id: subCatObjId ? subCatObjId : null,
        status: 'published',
        audience: ['explorer'],
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      };
    });

    // 1. Insert questions into Question collection
    await db.collection('Question').insertMany(questionDocs);

    // 2. Auto-chunk questions into sets of 20 (e.g. 200 questions -> 10 sets)
    const CHUNK_SIZE = 20;
    const createdSets = [];
    let currentSetIndex = nextSetIndex;

    for (let i = 0; i < questionDocs.length; i += CHUNK_SIZE) {
      const chunk = questionDocs.slice(i, i + CHUNK_SIZE);
      const setIdx = currentSetIndex++;

      let easy = 0, medium = 0, hard = 0, expert = 0;
      chunk.forEach(q => {
        const diff = (q.difficulty || 'easy').toLowerCase();
        if (diff === 'expert') expert++;
        else if (diff === 'hard') hard++;
        else if (diff === 'medium') medium++;
        else easy++;
      });

      const setDoc = {
        _id: new ObjectId(),
        categoryId: catObjId || targetCatId,
        topicId: subCatObjId || null,
        setIndex: setIdx,
        title: title && questionDocs.length <= CHUNK_SIZE ? title : `Set ${setIdx}`,
        titleHi: titleHi && questionDocs.length <= CHUNK_SIZE ? titleHi : `सेट ${setIdx}`,
        questionIds: chunk.map(q => q._id),
        questionCount: chunk.length,
        difficultyBreakdown: { easy, medium, hard, expert },
        isFrozen: true,
        status: 'published',
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('QuizSet').insertOne(setDoc);
      createdSets.push(setDoc);
    }

    // 3. Update questionCount and touch updatedAt on Category
    if (targetCatId) {
      const actualCount = await db.collection('Question').countDocuments({
        $or: [
          { categoryId: targetCatId },
          { category_id: targetCatId },
          { categoryId: String(targetCatId) },
          { category_id: String(targetCatId) },
        ]
      });
      await db.collection('Category').updateOne(
        { _id: targetCatId },
        { $set: { questionCount: actualCount, updatedAt: now } }
      );
    }
    if (categoryDoc && categoryDoc._id && categoryDoc._id.toString() !== targetCatId?.toString()) {
      const parentActualCount = await db.collection('Question').countDocuments({
        $or: [
          { categoryId: categoryDoc._id },
          { category_id: categoryDoc._id },
          { categoryId: String(categoryDoc._id) },
          { category_id: String(categoryDoc._id) },
        ]
      });
      await db.collection('Category').updateOne(
        { _id: categoryDoc._id },
        { $set: { questionCount: parentActualCount, updatedAt: now } }
      );
    }

    ADMIN_SETS_CACHE.clear();
    if (globalThis.__CATEGORY_CACHE__) globalThis.__CATEGORY_CACHE__.clear();

    const pluralSets = createdSets.length === 1 ? '1 set' : `${createdSets.length} sets`;
    return NextResponse.json({
      success: true,
      message: `Created ${pluralSets} (${questionDocs.length} questions total) successfully!`,
      createdCount: createdSets.length,
      sets: createdSets.map(s => ({
        ...s,
        _id: s._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Error creating set:', error);
    return NextResponse.json({ error: 'Failed to create set', details: error.message }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// PATCH /api/admin/sets: Toggle status (hide/unhide), update title or questions
// --------------------------------------------------------------------------
export async function PATCH(req) {
  try {
    const auth = await verifyAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const body = await req.json();

    // Reorder sets in bulk
    if (body.reorder && Array.isArray(body.orderedSetIds)) {
      const db = await getDb();
      for (let i = 0; i < body.orderedSetIds.length; i++) {
        const sid = toObjectId(body.orderedSetIds[i]);
        if (sid) {
          await db.collection('QuizSet').updateOne(
            { _id: sid },
            { $set: { setIndex: i + 1, updatedAt: new Date() } }
          );
        }
      }
      ADMIN_SETS_CACHE.clear();
      return NextResponse.json({ success: true, message: 'Sets reordered successfully' });
    }

    const { setId, status, title, titleHi, setTags, questionUpdates } = body;

    if (!setId) {
      return NextResponse.json({ error: 'setId is required' }, { status: 400 });
    }

    const db = await getDb();
    const setObjId = toObjectId(setId);
    const now = new Date();

    const setUpdates = { updatedAt: now };
    if (status) setUpdates.status = status;
    if (title) setUpdates.title = title;
    if (titleHi) setUpdates.titleHi = titleHi;
    if (setTags !== undefined) {
      const tagsList = Array.isArray(setTags)
        ? setTags.map(t => String(t).trim()).filter(Boolean)
        : typeof setTags === 'string'
        ? setTags.split(/[,،]+/).map(t => t.trim()).filter(Boolean)
        : [];
      setUpdates.tags = tagsList;

      // Also apply these tags to all questions in this set
      const currentSet = await db.collection('QuizSet').findOne({ _id: setObjId });
      if (currentSet?.questionIds && Array.isArray(currentSet.questionIds)) {
        await db.collection('Question').updateMany(
          { _id: { $in: currentSet.questionIds } },
          { $set: { tags: tagsList, updatedAt: now } }
        );
      }
    }

    // Update QuizSet
    await db.collection('QuizSet').updateOne(
      { _id: setObjId },
      { $set: setUpdates }
    );

    // If individual question was edited
    if (questionUpdates && questionUpdates._id) {
      const qObjId = toObjectId(questionUpdates._id);
      const qFields = { updatedAt: now };

      if (questionUpdates.text) {
        qFields.text = questionUpdates.text;
        qFields.text_en = questionUpdates.text;
        if (/[\u0900-\u097F]/.test(questionUpdates.text)) {
          qFields.text_hi = questionUpdates.text;
        }
      }
      if (Array.isArray(questionUpdates.options)) {
        qFields.options = JSON.stringify(questionUpdates.options);
        qFields.options_list = questionUpdates.options;
      }
      if (typeof questionUpdates.correct_index === 'number') {
        qFields.correct_index = questionUpdates.correct_index;
        qFields.correct = questionUpdates.correct_index;
        if (Array.isArray(questionUpdates.options)) {
          qFields.correctAnswer = questionUpdates.options[questionUpdates.correct_index] || '';
        }
      }
      if (questionUpdates.difficulty) {
        const diff = questionUpdates.difficulty.toLowerCase();
        qFields.difficulty = diff;
        qFields.difficulty_level = diff === 'expert' ? 4 : diff === 'hard' ? 3 : diff === 'medium' ? 2 : 1;
      }
      if (questionUpdates.tags !== undefined) {
        const tagsArr = Array.isArray(questionUpdates.tags)
          ? questionUpdates.tags.map(t => String(t).trim()).filter(Boolean)
          : typeof questionUpdates.tags === 'string'
          ? questionUpdates.tags.split(/[,،]+/).map(t => t.trim()).filter(Boolean)
          : [];
        qFields.tags = tagsArr;
      }
      if (questionUpdates.subject !== undefined) {
        qFields.subject = questionUpdates.subject;
        qFields.subjectName = questionUpdates.subject;
      }
      if (questionUpdates.topic !== undefined) {
        qFields.topic = questionUpdates.topic;
        qFields.topicName = questionUpdates.topic;
      }

      await db.collection('Question').updateOne(
        { _id: qObjId },
        { $set: qFields }
      );
    }

    ADMIN_SETS_CACHE.clear();
    if (globalThis.__CATEGORY_CACHE__) globalThis.__CATEGORY_CACHE__.clear();

    return NextResponse.json({ success: true, message: 'Set and question updated successfully' });
  } catch (error) {
    console.error('Error updating set:', error);
    return NextResponse.json({ error: 'Failed to update set', details: error.message }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// DELETE /api/admin/sets?setId=... OR body { setIds: [...] }
// --------------------------------------------------------------------------
export async function DELETE(req) {
  try {
    const auth = await verifyAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    let setIds = [];
    let deleteQuestions = true;

    // 1. Try URL parameters
    const { searchParams } = new URL(req.url);
    const singleSetId = searchParams.get('setId');
    const paramSetIds = searchParams.get('setIds');
    if (searchParams.has('deleteQuestions')) {
      deleteQuestions = searchParams.get('deleteQuestions') !== 'false';
    }

    if (singleSetId) {
      setIds = [singleSetId];
    } else if (paramSetIds) {
      setIds = paramSetIds.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      // 2. Try JSON request body
      try {
        const body = await req.json();
        if (Array.isArray(body?.setIds)) {
          setIds = body.setIds;
        } else if (body?.setId) {
          setIds = [body.setId];
        }
        if (typeof body?.deleteQuestions === 'boolean') {
          deleteQuestions = body.deleteQuestions;
        }
      } catch {
        // no json body
      }
    }

    if (!setIds || setIds.length === 0) {
      return NextResponse.json({ error: 'setId or setIds is required' }, { status: 400 });
    }

    const db = await getDb();
    const setObjIds = setIds.map(id => toObjectId(id)).filter(Boolean);

    const quizSets = await db.collection('QuizSet').find({ _id: { $in: setObjIds } }).toArray();
    if (quizSets.length === 0) {
      return NextResponse.json({ error: 'No matching quiz sets found' }, { status: 404 });
    }

    // Collect all question IDs from all target sets
    let allQuestionObjIds = [];
    const affectedCatIds = new Set();

    quizSets.forEach(s => {
      if (s.categoryId) affectedCatIds.add(s.categoryId.toString());
      if (Array.isArray(s.questionIds)) {
        s.questionIds.forEach(qid => {
          const objId = toObjectId(qid);
          if (objId) allQuestionObjIds.push(objId);
        });
      }
    });

    // Delete associated questions if requested
    if (deleteQuestions && allQuestionObjIds.length > 0) {
      await db.collection('Question').deleteMany({ _id: { $in: allQuestionObjIds } });
    }

    // Delete the QuizSet documents
    const deleteResult = await db.collection('QuizSet').deleteMany({ _id: { $in: setObjIds } });

    // Recount category questions and update Category for all affected categories
    for (const catIdStr of affectedCatIds) {
      const catObjId = toObjectId(catIdStr);
      const remainingCount = await db.collection('Question').countDocuments({
        $or: [
          { categoryId: catObjId },
          { category_id: catObjId },
          { categoryId: catIdStr },
          { category_id: catIdStr },
        ]
      });
      await db.collection('Category').updateOne(
        { _id: catObjId },
        { $set: { questionCount: remainingCount, updatedAt: new Date() } }
      );
    }

    ADMIN_SETS_CACHE.clear();
    if (globalThis.__CATEGORY_CACHE__) globalThis.__CATEGORY_CACHE__.clear();

    const plural = setObjIds.length === 1 ? '1 set' : `${setObjIds.length} sets`;
    return NextResponse.json({
      success: true,
      message: `Deleted ${plural} successfully${deleteQuestions ? ` along with ${allQuestionObjIds.length} questions` : ''}`,
      deletedCount: deleteResult.deletedCount,
      deletedQuestionsCount: deleteQuestions ? allQuestionObjIds.length : 0,
    });
  } catch (error) {
    console.error('Error deleting set(s):', error);
    return NextResponse.json({ error: 'Failed to delete set(s)', details: error.message }, { status: 500 });
  }
}
