#!/usr/bin/env node
/**
 * Revision Notification Script for Mission Control Media Hub
 * 
 * Checks for content items with status='draft' and revision_feedback in metadata
 * that haven't been notified yet. Outputs notification for OpenClaw to send via Telegram.
 * 
 * Run via cron every 15 minutes.
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load Turso config from workspace config
const configPath = path.join(__dirname, '../../config/turso.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const client = createClient({
  url: config.database_url,
  authToken: config.auth_token,
});

async function main() {
  console.log(`[${new Date().toISOString()}] Checking for revision requests...`);

  // Query for draft content items with metadata
  const result = await client.execute(`
    SELECT id, title, platform, metadata 
    FROM content_items 
    WHERE status = 'draft' 
    AND metadata IS NOT NULL
  `);

  const pendingRevisions = [];
  
  for (const row of result.rows) {
    try {
      const metadata = JSON.parse(row.metadata || '{}');
      
      // Check if has revision_feedback but not yet notified
      if (metadata.revision_feedback && !metadata.revision_notified) {
        pendingRevisions.push({
          id: row.id,
          title: row.title,
          platform: row.platform,
          feedback: metadata.revision_feedback,
          metadata: metadata
        });
      }
    } catch (e) {
      // Skip items with invalid JSON metadata
      console.error(`Invalid metadata for content ${row.id}:`, e.message);
    }
  }

  if (pendingRevisions.length === 0) {
    console.log('No pending revision requests found.');
    return { notified: 0 };
  }

  console.log(`Found ${pendingRevisions.length} pending revision request(s)`);

  // Build notification message for Telegram
  let message = `📝 Content Revision Request${pendingRevisions.length > 1 ? 's' : ''}\n\n`;
  
  for (const item of pendingRevisions) {
    message += `• ${item.title} (${item.platform})\n`;
    message += `  Feedback: ${item.feedback}\n\n`;
  }

  message += `View in Mission Control: http://localhost:3000/content`;

  // Output JSON result for cron handler to process
  const output = {
    hasRevisions: true,
    count: pendingRevisions.length,
    message: message,
    items: pendingRevisions.map(i => ({ id: i.id, title: i.title, platform: i.platform, feedback: i.feedback }))
  };
  
  // Mark items as notified
  for (const item of pendingRevisions) {
    const updatedMetadata = {
      ...item.metadata,
      revision_notified: true,
      revision_notified_at: new Date().toISOString()
    };
    
    await client.execute({
      sql: `UPDATE content_items SET metadata = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [JSON.stringify(updatedMetadata), item.id]
    });
    
    console.log(`Marked ${item.id} as notified`);
  }

  // Output special marker for the notification message
  console.log('\n===TELEGRAM_NOTIFICATION===');
  console.log(message);
  console.log('===END_NOTIFICATION===');

  return output;
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
