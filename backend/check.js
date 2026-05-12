const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tillcloudpos?schema=public'
  });
  await client.connect();
  
  const res = await client.query('SELECT * FROM "Customer"');
  console.log('Customers:', res.rows);

  const bills = await client.query('SELECT id, "orderType", status, "customerId", "customerPhone", "deliveryPhone", "createdAt" FROM "Bill" ORDER BY "createdAt" DESC LIMIT 5');
  console.log('Recent Bills:', bills.rows);

  await client.end();
}

main().catch(console.error);
