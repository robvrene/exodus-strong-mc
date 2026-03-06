/**
 * Solomon Wake Notification System
 * 
 * Sends important Mission Control events to Solomon's main session
 * using OpenClaw cron wakes. Only triggers for significant changes
 * that require attention.
 */

import { Task, Comment } from './db';

// Configuration
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:3033';
const OPENCLAW_GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Wake types that Solomon should be notified about
export type WakeEventType = 
  | 'comment_added'
  | 'task_status_changed'
  | 'task_assigned_aaron'
  | 'high_priority_created'
  | 'urgent_task_created';

interface WakeEvent {
  type: WakeEventType;
  taskId: string;
  taskTitle: string;
  details: string;
  timestamp: string;
  author?: string;
}

// Filtering rules for what's considered "important"
const IMPORTANT_STATUS_CHANGES: string[] = [
  'in-review',        // Something ready for review
  'waiting-on-aaron', // Aaron needs to do something
  'done',             // Task completed (good to know)
];

const SKIP_AUTHORS = [
  'system',
  'solomon',
  'cron',
  'recurring-task-generator',
];

/**
 * Determine if a status change is important enough to wake Solomon
 */
function isStatusChangeImportant(oldStatus: string, newStatus: string): boolean {
  // Any move to an "important" status
  if (IMPORTANT_STATUS_CHANGES.includes(newStatus)) {
    return true;
  }
  
  // Skip inbox -> up-next (minor triage)
  if (oldStatus === 'inbox' && newStatus === 'up-next') {
    return false;
  }
  
  // Skip done -> any (reopening - might be noise)
  if (oldStatus === 'done') {
    return false;
  }
  
  // Default: wake for most status changes
  return newStatus !== oldStatus;
}

/**
 * Check if the author is a human (not system/automated)
 */
function isHumanAuthor(author: string | undefined | null): boolean {
  if (!author) return true; // Assume human if no author
  const lowerAuthor = author.toLowerCase();
  return !SKIP_AUTHORS.some(skip => lowerAuthor.includes(skip));
}

/**
 * Format a wake message for Solomon
 */
function formatWakeMessage(event: WakeEvent): string {
  const emoji = {
    comment_added: '💬',
    task_status_changed: '🔄',
    task_assigned_aaron: '👤',
    high_priority_created: '🔥',
    urgent_task_created: '🚨',
  }[event.type] || '📋';

  const typeLabel = {
    comment_added: 'New Comment',
    task_status_changed: 'Status Changed',
    task_assigned_aaron: 'Assigned to Aaron',
    high_priority_created: 'High Priority Task',
    urgent_task_created: 'URGENT Task',
  }[event.type] || 'Update';

  return `${emoji} **Mission Control: ${typeLabel}**

**Task:** ${event.taskTitle}
**Details:** ${event.details}
${event.author ? `**By:** ${event.author}` : ''}

[View in Mission Control](https://mission-control-flax.vercel.app/?task=${event.taskId})`;
}

/**
 * Send wake to Solomon via Telegram (primary method)
 * Falls back gracefully if not configured
 */
async function sendTelegramNotification(message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('[Solomon Wake] Telegram not configured, skipping notification');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Solomon Wake] Telegram API error:', error);
      return false;
    }

    console.log('[Solomon Wake] Telegram notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Solomon Wake] Failed to send Telegram notification:', error);
    return false;
  }
}

/**
 * Try to send wake via OpenClaw gateway (if available)
 */
