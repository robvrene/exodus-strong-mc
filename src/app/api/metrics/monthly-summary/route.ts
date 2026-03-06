import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Historical monthly data - updated manually or via API
// This stores confirmed monthly summaries for dashboard display
const MONTHLY_DATA: Record<string, {
  revenue: number;
  adSpend: number;
  leads: number;
  sales: number;
  roas: number;
  cpa: number;
  salesByDate: Array<{ date: string; amount: number; count: number }>;
  notes?: string;
}> = {
  '2026-02': {
    revenue: 26500,
    adSpend: 10000, // Approximate based on memory logs
    leads: 385,
    sales: 17,
    roas: 2.65,
    cpa: 26,
    salesByDate: [
      { date: '2026-02-11', amount: 2500, count: 1 },
      { date: '2026-02-21', amount: 8500, count: 4 },
      { date: '2026-02-22', amount: 2500, count: 1 },
      { date: '2026-02-24', amount: 1000, count: 1 },
      { date: '2026-02-25', amount: 4000, count: 3 },
      { date: '2026-02-26', amount: 5000, count: 4 },
      { date: '2026-02-27', amount: 3000, count: 3 },
    ],
    notes: 'Webinar model working. Shifted from 3-day challenge to webinar funnel.',
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // Format: YYYY-MM
  
  if (month) {
    // Return specific month
    const data = MONTHLY_DATA[month];
    if (!data) {
      return NextResponse.json({ error: `No data for ${month}` }, { status: 404 });
    }
    return NextResponse.json({ month, ...data });
  }
  
  // Return all months
  const months = Object.entries(MONTHLY_DATA).map(([month, data]) => ({
    month,
    ...data,
  }));
  
  return NextResponse.json({ months });
}

// POST to update monthly data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, revenue, adSpend, leads, sales, notes } = body;
    
    if (!month || !month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }
    
    const roas = adSpend > 0 ? revenue / adSpend : 0;
    const cpa = leads > 0 ? adSpend / leads : 0;
    
    MONTHLY_DATA[month] = {
      revenue: revenue || MONTHLY_DATA[month]?.revenue || 0,
      adSpend: adSpend || MONTHLY_DATA[month]?.adSpend || 0,
      leads: leads || MONTHLY_DATA[month]?.leads || 0,
      sales: sales || MONTHLY_DATA[month]?.sales || 0,
      roas: Math.round(roas * 100) / 100,
      cpa: Math.round(cpa * 100) / 100,
      salesByDate: MONTHLY_DATA[month]?.salesByDate || [],
      notes: notes || MONTHLY_DATA[month]?.notes,
    };
    
    return NextResponse.json({ success: true, month, data: MONTHLY_DATA[month] });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
