import { NextRequest, NextResponse } from 'next/server';
import { broadcasts } from '@/lib/content-db';

// POST /api/broadcasts/[id]/reject - Reject broadcast
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const rejectedBy = body.rejected_by || 'aaron';
    const reason = body.reason;
    
    const item = await broadcasts.reject(id, rejectedBy, reason);
    
    if (!item) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to reject broadcast:', error);
    return NextResponse.json({ error: 'Failed to reject broadcast' }, { status: 500 });
  }
}
