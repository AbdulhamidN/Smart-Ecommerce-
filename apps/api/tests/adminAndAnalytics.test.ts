import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/lib/prisma';
import { SellerStatus } from '@prisma/client';

describe('Phase 6: Admin & Analytics API', () => {
  let customerCookie: string[];
  let adminCookie: string[];
  let seller4Cookie: string[];
  let seller1Cookie: string[];
  let seller4Id: string;
  let seller4UserId: string;

  beforeAll(async () => {
    // 1. Get seller4 details and reset to PENDING
    const seller4User = await prisma.user.findUnique({
      where: { email: 'seller4@demo.com' },
      include: { seller: true },
    });
    if (!seller4User || !seller4User.seller) {
      throw new Error('seller4@demo.com not found in database');
    }
    seller4Id = seller4User.seller.id;
    seller4UserId = seller4User.id;

    await prisma.seller.update({
      where: { id: seller4Id },
      data: { status: SellerStatus.PENDING },
    });

    // Clean up previous status notifications for seller4
    await prisma.notification.deleteMany({
      where: { userId: seller4UserId, type: 'SELLER_STATUS_UPDATED' },
    });

    // 2. Authenticate customer1
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer1@demo.com', password: 'Customer123!' });
    customerCookie = custRes.headers['set-cookie'];

    // 3. Authenticate admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@demo.com', password: 'Admin123!' });
    adminCookie = adminRes.headers['set-cookie'];

    // 4. Authenticate seller4
    const seller4Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'seller4@demo.com', password: 'Seller123!' });
    seller4Cookie = seller4Res.headers['set-cookie'];

    // 5. Authenticate seller1
    const seller1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'seller1@demo.com', password: 'Seller123!' });
    seller1Cookie = seller1Res.headers['set-cookie'];
  }, 45000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('RBAC Authorization', () => {
    it('returns 403 Forbidden when a customer attempts to access /api/v1/admin/stats', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Cookie', customerCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 401 Unauthorized when an unauthenticated user accesses /api/v1/admin/stats', async () => {
      const res = await request(app).get('/api/v1/admin/stats');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Admin Operations', () => {
    it('allows admin to fetch platform stats', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalUsers');
      expect(res.body.data).toHaveProperty('totalSellers');
      expect(res.body.data).toHaveProperty('pendingSellers');
      expect(res.body.data).toHaveProperty('totalOrders');
      expect(res.body.data).toHaveProperty('totalRevenueCents');
      expect(typeof res.body.data.totalRevenueCents).toBe('number');
    });

    it('returns pending sellers including seller4', async () => {
      const res = await request(app)
        .get('/api/v1/admin/sellers/pending')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((s: any) => s.id === seller4Id);
      expect(found).toBeDefined();
      expect(found.status).toBe('PENDING');
      expect(found.user.email).toBe('seller4@demo.com');
    });

    it('allows admin to approve seller4 and generates a notification', async () => {
      const approveRes = await request(app)
        .patch(`/api/v1/admin/sellers/${seller4Id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'APPROVED' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');

      // Verify notification created for seller4
      const notifRes = await request(app)
        .get('/api/v1/notifications')
        .set('Cookie', seller4Cookie);

      expect(notifRes.status).toBe(200);
      const notif = notifRes.body.data.find((n: any) => n.type === 'SELLER_STATUS_UPDATED');
      expect(notif).toBeDefined();
      expect(notif.payload.status).toBe('APPROVED');
      expect(notif.readAt).toBeNull();

      // Test mark as read
      const markRes = await request(app)
        .patch(`/api/v1/notifications/${notif.id}/read`)
        .set('Cookie', seller4Cookie);

      expect(markRes.status).toBe(200);
      expect(markRes.body.data.readAt).not.toBeNull();
    });

    it('allows admin to fetch all platform orders', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('customer');
        expect(res.body.data[0]).toHaveProperty('items');
      }
    });
  });

  describe('Seller Analytics', () => {
    it('allows an approved seller to fetch their sales analytics', async () => {
      const res = await request(app)
        .get('/api/v1/seller/analytics')
        .set('Cookie', seller1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalRevenueCents');
      expect(res.body.data).toHaveProperty('totalOrders');
      expect(res.body.data).toHaveProperty('totalUnitsSold');
      expect(res.body.data).toHaveProperty('revenueOverTime');
      expect(Array.isArray(res.body.data.revenueOverTime)).toBe(true);
    });
  });
});
