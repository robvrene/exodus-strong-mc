import { NextResponse } from 'next/server';
import { content, contentActivity } from '@/lib/content-db';

// GET /api/content/stats - Get content statistics
export async function GET() {
  try {
    const stats = await content.getStats();
    const recentActivity = await contentActivity.getRecent(10);
    
    // Aggregate by status
    const byStatus: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};
    
    for (const row of stats) {
      byStatus[row.status] = (byStatus[row.status] || 0) + row.count;
      byPlatform[row.platform] = (byPlatform[row.platform] || 0) + row.count;
    }

    return NextResponse.json({
      byStatus,
      byPlatform,
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      pendingCount: byStatus['pending'] || 0,
      approvedCount: byStatus['approved'] || 0,
      scheduledCount: byStatus['scheduled'] || 0,
      publishedCount: byStatus['published'] || 0,
      rejectedCount: byStatus['rejected'] || 0,
      recentActivity,
    });
  } catch (error) {
    console.error('Failed to fetch content stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
