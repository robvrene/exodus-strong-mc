import { createClient, Client } from '@libsql/client';

// Initialize Turso client
const client: Client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/mission-control.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize schema on first import
let schemaInitialized = false;

async function initializeSchema() {
  if (schemaInitialized) return;
  
  await client.batch([
    // Tasks table (Kanban items)
    `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'inbox',
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_agent TEXT,
      mission_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      due_date TEXT,
      tags TEXT,
      metadata TEXT
    )`,

    // Missions table (grouping of related tasks)
    `CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Activity log
    `CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      agent TEXT,
      task_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Comments on tasks
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )`,

    // Subtasks (checklist items)
    `CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )`,

    // Links attached to tasks
    `CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )`,

    // Recurring tasks table
    `CREATE TABLE IF NOT EXISTS recurring_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      project_id TEXT,
      schedule_type TEXT NOT NULL,
      schedule_day INTEGER,
      schedule_time TEXT,
      cron_expression TEXT,
      last_created_at TEXT,
      next_due_at TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Funnel Ad Stats table (FB Ads, etc.)
    `CREATE TABLE IF NOT EXISTS funnel_ad_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      campaign_id TEXT,
      funnel_name TEXT NOT NULL,
      date TEXT NOT NULL,
      reach INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      link_clicks INTEGER DEFAULT 0,
      landing_page_views INTEGER DEFAULT 0,
      leads INTEGER DEFAULT 0,
      spend REAL DEFAULT 0,
      cost_per_click REAL DEFAULT 0,
      cost_per_lead REAL DEFAULT 0,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(project_id, date)
    )`,

    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_mission ON tasks(mission_id)`,
    `CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id)`,
    `CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id)`,
    `CREATE INDEX IF NOT EXISTS idx_links_task ON links(task_id)`,
    `CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active ON recurring_tasks(active)`,
    `CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next_due ON recurring_tasks(next_due_at)`,
    `CREATE INDEX IF NOT EXISTS idx_funnel_ad_stats_project ON funnel_ad_stats(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_funnel_ad_stats_date ON funnel_ad_stats(date DESC)`,
  ], 'write');
  
  schemaInitialized = true;
}

// Type definitions
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'inbox' | 'up-next' | 'in-progress' | 'waiting-on-aaron' | 'in-review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_agent: string | null;
  mission_id: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  tags: string | null;
  metadata: string | null;
}

export interface Mission {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  type: 'task_created' | 'task_updated' | 'task_moved' | 'agent_action' | 'comment' | 'system';
  message: string;
  agent: string | null;
  task_id: string | null;
  metadata: string | null;
  created_at: string;
}

export interface Comment {
  id: number;
  task_id: string;
  content: string;
  author: string;
  created_at: string;
}

export interface Subtask {
  id: number;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface Link {
  id: number;
  task_id: string;
  url: string;
  title: string | null;
  created_at: string;
}

export interface RecurringTask {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id: string | null;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule_day: number | null;
  schedule_time: string | null;
  cron_expression: string | null;
  last_created_at: string | null;
  next_due_at: string | null;
  active: boolean;
  created_at: string;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

// Task operations
export const tasks = {
  getAll: async (): Promise<Task[]> => {
    await initializeSchema();
    const result = await client.execute('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows as unknown as Task[];
  },

  getByStatus: async (status: string): Promise<Task[]> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC',
      args: [status],
    });
    return result.rows as unknown as Task[];
  },

  getById: async (id: string): Promise<Task | undefined> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM tasks WHERE id = ?',
      args: [id],
    });
    return result.rows[0] as unknown as Task | undefined;
  },

  create: async (data: Partial<Task>): Promise<Task> => {
    await initializeSchema();
    const id = generateId();
    await client.execute({
      sql: `INSERT INTO tasks (id, title, description, status, priority, assigned_agent, mission_id, due_date, tags, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.title || 'Untitled Task',
        data.description || null,
        data.status || 'inbox',
        data.priority || 'medium',
        data.assigned_agent || null,
        data.mission_id || null,
        data.due_date || null,
        data.tags || null,
        data.metadata || null,
      ],
    });
    
    // Log activity
    await activity.log('task_created', `Task created: ${data.title}`, null, id);
    
    return (await tasks.getById(id))!;
  },

  update: async (id: string, data: Partial<Task>): Promise<Task | undefined> => {
    await initializeSchema();
    const existing = await tasks.getById(id);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
    if (data.priority !== undefined) { updates.push('priority = ?'); values.push(data.priority); }
    if (data.assigned_agent !== undefined) { updates.push('assigned_agent = ?'); values.push(data.assigned_agent); }
    if (data.mission_id !== undefined) { updates.push('mission_id = ?'); values.push(data.mission_id); }
    if (data.due_date !== undefined) { updates.push('due_date = ?'); values.push(data.due_date); }
    if (data.tags !== undefined) { updates.push('tags = ?'); values.push(data.tags); }
    if (data.metadata !== undefined) { updates.push('metadata = ?'); values.push(data.metadata); }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await client.execute({
      sql: `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      args: values,
    });

    // Log status change
    if (data.status && data.status !== existing.status) {
      await activity.log('task_moved', `Task moved from ${existing.status} to ${data.status}: ${existing.title}`, data.assigned_agent || null, id);
    }

    return tasks.getById(id);
  },

  delete: async (id: string): Promise<boolean> => {
    await initializeSchema();
    const existing = await tasks.getById(id);
    if (!existing) return false;
    
    await client.execute({
      sql: 'DELETE FROM tasks WHERE id = ?',
      args: [id],
    });
    await activity.log('task_updated', `Task deleted: ${existing.title}`, null, null);
    return true;
  },

  getStats: async () => {
    await initializeSchema();
    const result = await client.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_count
      FROM tasks 
      GROUP BY status
    `);
    
    return result.rows as unknown as { status: string; count: number; urgent_count: number }[];
  },
};

