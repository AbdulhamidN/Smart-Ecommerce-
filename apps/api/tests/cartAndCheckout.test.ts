import { describe, it, expect } from 'vitest';
import {
  addToCartSchema,
  updateCartItemSchema,
  checkoutSchema,
  orderStatusTransitionSchema,
} from '../src/schemas/cartSchema';
import { OrderStateMachine, ALLOWED_TRANSITIONS } from '../src/services/orderStateMachine';
import { OrderStatus } from '@prisma/client';

describe('Cart & Checkout Schemas', () => {
  it('validates addToCartSchema with valid input', () => {
    const valid = {
      productId: '102e0823-e65d-4a79-a194-eb709d026708',
      quantity: 2,
    };
    const parsed = addToCartSchema.parse(valid);
    expect(parsed.productId).toBe(valid.productId);
    expect(parsed.quantity).toBe(2);
  });

  it('rejects addToCartSchema with invalid product UUID or quantity < 1', () => {
    expect(() =>
      addToCartSchema.parse({
        productId: 'not-a-uuid',
        quantity: 1,
      })
    ).toThrow();

    expect(() =>
      addToCartSchema.parse({
        productId: '102e0823-e65d-4a79-a194-eb709d026708',
        quantity: 0,
      })
    ).toThrow();
  });

  it('validates checkoutSchema with valid address details', () => {
    const valid = {
      shippingName: 'Alice Johnson',
      shippingLine1: '123 Market St, Suite 400',
      shippingCity: 'San Francisco',
      shippingCountry: 'USA',
    };
    const parsed = checkoutSchema.parse(valid);
    expect(parsed.shippingName).toBe('Alice Johnson');
    expect(parsed.shippingCity).toBe('San Francisco');
  });

  it('rejects checkoutSchema with empty fields', () => {
    expect(() =>
      checkoutSchema.parse({
        shippingName: '',
        shippingLine1: 'Line 1',
        shippingCity: 'City',
        shippingCountry: 'Country',
      })
    ).toThrow();
  });

  it('validates order status transition payload', () => {
    const valid = {
      fromStatus: OrderStatus.PAID,
      toStatus: OrderStatus.PROCESSING,
    };
    const parsed = orderStatusTransitionSchema.parse(valid);
    expect(parsed.fromStatus).toBe(OrderStatus.PAID);
    expect(parsed.toStatus).toBe(OrderStatus.PROCESSING);
  });
});

describe('Order State Machine', () => {
  it('permits valid linear order transitions', () => {
    expect(OrderStateMachine.canTransition(OrderStatus.PAID, OrderStatus.PROCESSING)).toBe(true);
    expect(OrderStateMachine.canTransition(OrderStatus.PROCESSING, OrderStatus.SHIPPED)).toBe(true);
    expect(OrderStateMachine.canTransition(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(true);
  });

  it('permits CANCELLED only prior to SHIPPED', () => {
    expect(OrderStateMachine.canTransition(OrderStatus.PAID, OrderStatus.CANCELLED)).toBe(true);
    expect(OrderStateMachine.canTransition(OrderStatus.PROCESSING, OrderStatus.CANCELLED)).toBe(true);
    expect(OrderStateMachine.canTransition(OrderStatus.SHIPPED, OrderStatus.CANCELLED)).toBe(false);
    expect(OrderStateMachine.canTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED)).toBe(false);
  });

  it('forbids invalid transitions or backward transitions', () => {
    expect(OrderStateMachine.canTransition(OrderStatus.CANCELLED, OrderStatus.PAID)).toBe(false);
    expect(OrderStateMachine.canTransition(OrderStatus.DELIVERED, OrderStatus.PROCESSING)).toBe(false);
    expect(OrderStateMachine.canTransition(OrderStatus.SHIPPED, OrderStatus.PAID)).toBe(false);
  });
});
