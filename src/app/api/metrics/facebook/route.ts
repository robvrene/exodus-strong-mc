import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Cache to avoid hammering the API - keyed by period
const cache: Record<string, {
  data: FacebookMetrics | null;
  timestamp: number;
}> = {};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface FacebookMetrics {
  spend: number;
  leads: number;
  cpa: number;
  impressions: number;
  clicks: number;
  ctr: number;
  dateRange: {
    start: string;
    end: string;
  };
  lastUpdated: string;
  period: string;
  error?: string;
}

interface FacebookConfig {
  provider: string;
  apiVersion: string;
  baseUrl: string;
  accessToken: string;
  adAccounts: {
    aim_primary: string;
    [key: string]: string;
  };
}

// Period to days mapping
const PERIOD_DAYS: Record<string, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

// Period to Facebook date_preset mapping
// Note: Facebook doesn't have last_365d, so we use this_year (from Jan 1)
const PERIOD_PRESETS: Record<string, string> = {
  week: 'last_7d',
  month: 'last_30d',
  quarter: 'last_90d',
  year: 'this_year',
};

export async function GET(request: NextRequest) {
  const now = Date.now();
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'week';
  
  // Validate period
  if (!PERIOD_DAYS[period]) {
    return NextResponse.json({ error: 'Invalid period. Use: week, month, quarter, year' }, { status: 400 });
  }
  
  // Return cached data if still fresh for this period
  if (cache[period]?.data && (now - cache[period].timestamp) < CACHE_DURATION_MS) {
    return NextResponse.json(cache[period].data);
  }
  
  try {
    // Load Facebook config from env var first, then fall back to file
    let configContent: string;
    if (process.env.FACEBOOK_CONFIG) {
      configContent = process.env.FACEBOOK_CONFIG;
    } else {
      const configPath = path.join(process.cwd(), '..', 'config', 'facebook.json');
      configContent = fs.readFileSync(configPath, 'utf-8');
    }
    const config: FacebookConfig = JSON.parse(configContent);
    
    // Calculate date range based on period
    const days = PERIOD_DAYS[period];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const datePreset = PERIOD_PRESETS[period];
    
    // Build the API URL
    const accountId = config.adAccounts.aim_primary;
    const fields = 'spend,impressions,clicks,actions,ctr';
    const url = `${config.baseUrl}/${config.apiVersion}/${accountId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${config.accessToken}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facebook API error:', errorText);
      throw new Error(`Facebook API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Parse the response
    let spend = 0;
    let leads = 0;
    let impressions = 0;
    let clicks = 0;
    let ctr = 0;
    
    if (data.data && data.data.length > 0) {
      const insights = data.data[0];
      spend = parseFloat(insights.spend || '0');
      impressions = parseInt(insights.impressions || '0', 10);
      clicks = parseInt(insights.clicks || '0', 10);
      ctr = parseFloat(insights.ctr || '0');
      
      // Find leads in actions array
      if (insights.actions) {
        const leadAction = insights.actions.find(
          (action: { action_type: string; value: string }) => 
            action.action_type === 'lead' || 
            action.action_type === 'onsite_conversion.lead_grouped'
        );
        if (leadAction) {
          leads = parseInt(leadAction.value, 10);
        }
      }
    }
    
    // Calculate CPA
    const cpa = leads > 0 ? spend / leads : 0;
    
    const metrics: FacebookMetrics = {
      spend,
      leads,
      cpa: Math.round(cpa * 100) / 100,
      impressions,
      clicks,
      ctr: Math.round(ctr * 100) / 100,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      lastUpdated: new Date().toISOString(),
      period,
    };
    
    // Update cache for this period
    cache[period] = {
      data: metrics,
      timestamp: now,
    };
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Facebook metrics error:', error);
    
    // Return cached data if available, even if stale
    if (cache[period]?.data) {
      return NextResponse.json({
        ...cache[period].data,
        error: 'Using cached data - live fetch failed',
      });
    }
    
    // Return error response with placeholder data
    return NextResponse.json({
      spend: 0,
      leads: 0,
      cpa: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      dateRange: {
        start: '',
        end: '',
      },
      lastUpdated: new Date().toISOString(),
      period,
      error: error instanceof Error ? error.message : 'Failed to fetch Facebook metrics',
    }, { status: 500 });
  }
}