// Mission operations
export const missions = {
  getAll: async (): Promise<Mission[]> => {
    await initializeSchema();
    const result = await client.execute('SELECT * FROM missions ORDER BY created_at DESC');
    return result.rows as unknown as Mission[];
  },

  getById: async (id: string): Promise<Mission | undefined> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM missions WHERE id = ?',
      args: [id],
    });
    return result.rows[0] as unknown as Mission | undefined;
  },

  create: async (data: Partial<Mission>): Promise<Mission> => {
    await initializeSchema();
    const id = generateId();
    await client.execute({
      sql: `INSERT INTO missions (id, name, description, status)
            VALUES (?, ?, ?, ?)`,
      args: [id, data.name || 'Untitled Mission', data.description || null, data.status || 'active'],
    });
    return (await missions.getById(id))!;
  },

  update: async (id: string, data: Partial<Mission>): Promise<Mission | undefined> => {
    await initializeSchema();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await client.execute({
      sql: `UPDATE missions SET ${updates.join(', ')} WHERE id = ?`,
      args: values,
    });
    return missions.getById(id);
  },

  delete: async (id: string): Promise<boolean> => {
    await initializeSchema();
    await client.execute({
      sql: 'DELETE FROM missions WHERE id = ?',
      args: [id],
    });
    return true;
  },
};

// Activity operations
export const activity = {
  getRecent: async (limit = 50): Promise<Activity[]> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM activity ORDER BY created_at DESC LIMIT ?',
      args: [limit],
    });
    return result.rows as unknown as Activity[];
  },

  log: async (type: Activity['type'], message: string, agent: string | null = null, taskId: string | null = null, metadata: string | null = null) => {
    await initializeSchema();
    await client.execute({
      sql: `INSERT INTO activity (type, message, agent, task_id, metadata)
            VALUES (?, ?, ?, ?, ?)`,
      args: [type, message, agent, taskId, metadata],
    });
  },

  clear: async () => {
    await initializeSchema();
    await client.execute('DELETE FROM activity');
  },
};

