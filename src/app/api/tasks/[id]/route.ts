import { NextRequest, NextResponse } from 'next/server';
import { tasks } from '@/lib/db';
import { 
  notifyStatusChange, 
  notifyAssignedToAaron, 
  notifyHighPriorityCreated 
} from '@/lib/solomon-wake';

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
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Get existing task to detect changes
    const existingTask = await tasks.getById(id);
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    const task = await tasks.update(id, body);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Wake Solomon for status changes
    if (body.status && body.status !== existingTask.status) {
      notifyStatusChange(task, existingTask.status, body.status, body.updated_by).catch(err => {
        console.error('[Solomon Wake] Error notifying status change:', err);
      });
    }
    
    // Wake Solomon if newly assigned to Aaron
    if (body.assigned_agent?.toLowerCase() === 'aaron' && 
        existingTask.assigned_agent?.toLowerCase() !== 'aaron') {
      notifyAssignedToAaron(task, body.updated_by).catch(err => {
        console.error('[Solomon Wake] Error notifying Aaron assignment:', err);
      });
    }
    
    // Wake Solomon if priority escalated to high/urgent
    if ((body.priority === 'high' || body.priority === 'urgent') &&
        existingTask.priority !== 'high' && existingTask.priority !== 'urgent') {
      notifyHighPriorityCreated(task, body.updated_by).catch(err => {
        console.error('[Solomon Wake] Error notifying priority escalation:', err);
      });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await tasks.delete(id);
    if (!success) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
