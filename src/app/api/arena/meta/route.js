import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongoDb';

export async function GET(req) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const audience = searchParams.get('audience');

    // 1. Get legacy/main Categories with non-hidden status
    const categories = await db.collection('Category')
      .find({ hidden: false }, { projection: { _id: 1, name: 1, name_hi: 1, topic: 1, icon: 1, slug: 1, audience: 1 } })
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

    // Merge and format
    const formattedCategories = (taxonomyCats.length > 0 ? taxonomyCats : categories).map(c => {
      const idStr = c._id.toString();
      const count = countMap.get(idStr) || 0;
      return {
        id: idStr,
        name: c.name || c.topic || 'General',
        nameHi: c.nameHi || c.name_hi || c.name || c.topic || 'सामान्य',
        icon: c.icon || '📚',
        slug: c.slug || idStr,
        audience: c.audience || 'all',
        questionCount: count,
      };
    }).filter(c => c.questionCount > 0);

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
