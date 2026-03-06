import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';

const turso = createClient({
  url: 'libsql://mission-control-solomoncos.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzExODI2NTUsImlkIjoiODBlYzEzMmUtOTE1OS00ZmEwLWI3ZmEtNDI5MmEzOWFiN2ZkIiwicmlkIjoiMGZkYmI4MDktMzAyOC00M2FlLTk2ZjctMDllYjMwNjBhY2NmIn0.8ewl9REGxHi9PeQy2KVCpgK6arDDDjh1rK6hd_0GSKdV20TjKOQUnlRyhTUpjGAmZ8v8Kmrrhh8nELKl2FBcAw'
});

const local = new Database('./data/mission-control.db');
const norm = (v) => v === undefined ? null : v;

async function migrate() {
  console.log('Dropping existing tables...');
  await turso.execute('DROP TABLE IF EXISTS links');
  await turso.execute('DROP TABLE IF EXISTS subtasks');
  await turso.execute('DROP TABLE IF EXISTS comments');
  await turso.execute('DROP TABLE IF EXISTS activity');
  await turso.execute('DROP TABLE IF EXISTS missions');
  await turso.execute('DROP TABLE IF EXISTS tasks');

  console.log('Creating tables with correct schema...');
  await turso.execute(`CREATE TABLE tasks (
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
  )`);
  
  await turso.execute(`CREATE TABLE missions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await turso.execute(`CREATE TABLE activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    agent TEXT,
    task_id TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await turso.execute(`CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )`);

  await turso.execute(`CREATE TABLE subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )`);

  await turso.execute(`CREATE TABLE links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )`);

  // Indexes
  await turso.execute('CREATE INDEX idx_tasks_status ON tasks(status)');
  await turso.execute('CREATE INDEX idx_tasks_mission ON tasks(mission_id)');
  await turso.execute('CREATE INDEX idx_activity_created ON activity(created_at DESC)');
  await turso.execute('CREATE INDEX idx_comments_task ON comments(task_id)');
  await turso.execute('CREATE INDEX idx_subtasks_task ON subtasks(task_id)');
  await turso.execute('CREATE INDEX idx_links_task ON links(task_id)');

  // Now migrate data with column mapping
  const tasks = local.prepare('SELECT * FROM tasks').all();
  console.log(`Migrating ${tasks.length} tasks...`);
  for (const t of tasks) {
    await turso.execute({
      sql: `INSERT INTO tasks (id, title, description, status, priority, assigned_agent, mission_id, created_at, updated_at, due_date, tags, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [t.id, t.title, norm(t.description), t.status, t.priority, norm(t.owner), norm(t.project_id), t.created_at, t.updated_at, norm(t.due_date), null, null]
    });
  }

  const subtasks = local.prepare('SELECT * FROM subtasks').all();
  console.log(`Migrating ${subtasks.length} subtasks...`);
  for (const s of subtasks) {
    await turso.execute({
      sql: 'INSERT INTO subtasks (id, task_id, title, completed, position, created_at) VALUES (?, ?, ?, ?, 0, ?)',
      args: [s.id, s.task_id, s.title, s.completed, s.created_at]
    });
  }

  const comments = local.prepare('SELECT * FROM comments').all();
  console.log(`Migrating ${comments.length} comments...`);
  for (const c of comments) {
    await turso.execute({
      sql: 'INSERT INTO comments (id, task_id, content, author, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [c.id, c.task_id, c.content, norm(c.agent) || 'user', c.created_at]
    });
  }

  const links = local.prepare('SELECT * FROM links').all();
  console.log(`Migrating ${links.length} links...`);
  for (const l of links) {
    await turso.execute({
      sql: 'INSERT INTO links (id, task_id, url, title, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [l.id, l.task_id, l.url, norm(l.title), l.created_at]
    });
  }

  const activity = local.prepare('SELECT * FROM activity').all();
  console.log(`Migrating ${activity.length} activity records...`);
  for (const a of activity) {
    await turso.execute({
      sql: 'INSERT INTO activity (id, type, message, agent, task_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [a.id, a.type, a.message, norm(a.agent), norm(a.task_id), norm(a.metadata), a.created_at]
    });
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
