require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function fixStatuses() {
  // Map invalid statuses to valid ones
  const statusMapping = {
    'In Progress': 'in-progress',
    'This Week': 'up-next',
    'Waiting/Blocked': 'waiting-on-aaron',
    'Critical': 'in-progress',  // Critical is a priority, not status
    'up_next': 'up-next',
    'in_progress': 'in-progress',
    'TODO': 'inbox',
    'in progress': 'in-progress',
  };

  for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
    const result = await client.execute({
      sql: 'UPDATE tasks SET status = ? WHERE status = ?',
      args: [newStatus, oldStatus]
    });
    if (result.rowsAffected > 0) {
      console.log(`Fixed ${result.rowsAffected} tasks: "${oldStatus}" -> "${newStatus}"`);
    }
  }

  // Check for any remaining non-standard statuses
  const remaining = await client.execute(
    "SELECT DISTINCT status, COUNT(*) as count FROM tasks GROUP BY status"
  );
  console.log('\nCurrent status distribution:');
  for (const row of remaining.rows) {
    console.log(`  ${row.status}: ${row.count} tasks`);
  }
}

fixStatuses().catch(console.error);
