import { NextRequest, NextResponse } from 'next/server';
import { tasks } from '@/lib/db';
import { notifyHighPriorityCreated, notifyAssignedToAaron } from '@/lib/solomon-wake';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allTasks = await tasks.getAll();
    return NextResponse.json(allTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task = await tasks.create(body);
    
    // Wake Solomon for high-priority/urgent tasks
    if (task.priority === 'high' || task.priority === 'urgent') {
      // Fire and forget - don't block the response
      notifyHighPriorityCreated(task, body.created_by || body.assigned_agent).catch(err => {
        console.error('[Solomon Wake] Error notifying high priority:', err);
      });
    }
    
    // Wake Solomon if task is assigned to Aaron
    if (task.assigned_agent?.toLowerCase() === 'aaron') {
      notifyAssignedToAaron(task, body.created_by).catch(err => {
        console.error('[Solomon Wake] Error notifying Aaron assignment:', err);
      });
    }
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
