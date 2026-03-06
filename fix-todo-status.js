require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function fixTodo() {
  // Fix "todo" to "inbox" (or "up-next" if you prefer)
  const result = await client.execute({
    sql: 'UPDATE tasks SET status = ? WHERE status = ?',
    args: ['up-next', 'todo']
  });
  console.log(`Fixed ${result.rowsAffected} tasks: "todo" -> "up-next"`);

  // Final status check
  const remaining = await client.execute(
    "SELECT DISTINCT status, COUNT(*) as count FROM tasks GROUP BY status"
  );
  console.log('\nFinal status distribution:');
  for (const row of remaining.rows) {
    console.log(`  ${row.status}: ${row.count} tasks`);
  }
  
  // Check total count
  const total = await client.execute("SELECT COUNT(*) as count FROM tasks");
  console.log(`\nTotal tasks: ${total.rows[0].count}`);
}

fixTodo().catch(console.error);
