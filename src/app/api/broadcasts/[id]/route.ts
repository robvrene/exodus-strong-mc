import { NextRequest, NextResponse } from 'next/server';
import { broadcasts, broadcastActivity } from '@/lib/content-db';

// GET /api/broadcasts/[id] - Get single broadcast with activity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await broadcasts.getById(id);
    
    if (!item) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    const activity = await broadcastActivity.getByBroadcast(id);
    
    return NextResponse.json({ ...item, activity });
  } catch (error) {
    console.error('Failed to fetch broadcast:', error);
    return NextResponse.json({ error: 'Failed to fetch broadcast' }, { status: 500 });
  }
}

// PATCH /api/broadcasts/[id] - Update broadcast
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const item = await broadcasts.update(id, body);
    
    if (!item) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update broadcast:', error);
    return NextResponse.json({ error: 'Failed to update broadcast' }, { status: 500 });
  }
}

// DELETE /api/broadcasts/[id] - Delete broadcast
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await broadcasts.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete broadcast:', error);
    return NextResponse.json({ error: 'Failed to delete broadcast' }, { status: 500 });
  }
}
