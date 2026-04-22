import { PrismaClient } from '../src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'urbandos7@gmail.com' },
    select: {
      id: true,
      email: true,
      role: true,
      restaurantId: true,
      isActive: true,
      permissions: true
    }
  });
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
