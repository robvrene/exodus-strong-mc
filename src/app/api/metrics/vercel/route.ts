import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@libsql/client';

// Turso client for lead tracking data
const getTursoClient = () => {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    return null;
  }
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
};

interface PageStats {
  path: string;
  views: number;
  visitors: number;
}

interface VercelAnalytics {
  pageViews: number;
  uniqueVisitors: number;
  pages: PageStats[];
  topReferrers: { referrer: string; views: number }[];
}

interface StripeMetrics {
  sales: number;
  revenue: number;
}

interface LeadMetrics {
  total: number;
  unique: number;
}

interface FunnelMetrics {
  analytics: VercelAnalytics;
  stripe: StripeMetrics;
  leads: LeadMetrics;
  epc: number; // Earnings per click (visitor)
  conversionRate: number; // Sales / Visitors %
}

interface FunnelProject {
  id: string;
  name: string;
  projectId: string;
  liveUrl: string;
  analytics?: VercelAnalytics;
  leads?: LeadMetrics;
  error?: string;
}

const FUNNEL_PROJECTS: FunnelProject[] = [
  {
    id: 'race-to-revenue',
    name: 'Race to Revenue',
    projectId: 'prj_LKBGTKvnRYs04TgRINHAw3Wf50Cy',
    liveUrl: 'https://race-to-revenue.vercel.app',
  },
  {
    id: 'openclaw-webinar',
    name: 'OpenClaw Playbook Webinar',
    projectId: 'prj_NDxjDk90h7jGWfP1FS6InibMKoaG',
    liveUrl: 'https://openclaw-webinar.vercel.app',
  },
  // Add more funnels here as they're created
];

async function fetchVercelAnalytics(
  projectId: string,
  token: string,
  teamId: string,
  from: string,
  to: string
): Promise<VercelAnalytics> {
  const baseUrl = 'https://vercel.com/api/web-analytics';

  // Fetch page-level stats 
  const pathsUrl = `${baseUrl}/stats?projectId=${projectId}&teamId=${teamId}&from=${from}&to=${to}&type=path`;
  
  // Fetch top referrers
  const referrersUrl = `${baseUrl}/stats?projectId=${projectId}&teamId=${teamId}&from=${from}&to=${to}&type=referrer`;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const [pathsRes, referrersRes] = await Promise.all([
      fetch(pathsUrl, { headers }),
      fetch(referrersUrl, { headers }),
    ]);

    const pathsData = pathsRes.ok ? await pathsRes.json() : null;
    const referrersData = referrersRes.ok ? await referrersRes.json() : null;

    // Parse page-level data
    const pages: PageStats[] = [];
    let totalPageViews = 0;
    let totalVisitors = 0;

    if (pathsData?.data && Array.isArray(pathsData.data)) {
      pathsData.data.forEach((entry: { key: string; total?: number; devices?: number; pageViews?: number; visitors?: number }) => {
        const views = entry.total || entry.pageViews || 0;
        const visitors = entry.devices || entry.visitors || 0;
        totalPageViews += views;
        totalVisitors += visitors;
        pages.push({
          path: entry.key || '/',
          views,
          visitors,
        });
      });
      // Sort by views descending
      pages.sort((a, b) => b.views - a.views);
    }

    // Parse top referrers
    const topReferrers: { referrer: string; views: number }[] = [];
    if (referrersData?.data && Array.isArray(referrersData.data)) {
      referrersData.data.slice(0, 5).forEach((entry: { key: string; total?: number; pageViews?: number }) => {
        topReferrers.push({
          referrer: entry.key || 'Direct',
          views: entry.total || entry.pageViews || 0,
        });
      });
    }

    return {
      pageViews: totalPageViews,
      uniqueVisitors: totalVisitors,
      pages,
      topReferrers,
    };
  } catch (error) {
    console.error('Error fetching Vercel analytics:', error);
    throw error;
  }
}

async function fetchLeadMetrics(funnelId: string, from: string, to: string): Promise<LeadMetrics> {
  const client = getTursoClient();
  if (!client) {
    return { total: 0, unique: 0 };
  }

  try {
    // Query leads from our tracking database
    // Leads are tracked as page = '/lead' when form is submitted
    const fromDate = from.split('T')[0]; // Extract date part
    const toDate = to.split('T')[0];
    
    const result = await client.execute({
      sql: `
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT visitor_id) as unique_visitors
        FROM page_views 
        WHERE funnel = ? 
          AND page = '/lead'
          AND DATE(created_at) >= ?
          AND DATE(created_at) <= ?
      `,
      args: [funnelId, fromDate, toDate]
    });

    const row = result.rows[0];
    return {
      total: (row?.total as number) || 0,
      unique: (row?.unique_visitors as number) || 0,
    };
  } catch (error) {
    console.error('Error fetching lead metrics:', error);
    return { total: 0, unique: 0 };
  }
}

