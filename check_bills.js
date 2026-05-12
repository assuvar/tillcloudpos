const { Client } = require('pg');

async function checkBills() {
  const connectionString = "postgresql://postgres:sql123@localhost:5432/tillcloud_db";
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('--- MOST RECENT 30 BILLS ---');
    const res = await client.query('SELECT id, "orderNumber", "orderType", status, "totalCents", "tableId", "tableNumber", "createdAt" FROM bills ORDER BY "createdAt" DESC LIMIT 30');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkBills();
