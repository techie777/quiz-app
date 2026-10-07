import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongoDb';

export async function GET(req) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const audience = searchParams.get('audience');

    // 1. Get legacy/main Categories with non-hidden status
    const categories = await db.collection('Category')
      .find({ hidden: { $ne: true } }, { projection: { _id: 1, name: 1, name_hi: 1, topic: 1, topicHi: 1, icon: 1, emoji: 1, slug: 1, audience: 1 } })
      .toArray();

    // 2. Get Taxonomy Categories
    const taxonomyCats = await db.collection('TaxonomyCategory')
      .find({}, { projection: { _id: 1, name: 1, nameHi: 1, icon: 1, slug: 1, audience: 1 } })
      .toArray();

    // 3. Get aggregate question counts per category
    const catCounts = await db.collection('Question').aggregate([
      { $match: { status: 'published' } },
      {
        $facet: {
          byTaxonomyCat: [
            { $match: { category_id: { $ne: null } } },
            { $group: { _id: "$category_id", count: { $sum: 1 } } }
          ],
          byLegacyCat: [
            { $match: { categoryId: { $ne: null } } },
            { $group: { _id: "$categoryId", count: { $sum: 1 } } }
          ]
        }
      }
    ]).toArray();

    const countMap = new Map();
    if (catCounts[0]) {
      (catCounts[0].byTaxonomyCat || []).forEach(c => {
        if (c._id) countMap.set(c._id.toString(), c.count);
      });
      (catCounts[0].byLegacyCat || []).forEach(c => {
        if (c._id && !countMap.has(c._id.toString())) {
          countMap.set(c._id.toString(), c.count);
        }
      });
    }

    // Merge all unique categories from both Category and TaxonomyCategory collections
    const uniqueCatsMap = new Map();

    // 1. Process all main Category items (70 categories)
    (categories || []).forEach(c => {
      const idStr = c._id.toString();
      const count = countMap.get(idStr) || countMap.get(c.slug) || (Array.isArray(c.questions) ? c.questions.length : 0);
      uniqueCatsMap.set(idStr, {
        id: idStr,
        name: c.topic || c.name || 'General',
        nameHi: c.topicHi || c.name_hi || c.topic || c.name || 'सामान्य',
        icon: c.icon || c.emoji || '🎯',
        emoji: c.emoji || c.icon || '🎯',
        slug: c.slug || idStr,
        audience: c.audience || 'all',
        questionCount: count,
      });
    });

    const TAXONOMY_ICON_EMOJIS = {
      landmark: '🏛️',
      globe: '🌍',
      shield: '🛡️',
      'trending-up': '📈',
      trendingup: '📈',
      atom: '⚛️',
      newspaper: '📰',
      'map-pin': '📍',
      mappin: '📍',
      palette: '🎨',
      book: '📚',
      'book-open': '📖',
      calculator: '🔢',
      cpu: '💻',
      music: '🎵',
      film: '🎬',
      award: '🏆',
      trophy: '🏆',
      zap: '⚡',
      star: '⭐',
      brain: '🧠',
    };

    // 2. Add any additional taxonomy categories
    (taxonomyCats || []).forEach(c => {
      const idStr = c._id.toString();
      if (!uniqueCatsMap.has(idStr)) {
        const count = countMap.get(idStr) || countMap.get(c.slug) || 0;
        const iconKey = String(c.icon || '').toLowerCase().trim();
        const resolvedEmoji = TAXONOMY_ICON_EMOJIS[iconKey] || (iconKey.length <= 4 && iconKey ? iconKey : '🎯');
        uniqueCatsMap.set(idStr, {
          id: idStr,
          name: c.name || 'General',
          nameHi: c.nameHi || c.name || 'सामान्य',
          icon: resolvedEmoji,
          emoji: resolvedEmoji,
          slug: c.slug || idStr,
          audience: c.audience || 'all',
          questionCount: count,
        });
      }
    });

    // 3. Add GK Topics grouped under "India GK" and "World GK" (Phase 5B.3)
    const gkTopics = await db.collection('gk_topics').find({ active: true }).sort({ category: 1, order: 1 }).toArray();
    const gkTopicList = (gkTopics || []).map(t => ({
      id: t.id,
      name: t.name,
      nameHi: t.nameHi || t.name,
      icon: t.icon || '🏛️',
      emoji: t.icon || '🏛️',
      slug: t.id,
      audience: ['adults', 'explorer', 'all'],
      group: t.category, // "India GK" | "World GK"
      isGkTopic: true,
      questionCount: 40,
    }));

    const formattedCategories = [...Array.from(uniqueCatsMap.values()), ...gkTopicList];

    // Also get available exams and states
    const exams = await db.collection('Question').distinct('exam', { status: 'published', exam: { $ne: null } });
    const flattenedExams = [...new Set(exams.flat().filter(Boolean))];

    const states = await db.collection('Question').distinct('state', { status: 'published', state: { $ne: null, $ne: '' } });

    // Total published count
    const totalQuestions = await db.collection('Question').countDocuments({ status: 'published' });

    return NextResponse.json({
      totalQuestions,
      categories: formattedCategories,
      exams: flattenedExams,
      states: states.filter(Boolean),
    });

  } catch (error) {
    console.error('Error fetching arena meta:', error);
    return NextResponse.json({ error: 'Failed to fetch arena meta' }, { status: 500 });
  }
}
