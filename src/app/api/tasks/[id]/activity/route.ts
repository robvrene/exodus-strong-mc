import { NextRequest, NextResponse } from 'next/server';
import { activity, tasks } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await tasks.getById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    // Get activity for this specific task
    const allActivity = await activity.getRecent(100);
    const taskActivity = allActivity.filter(a => a.task_id === id);
    return NextResponse.json(taskActivity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
