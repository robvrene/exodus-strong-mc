import { NextRequest, NextResponse } from 'next/server';
import { recurringTasks } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/recurring-tasks/generate - Generate tasks from due recurring templates
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for a secret key to prevent unauthorized cron triggers
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, require it in the request
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await recurringTasks.generateDueTasks();
    
    return NextResponse.json({
      success: true,
      created: result.created,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating recurring tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to generate recurring tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for Vercel Cron (cron jobs make GET requests)
export async function GET(request: NextRequest) {
  try {
    // Check for Vercel cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await recurringTasks.generateDueTasks();
    
    return NextResponse.json({
      success: true,
      created: result.created,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating recurring tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to generate recurring tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
