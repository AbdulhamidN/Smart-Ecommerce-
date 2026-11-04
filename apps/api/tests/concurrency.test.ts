import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import app from '../src/index';
import prisma from '../src/lib/prisma';

describe('Concurrency Race Condition - Inventory Locking', () => {
  let server: http.Server;
  let user1Cookie: string[];
  let user2Cookie: string[];
  let user1Id: string;
  let user2Id: string;
  let product: { id: string; sku: string; priceCents: number };

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));

    // 1. Ensure product SKU-LAP-001 exists and has stock exactly 1
    const p = await prisma.product.findUnique({
      where: { sku: 'SKU-LAP-001' },
    });
    if (!p) {
      throw new Error('Product with SKU SKU-LAP-001 not found');
    }
    product = { id: p.id, sku: p.sku, priceCents: p.priceCents };

    // Reset product stock to exactly 1
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: 1, status: 'ACTIVE' },
    });

    // 2. Login customer 1 (customer1@demo.com)
    const login1 = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'customer1@demo.com', password: 'Customer123!' });
    expect(login1.status).toBe(200);
    user1Cookie = login1.headers['set-cookie'] as unknown as string[];
    user1Id = login1.body.data.user.id;

    // 3. Login customer 2 (customer2@demo.com)
    const login2 = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'customer2@demo.com', password: 'Customer123!' });
    expect(login2.status).toBe(200);
    user2Cookie = login2.headers['set-cookie'] as unknown as string[];
    user2Id = login2.body.data.user.id;

    // 4. Clear any existing cart items for both users
    if (user1Id || user2Id) {
      await prisma.cartItem.deleteMany({
        where: { userId: { in: [user1Id, user2Id].filter(Boolean) as string[] } },
      });
    }
  }, 45000);

  afterAll(async () => {
    // Clean up test cart items
    if (user1Id || user2Id) {
      await prisma.cartItem.deleteMany({
        where: { userId: { in: [user1Id, user2Id].filter(Boolean) as string[] } },
      });
    }
    server.close();
    await prisma.$disconnect();
  });

  it(
    'prevents overselling when two users simultaneously checkout the last item in stock',
    async () => {
      // Step A: Ensure stock is exactly 1 before the test
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: 1, status: 'ACTIVE' },
      });

      // Step B: Add the 1 item to customer 1's cart
      const addCart1 = await request(server)
        .post('/api/v1/cart')
        .set('Cookie', user1Cookie)
        .send({ productId: product.id, quantity: 1 });
      expect(addCart1.status).toBe(200);

      // Step C: Add the 1 item to customer 2's cart
      const addCart2 = await request(server)
        .post('/api/v1/cart')
        .set('Cookie', user2Cookie)
        .send({ productId: product.id, quantity: 1 });
      expect(addCart2.status).toBe(200);

      // Step D: Send simultaneous checkout requests using Promise.all()
      const reqTimestamp = Date.now();
      const [orderRes1, orderRes2] = await Promise.all([
        request(server)
          .post('/api/v1/orders')
          .set('Cookie', user1Cookie)
          .set('Idempotency-Key', `race-user1-${reqTimestamp}`)
          .send({
            shippingName: 'Customer One',
            shippingLine1: '101 Race Ave',
            shippingCity: 'Concurrent City',
            shippingCountry: 'USA',
          }),
        request(server)
          .post('/api/v1/orders')
          .set('Cookie', user2Cookie)
          .set('Idempotency-Key', `race-user2-${reqTimestamp}`)
          .send({
            shippingName: 'Customer Two',
            shippingLine1: '202 Race Ave',
            shippingCity: 'Concurrent City',
            shippingCountry: 'USA',
          }),
      ]);

      const responses = [orderRes1, orderRes2];
      const statuses = responses.map((r) => r.status);

      // 1. Exactly one request returns 201 Created
      expect(statuses.filter((s) => s === 201)).toHaveLength(1);

      // 2. Exactly one request returns 400 Bad Request (OUT_OF_STOCK)
      expect(statuses.filter((s) => s === 400)).toHaveLength(1);

      const successRes = responses.find((r) => r.status === 201)!;
      const failedRes = responses.find((r) => r.status === 400)!;

      expect(successRes.body.data.id).toBeDefined();
      expect(successRes.body.data.status).toBe('PAID');
      expect(failedRes.body.error.code).toBe('OUT_OF_STOCK');

      // 3. Product stock in database is now exactly 0
      const finalProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(finalProduct?.stock).toBe(0);

      // 4. Only ONE order was created in the database for this product from these requests
      const createdOrders = await prisma.order.findMany({
        where: {
          id: {
            in: [orderRes1.body?.data?.id, orderRes2.body?.data?.id].filter(Boolean),
          },
        },
        include: { items: true },
      });
      expect(createdOrders).toHaveLength(1);
      expect(createdOrders[0].id).toBe(successRes.body.data.id);
      expect(createdOrders[0].items[0].productId).toBe(product.id);
      expect(createdOrders[0].items[0].quantity).toBe(1);
    },
    120000
  );
});
