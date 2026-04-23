import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    let where = { hidden: false };
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    const [items, totalCount] = await Promise.all([
      prisma.sawalJawab.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { name: true, nameHi: true, slug: true }
          }
        }
      }),
      prisma.sawalJawab.count({ where })
    ]);

    return NextResponse.json({
      items,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching SawalJawab items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
