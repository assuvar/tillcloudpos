const { Client } = require('pg');

async function checkDatabase() {
  const connectionString = "postgresql://postgres:Root%401234@localhost:5432/tillcloud_db";
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('--- RESTAURANTS ---');
    const resRes = await client.query('SELECT id, name, "createdAt" FROM restaurants ORDER BY "createdAt" DESC LIMIT 5');
    console.table(resRes.rows);

    console.log('\n--- USERS ---');
    const userRes = await client.query('SELECT id, email, "fullName", role, "restaurantId", "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 5');
    console.table(userRes.rows);
  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await client.end();
  }
}

checkDatabase();
