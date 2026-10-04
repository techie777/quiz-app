import { getDb } from "@/lib/mongoDb";
import { PAGES as SEED_PAGES, BOOK_TREE as SEED_TREE } from "./seedData";

const CHAPTERS_COLLECTION = "gk_book_chapters";
const PAGES_COLLECTION = "gk_book_pages";
const PROGRESS_COLLECTION = "gk_book_progress";

/**
 * Returns the hierarchical taxonomy tree for GK Book:
 * Sub-Category > Topic > Subject > Chapter
 */
export async function getGkBookTree() {
  try {
    const db = await getDb();
    const chaptersCol = db.collection(CHAPTERS_COLLECTION);
    const count = await chaptersCol.countDocuments();

    if (count === 0) {
      // Seed default chapter if collection is empty
      await seedDefaultChapter(db);
    }

    const dbChapters = await chaptersCol.find({}).sort({ sortOrder: 1, createdAt: 1 }).toArray();

    // Map into hierarchical tree structure
    const treeMap = new Map();

    // First populate from SEED_TREE to ensure all categories/topics/subjects exist
    SEED_TREE.forEach((sc) => {
      const scKey = sc.id || sc.slug;
      if (!treeMap.has(scKey)) {
        treeMap.set(scKey, {
          id: scKey,
          title: sc.title || sc.n,
          icon: sc.icon || "📚",
          en: sc.en,
          topics: new Map(),
        });
      }

      const topicsList = sc.topics || sc.t || [];
      topicsList.forEach((top) => {
        const topKey = top.id || top.slug;
        const scNode = treeMap.get(scKey);
        if (!scNode.topics.has(topKey)) {
          scNode.topics.set(topKey, {
            id: topKey,
            title: top.title || top.n,
            en: top.en,
            subjects: new Map(),
          });
        }

        const subjectsList = top.subjects || top.s || [];
        subjectsList.forEach((subj) => {
          const subKey = subj.id || subj.slug;
          const topNode = scNode.topics.get(topKey);
          if (!topNode.subjects.has(subKey)) {
            topNode.subjects.set(subKey, {
              id: subKey,
              title: subj.title || subj.n,
              en: subj.en,
              chapters: [],
            });
          }

          const chaptersList = subj.chapters || subj.c || [];
          chaptersList.forEach((ch) => {
            topNode.subjects.get(subKey).chapters.push({ ...ch });
          });
        });
      });
    });

    // Merge or update from DB chapters
    dbChapters.forEach((ch) => {
      const scKey = ch.subCategorySlug || "ancient-history";
      const topKey = ch.topicSlug || "indus-and-prehistoric";
      const subKey = ch.subjectSlug || "indus-civilization";

      if (!treeMap.has(scKey)) {
        treeMap.set(scKey, {
          id: scKey,
          title: ch.subCategory || "सामान्य ज्ञान",
          icon: "📚",
          en: ch.subCategoryEn || "General Knowledge",
          topics: new Map(),
        });
      }

      const scNode = treeMap.get(scKey);
      if (!scNode.topics.has(topKey)) {
        scNode.topics.set(topKey, {
          id: topKey,
          title: ch.topic || "विषय",
          en: ch.topicEn || "Topic",
          subjects: new Map(),
        });
      }

      const topNode = scNode.topics.get(topKey);
      if (!topNode.subjects.has(subKey)) {
        topNode.subjects.set(subKey, {
          id: subKey,
          title: ch.subject || "अध्याय",
          en: ch.subjectEn || "Subject",
          chapters: [],
        });
      }

      const subjNode = topNode.subjects.get(subKey);
      const existingIdx = subjNode.chapters.findIndex((c) => c.slug === ch.slug);
      const chapterItem = {
        slug: ch.slug,
        title: ch.titleHi,
        titleEn: ch.titleEn,
        pages: ch.totalPages || ch.pagesCount || 5,
        timeP: ch.estimatedMinutes?.short || "3m",
        timeF: ch.estimatedMinutes?.full || "8m",
        status: ch.status || "published",
        en: ch.titleEn,
      };

      if (existingIdx >= 0) {
        subjNode.chapters[existingIdx] = chapterItem;
      } else {
        subjNode.chapters.push(chapterItem);
      }
    });

    // Format map to nested arrays
    return Array.from(treeMap.values()).map((sc) => ({
      id: sc.id,
      title: sc.title,
      icon: sc.icon,
      en: sc.en,
      topics: Array.from(sc.topics.values()).map((top) => ({
        id: top.id,
        title: top.title,
        en: top.en,
        subjects: Array.from(top.subjects.values()).map((subj) => ({
          id: subj.id,
          title: subj.title,
          en: subj.en,
          chapters: subj.chapters,
        })),
      })),
    }));
  } catch (err) {
    console.error("[gk-book/db] getGkBookTree error, falling back to seed:", err);
    return SEED_TREE;
  }
}