// Comment operations
export const comments = {
  getByTask: async (taskId: string): Promise<Comment[]> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC',
      args: [taskId],
    });
    return result.rows as unknown as Comment[];
  },

  create: async (taskId: string, content: string, author = 'user'): Promise<Comment> => {
    await initializeSchema();
    const result = await client.execute({
      sql: `INSERT INTO comments (task_id, content, author)
            VALUES (?, ?, ?)`,
      args: [taskId, content, author],
    });
    
    await activity.log('comment', `Comment added to task`, author, taskId);
    
    const commentResult = await client.execute({
      sql: 'SELECT * FROM comments WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    });
    return commentResult.rows[0] as unknown as Comment;
  },

  delete: async (id: number): Promise<boolean> => {
    await initializeSchema();
    await client.execute({
      sql: 'DELETE FROM comments WHERE id = ?',
      args: [id],
    });
    return true;
  },
};

// Subtask operations
export const subtasks = {
  getByTask: async (taskId: string): Promise<Subtask[]> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC, id ASC',
      args: [taskId],
    });
    return (result.rows as unknown as { id: number; task_id: string; title: string; completed: number; position: number; created_at: string }[])
      .map(r => ({ ...r, completed: r.completed === 1 }));
  },

  create: async (taskId: string, title: string): Promise<Subtask> => {
    await initializeSchema();
    // Get max position
    const maxPosResult = await client.execute({
      sql: 'SELECT MAX(position) as max FROM subtasks WHERE task_id = ?',
      args: [taskId],
    });
    const maxPos = maxPosResult.rows[0] as unknown as { max: number | null };
    const position = (maxPos?.max ?? -1) + 1;
    
    const result = await client.execute({
      sql: `INSERT INTO subtasks (task_id, title, position)
            VALUES (?, ?, ?)`,
      args: [taskId, title, position],
    });
    
    await activity.log('task_updated', `Subtask added: ${title}`, null, taskId);
    
    const row = await client.execute({
      sql: 'SELECT * FROM subtasks WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    });
    const subtask = row.rows[0] as unknown as { id: number; task_id: string; title: string; completed: number; position: number; created_at: string };
    return { ...subtask, completed: subtask.completed === 1 };
  },

  update: async (id: number, data: Partial<{ title: string; completed: boolean; position: number }>): Promise<Subtask | undefined> => {
    await initializeSchema();
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.completed !== undefined) { updates.push('completed = ?'); values.push(data.completed ? 1 : 0); }
    if (data.position !== undefined) { updates.push('position = ?'); values.push(data.position); }

    if (updates.length === 0) return undefined;
    
    values.push(id);
    await client.execute({
      sql: `UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`,
      args: values,
    });
    
    const row = await client.execute({
      sql: 'SELECT * FROM subtasks WHERE id = ?',
      args: [id],
    });
    if (row.rows.length === 0) return undefined;
    const subtask = row.rows[0] as unknown as { id: number; task_id: string; title: string; completed: number; position: number; created_at: string };
    return { ...subtask, completed: subtask.completed === 1 };
  },

  delete: async (id: number): Promise<boolean> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'DELETE FROM subtasks WHERE id = ?',
      args: [id],
    });
    return (result.rowsAffected ?? 0) > 0;
  },
};

// Link operations
export const links = {
  getByTask: async (taskId: string): Promise<Link[]> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM links WHERE task_id = ? ORDER BY created_at DESC',
      args: [taskId],
    });
    return result.rows as unknown as Link[];
  },

  create: async (taskId: string, url: string, title?: string): Promise<Link> => {
    await initializeSchema();
    const result = await client.execute({
      sql: `INSERT INTO links (task_id, url, title)
            VALUES (?, ?, ?)`,
      args: [taskId, url, title || null],
    });
    
    await activity.log('task_updated', `Link added: ${title || url}`, null, taskId);
    
    const linkResult = await client.execute({
      sql: 'SELECT * FROM links WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    });
    return linkResult.rows[0] as unknown as Link;
  },

  delete: async (id: number): Promise<boolean> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'DELETE FROM links WHERE id = ?',
      args: [id],
    });
    return (result.rowsAffected ?? 0) > 0;
  },
};

