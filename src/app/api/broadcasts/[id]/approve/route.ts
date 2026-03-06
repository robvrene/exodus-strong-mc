import { NextRequest, NextResponse } from 'next/server';
import { broadcasts } from '@/lib/content-db';

// POST /api/broadcasts/[id]/approve - Approve broadcast
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const approvedBy = body.approved_by || 'aaron';
    const scheduledFor = body.scheduled_for;
    
    const item = await broadcasts.approve(id, approvedBy, scheduledFor);
    
    if (!item) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to approve broadcast:', error);
    return NextResponse.json({ error: 'Failed to approve broadcast' }, { status: 500 });
  }
}
