import { NextRequest, NextResponse } from 'next/server';
import { content } from '@/lib/content-db';

// POST /api/content/[id]/reject - Reject content with optional reason
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const rejectedBy = body.rejected_by || 'aaron';
    const reason = body.reason || null;
    
    const item = await content.reject(id, rejectedBy, reason);
    
    if (!item) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to reject content:', error);
    return NextResponse.json({ error: 'Failed to reject content' }, { status: 500 });
  }
}
