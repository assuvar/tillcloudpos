import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('RBAC Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let restaurantId: string;
  let adminEmail: string;
  let adminPassword: string;
  let managerEmail: string;
  let managerPassword: string;

  const roleEndpoints = ['MANAGER', 'CASHIER'];

  const loginAsAdmin = async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    return response.body.access_token as string;
  };

  const loginAsManager = async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: managerEmail, password: managerPassword })
      .expect(200);

    return response.body.access_token as string;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "pinFailedAttempts" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "pinLockedUntil" TIMESTAMP(3)
    `);

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    adminEmail = `admin-rbac-${suffix}@example.com`;
    adminPassword = 'StrongPass123!';
    managerEmail = `manager-rbac-${suffix}@example.com`;
    managerPassword = 'ManagerPass123!';
    const cashierEmail = `cashier-rbac-${suffix}@example.com`;

    const restaurant = await prisma.restaurant.create({
      data: {
        name: `RBAC Test ${suffix}`,
        streetAddress: '1 Test Street',
        suburb: 'Testville',
        postcode: '2000',
      },
    });

    restaurantId = restaurant.id;

    await prisma.user.create({
      data: {
        restaurantId,
        fullName: 'RBAC Admin',
        name: 'RBAC Admin',
        email: adminEmail,
        role: 'ADMIN',
        passwordHash: await bcrypt.hash(adminPassword, 10),
      },
    });

    await prisma.user.create({
      data: {
        restaurantId,
        fullName: 'RBAC Manager',
        name: 'RBAC Manager',
        email: managerEmail,
        role: 'MANAGER',
        passwordHash: await bcrypt.hash(managerPassword, 10),
      },
    });

    await prisma.user.create({
      data: {
        restaurantId,
        fullName: 'RBAC Cashier',
        name: 'RBAC Cashier',
        email: cashierEmail,
        role: 'CASHIER',
        passwordHash: await bcrypt.hash('CashierPass123!', 10),
      },
    });
  });

  beforeEach(async () => {
    await prisma.rolePermission.deleteMany({
      where: {
        restaurantId,
      },
    });
  });

  afterAll(async () => {
    await prisma.rolePermission.deleteMany({ where: { restaurantId } });
    await prisma.user.deleteMany({ where: { restaurantId } });
    await prisma.restaurant.delete({ where: { id: restaurantId } });
    await app.close();
  });

  it('A) fetches role permissions for valid roles', async () => {
    const token = await loginAsAdmin();

    for (const role of roleEndpoints) {
      const response = await request(app.getHttpServer())
        .get(`/permissions/${role}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          role,
          permissions: expect.any(Object),
        }),
      );
      expect(response.body.permissions).toHaveProperty('BILLING');
      expect(Array.isArray(response.body.permissions.BILLING)).toBe(true);
    }
  });

  it('B) updates and persists role permissions', async () => {
    const token = await loginAsAdmin();

    const updatedPermissions = {
      BILLING: ['VOID_BILL'],
      PAYMENTS: ['SPLIT'],
      MENU: ['HIDE_SHOW_ITEMS'],
      STAFF: ['EDIT_STAFF'],
    };

    await request(app.getHttpServer())
      .patch('/permissions/MANAGER')
      .set('Authorization', `Bearer ${token}`)
      .send({ permissions: updatedPermissions })
      .expect(200);

    const fetched = await request(app.getHttpServer())
      .get('/permissions/MANAGER')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(fetched.body.permissions).toMatchObject(updatedPermissions);

    const persisted = await prisma.rolePermission.findUnique({
      where: {
        restaurantId_role: {
          restaurantId,
          role: 'MANAGER',
        },
      },
      select: {
        permissions: true,
      },
    });

    expect(persisted?.permissions).toMatchObject(updatedPermissions);
  });

  it('C) blocks restricted action when permission is removed', async () => {
    const adminToken = await loginAsAdmin();

    await request(app.getHttpServer())
      .patch('/permissions/MANAGER')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        permissions: {
          BILLING: ['VOID_BILL'],
          STAFF: ['EDIT_STAFF'],
        },
      })
      .expect(200);

    const token = await loginAsManager();

    await request(app.getHttpServer())
      .patch('/orders/1')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(403);
  });
});
