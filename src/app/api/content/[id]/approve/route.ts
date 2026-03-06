import { NextRequest, NextResponse } from 'next/server';
import { content } from '@/lib/content-db';

// POST /api/content/[id]/approve - Approve content
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const approvedBy = body.approved_by || 'aaron';
    
    const item = await content.approve(id, approvedBy);
    
    if (!item) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to approve content:', error);
    return NextResponse.json({ error: 'Failed to approve content' }, { status: 500 });
  }
}
