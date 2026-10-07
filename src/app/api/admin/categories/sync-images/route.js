import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const now = new Date();

    // 1. Target 9 card image updates
    const imageUpdates = [
      { slug: 'human-body', img: '/cards/human-body.webp', topic: 'Human Body' },
      { slug: 'amazing-facts', img: '/cards/amazing-facts.webp', topic: 'Amazing Facts' },
      { slug: 'famous-people', img: '/cards/famous-people.webp', topic: 'Famous People' },
      { slug: 'india-history', img: '/cards/india-history.webp', topic: 'India History' },
      { slug: 'india-geography', img: '/cards/india-geography.webp', topic: 'India Geography' },
      { slug: 'animals-nature', img: '/cards/animals-nature.webp', topic: 'Animals & Nature' },
      { slug: 'space-universe', img: '/cards/space-universe.webp', topic: 'Space & Universe' },
      { slug: 'brain-riddles', img: '/cards/brain-riddles.webp', topic: 'Brain Riddles' },
      { slug: 'food', img: '/cards/food.webp', topic: 'Food' },
    ];

    const imageResults = [];
    for (const item of imageUpdates) {
      // Update by slug or topic
      const res = await prisma.category.updateMany({
        where: {
          OR: [
            { slug: item.slug },
            { topic: item.topic },
          ]
        },
        data: {
          image: item.img,
          image_url: item.img,
          updatedAt: now,
        }
      });
      imageResults.push({ topic: item.topic, slug: item.slug, count: res.count });
    }

    // 2. Fetch all categories with their subcategories and Prisma question counts
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { questions: true } },
        subCategories: {
          include: {
            _count: { select: { questions: true } },
          }
        }
      }
    });

    let updatedCounts = 0;
    for (const cat of categories) {
      const directCount = cat._count?.questions || 0;
      const childCount = (cat.subCategories || []).reduce((acc, sub) => acc + (sub._count?.questions || 0), 0);
      const totalCount = directCount + childCount;

      await prisma.category.update({
        where: { id: cat.id },
        data: {
          attemptCount: cat.attemptCount ?? 0,
          updatedAt: now,
        }
      });
      updatedCounts++;
    }

    // 3. Clear in-memory caches across server
    if (globalThis.__CATEGORY_CACHE__) globalThis.__CATEGORY_CACHE__.clear();
    if (globalThis.__ADMIN_SETS_CACHE__) globalThis.__ADMIN_SETS_CACHE__.clear();

    return NextResponse.json({
      success: true,
      message: 'Card images and data updated successfully via Prisma!',
      imageResults,
      updatedCategoriesCount: updatedCounts,
    });
  } catch (error) {
    console.error('Error in sync-images:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
