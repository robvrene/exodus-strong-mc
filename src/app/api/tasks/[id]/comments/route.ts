import { NextRequest, NextResponse } from 'next/server';
import { comments, tasks } from '@/lib/db';
import { notifyCommentAdded } from '@/lib/solomon-wake';

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
    const taskComments = await comments.getByTask(id);
    return NextResponse.json(taskComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await tasks.getById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    const body = await request.json();
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    const author = body.author || 'user';
    const comment = await comments.create(id, body.content.trim(), author);
    
    // Wake Solomon for new comments (from humans)
    notifyCommentAdded(task, { 
      content: body.content.trim(), 
      author 
    }).catch(err => {
      console.error('[Solomon Wake] Error notifying comment:', err);
    });
    
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
