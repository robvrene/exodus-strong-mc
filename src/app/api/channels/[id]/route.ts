import { NextRequest, NextResponse } from 'next/server';
import { channels, channelMetrics } from '@/lib/content-db';

// GET /api/channels/[id] - Get channel with metrics history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const channel = await channels.getById(id);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const metrics = await channelMetrics.getByChannel(id, days);
    const summary = await channelMetrics.getSummary(id);

    return NextResponse.json({
      channel,
      metrics,
      summary,
    });
  } catch (error) {
    console.error('Failed to fetch channel:', error);
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 });
  }
}

// DELETE /api/channels/[id] - Delete a channel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await channels.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete channel:', error);
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
}
