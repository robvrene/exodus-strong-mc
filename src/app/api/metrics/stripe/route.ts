import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';

// Get Turso client for historical data
function getTursoClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  return createClient({ url, authToken });
}

// Fetch historical transactions from Turso (Jan-Feb 2026 from agency account)
async function getHistoricalTransactions(startUnix: number, endUnix: number): Promise<Array<{
  date: number;
  amount: number;
  name: string | null;
  email: string | null;
}>> {
  const client = getTursoClient();
  if (!client) return [];
  
  try {
    const startDate = new Date(startUnix * 1000).toISOString();
    const endDate = new Date(endUnix * 1000).toISOString();
    
    const result = await client.execute({
      sql: 'SELECT date, amount, name, email FROM historical_stripe_transactions WHERE date >= ? AND date <= ? ORDER BY date DESC',
      args: [startDate, endDate]
    });
    
    return result.rows.map(row => ({
      date: Math.floor(new Date(row.date as string).getTime() / 1000),
      amount: row.amount as number,
      name: row.name as string | null,
      email: row.email as string | null
    }));
  } catch (e) {
    console.error('Error fetching historical transactions:', e);
    return [];
  }
}

// Period to days mapping (legacy, kept for reference)
const PERIOD_DAYS: Record<string, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

// All reporting uses EST (America/New_York) to match Stripe account timezone
const TIMEZONE = 'America/New_York';

// Get EST date components
function getESTComponents(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

// Check if date is in DST
function isDSTInEST(date: Date): boolean {
  return date.toLocaleString('en-US', { timeZone: TIMEZONE, timeZoneName: 'short' }).includes('EDT');
}

// Get EST offset string
function getESTOffset(date: Date): string {
  return isDSTInEST(date) ? '-04:00' : '-05:00';
}

// Get Unix timestamp for start of day in EST
function getESTMidnightUnix(date: Date = new Date()): number {
  const { year, month, day } = getESTComponents(date);
  const offset = getESTOffset(date);
  return Math.floor(new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00${offset}`).getTime() / 1000);
}

// Get Unix timestamp for end of day (11:59:59 PM) in EST
function getESTEndOfDayUnix(date: Date = new Date()): number {
  const { year, month, day } = getESTComponents(date);
  const offset = getESTOffset(date);
  return Math.floor(new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59${offset}`).getTime() / 1000);
}