async function sendOpenClawWake(event: WakeEvent): Promise<boolean> {
  if (!OPENCLAW_GATEWAY_TOKEN) {
    console.log('[Solomon Wake] OpenClaw gateway token not configured');
    return false;
  }

  try {
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/api/cron`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        action: 'wake',
        session: 'agent:main:main',
        text: formatWakeMessage(event),
      }),
    });

    if (!response.ok) {
      console.error('[Solomon Wake] OpenClaw gateway error:', await response.text());
      return false;
    }

    console.log('[Solomon Wake] OpenClaw wake sent successfully');
    return true;
  } catch (error) {
    console.error('[Solomon Wake] Failed to send OpenClaw wake:', error);
    return false;
  }
}

/**
 * Main function to wake Solomon about an event
 * Tries OpenClaw first, falls back to Telegram
 */
async function wakeSolomon(event: WakeEvent): Promise<void> {
  console.log('[Solomon Wake] Processing event:', event.type, event.taskTitle);
  
  const message = formatWakeMessage(event);
  
  // Try Telegram (more reliable for now)
  const telegramSent = await sendTelegramNotification(message);
  
  // Also try OpenClaw wake if configured (future-proofing)
  if (OPENCLAW_GATEWAY_TOKEN) {
    await sendOpenClawWake(event);
  }
  
  if (!telegramSent && !OPENCLAW_GATEWAY_TOKEN) {
    console.log('[Solomon Wake] No notification method available');
  }
}

// ============================================================
// PUBLIC API - Use these functions from API routes
// ============================================================

/**
 * Notify Solomon when a new comment is added
 */
export async function notifyCommentAdded(
  task: Task,
  comment: { content: string; author: string }
): Promise<void> {
  // Skip automated comments
  if (!isHumanAuthor(comment.author)) {
    console.log('[Solomon Wake] Skipping automated comment from:', comment.author);
    return;
  }

  await wakeSolomon({
    type: 'comment_added',
    taskId: task.id,
    taskTitle: task.title,
    details: comment.content.substring(0, 200) + (comment.content.length > 200 ? '...' : ''),
    author: comment.author,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notify Solomon when task status changes
 */
export async function notifyStatusChange(
  task: Task,
  oldStatus: string,
  newStatus: string,
  changedBy?: string
): Promise<void> {
  // Skip if not important
  if (!isStatusChangeImportant(oldStatus, newStatus)) {
    console.log('[Solomon Wake] Skipping minor status change:', oldStatus, '->', newStatus);
    return;
  }

  // Skip automated changes
  if (changedBy && !isHumanAuthor(changedBy)) {
    console.log('[Solomon Wake] Skipping automated status change by:', changedBy);
    return;
  }

  await wakeSolomon({
    type: 'task_status_changed',
    taskId: task.id,
    taskTitle: task.title,
    details: `${oldStatus} → ${newStatus}`,
    author: changedBy,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notify Solomon when a task is assigned to Aaron
 */
export async function notifyAssignedToAaron(
  task: Task,
  assignedBy?: string
): Promise<void> {
  await wakeSolomon({
    type: 'task_assigned_aaron',
    taskId: task.id,
    taskTitle: task.title,
    details: `Task now requires Aaron's attention`,
    author: assignedBy,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notify Solomon when a high-priority or urgent task is created
 */
export async function notifyHighPriorityCreated(
  task: Task,
  createdBy?: string
): Promise<void> {
  // Skip if created by system/automation
  if (createdBy && !isHumanAuthor(createdBy)) {
    console.log('[Solomon Wake] Skipping automated high-priority task');
    return;
  }

  const isUrgent = task.priority === 'urgent';
  
  await wakeSolomon({
    type: isUrgent ? 'urgent_task_created' : 'high_priority_created',
    taskId: task.id,
    taskTitle: task.title,
    details: task.description?.substring(0, 150) || 'No description',
    author: createdBy,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check if a task update is important enough to notify
 * Used by API routes to pre-filter before calling specific notify functions
 */
export function shouldNotify(
  eventType: 'status_change' | 'comment' | 'assignment' | 'priority',
  data: {
    oldStatus?: string;
    newStatus?: string;
    author?: string;
    priority?: string;
    assignee?: string;
  }
): boolean {
  // Always skip automated changes
  if (data.author && !isHumanAuthor(data.author)) {
    return false;
  }

  switch (eventType) {
    case 'status_change':
      return data.oldStatus && data.newStatus 
        ? isStatusChangeImportant(data.oldStatus, data.newStatus)
        : false;
    
    case 'comment':
      return true; // Comments from humans are always interesting
    
    case 'assignment':
      return data.assignee?.toLowerCase() === 'aaron';
    
    case 'priority':
      return data.priority === 'high' || data.priority === 'urgent';
    
    default:
      return false;
  }
}
