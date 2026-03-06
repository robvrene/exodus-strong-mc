import { NextRequest, NextResponse } from 'next/server';
import { recurringTasks } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allRecurring = await recurringTasks.getAll();
    return NextResponse.json(allRecurring);
  } catch (error) {
    console.error('Error fetching recurring tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch recurring tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const recurring = await recurringTasks.create(body);
    return NextResponse.json(recurring, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring task:', error);
    return NextResponse.json({ error: 'Failed to create recurring task' }, { status: 500 });
  }
}
