import { describe, it, expect } from 'vitest';
import {
  createProductSchema,
  updateProductSchema,
  sellerProductIdParamSchema,
} from '../src/schemas/sellerProductSchema';
import { requireApprovedSeller } from '../src/middleware/requireApprovedSeller';
import { Role, SellerStatus } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

describe('Seller Product Schemas', () => {
  it('validates a valid create product payload', () => {
    const validData = {
      title: 'Ergonomic Gaming Mouse',
      description: 'Ultra-lightweight gaming mouse with optical sensor',
      priceCents: 5999,
      categoryId: '102e0823-e65d-4a79-a194-eb709d026708',
      sku: 'SKU-MOUSE-001',
      stock: 50,
      currency: 'USD',
      status: 'ACTIVE' as const,
      images: [
        { url: 'https://placehold.co/600x400', sortOrder: 0 },
        'https://placehold.co/600x400/side',
      ],
    };

    const parsed = createProductSchema.parse(validData);
    expect(parsed.title).toBe('Ergonomic Gaming Mouse');
    expect(parsed.priceCents).toBe(5999);
    expect(parsed.images).toHaveLength(2);
    expect(parsed.images?.[0]).toEqual({ url: 'https://placehold.co/600x400', sortOrder: 0 });
    expect(parsed.images?.[1]).toEqual({ url: 'https://placehold.co/600x400/side', sortOrder: 0 });
  });

  it('rejects create product with negative priceCents or missing title', () => {
    const invalidData = {
      title: '',
      description: 'Some desc',
      priceCents: -100,
      categoryId: 'invalid-uuid',
      sku: 'SKU-TEST',
    };

    expect(() => createProductSchema.parse(invalidData)).toThrow();
  });

  it('validates a valid partial update', () => {
    const updateData = {
      priceCents: 4999,
      stock: 10,
    };

    const parsed = updateProductSchema.parse(updateData);
    expect(parsed.priceCents).toBe(4999);
    expect(parsed.stock).toBe(10);
  });

  it('rejects an empty update payload', () => {
    expect(() => updateProductSchema.parse({})).toThrow();
  });

  it('validates product ID UUID param', () => {
    expect(
      sellerProductIdParamSchema.parse({
        id: '102e0823-e65d-4a79-a194-eb709d026708',
      })
    ).toEqual({ id: '102e0823-e65d-4a79-a194-eb709d026708' });

    expect(() =>
      sellerProductIdParamSchema.parse({
        id: 'not-a-uuid',
      })
    ).toThrow();
  });
});

describe('requireApprovedSeller Middleware', () => {
  const mockRes = () => {
    const res: Partial<Response> = {};
    res.status = (code: number) => {
      (res as any).statusCode = code;
      return res as Response;
    };
    res.json = (body: any) => {
      (res as any).body = body;
      return res as Response;
    };
    return res as Response & { statusCode: number; body: any };
  };

  it('returns 401 when req.user is undefined', () => {
    const req = {} as Request;
    const res = mockRes();
    let nextCalled = false;
    const next: NextFunction = () => {
      nextCalled = true;
    };

    requireApprovedSeller(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(nextCalled).toBe(false);
  });

  it('returns 403 when user is not a SELLER', () => {
    const req = {
      user: {
        id: 'user-1',
        email: 'customer@demo.com',
        name: 'Customer',
        role: Role.CUSTOMER,
        createdAt: new Date(),
        seller: null,
      },
    } as unknown as Request;
    const res = mockRes();
    let nextCalled = false;
    const next: NextFunction = () => {
      nextCalled = true;
    };

    requireApprovedSeller(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(nextCalled).toBe(false);
  });

  it('returns 403 when seller status is PENDING', () => {
    const req = {
      user: {
        id: 'seller-4',
        email: 'seller4@demo.com',
        name: 'Pending Seller',
        role: Role.SELLER,
        createdAt: new Date(),
        seller: {
          id: 'seller-id-4',
          storeName: 'Pending Store',
          status: SellerStatus.PENDING,
        },
      },
    } as unknown as Request;
    const res = mockRes();
    let nextCalled = false;
    const next: NextFunction = () => {
      nextCalled = true;
    };

    requireApprovedSeller(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(nextCalled).toBe(false);
  });

  it('calls next() when seller is APPROVED', () => {
    const req = {
      user: {
        id: 'seller-1',
        email: 'seller1@demo.com',
        name: 'Approved Seller',
        role: Role.SELLER,
        createdAt: new Date(),
        seller: {
          id: 'seller-id-1',
          storeName: 'TechHub',
          status: SellerStatus.APPROVED,
        },
      },
    } as unknown as Request;
    const res = mockRes();
    let nextCalled = false;
    const next: NextFunction = () => {
      nextCalled = true;
    };

    requireApprovedSeller(req, res, next);
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeUndefined();
  });
});
