import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import path from 'path';

const localDb = new Database(path.join(process.cwd(), 'data', 'mission-control.db'));

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('Starting migration to Turso...');

  // Create tables
  console.log('Creating tables...');
  await tursoClient.batch([
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
    `CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      agent TEXT,
      task_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_mission ON tasks(mission_id)`,
    `CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id)`,
    `CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id)`,
    `CREATE INDEX IF NOT EXISTS idx_links_task ON links(task_id)`,
  ], 'write');

  // Migrate tasks
  console.log('Migrating tasks...');
  const tasks = localDb.prepare('SELECT * FROM tasks').all() as any[];
  for (const task of tasks) {
    await tursoClient.execute({
      sql: `INSERT OR REPLACE INTO tasks (id, title, description, status, priority, assigned_agent, mission_id, created_at, updated_at, due_date, tags, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        task.id,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.assigned_agent,
        task.mission_id,
        task.created_at,
        task.updated_at,
        task.due_date,
        task.tags,
        task.metadata,
      ],
    });
  }
  console.log(`Migrated ${tasks.length} tasks`);

  // Migrate missions
  console.log('Migrating missions...');
  const missions = localDb.prepare('SELECT * FROM missions').all() as any[];
  for (const mission of missions) {
    await tursoClient.execute({
      sql: `INSERT OR REPLACE INTO missions (id, name, description, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        mission.id,
        mission.name,
        mission.description,
        mission.status,
        mission.created_at,
        mission.updated_at,
      ],
    });
  }
  console.log(`Migrated ${missions.length} missions`);

  // Migrate activity
  console.log('Migrating activity...');
  const activity = localDb.prepare('SELECT * FROM activity').all() as any[];
  for (const act of activity) {
    await tursoClient.execute({
      sql: `INSERT INTO activity (type, message, agent, task_id, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        act.type,
        act.message,
        act.agent,
        act.task_id,
        act.metadata,
        act.created_at,
      ],
    });
  }
  console.log(`Migrated ${activity.length} activity records`);

  // Migrate comments
  console.log('Migrating comments...');
  const comments = localDb.prepare('SELECT * FROM comments').all() as any[];
  for (const comment of comments) {
    await tursoClient.execute({
      sql: `INSERT INTO comments (task_id, content, author, created_at)
            VALUES (?, ?, ?, ?)`,
      args: [
        comment.task_id,
        comment.content,
        comment.author,
        comment.created_at,
      ],
    });
  }
  console.log(`Migrated ${comments.length} comments`);

  // Migrate subtasks
  console.log('Migrating subtasks...');
  const subtasks = localDb.prepare('SELECT * FROM subtasks').all() as any[];
  for (const subtask of subtasks) {
    await tursoClient.execute({
      sql: `INSERT INTO subtasks (task_id, title, completed, position, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        subtask.task_id,
        subtask.title,
        subtask.completed,
        subtask.position,
        subtask.created_at,
      ],
    });
  }
  console.log(`Migrated ${subtasks.length} subtasks`);

  // Migrate links
  console.log('Migrating links...');
  const links = localDb.prepare('SELECT * FROM links').all() as any[];
  for (const link of links) {
    await tursoClient.execute({
      sql: `INSERT INTO links (task_id, url, title, created_at)
            VALUES (?, ?, ?, ?)`,
      args: [
        link.task_id,
        link.url,
        link.title,
        link.created_at,
      ],
    });
  }
  console.log(`Migrated ${links.length} links`);

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);
