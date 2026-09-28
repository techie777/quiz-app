import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongoDb';
import { buildArenaFilter } from '@/lib/arenaHelper';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const db = await getDb();

    const query = await buildArenaFilter(db, body);
    const matchCount = await db.collection('Question').countDocuments(query);

    return NextResponse.json({
      matchCount,
    });
  } catch (error) {
    console.error('Error counting arena questions:', error);
    return NextResponse.json({ error: 'Failed to count matching questions' }, { status: 500 });
  }
}
