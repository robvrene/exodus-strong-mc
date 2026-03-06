import { NextResponse } from 'next/server';
import { broadcasts } from '@/lib/content-db';

// GET /api/broadcasts/stats - Get broadcast statistics
export async function GET() {
  try {
    const stats = await broadcasts.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch broadcast stats:', error);
    return NextResponse.json({ error: 'Failed to fetch broadcast stats' }, { status: 500 });
  }
}