/**
 * Returns a complete Chapter with all its pages (Short & Full blocks + Quiz)
 */
export async function getGkBookChapter(slug) {
  try {
    const db = await getDb();
    const chaptersCol = db.collection(CHAPTERS_COLLECTION);
    const pagesCol = db.collection(PAGES_COLLECTION);

    const chapter = await chaptersCol.findOne({ slug });
    if (!chapter) {
      if (slug === "sindhu-ghati") {
        return {
          slug: "sindhu-ghati",
          title: "सिंधु घाटी सभ्यता — विस्तार, नगर नियोजन एवं सामाजिक जीवन",
          titleEn: "Indus Valley Civilization",
          subCategory: "प्राचीन भारत का इतिहास",
          topic: "सिंधु घाटी एवं प्रागैतिहासिक काल",
          subject: "सिंधु घाटी सभ्यता",
          totalPages: SEED_PAGES.length,
          pages: SEED_PAGES,
        };
      }
      return null;
    }

    const pages = await pagesCol.find({ chapterSlug: slug }).sort({ pageNumber: 1 }).toArray();

    return {
      id: chapter._id.toString(),
      slug: chapter.slug,
      title: chapter.titleHi,
      titleEn: chapter.titleEn,
      subCategory: chapter.subCategory,
      topic: chapter.topic,
      subject: chapter.subject,
      totalPages: pages.length || chapter.totalPages,
      pages: pages.length > 0 ? pages.map(formatPageDoc) : SEED_PAGES,
    };
  } catch (err) {
    console.error("[gk-book/db] getGkBookChapter error, falling back to seed:", err);
    if (slug === "sindhu-ghati") {
      return {
        slug: "sindhu-ghati",
        title: "सिंधु घाटी सभ्यता — विस्तार, नगर नियोजन एवं सामाजिक जीवन",
        titleEn: "Indus Valley Civilization",
        subCategory: "प्राचीन भारत का इतिहास",
        topic: "सिंधु घाटी एवं प्रागैतिहासिक काल",
        subject: "सिंधु घाटी सभ्यता",
        totalPages: SEED_PAGES.length,
        pages: SEED_PAGES,
      };
    }
    return null;
  }
}

/**
 * Upserts a Chapter and optionally all its pages
 */
