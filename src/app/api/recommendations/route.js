import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongoDb';
import { ObjectId } from 'mongodb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const currentTopicId = searchParams.get('currentTopicId');
    const currentCategoryId = searchParams.get('currentCategoryId');
    const currentSetIndex = parseInt(searchParams.get('currentSetIndex') || '1', 10);
    const score = parseInt(searchParams.get('score') || '0', 10);
    const total = parseInt(searchParams.get('total') || '20', 10);
    const tier = searchParams.get('tier') || 'adults';
    const userId = searchParams.get('userId');

    const accuracy = total > 0 ? (score / total) : 0.5;
    const db = await getDb();

    const cards = [];
    let isPersonalized = false;

    // 1. CARD 1: Next set in the same topic/category
    if (currentTopicId || currentCategoryId) {
      const nextIndex = currentSetIndex + 1;
      let filter = { setIndex: nextIndex, status: 'published' };
      if (currentTopicId) {
        try { filter.topicId = new ObjectId(currentTopicId); } catch { filter.topicId = currentTopicId; }
      } else {
        try { filter.categoryId = new ObjectId(currentCategoryId); } catch { filter.categoryId = currentCategoryId; }
      }

      const nextSet = await db.collection('QuizSet').findOne(filter);
      if (nextSet) {
        // Fetch topic info
        const topic = currentTopicId
          ? await db.collection('TaxonomyTopic').findOne({ _id: filter.topicId })
          : await db.collection('Category').findOne({ _id: filter.categoryId });

        cards.push({
          id: nextSet._id.toString(),
          type: 'next_set',
          title: topic?.name || topic?.topic || `Topic`,
          titleHi: topic?.nameHi || topic?.topicHi || topic?.name || topic?.topic || `विषय`,
          meta: `Set ${nextSet.setIndex} · ${nextSet.questionCount} Qs`,
          metaHi: `सेट ${nextSet.setIndex} · ${nextSet.questionCount} प्रश्न`,
          difficulty: 'medium',
          icon: topic?.icon || '📚',
          badge: 'Next Set',
          badgeHi: 'अगला सेट',
          badgeColor: 'indigo',
          href: topic?.slug ? `/hub/topic/${topic.slug}` : (currentCategoryId ? `/category/${currentCategoryId}` : '/quizzes'),
          setId: nextSet._id.toString(),
        });
        isPersonalized = true;
      }
    }

    // 2. CARD 2: Level up (or easier if accuracy < 40%)
    const targetDiff = accuracy < 0.4 ? 'easy' : accuracy > 0.75 ? 'hard' : 'medium';
    const levelUpTopic = await db.collection('TaxonomyTopic').findOne({
      questionCount: { $gte: 15 },
      ...(currentTopicId ? { _id: { $ne: new ObjectId(currentTopicId) } } : {}),
    });

    if (levelUpTopic) {
      const levelSet = await db.collection('QuizSet').findOne({
        topicId: levelUpTopic._id,
        status: 'published',
      });

      if (levelSet) {
        cards.push({
          id: levelSet._id.toString(),
          type: 'level_up',
          title: levelUpTopic.name,
          titleHi: levelUpTopic.nameHi || levelUpTopic.name,
          meta: `Set 1 · ${levelSet.questionCount} Qs`,
          metaHi: `सेट 1 · ${levelSet.questionCount} प्रश्न`,
          difficulty: targetDiff,
          icon: levelUpTopic.icon || (targetDiff === 'hard' ? '⚡' : targetDiff === 'easy' ? '🌱' : '🎯'),
          badge: targetDiff === 'hard' ? 'Level Up' : targetDiff === 'easy' ? 'Foundational' : 'Recommended',
          badgeHi: targetDiff === 'hard' ? 'उच्च स्तर' : targetDiff === 'easy' ? 'सरल अभ्यास' : 'संस्तुत',
          badgeColor: targetDiff === 'hard' ? 'rose' : targetDiff === 'easy' ? 'emerald' : 'amber',
          href: `/hub/topic/${levelUpTopic.slug}`,
          setId: levelSet._id.toString(),
        });
        isPersonalized = true;
      }
    }

    // 3. CARD 3: Fix your weak spot (if user history exists and has accuracy < 60%)
    let weakTopicFound = false;
    if (userId && userId !== 'guest') {
      try {
        const weakTopics = await db.collection('QuestionHistory').aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: "$topicId",
              total: { $sum: 1 },
              correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            },
          },
          { $match: { total: { $gte: 3 } } },
          {
            $project: {
              acc: { $divide: ["$correct", "$total"] },
            },
          },
          { $sort: { acc: 1 } },
          { $limit: 1 },
        ]).toArray();

        if (weakTopics[0] && weakTopics[0].acc < 0.6) {
          const wTopic = await db.collection('TaxonomyTopic').findOne({ _id: weakTopics[0]._id });
          if (wTopic) {
            const wSet = await db.collection('QuizSet').findOne({ topicId: wTopic._id, status: 'published' });
            if (wSet) {
              cards.push({
                id: wSet._id.toString(),
                type: 'weak_spot',
                title: wTopic.name,
                titleHi: wTopic.nameHi || wTopic.name,
                meta: `Set 1 · ${wSet.questionCount} Qs`,
                metaHi: `सेट 1 · ${wSet.questionCount} प्रश्न`,
                difficulty: 'medium',
                icon: '🎯',
                badge: 'Fix Weak Spot',
                badgeHi: 'कमज़ोर विषय सुधारें',
                badgeColor: 'amber',
                href: `/hub/topic/${wTopic.slug}`,
                setId: wSet._id.toString(),
              });
              weakTopicFound = true;
              isPersonalized = true;
            }
          }
        }
      } catch (e) {
        console.warn('Weak topic check error:', e);
      }
    }

    // 4. Related / Popular fallback cards to always ensure at least 3 smart cards
    if (cards.length < 3) {
      const audienceFilter = tier === 'kids' ? { audience: 'kids' } : {};
      const fallbackTopics = await db.collection('TaxonomyTopic').find({
        questionCount: { $gte: 15 },
        ...audienceFilter,
      }).limit(5).toArray();

      for (const t of fallbackTopics) {
        if (cards.length >= 3) break;
        if (cards.some(c => c.title === t.name)) continue;

        const fSet = await db.collection('QuizSet').findOne({ topicId: t._id, status: 'published' });
        if (fSet) {
          cards.push({
            id: fSet._id.toString(),
            type: 'related',
            title: t.name,
            titleHi: t.nameHi || t.name,
            meta: `Set 1 · ${fSet.questionCount} Qs`,
            metaHi: `सेट 1 · ${fSet.questionCount} प्रश्न`,
            difficulty: 'easy',
            icon: t.icon || '🌟',
            badge: isPersonalized ? 'Related Topic' : 'Popular Now',
            badgeHi: isPersonalized ? 'संबंधित विषय' : 'अभी लोकप्रिय',
            badgeColor: 'emerald',
            href: `/hub/topic/${t.slug}`,
            setId: fSet._id.toString(),
          });
        }
      }
    }

    return NextResponse.json({
      isPersonalized,
      headline: isPersonalized ? 'Next up (Recommended for you)' : 'Popular now',
      headlineHi: isPersonalized ? 'अगला क्विज़ (आपके लिए संस्तुत)' : 'अभी लोकप्रिय क्विज़',
      cards: cards.slice(0, 4),
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
