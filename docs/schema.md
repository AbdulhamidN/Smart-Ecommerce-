# Database Schema & Design

## Overview
The GibeMart database is built on MySQL 8 and uses the Prisma ORM. It consists of 13 normalized tables handling users, authentication, catalog, cart, orders, and analytics.

## Core Design Decisions

### 1. Money as Integers
All monetary values (prices, totals, payments) are stored as `Int` representing **cents** (or santim for ETB). This prevents floating-point precision errors during calculations.

### 2. Price Snapshots
When a user checks out, the price of the product is copied from the `Product` table into the `OrderItem` table (`unitPriceCents`). 
If a seller changes the product price tomorrow, the historical order totals remain accurate.

### 3. Order Status History
Every status change on an order is logged in the `OrderStatusHistory` table. This provides an audit trail of who changed the status, when, and from what previous state.

### 4. Soft Deletes
Products are never hard-deleted. Instead, their status is changed to `ARCHIVED`. This ensures that historical orders can still reference the product details.

## Entity-Relationship Summary
- **User**: Can be a CUSTOMER, SELLER, or ADMIN.
- **Seller**: 1-to-1 with a User. Requires Admin approval.
- **Product**: Belongs to a Seller and a Category.
- **Order**: Belongs to a Customer. Contains multiple OrderItems.
- **Payment**: 1-to-1 with an Order.
