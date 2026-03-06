import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Allow CORS for tracking from funnel pages
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { page, funnel, visitorId, referrer } = await request.json();
    
    if (!page || !funnel) {
      return NextResponse.json(
        { error: 'page and funnel are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const userAgent = request.headers.get('user-agent') || '';
    
    await client.execute({
      sql: `INSERT INTO page_views (page, funnel, visitor_id, referrer, user_agent) VALUES (?, ?, ?, ?, ?)`,
      args: [page, funnel, visitorId || null, referrer || null, userAgent]
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json(
      { error: 'Failed to track' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Also support GET with query params (for simple pixel tracking)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const funnel = searchParams.get('funnel');
    const visitorId = searchParams.get('vid');
    const referrer = searchParams.get('ref');
    
    if (!page || !funnel) {
      // Return 1x1 transparent gif anyway to not break the page
      return new NextResponse(
        Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        { headers: { ...corsHeaders, 'Content-Type': 'image/gif' } }
      );
    }

    const userAgent = request.headers.get('user-agent') || '';
    
    await client.execute({
      sql: `INSERT INTO page_views (page, funnel, visitor_id, referrer, user_agent) VALUES (?, ?, ?, ?, ?)`,
      args: [page, funnel, visitorId || null, referrer || null, userAgent]
    });

    // Return 1x1 transparent gif
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      { headers: { ...corsHeaders, 'Content-Type': 'image/gif' } }
    );
  } catch (error) {
    console.error('Analytics track error:', error);
    // Still return gif to not break page
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      { headers: { ...corsHeaders, 'Content-Type': 'image/gif' } }
    );
  }
}
