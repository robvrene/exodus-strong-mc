import { NextRequest, NextResponse } from 'next/server';
import { contentActivity } from '@/lib/content-db';

// POST /api/content/[id]/activity - Log activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, actor, notes } = body;
    
    if (!action || !actor) {
      return NextResponse.json({ error: 'action and actor are required' }, { status: 400 });
    }
    
    await contentActivity.log(id, action, actor, notes);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log activity:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}

// GET /api/content/[id]/activity - Get activity for content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activity = await contentActivity.getByContent(id);
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
