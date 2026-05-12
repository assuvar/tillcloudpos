const { Client } = require('pg');

async function getLatestOtp() {
  const connectionString = "postgresql://postgres:sql123@localhost:5432/tillcloud_db";
  const client = new Client({ connectionString });

  try {
    await client.connect();
    
    const otpRes = await client.query(`
      SELECT * FROM "otps"
      ORDER BY "createdAt" DESC
      LIMIT 1
    `);
    console.log('Latest OTP row:', otpRes.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

getLatestOtp();
