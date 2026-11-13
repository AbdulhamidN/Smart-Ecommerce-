# Engineering Decisions & Trade-offs

This document outlines the key technical decisions made during the development of GibeMart.

## 1. Transactional Checkout (Concurrency)
**Problem:** Two users buying the last item simultaneously can cause negative stock.
**Decision:** We use a single `prisma.$transaction` with an atomic conditional update: `UPDATE Product SET stock = stock - qty WHERE id = ? AND stock >= qty`.
**Trade-off:** This locks the row briefly, but guarantees stock integrity without needing complex distributed locks.

## 2. Idempotency Keys
**Problem:** If a user double-clicks "Pay", they might be charged twice.
**Decision:** The frontend generates an `Idempotency-Key` (UUID). The backend stores it on the Order. If the same key is received again, it returns the existing order.
**Trade-off:** Requires the client to generate and send the header, but prevents duplicate financial transactions.

## 3. JWT Authentication
**Decision:** JWTs are stored in `HttpOnly`, `SameSite=Lax` (dev) / `SameSite=None` (prod) cookies.
**Trade-off:** This protects against XSS (HttpOnly) and CSRF (SameSite), but requires strict CORS configuration between Vercel and Render.

## 4. MySQL FULLTEXT vs. External Search
**Decision:** Used MySQL's built-in `MATCH ... AGAINST` for product search.
**Trade-off:** It is free and simple to deploy, but lacks the typo-tolerance and stemming of Algolia or Elasticsearch. For a catalog of this size, it is sufficient.

## 5. Mocked Payments
**Decision:** Payments use a `MOCK` provider that always succeeds.
**Trade-off:** Allows the checkout flow to be tested end-to-end without needing real Telebirr/CBE credentials, which are out of scope for the 28-day challenge.

## 6. SQL Recommendations instead of LLM
**Decision:** Used SQL co-occurrence to recommend products instead of an LLM.
**Trade-off:** Zero cost, instant response, and fully explainable. It doesn't understand "intent", but it accurately reflects real buying patterns.
