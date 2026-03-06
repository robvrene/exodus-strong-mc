import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Cache to avoid hammering the API - keyed by period
const cache: Record<string, {
  data: GHLMetrics | null;
  timestamp: number;
}> = {};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

interface GHLMetrics {
  contactsTotal: number;
  contactsInPeriod: number;
  opportunitiesTotal: number;
  opportunitiesWon: number;
  opportunitiesValue: number;
  period: TimePeriod;
  lastUpdated: string;
  error?: string;
}

interface GHLConfig {
  provider: string;
  apiVersion: string;
  baseUrl: string;
  locations: {
    [key: string]: {
      id: string;
      name: string;
      token: string;
    };
  };
}

function getStartDateForPeriod(period: TimePeriod): Date {
  const now = new Date();
  const startDate = new Date(now);
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'quarter':
      startDate.setDate(now.getDate() - 90);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }
  
  return startDate;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = (searchParams.get('period') || 'week') as TimePeriod;
  
  const now = Date.now();
  const cacheKey = period;
  
  // Return cached data if still fresh
  if (cache[cacheKey]?.data && (now - cache[cacheKey].timestamp) < CACHE_DURATION_MS) {
    return NextResponse.json(cache[cacheKey].data);
  }
  
  try {
    // Load GHL config from env var first, then fall back to file
    let configContent: string;
    if (process.env.GHL_CONFIG) {
      configContent = process.env.GHL_CONFIG;
    } else {
      const configPath = path.join(process.cwd(), '..', 'config', 'ghl.json');
      configContent = fs.readFileSync(configPath, 'utf-8');
    }
    const config: GHLConfig = JSON.parse(configContent);
    
    const location = config.locations.aim_live;
    const headers = {
      'Authorization': `Bearer ${location.token}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
    };
    
    // Calculate date for the selected period
    const startOfPeriod = getStartDateForPeriod(period);
    
    // Fetch contacts
    let contactsTotal = 0;
    let contactsInPeriod = 0;
    
    try {
      const contactsUrl = `${config.baseUrl}/contacts/?locationId=${location.id}&limit=100`;
      const contactsResponse = await fetch(contactsUrl, { headers });
      
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        contactsTotal = contactsData.meta?.total || contactsData.contacts?.length || 0;
        
        // Count contacts created in the selected period
        if (contactsData.contacts) {
          contactsInPeriod = contactsData.contacts.filter((contact: { dateAdded?: string }) => {
            if (!contact.dateAdded) return false;
            const createdDate = new Date(contact.dateAdded);
            return createdDate >= startOfPeriod;
          }).length;
        }
      } else {
        console.error('GHL contacts fetch failed:', await contactsResponse.text());
      }
    } catch (contactErr) {
      console.error('Error fetching contacts:', contactErr);
    }
    
    // Fetch opportunities
    let opportunitiesTotal = 0;
    let opportunitiesWon = 0;
    let opportunitiesValue = 0;
    
    try {
      const oppsUrl = `${config.baseUrl}/opportunities/search?location_id=${location.id}`;
      const oppsResponse = await fetch(oppsUrl, { 
        method: 'POST',
        headers,
        body: JSON.stringify({
          location_id: location.id,
          limit: 100,
        }),
      });
      
      if (oppsResponse.ok) {
        const oppsData = await oppsResponse.json();
        const opportunities = oppsData.opportunities || [];
        opportunitiesTotal = opportunities.length;
        
        opportunities.forEach((opp: { status?: string; monetaryValue?: number }) => {
          if (opp.status === 'won') {
            opportunitiesWon++;
            opportunitiesValue += opp.monetaryValue || 0;
          }
        });
      } else {
        // Try alternative endpoint
        const altOppsUrl = `${config.baseUrl}/opportunities/?locationId=${location.id}&limit=100`;
        const altOppsResponse = await fetch(altOppsUrl, { headers });
        
        if (altOppsResponse.ok) {
          const oppsData = await altOppsResponse.json();
          const opportunities = oppsData.opportunities || [];
          opportunitiesTotal = opportunities.length;
          
          opportunities.forEach((opp: { status?: string; monetaryValue?: number }) => {
            if (opp.status === 'won') {
              opportunitiesWon++;
              opportunitiesValue += opp.monetaryValue || 0;
            }
          });
        }
      }
    } catch (oppsErr) {
      console.error('Error fetching opportunities:', oppsErr);
    }
    
    const metrics: GHLMetrics = {
      contactsTotal,
      contactsInPeriod,
      opportunitiesTotal,
      opportunitiesWon,
      opportunitiesValue,
      period,
      lastUpdated: new Date().toISOString(),
    };
    
    // Update cache for this period
    cache[cacheKey] = {
      data: metrics,
      timestamp: now,
    };
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('GHL metrics error:', error);
    
    // Return cached data if available, even if stale
    if (cache[cacheKey]?.data) {
      return NextResponse.json({
        ...cache[cacheKey].data,
        error: 'Using cached data - live fetch failed',
      });
    }
    
    // Return error response with placeholder data
    return NextResponse.json({
      contactsTotal: 0,
      contactsInPeriod: 0,
      opportunitiesTotal: 0,
      opportunitiesWon: 0,
      opportunitiesValue: 0,
      period,
      lastUpdated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to fetch GHL metrics',
    }, { status: 500 });
  }
}