// Helper: Calculate next due date based on schedule
function calculateNextDueAt(scheduleType: string, scheduleDay: number | null, scheduleTime: string | null): string {
  const now = new Date();
  const time = scheduleTime ? scheduleTime.split(':') : ['00', '00'];
  const targetHour = parseInt(time[0], 10);
  const targetMinute = parseInt(time[1], 10);
  
  let nextDue = new Date(now);
  nextDue.setHours(targetHour, targetMinute, 0, 0);
  
  switch (scheduleType) {
    case 'daily':
      // If today's time has passed, schedule for tomorrow
      if (nextDue <= now) {
        nextDue.setDate(nextDue.getDate() + 1);
      }
      break;
    
    case 'weekly':
      // scheduleDay is 0 (Sun) to 6 (Sat)
      const targetDay = scheduleDay ?? 1; // Default to Monday
      const currentDay = nextDue.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil < 0 || (daysUntil === 0 && nextDue <= now)) {
        daysUntil += 7;
      }
      nextDue.setDate(nextDue.getDate() + daysUntil);
      break;
    
    case 'monthly':
      // scheduleDay is day of month (1-31)
      const targetDate = scheduleDay ?? 1; // Default to 1st
      nextDue.setDate(targetDate);
      if (nextDue <= now) {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }
      // Handle months with fewer days
      if (nextDue.getDate() !== targetDate) {
        nextDue.setDate(0); // Last day of previous month
      }
      break;
    
    default:
      // Custom - just set to tomorrow by default
      if (nextDue <= now) {
        nextDue.setDate(nextDue.getDate() + 1);
      }
  }
  
  return nextDue.toISOString();
}

