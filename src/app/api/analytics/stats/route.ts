import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const funnel = searchParams.get('funnel') || 'ai-workforce-book-call';
    const startDate = searchParams.get('start'); // YYYY-MM-DD
    const endDate = searchParams.get('end'); // YYYY-MM-DD
    const groupBy = searchParams.get('group') || 'day'; // day, week, month
    
    // Build date filter
    let dateFilter = '';
    const args: (string | null)[] = [funnel];
    
    if (startDate) {
      dateFilter += ' AND DATE(created_at) >= ?';
      args.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND DATE(created_at) <= ?';
      args.push(endDate);
    }

    // Get overall stats
    const overallResult = await client.execute({
      sql: `
        SELECT 
          page,
          COUNT(*) as views,
          COUNT(DISTINCT visitor_id) as unique_visitors
        FROM page_views 
        WHERE funnel = ?${dateFilter}
        GROUP BY page
      `,
      args
    });

    // Get daily breakdown
    const dailyResult = await client.execute({
      sql: `
        SELECT 
          DATE(created_at) as date,
          page,
          COUNT(*) as views,
          COUNT(DISTINCT visitor_id) as unique_visitors
        FROM page_views 
        WHERE funnel = ?${dateFilter}
        GROUP BY DATE(created_at), page
        ORDER BY date DESC
      `,
      args
    });

    // Calculate funnel metrics
    const pageStats: Record<string, { views: number; unique: number }> = {};
    for (const row of overallResult.rows) {
      pageStats[row.page as string] = {
        views: row.views as number,
        unique: row.unique_visitors as number
      };
    }

    const landingViews = pageStats['landing']?.views || 0;
    const landingUnique = pageStats['landing']?.unique || 0;
    const thankYouViews = pageStats['thank-you']?.views || 0;
    const thankYouUnique = pageStats['thank-you']?.unique || 0;

    const conversionRate = landingViews > 0 
      ? ((thankYouViews / landingViews) * 100).toFixed(2) 
      : '0.00';
    
    const uniqueConversionRate = landingUnique > 0 
      ? ((thankYouUnique / landingUnique) * 100).toFixed(2) 
      : '0.00';

    // Format daily data
    const dailyData: Record<string, { landing: number; thankYou: number; rate: string }> = {};
    for (const row of dailyResult.rows) {
      const date = row.date as string;
      if (!dailyData[date]) {
        dailyData[date] = { landing: 0, thankYou: 0, rate: '0.00' };
      }
      if (row.page === 'landing') {
        dailyData[date].landing = row.views as number;
      } else if (row.page === 'thank-you') {
        dailyData[date].thankYou = row.views as number;
      }
    }
    
    // Calculate daily rates
    for (const date of Object.keys(dailyData)) {
      const d = dailyData[date];
      d.rate = d.landing > 0 ? ((d.thankYou / d.landing) * 100).toFixed(2) : '0.00';
    }

    return NextResponse.json({
      funnel,
      period: {
        start: startDate || 'all time',
        end: endDate || 'now'
      },
      summary: {
        landingPageViews: landingViews,
        landingPageUnique: landingUnique,
        thankYouPageViews: thankYouViews,
        thankYouPageUnique: thankYouUnique,
        conversionRate: `${conversionRate}%`,
        uniqueConversionRate: `${uniqueConversionRate}%`
      },
      daily: dailyData
    });
  } catch (error) {
    console.error('Analytics stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
