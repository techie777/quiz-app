import { GK_CATEGORIES } from "./gkData";

export function slugify(text) {
  if (!text) return "";
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/**
 * Resolves or auto-creates the 4-level hierarchy:
 * Master Category > Sub Category > Topic > Subject
 */
const catCache = new Map();
const topicCache = new Map();
const subjectCache = new Map();

export async function resolveHierarchy(db, {
  masterCategory = "GK",
  category = "India GK",
  topic = "General Knowledge",
  subject = "",
}) {
  const cleanMaster = String(masterCategory || "GK").trim();
  const cleanCategory = String(category || "India GK").trim();
  const cleanTopic = String(topic || "General Knowledge").trim();
  // Rule 3: If subject is missing, fallback to topic name
  const cleanSubject = String(subject || cleanTopic).trim();

  // 1. Resolve or Create Category (in Category collection for app-wide compatibility)
  const catCol = db.collection("Category");
  const catCacheKey = cleanCategory.toLowerCase();
  let catDoc = catCache.get(catCacheKey);
  if (!catDoc) {
    catDoc = await catCol.findOne({
      $or: [
        { topic: { $regex: `^${cleanCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        { name: { $regex: `^${cleanCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        { slug: slugify(cleanCategory) },
      ],
    });

    if (!catDoc) {
      const catSlug = slugify(cleanCategory) || `cat-${Date.now().toString(36)}`;
      catDoc = {
        topic: cleanCategory,
        topicHi: cleanCategory,
        slug: catSlug,
        emoji: "📚",
        description: `Comprehensive practice sets & questions for ${cleanCategory}`,
        categoryClass: "category-general",
        hidden: false,
        originalLang: "hi",
        isTrending: false,
        chips: "[]",
        sortOrder: 10,
        showSubCategoriesOnHome: true,
        attemptCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const insertRes = await catCol.insertOne(catDoc);
      catDoc._id = insertRes.insertedId;
    }
    catCache.set(catCacheKey, catDoc);
  }

  const topicCacheKey = `${cleanCategory}:::${cleanTopic.toLowerCase()}`;
  const subjectCacheKey = `${cleanCategory}:::${cleanSubject.toLowerCase()}`;

  const topicsCol = db.collection("gk_topics");
  const subjectsCol = db.collection("gk_subjects");

  // 1. Resolve or Create Topic (with in-memory cache)
  let topicDoc = topicCache.get(topicCacheKey);
  if (!topicDoc) {
    topicDoc = await topicsCol.findOne({
      category: cleanCategory,
      $or: [
        { name: { $regex: `^${cleanTopic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        { nameHi: { $regex: `^${cleanTopic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
      ],
    });

    if (!topicDoc) {
      const topicSlug = slugify(cleanTopic) || `topic-${Date.now().toString(36)}`;
      const highestTopic = await topicsCol
        .find({ category: cleanCategory })
        .sort({ order: -1 })
        .limit(1)
        .toArray();
      const nextOrder = highestTopic.length > 0 ? (highestTopic[0].order || 0) + 1 : 1;

      topicDoc = {
        id: topicSlug,
        slug: topicSlug,
        category: cleanCategory,
        name: cleanTopic,
        nameHi: cleanTopic,
        icon: "📚",
        tint: "#F8FAFC",
        order: nextOrder,
        weight: 1,
        active: true,
        showOnHome: true,
        homeOrder: nextOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await topicsCol.insertOne(topicDoc);
    }
    topicCache.set(topicCacheKey, topicDoc);
  }

  // 2. Resolve or Create Subject under this Category (with in-memory cache)
  let subjectDoc = subjectCache.get(subjectCacheKey);
  if (!subjectDoc) {
    subjectDoc = await subjectsCol.findOne({
      $or: [
        { topicId: topicDoc.id, name: { $regex: `^${cleanSubject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        { category: cleanCategory, name: { $regex: `^${cleanSubject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        { name: { $regex: `^${cleanSubject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
      ],
    });

    if (!subjectDoc) {
      const subjectSlug = slugify(cleanSubject) || `subject-${Date.now().toString(36)}`;
      const highestSubject = await subjectsCol
        .find({ topicId: topicDoc.id })
        .sort({ order: -1 })
        .limit(1)
        .toArray();
      const nextSubOrder = highestSubject.length > 0 ? (highestSubject[0].order || 0) + 1 : 1;

      subjectDoc = {
        id: `${topicDoc.id}_${subjectSlug}`,
        slug: subjectSlug,
        topicId: topicDoc.id,
        topicName: topicDoc.name,
        category: cleanCategory,
        masterCategory: cleanMaster,
        name: cleanSubject,
        nameHi: cleanSubject,
        icon: "📖",
        order: nextSubOrder,
        status: "published",
        setCount: 0,
        questionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await subjectsCol.insertOne(subjectDoc);
    }
    subjectCache.set(subjectCacheKey, subjectDoc);
  }

  return {
    masterCategory: cleanMaster,
    categoryId: catDoc ? catDoc._id : null,
    category: catDoc?.topic || cleanCategory,
    categorySlug: catDoc?.slug || slugify(cleanCategory),
    topicId: topicDoc.id,
    topicName: topicDoc.name,
    topicSlug: topicDoc.slug,
    subjectId: subjectDoc.id,
    subjectName: subjectDoc.name,
    subjectSlug: subjectDoc.slug,
  };
}

/**
 * Task 1.1: Back-fill subject for existing questions where subjectId is missing
 */
export async function backfillExistingQuestions(db) {
  const topicsCol = db.collection("gk_topics");
  const subjectsCol = db.collection("gk_subjects");
  const qCol = db.collection("Question");

  const missingCount = await qCol.countDocuments({
    $or: [{ subjectId: { $exists: false } }, { subjectId: null }],
  });

  if (missingCount === 0) {
    return { migratedCount: 0, message: "All questions already have subjectId" };
  }

  const existingTopics = await topicsCol.find({}).toArray();
  const existingSubjects = await subjectsCol.find({}).toArray();

  const topicCache = new Map();
  existingTopics.forEach((t) => {
    if (t.name) topicCache.set(t.name.trim().toLowerCase(), t);
    if (t.nameHi) topicCache.set(t.nameHi.trim().toLowerCase(), t);
    if (t.slug) topicCache.set(t.slug.trim().toLowerCase(), t);
  });

  const subjectCache = new Map();
  existingSubjects.forEach((s) => {
    if (s.name) subjectCache.set(`${s.topicId}::${s.name.trim().toLowerCase()}`, s);
    if (s.nameHi) subjectCache.set(`${s.topicId}::${s.nameHi.trim().toLowerCase()}`, s);
  });

  const questions = await qCol
    .find({
      $or: [{ subjectId: { $exists: false } }, { subjectId: null }],
    })
    .project({ _id: 1, category: 1, categoryName: 1, topicName: 1, topicId: 1, subTopic: 1, masterCategory: 1 })
    .toArray();

  let bulkOps = [];
  let totalProcessed = 0;

  for (const q of questions) {
    const rawCategory = q.category || q.categoryName || "India GK";
    const rawTopic = q.topicName || q.topicId || "General Knowledge";
    const rawSubject = q.subTopic && String(q.subTopic).trim() ? q.subTopic : rawTopic;

    const resolved = await resolveHierarchy(db, {
      masterCategory: q.masterCategory || "GK",
      category: rawCategory,
      topic: rawTopic,
      subject: rawSubject,
    });

    bulkOps.push({
      updateOne: {
        filter: { _id: q._id },
        update: {
          $set: {
            masterCategory: resolved.masterCategory,
            category: resolved.category,
            topicId: resolved.topicId,
            topicName: resolved.topicName,
            subjectId: resolved.subjectId,
            subjectName: resolved.subjectName,
            updatedAt: new Date(),
          },
        },
      },
    });

    if (bulkOps.length >= 500) {
      await qCol.bulkWrite(bulkOps, { ordered: false });
      totalProcessed += bulkOps.length;
      bulkOps = [];
    }
  }

  if (bulkOps.length > 0) {
    await qCol.bulkWrite(bulkOps, { ordered: false });
    totalProcessed += bulkOps.length;
  }

  return { migratedCount: totalProcessed, message: `Successfully back-filled ${totalProcessed} questions.` };
}
