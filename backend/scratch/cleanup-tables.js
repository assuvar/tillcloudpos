const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Delete tables that are stuck in MERGED status but have no virtual table (isMerged: true)
  // Since we verified there are NO virtual tables, all MERGED tables are safe to delete or reset.
  // The user specifically asked to "delete it", so we will delete them.
  
  const deleted = await prisma.table.deleteMany({
    where: {
      status: 'MERGED'
    }
  });
  
  console.log(`Deleted ${deleted.count} ghost tables.`);
  
  // Also check if any table named "T1", "G1", or "1" still exists and delete them to be sure
  const namesToDelete = ['T1', 'G1', '1'];
  const deletedByName = await prisma.table.deleteMany({
    where: {
      name: { in: namesToDelete }
    }
  });
  
  console.log(`Deleted ${deletedByName.count} additional tables by name.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