// Get current week boundaries (Monday 12:00 AM to Sunday 11:59 PM ET)
function getCurrentWeekBounds(now: Date): { start: number; end: number; startDate: string; endDate: string } {
  const { year, month, day } = getESTComponents(now);
  
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const estDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00${getESTOffset(now)}`);
  const dayOfWeek = estDate.getDay();
  
  // Calculate days to subtract to get to Monday (if Sunday, go back 6 days; if Monday, 0; if Tuesday, 1; etc.)
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Get Monday
  const monday = new Date(estDate);
  monday.setDate(monday.getDate() - daysToMonday);
  const mondayComponents = getESTComponents(monday);
  
  // Get Sunday (Monday + 6 days)
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const sundayComponents = getESTComponents(sunday);
  
  const startDate = `${mondayComponents.year}-${String(mondayComponents.month).padStart(2, '0')}-${String(mondayComponents.day).padStart(2, '0')}`;
  const endDate = `${sundayComponents.year}-${String(sundayComponents.month).padStart(2, '0')}-${String(sundayComponents.day).padStart(2, '0')}`;
  
  return {
    start: Math.floor(new Date(`${startDate}T00:00:00${getESTOffset(monday)}`).getTime() / 1000),
    end: Math.floor(new Date(`${endDate}T23:59:59${getESTOffset(sunday)}`).getTime() / 1000),
    startDate,
    endDate
  };
}

// Get current month boundaries (1st to last day)
function getCurrentMonthBounds(now: Date): { start: number; end: number; startDate: string; endDate: string } {
  const { year, month } = getESTComponents(now);
  const lastDay = new Date(year, month, 0).getDate();
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  return {
    start: Math.floor(new Date(`${startDate}T00:00:00${getESTOffset(now)}`).getTime() / 1000),
    end: Math.floor(new Date(`${endDate}T23:59:59${getESTOffset(now)}`).getTime() / 1000),
    startDate,
    endDate
  };
}

// Get current quarter boundaries
function getCurrentQuarterBounds(now: Date): { start: number; end: number; startDate: string; endDate: string } {
  const { year, month } = getESTComponents(now);
  const quarter = Math.ceil(month / 3);
  const quarterStartMonth = (quarter - 1) * 3 + 1;
  const quarterEndMonth = quarter * 3;
  const lastDay = new Date(year, quarterEndMonth, 0).getDate();
  
  const startDate = `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(quarterEndMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  return {
    start: Math.floor(new Date(`${startDate}T00:00:00${getESTOffset(now)}`).getTime() / 1000),
    end: Math.floor(new Date(`${endDate}T23:59:59${getESTOffset(now)}`).getTime() / 1000),
    startDate,
    endDate
  };
}

// Get current year boundaries
function getCurrentYearBounds(now: Date): { start: number; end: number; startDate: string; endDate: string } {
  const { year } = getESTComponents(now);
  
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  return {
    start: Math.floor(new Date(`${startDate}T00:00:00${getESTOffset(now)}`).getTime() / 1000),
    end: Math.floor(new Date(`${endDate}T23:59:59${getESTOffset(now)}`).getTime() / 1000),
    startDate,
    endDate
  };
}

async function getStripeKey(): Promise<string | null> {
  try {
    const configPath = join(process.cwd(), '..', 'config', 'stripe.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return config.secret_key;
  } catch {
    return process.env.STRIPE_SECRET_KEY || null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'week';
  const specificMonth = searchParams.get('month'); // Format: YYYY-MM for specific month
  
  try {
    // Stripe key is optional - historical data works without it
    const stripeKey = await getStripeKey();

    // All date calculations use EST (America/New_York) to match Stripe account timezone
    const now = new Date();
    const todayStartUnix = getESTMidnightUnix(now);
    
    // Calculate period bounds based on calendar periods (EST)
    let periodStartUnix: number;
    let periodEndUnix: number;
    let periodStartDate: string;
    let periodEndDate: string;
    
    if (specificMonth) {
      // Parse YYYY-MM format (EST)
      const [year, month] = specificMonth.split('-').map(Number);
      const offset = getESTOffset(now);
      const lastDay = new Date(year, month, 0).getDate();
      periodStartDate = `${year}-${String(month).padStart(2, '0')}-01`;
      periodEndDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      periodStartUnix = Math.floor(new Date(`${periodStartDate}T00:00:00${offset}`).getTime() / 1000);
      periodEndUnix = Math.floor(new Date(`${periodEndDate}T23:59:59${offset}`).getTime() / 1000);
    } else {
      // Use calendar-based periods
      let bounds: { start: number; end: number; startDate: string; endDate: string };
      
      switch (period) {
        case 'week':
          // Current week: Monday 12:00 AM to Sunday 11:59 PM ET
          bounds = getCurrentWeekBounds(now);
          break;
        case 'month':
          // Current calendar month
          bounds = getCurrentMonthBounds(now);
          break;
        case 'quarter':
          // Current calendar quarter
          bounds = getCurrentQuarterBounds(now);
          break;
        case 'year':
          // Current calendar year
          bounds = getCurrentYearBounds(now);
          break;
        default:
          bounds = getCurrentWeekBounds(now);
      }
      
      periodStartUnix = bounds.start;
      periodEndUnix = bounds.end;
      periodStartDate = bounds.startDate;
      periodEndDate = bounds.endDate;
    }

    // Combine data from: 1) Historical (Turso DB) + 2) Live Stripe API
    
    // 1. Fetch historical transactions from Turso (Jan-Feb 2026 agency account data)
    const historicalTransactions = await getHistoricalTransactions(periodStartUnix, periodEndUnix);
    
    // 2. Fetch live Stripe charges (if Stripe key exists)
    let liveCharges: Array<{ created: number; amount: number; name: string | null; email: string | null }> = [];
    
    if (stripeKey) {
      const chargesUrl = `https://api.stripe.com/v1/charges?limit=100&created[gte]=${periodStartUnix}&created[lte]=${periodEndUnix}`;
      
      const chargesRes = await fetch(chargesUrl, {
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
        },
      });

      if (chargesRes.ok) {
        const charges = await chargesRes.json();
        liveCharges = charges.data
          .filter((c: { status: string }) => c.status === 'succeeded')
          .map((c: { created: number; amount: number; billing_details?: { name?: string; email?: string }; receipt_email?: string }) => ({
            created: c.created,
            amount: c.amount / 100,
            name: c.billing_details?.name || null,
            email: c.billing_details?.email || c.receipt_email || null
          }));
      }
    }
    
    // Combine all transactions
    const allTransactions = [
      ...historicalTransactions.map(t => ({ ...t, created: t.date, source: 'historical' })),
      ...liveCharges.map(t => ({ ...t, source: 'live' }))
    ];
    
    // Calculate metrics
    let todayRevenue = 0;
    let todaySales = 0;
    let periodRevenue = 0;
    let periodSales = 0;
    const recentSales: Array<{
      amount: number;
      name: string | null;
      email: string | null;
      created: string;
      status: string;
    }> = [];
    
    // Track by date for breakdown
    const byDate: Record<string, { amount: number; count: number }> = {};

    for (const txn of allTransactions) {
      const chargeDate = txn.created;
      const amount = txn.amount;
      
      periodRevenue += amount;
      periodSales++;
      
      // Track by date
      const dateKey = new Date(chargeDate * 1000).toISOString().split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = { amount: 0, count: 0 };
      byDate[dateKey].amount += amount;
      byDate[dateKey].count++;
      
      if (chargeDate >= todayStartUnix) {
        todayRevenue += amount;
        todaySales++;
      }
      
      // Add to recent sales (top 10)
      if (recentSales.length < 10) {
        recentSales.push({
          amount,
          name: txn.name || null,
          email: txn.email || null,
          created: new Date(chargeDate * 1000).toISOString(),
          status: 'succeeded',
        });
      }
    }
    
    // Convert byDate to sorted array
    const salesByDate = Object.entries(byDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get balance (only if Stripe key exists)
    let pendingBalance = 0;
    let availableBalance = 0;
    
    if (stripeKey) {
      try {
        const balanceRes = await fetch('https://api.stripe.com/v1/balance', {
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
          },
        });
        
        if (balanceRes.ok) {
          const balance = await balanceRes.json();
          pendingBalance = (balance.pending?.[0]?.amount || 0) / 100;
          availableBalance = (balance.available?.[0]?.amount || 0) / 100;
        }
      } catch (e) {
        // Balance fetch failed, continue with zeros
      }
    }

    return NextResponse.json({
      today: {
        revenue: todayRevenue,
        sales: todaySales,
      },
      period: {
        revenue: periodRevenue,
        sales: periodSales,
        start: periodStartDate,
        end: periodEndDate,
        type: period, // week, month, quarter, year
      },
      // Keep last7Days for backward compatibility
      last7Days: {
        revenue: periodRevenue,
        sales: periodSales,
      },
      balance: {
        pending: pendingBalance,
        available: availableBalance,
      },
      salesByDate,
      recentSales,
      lastUpdated: new Date().toISOString(),
      requestedPeriod: period,
      requestedMonth: specificMonth || null,
      dataSources: {
        historical: historicalTransactions.length > 0,
        historicalCount: historicalTransactions.length,
        live: liveCharges.length > 0,
        liveCount: liveCharges.length,
      },
    });
  } catch (error) {
    console.error('Stripe metrics error:', error);
    return NextResponse.json({ error: 'Failed to fetch Stripe metrics' }, { status: 500 });
  }
}
