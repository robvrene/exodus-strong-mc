import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClient } from '@libsql/client';

// Initialize Turso client
const getClient = () => createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/mission-control.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

interface FunnelAdStats {
  id: number;
  project_id: string;
  campaign_id: string | null;
  funnel_name: string;
  date: string;
  reach: number;
  impressions: number;
  link_clicks: number;
  landing_page_views: number;
  leads: number;
  spend: number;
  cost_per_click: number;
  cost_per_lead: number;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

// GET - Retrieve funnel ad stats
export async function GET(request: NextRequest) {
  try {
    const client = getClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const funnelName = searchParams.get('funnel_name');
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    
    let sql = 'SELECT * FROM funnel_ad_stats';
    const conditions: string[] = [];
    const args: (string | number)[] = [];
    
    if (projectId) {
      conditions.push('project_id = ?');
      args.push(projectId);
    }
    
    if (funnelName) {
      conditions.push('funnel_name LIKE ?');
      args.push(`%${funnelName}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY date DESC LIMIT ?';
    args.push(limit);
    
    const result = await client.execute({ sql, args });
    
    return NextResponse.json({
      success: true,
      data: result.rows as unknown as FunnelAdStats[],
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Funnel stats GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch funnel stats',
    }, { status: 500 });
  }
}

// POST - Add or update funnel ad stats
export async function POST(request: NextRequest) {
  try {
    const client = getClient();
    const body = await request.json();
    
    const {
      project_id,
      campaign_id,
      funnel_name,
      date,
      reach = 0,
      impressions = 0,
      link_clicks = 0,
      landing_page_views = 0,
      leads = 0,
      spend = 0,
      cost_per_click = 0,
      cost_per_lead = 0,
      metadata = null,
    } = body;
    
    if (!project_id || !funnel_name || !date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: project_id, funnel_name, date',
      }, { status: 400 });
    }
    
    // Calculate cost_per_lead if not provided but we have leads
    const calculatedCPL = cost_per_lead > 0 ? cost_per_lead : (leads > 0 ? spend / leads : 0);
    
    const result = await client.execute({
      sql: `INSERT INTO funnel_ad_stats 
            (project_id, campaign_id, funnel_name, date, reach, impressions, link_clicks, landing_page_views, leads, spend, cost_per_click, cost_per_lead, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(project_id, date) DO UPDATE SET
              campaign_id = excluded.campaign_id,
              funnel_name = excluded.funnel_name,
              reach = excluded.reach,
              impressions = excluded.impressions,
              link_clicks = excluded.link_clicks,
              landing_page_views = excluded.landing_page_views,
              leads = excluded.leads,
              spend = excluded.spend,
              cost_per_click = excluded.cost_per_click,
              cost_per_lead = excluded.cost_per_lead,
              metadata = excluded.metadata,
              updated_at = datetime('now')`,
      args: [
        project_id,
        campaign_id,
        funnel_name,
        date,
        reach,
        impressions,
        link_clicks,
        landing_page_views,
        leads,
        spend,
        cost_per_click,
        calculatedCPL,
        typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
      ],
    });
    
    return NextResponse.json({
      success: true,
      message: 'Funnel stats saved',
      rowsAffected: result.rowsAffected,
    });
  } catch (error) {
    console.error('Funnel stats POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save funnel stats',
    }, { status: 500 });
  }
}