// Recurring task operations
export const recurringTasks = {
  getAll: async (): Promise<RecurringTask[]> => {
    await initializeSchema();
    const result = await client.execute('SELECT * FROM recurring_tasks ORDER BY created_at DESC');
    return (result.rows as unknown as { active: number }[]).map(r => ({
      ...r,
      active: r.active === 1,
    })) as unknown as RecurringTask[];
  },

  getActive: async (): Promise<RecurringTask[]> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM recurring_tasks WHERE active = 1 ORDER BY next_due_at ASC',
      args: [],
    });
    return (result.rows as unknown as { active: number }[]).map(r => ({
      ...r,
      active: r.active === 1,
    })) as unknown as RecurringTask[];
  },

  getDue: async (): Promise<RecurringTask[]> => {
    await initializeSchema();
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: 'SELECT * FROM recurring_tasks WHERE active = 1 AND next_due_at <= ?',
      args: [now],
    });
    return (result.rows as unknown as { active: number }[]).map(r => ({
      ...r,
      active: r.active === 1,
    })) as unknown as RecurringTask[];
  },

  getById: async (id: string): Promise<RecurringTask | undefined> => {
    await initializeSchema();
    const result = await client.execute({
      sql: 'SELECT * FROM recurring_tasks WHERE id = ?',
      args: [id],
    });
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0] as unknown as { active: number };
    return { ...row, active: row.active === 1 } as unknown as RecurringTask;
  },

  create: async (data: Partial<RecurringTask>): Promise<RecurringTask> => {
    await initializeSchema();
    const id = generateId();
    const nextDue = calculateNextDueAt(
      data.schedule_type || 'daily',
      data.schedule_day ?? null,
      data.schedule_time ?? null
    );
    
    await client.execute({
      sql: `INSERT INTO recurring_tasks (id, title, description, priority, project_id, schedule_type, schedule_day, schedule_time, cron_expression, next_due_at, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.title || 'Untitled Recurring Task',
        data.description || null,
        data.priority || 'medium',
        data.project_id || null,
        data.schedule_type || 'daily',
        data.schedule_day ?? null,
        data.schedule_time || null,
        data.cron_expression || null,
        nextDue,
        data.active !== false ? 1 : 0,
      ],
    });
    
    await activity.log('system', `Recurring task created: ${data.title}`, null, null);
    
    return (await recurringTasks.getById(id))!;
  },

  update: async (id: string, data: Partial<RecurringTask>): Promise<RecurringTask | undefined> => {
    await initializeSchema();
    const existing = await recurringTasks.getById(id);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.priority !== undefined) { updates.push('priority = ?'); values.push(data.priority); }
    if (data.project_id !== undefined) { updates.push('project_id = ?'); values.push(data.project_id); }
    if (data.schedule_type !== undefined) { updates.push('schedule_type = ?'); values.push(data.schedule_type); }
    if (data.schedule_day !== undefined) { updates.push('schedule_day = ?'); values.push(data.schedule_day); }
    if (data.schedule_time !== undefined) { updates.push('schedule_time = ?'); values.push(data.schedule_time); }
    if (data.cron_expression !== undefined) { updates.push('cron_expression = ?'); values.push(data.cron_expression); }
    if (data.active !== undefined) { updates.push('active = ?'); values.push(data.active ? 1 : 0); }
    if (data.next_due_at !== undefined) { updates.push('next_due_at = ?'); values.push(data.next_due_at); }
    if (data.last_created_at !== undefined) { updates.push('last_created_at = ?'); values.push(data.last_created_at); }

    // Recalculate next_due if schedule changed
    if (data.schedule_type !== undefined || data.schedule_day !== undefined || data.schedule_time !== undefined) {
      const nextDue = calculateNextDueAt(
        data.schedule_type || existing.schedule_type,
        data.schedule_day ?? existing.schedule_day,
        data.schedule_time ?? existing.schedule_time
      );
      updates.push('next_due_at = ?');
      values.push(nextDue);
    }

    if (updates.length === 0) return existing;
    
    values.push(id);
    await client.execute({
      sql: `UPDATE recurring_tasks SET ${updates.join(', ')} WHERE id = ?`,
      args: values,
    });

    return recurringTasks.getById(id);
  },

  delete: async (id: string): Promise<boolean> => {
    await initializeSchema();
    const existing = await recurringTasks.getById(id);
    if (!existing) return false;
    
    await client.execute({
      sql: 'DELETE FROM recurring_tasks WHERE id = ?',
      args: [id],
    });
    await activity.log('system', `Recurring task deleted: ${existing.title}`, null, null);
    return true;
  },

  // Generate tasks from due recurring templates
  generateDueTasks: async (): Promise<{ created: number; errors: string[] }> => {
    await initializeSchema();
    const dueTasks = await recurringTasks.getDue();
    const errors: string[] = [];
    let created = 0;

    for (const rt of dueTasks) {
      try {
        // Create a new task from the template
        await tasks.create({
          title: rt.title,
          description: rt.description,
          priority: rt.priority,
          mission_id: rt.project_id,
          status: 'inbox',
          metadata: JSON.stringify({ from_recurring: rt.id }),
        });

        // Update the recurring task: set last_created_at and calculate next_due_at
        const now = new Date().toISOString();
        const nextDue = calculateNextDueAt(rt.schedule_type, rt.schedule_day, rt.schedule_time);
        
        await client.execute({
          sql: `UPDATE recurring_tasks SET last_created_at = ?, next_due_at = ? WHERE id = ?`,
          args: [now, nextDue, rt.id],
        });

        created++;
        await activity.log('system', `Task generated from recurring: ${rt.title}`, null, null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Failed to generate task for "${rt.title}": ${errorMsg}`);
      }
    }

    return { created, errors };
  },
};

export default client;
