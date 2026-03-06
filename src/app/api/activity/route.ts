import { NextRequest, NextResponse } from 'next/server';
import { contentActivity } from '@/lib/content-db';

// GET /api/activity - Get recent activity log (useful for Solomon to poll)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const action = searchParams.get('action'); // Filter by action type
    
    let activity = await contentActivity.getRecent(limit);
    
    // Filter by action type if specified
    if (action) {
      activity = activity.filter(a => a.action === action);
    }
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
