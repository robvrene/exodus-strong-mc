import { NextRequest, NextResponse } from 'next/server';
import { recurringTasks } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recurring = await recurringTasks.getById(id);
    if (!recurring) {
      return NextResponse.json({ error: 'Recurring task not found' }, { status: 404 });
    }
    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Error fetching recurring task:', error);
    return NextResponse.json({ error: 'Failed to fetch recurring task' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const recurring = await recurringTasks.update(id, body);
    if (!recurring) {
      return NextResponse.json({ error: 'Recurring task not found' }, { status: 404 });
    }
    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Error updating recurring task:', error);
    return NextResponse.json({ error: 'Failed to update recurring task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await recurringTasks.delete(id);
    if (!success) {
      return NextResponse.json({ error: 'Recurring task not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring task:', error);
    return NextResponse.json({ error: 'Failed to delete recurring task' }, { status: 500 });
  }
}