async function fetchStripeMetrics(from: string, to: string): Promise<StripeMetrics> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { sales: 0, revenue: 0 };
  }

  try {
    const fromUnix = Math.floor(new Date(from).getTime() / 1000);
    const toUnix = Math.floor(new Date(to).getTime() / 1000);

    const res = await fetch(
      `https://api.stripe.com/v1/charges?limit=100&created[gte]=${fromUnix}&created[lte]=${toUnix}`,
      {
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
        },
      }
    );

    if (!res.ok) {
      return { sales: 0, revenue: 0 };
    }

    const data = await res.json();
    let sales = 0;
    let revenue = 0;

    for (const charge of data.data) {
      if (charge.status === 'succeeded') {
        sales++;
        revenue += charge.amount / 100; // Convert cents to dollars
      }
    }

    return { sales, revenue };
  } catch (error) {
    console.error('Error fetching Stripe metrics:', error);
    return { sales: 0, revenue: 0 };
  }
}

export async function GET(request: Request) {
  try {
    // Get Vercel credentials from env or config file
    let token = process.env.VERCEL_ANALYTICS_TOKEN;
    let teamId = process.env.VERCEL_TEAM_ID;

    // Fallback to config file for local development
    if (!token || !teamId) {
      try {
        const configPath = join(process.cwd(), '..', 'config', 'vercel.json');
        const configFile = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configFile);
        token = token || config.token;
        teamId = teamId || config.team_id;
      } catch {
        // Config file not found, continue with env vars only
      }
    }

    if (!token || !teamId) {
      return NextResponse.json(
        { error: 'Missing Vercel credentials - set VERCEL_ANALYTICS_TOKEN and VERCEL_TEAM_ID' },
        { status: 500 }
      );
    }

    // Parse time period from query
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Calculate date range
    const now = new Date();
    const to = now.toISOString();
    let from: string;

    switch (period) {
      case 'today':
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        from = todayStart.toISOString();
        break;
      case 'month':
        const monthStart = new Date(now);
        monthStart.setDate(monthStart.getDate() - 30);
        from = monthStart.toISOString();
        break;
      case 'week':
      default:
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        from = weekStart.toISOString();
        break;
    }

    // Fetch Stripe metrics for the period
    const stripeMetrics = await fetchStripeMetrics(from, to);

    // Fetch analytics and leads for all funnel projects
    const projectsWithAnalytics = await Promise.all(
      FUNNEL_PROJECTS.map(async (project) => {
        try {
          const [analytics, leads] = await Promise.all([
            fetchVercelAnalytics(
              project.projectId,
              token,
              teamId,
              from,
              to
            ),
            fetchLeadMetrics(project.id, from, to)
          ]);
          
          // Calculate EPC and conversion rate
          const visitors = analytics.uniqueVisitors || 1; // Avoid division by zero
          const epc = stripeMetrics.revenue / visitors;
          const conversionRate = (stripeMetrics.sales / visitors) * 100;

          return { 
            ...project, 
            analytics,
            leads,
            stripe: stripeMetrics,
            epc: Math.round(epc * 100) / 100, // Round to 2 decimal places
            conversionRate: Math.round(conversionRate * 100) / 100,
          };
        } catch (error) {
          return { 
            ...project, 
            error: error instanceof Error ? error.message : 'Failed to fetch analytics' 
          };
        }
      })
    );

    // Calculate totals
    const totals = projectsWithAnalytics.reduce(
      (acc, project) => {
        if (project.analytics) {
          acc.pageViews += project.analytics.pageViews;
          acc.uniqueVisitors += project.analytics.uniqueVisitors;
        }
        if (project.leads) {
          acc.leads += project.leads.unique; // Use unique leads count
        }
        return acc;
      },
      { pageViews: 0, uniqueVisitors: 0, leads: 0, sales: stripeMetrics.sales, revenue: stripeMetrics.revenue }
    );

    return NextResponse.json({
      projects: projectsWithAnalytics,
      totals,
      stripe: stripeMetrics,
      period,
      from,
      to,
    });
  } catch (error) {
    console.error('Vercel analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Vercel analytics' },
      { status: 500 }
    );
  }
}
