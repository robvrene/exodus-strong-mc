import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClient } from '@libsql/client';

// Initialize Turso client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Cache to avoid hammering the DB
let cache: {
  data: LeadsMetrics | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_DURATION_MS = 60 * 1000; // 1 minute

type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

interface LeadsMetrics {
  total: number;
  thisWeek: number;
  today: number;
  periodCount: number;
  period: TimePeriod;
  periodLabel: string;
  lastUpdated: string;
  error?: string;
}

function getWeekBoundaries(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  
  // Monday of this week
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  
  // Sunday of this week (end of week)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

function getPeriodBoundaries(period: TimePeriod): { start: Date; end: Date; label: string } {
  const now = new Date();
  const start = new Date(now);
  let label = '';
  
  switch (period) {
    case 'week': {
      const { start: weekStart, end: weekEnd } = getWeekBoundaries();
      return { start: weekStart, end: weekEnd, label: 'This Week' };
    }
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      label = 'This Month';
      break;
    case 'quarter': {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(quarterMonth, 1);
      start.setHours(0, 0, 0, 0);
      label = 'This Quarter';
      break;
    }
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      label = 'This Year';
      break;
    default:
      const { start: defaultStart, end: defaultEnd } = getWeekBoundaries();
      return { start: defaultStart, end: defaultEnd, label: 'This Week' };
  }
  
  // End is now
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  return { start, end, label };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = (searchParams.get('period') || 'week') as TimePeriod;
  
  const now = Date.now();
  
  // Return cached data if still fresh (only for same period request)
  if (cache.data && cache.data.period === period && (now - cache.timestamp) < CACHE_DURATION_MS) {
    return NextResponse.json(cache.data);
  }
  
  try {
    // Get total leads
    const totalResult = await client.execute('SELECT COUNT(*) as count FROM leads');
    const total = Number(totalResult.rows[0]?.count ?? 0);
    
    // Get this week's leads (Mon-Sun)
    const { start: weekStart } = getWeekBoundaries();
    const thisWeekResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM leads WHERE created_at >= ?',
      args: [weekStart.toISOString()],
    });
    const thisWeek = Number(thisWeekResult.rows[0]?.count ?? 0);
    
    // Get today's leads
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM leads WHERE created_at >= ?',
      args: [todayStart.toISOString()],
    });
    const today = Number(todayResult.rows[0]?.count ?? 0);
    
    // Get period-specific count
    const { start: periodStart, label: periodLabel } = getPeriodBoundaries(period);
    const periodResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM leads WHERE created_at >= ?',
      args: [periodStart.toISOString()],
    });
    const periodCount = Number(periodResult.rows[0]?.count ?? 0);
    
    const metrics: LeadsMetrics = {
      total,
      thisWeek,
      today,
      periodCount,
      period,
      periodLabel,
      lastUpdated: new Date().toISOString(),
    };
    
    // Update cache
    cache = {
      data: metrics,
      timestamp: now,
    };
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Leads metrics error:', error);
    
    // Return cached data if available, even if stale
    if (cache.data) {
      return NextResponse.json({
        ...cache.data,
        error: 'Using cached data - live fetch failed',
      });
    }
    
    // Return error response with zero data
    return NextResponse.json({
      total: 0,
      thisWeek: 0,
      today: 0,
      periodCount: 0,
      period,
      periodLabel: 'Unknown',
      lastUpdated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to fetch leads metrics',
    }, { status: 500 });
  }
}