export async function saveGkBookChapter(data) {
  const db = await getDb();
  const chaptersCol = db.collection(CHAPTERS_COLLECTION);
  const pagesCol = db.collection(PAGES_COLLECTION);

  const slug = data.slug || generateSlug(data.titleHi || data.title);
  const now = new Date();

  const chapterDoc = {
    slug,
    titleHi: data.titleHi || data.title,
    titleEn: data.titleEn || "",
    subCategory: data.subCategory || "सामान्य ज्ञान",
    subCategorySlug: data.subCategorySlug || generateSlug(data.subCategory || "general"),
    topic: data.topic || "विषय",
    topicSlug: data.topicSlug || generateSlug(data.topic || "topic"),
    subject: data.subject || "अध्याय",
    subjectSlug: data.subjectSlug || generateSlug(data.subject || "subject"),
    summary: data.summary || "",
    status: data.status || "published",
    sortOrder: Number(data.sortOrder) || 0,
    totalPages: Array.isArray(data.pages) ? data.pages.length : Number(data.totalPages) || 1,
    estimatedMinutes: data.estimatedMinutes || { short: "3m", full: "8m" },
    updatedAt: now,
  };

  await chaptersCol.updateOne(
    { slug },
    { $set: chapterDoc, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );

  // If pages are supplied, upsert them
  if (Array.isArray(data.pages) && data.pages.length > 0) {
    for (let i = 0; i < data.pages.length; i++) {
      const p = data.pages[i];
      const pageNumber = i + 1;
      await pagesCol.updateOne(
        { chapterSlug: slug, pageNumber },
        {
          $set: {
            chapterSlug: slug,
            pageNumber,
            title: p.title || `पृष्ठ ${pageNumber}`,
            // P = short blocks, F = full blocks
            P: Array.isArray(p.P) ? p.P : p.shortBlocks || [],
            F: Array.isArray(p.F) ? p.F : p.fullBlocks || [],
            // q = page-level self-contained quiz questions
            q: Array.isArray(p.q) ? p.q : p.quiz || [],
            readingTimeShort: p.readingTimeShort || 1,
            readingTimeFull: p.readingTimeFull || 2,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
    }
  }

  return { success: true, slug };
}

/**
 * Saves or updates a single Page within a chapter
 */
export async function saveGkBookPage(chapterSlug, pageData) {
  const db = await getDb();
  const pagesCol = db.collection(PAGES_COLLECTION);
  const now = new Date();

  const pageNumber = Number(pageData.pageNumber) || 1;

  await pagesCol.updateOne(
    { chapterSlug, pageNumber },
    {
      $set: {
        chapterSlug,
        pageNumber,
        title: pageData.title || `पृष्ठ ${pageNumber}`,
        P: pageData.P || pageData.shortBlocks || [],
        F: pageData.F || pageData.fullBlocks || [],
        q: pageData.q || pageData.quiz || [],
        readingTimeShort: pageData.readingTimeShort || 1,
        readingTimeFull: pageData.readingTimeFull || 2,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  return { success: true, pageNumber };
}

/**
 * Gets user / guest reading progress and quiz attempts for a chapter
 */
export async function getGkBookProgress(userOrDeviceId, chapterSlug) {
  if (!userOrDeviceId || !chapterSlug) return { read: {}, att: {} };

  try {
    const db = await getDb();
    const progressCol = db.collection(PROGRESS_COLLECTION);

    const doc = await progressCol.findOne({ userOrDeviceId, chapterSlug });
    if (!doc) return { read: {}, att: {} };

    return {
      read: doc.read || {},
      att: doc.att || {},
      lastPage: doc.lastPage || 0,
      updatedAt: doc.updatedAt,
    };
  } catch (err) {
    console.error("[gk-book/db] getGkBookProgress error:", err);
    return { read: {}, att: {} };
  }
}

/**
 * Saves user / guest reading progress and quiz attempts
 */
export async function saveGkBookProgress(userOrDeviceId, chapterSlug, data) {
  if (!userOrDeviceId || !chapterSlug) return { success: false };

  try {
    const db = await getDb();
    const progressCol = db.collection(PROGRESS_COLLECTION);
    const now = new Date();

    const updateFields = {
      updatedAt: now,
    };

    if (data.read !== undefined) updateFields.read = data.read;
    if (data.att !== undefined) updateFields.att = data.att;
    if (data.lastPage !== undefined) updateFields.lastPage = data.lastPage;

    await progressCol.updateOne(
      { userOrDeviceId, chapterSlug },
      {
        $set: updateFields,
        $setOnInsert: { userOrDeviceId, chapterSlug, createdAt: now },
      },
      { upsert: true }
    );

    return { success: true };
  } catch (err) {
    console.error("[gk-book/db] saveGkBookProgress error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Seeds the initial "Sindhu Ghati" chapter into MongoDB if empty
 */
async function seedDefaultChapter(db) {
  try {
    const chaptersCol = db.collection(CHAPTERS_COLLECTION);
    const pagesCol = db.collection(PAGES_COLLECTION);
    const now = new Date();

    const defaultChapter = {
      slug: "sindhu-ghati",
      titleHi: "सिंधु घाटी सभ्यता — विस्तार, नगर नियोजन एवं सामाजिक जीवन",
      titleEn: "Indus Valley Civilization",
      subCategory: "प्राचीन भारत का इतिहास",
      subCategorySlug: "ancient-history",
      topic: "सिंधु घाटी एवं प्रागैतिहासिक काल",
      topicSlug: "indus-and-prehistoric",
      subject: "सिंधु घाटी सभ्यता",
      subjectSlug: "indus-civilization",
      summary: "सिंधु घाटी सभ्यता का सम्पूर्ण अध्ययन: भौगोलिक विस्तार, नगर नियोजन, प्रमुख स्थल, सामाजिक-आर्थिक जीवन एवं पतन के कारण।",
      status: "published",
      sortOrder: 1,
      totalPages: SEED_PAGES.length,
      estimatedMinutes: { short: "3m", full: "8m" },
      createdAt: now,
      updatedAt: now,
    };

    await chaptersCol.updateOne(
      { slug: "sindhu-ghati" },
      { $set: defaultChapter },
      { upsert: true }
    );

    for (let i = 0; i < SEED_PAGES.length; i++) {
      const pageNumber = i + 1;
      const p = SEED_PAGES[i];
      await pagesCol.updateOne(
        { chapterSlug: "sindhu-ghati", pageNumber },
        {
          $set: {
            chapterSlug: "sindhu-ghati",
            pageNumber,
            title: p.title || `पृष्ठ ${pageNumber}`,
            P: p.P || [],
            F: p.F || [],
            q: p.q || [],
            readingTimeShort: 1,
            readingTimeFull: 2,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
    }

    console.log("[gk-book/db] Seeded default Sindhu Ghati chapter to MongoDB");
  } catch (e) {
    console.error("[gk-book/db] seedDefaultChapter failed:", e);
  }
}

function formatPageDoc(doc) {
  return {
    id: doc._id?.toString(),
    title: doc.title,
    pageNumber: doc.pageNumber,
    P: doc.P || [],
    F: doc.F || [],
    q: doc.q || [],
    readingTimeShort: doc.readingTimeShort || 1,
    readingTimeFull: doc.readingTimeFull || 2,
  };
}

function generateSlug(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "chapter-" + Date.now();
}
