import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.sawalJawabCategory.findMany({
      where: { hidden: false },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        nameHi: true,
        slug: true,
        image: true
      }
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching SawalJawab categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
