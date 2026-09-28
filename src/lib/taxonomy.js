import { getDb } from "./mongoDb";

/**
 * Core Taxonomy Helper (Step 4: Data Foundation)
 * Provides centralized queries, caching, and management for
 * the 15 Standard Categories and 150 Topics.
 */

export async function getTaxonomyCategories(options = {}) {
  const { audience, includeTopics = true } = options;

  try {
    const db = await getDb();
    const filter = audience ? { audience: { $in: [audience] } } : {};
    const categories = await db
      .collection("TaxonomyCategory")
      .find(filter)
      .sort({ sortOrder: 1 })
      .toArray();

    if (includeTopics && categories.length > 0) {
      const topics = await db
        .collection("TaxonomyTopic")
        .find({})
        .sort({ sortOrder: 1 })
        .toArray();

      const topicsByCatId = new Map();
      for (const t of topics) {
        const catKey = t.categoryId ? t.categoryId.toString() : "";
        if (!topicsByCatId.has(catKey)) topicsByCatId.set(catKey, []);
        topicsByCatId.get(catKey).push({ ...t, id: t._id.toString() });
      }

      return categories.map((cat) => ({
        ...cat,
        id: cat._id.toString(),
        topics: topicsByCatId.get(cat._id.toString()) || [],
      }));
    }

    return categories.map((cat) => ({ ...cat, id: cat._id.toString() }));
  } catch (error) {
    console.error("Error fetching taxonomy categories:", error);
    return [];
  }
}

export async function getTaxonomyTopics(categoryId) {
  try {
    const db = await getDb();
    const filter = categoryId ? { categoryId } : {};
    const topics = await db
      .collection("TaxonomyTopic")
      .find(filter)
      .sort({ sortOrder: 1 })
      .toArray();

    return topics.map((t) => ({ ...t, id: t._id.toString() }));
  } catch (error) {
    console.error("Error fetching taxonomy topics:", error);
    return [];
  }
}

export async function getTaxonomySummary() {
  try {
    const categories = await getTaxonomyCategories({ includeTopics: true });
    let totalQuestions = 0;
    let totalTopics = 0;

    const summary = categories.map((cat) => {
      const topicCount = cat.topics ? cat.topics.length : 0;
      const catQuestions = cat.topics
        ? cat.topics.reduce((acc, t) => acc + (t.questionCount || 0), 0)
        : 0;

      totalQuestions += catQuestions;
      totalTopics += topicCount;

      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        nameHi: cat.nameHi,
        icon: cat.icon,
        topicCount,
        questionCount: catQuestions,
        topics: cat.topics,
      };
    });

    return {
      categoryCount: categories.length,
      topicCount: totalTopics,
      totalQuestions,
      categories: summary,
    };
  } catch (error) {
    console.error("Error generating taxonomy summary:", error);
    return { categoryCount: 0, topicCount: 0, totalQuestions: 0, categories: [] };
  }
}
