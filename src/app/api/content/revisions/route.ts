import { NextResponse } from 'next/server';
import { content, contentActivity } from '@/lib/content-db';

// GET /api/content/revisions - Get all content with pending revision requests
export async function GET() {
  try {
    // Get all draft content
    const drafts = await content.getAll({ status: 'draft' });
    
    // Filter to only those with revision_feedback in metadata
    const revisions = drafts.filter(item => {
      if (!item.metadata) return false;
      try {
        const meta = JSON.parse(item.metadata);
        return !!meta.revision_feedback;
      } catch {
        return false;
      }
    }).map(item => {
      let feedback = null;
      let requestedAt = null;
      try {
        const meta = JSON.parse(item.metadata!);
        feedback = meta.revision_feedback;
        requestedAt = meta.revision_requested_at;
      } catch { /* ignore */ }
      
      return {
        id: item.id,
        title: item.title,
        platform: item.platform,
        copy: item.copy,
        revision_feedback: feedback,
        revision_requested_at: requestedAt,
        created_at: item.created_at,
      };
    });
    
    return NextResponse.json(revisions);
  } catch (error) {
    console.error('Failed to fetch revisions:', error);
    return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
  }
}
