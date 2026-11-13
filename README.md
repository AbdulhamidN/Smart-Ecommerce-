# GibeMart — Smart E-Commerce Platform

A modern, multi-vendor e-commerce platform built for the Ethiopian market. GibeMart connects Customers, Sellers, and Administrators through a secure, transactional system with ETB pricing, seller analytics, and a race-condition-safe checkout engine.

Built for the **Brolf Tech Remote Internship Challenge 2026 — Project 2: Smart E-Commerce Platform**.

---

## 🔗 Live Demo

- **Frontend:** https://smart-ecommerce-psi.vercel.app
- **Backend API:** https://smart-ecommerce-api-ek3p.onrender.com/api/v1/health
- **Database:** MySQL 8 (hosted on Railway)

---

## 🔑 Demo Credentials

Use these accounts to explore all three roles on the live demo:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | admin@demo.com | Admin123! | Admin Panel (approve sellers, view all orders) |
| **Seller** | seller1@demo.com | Seller123! | Seller Dashboard (products, analytics) |
| **Seller (Pending)** | seller4@demo.com | Seller123! | Pending approval flow |
| **Customer** | customer1@demo.com | Customer123! | Shopping, cart, checkout, order history |

**Admin URL:** Navigate directly to `/admin/login` (this route is not linked publicly for security).

---

## ✨ Features

### For Customers
- Browse the product catalog with a dynamic homepage (animated carousel, category grids)
- Full-text search across product titles and descriptions
- Filter by category, price range (ETB), and stock availability
- Add to cart with server-side quantity validation
- Transactional checkout with idempotency protection
- Order history with visual status timeline (Paid → Processing → Shipped → Delivered)
- Personalized product recommendations ("Customers also bought")

### For Sellers
- Apply to become a seller (requires Admin approval)
- Product CRUD with image support, draft/published states
- Low-stock and out-of-stock badges
- Real-time revenue analytics with interactive charts
- Order management for their own products only

### For Administrators
- Approve or reject pending seller applications
- Platform-wide metrics (revenue, orders, users, sellers)
- View all orders across the marketplace
- In-app notification system

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, TanStack Query |
| **Backend** | Node.js 20, Express, TypeScript, Zod |
| **Database** | MySQL 8, Prisma ORM |
| **Authentication** | JWT (access + refresh), bcrypt, HttpOnly cookies |
| **Testing** | Vitest, Supertest (25 automated tests) |
| **Charts** | Recharts |
| **Deployment** | Vercel (frontend), Render (backend), Railway (database) |

---

## 🏗️ Architecture

The application is a decoupled monorepo with two apps: apps/web (frontend) and apps/api (backend). Each app is deployed independently, communicating over HTTPS with strict CORS enforcement.

- Browser (React) sends HTTPS REST requests with HttpOnly Cookies.
- Vercel hosts the frontend.
- Render hosts the Express API.
- Railway hosts the MySQL 8 database, accessed via Prisma ORM.

---

## 🧠 Key Technical Highlights

### Transactional Checkout with Concurrency Safety
The checkout endpoint (POST /api/v1/orders) is wrapped in a single Prisma transaction. Stock is decremented atomically using an UPDATE with a WHERE stock >= quantity condition. If two users buy the last item simultaneously, exactly one transaction succeeds and the other receives a 400 OUT_OF_STOCK error. This is verified by an automated test that fires both requests in parallel via Promise.all.

### Idempotent Orders
Every checkout request accepts an Idempotency-Key header. If the same key is submitted twice (e.g., double-click), the second request returns the original order instead of charging the customer twice.

### Order State Machine
Orders follow a strict lifecycle: PAID → PROCESSING → SHIPPED → DELIVERED. CANCELLED is allowed only before SHIPPED. Invalid transitions return 400 INVALID_TRANSITION. Stale transitions (concurrent updates) return 409 CONFLICT due to optimistic locking.

### Role-Based Access Control (RBAC)
All protected endpoints enforce RBAC on the backend, not just in the UI. Middleware includes authenticate, requireRole, and requireApprovedSeller.

### Price Snapshots
Every OrderItem stores unitPriceCents at the moment of purchase. If a seller later changes the product price, historical order totals remain accurate.

### AI Recommendations
A SQL co-occurrence algorithm recommends products by finding items frequently purchased together, with a same-category fallback for new products. No external LLM dependencies.

---

## 🧪 Testing

The backend has 25 automated tests across 4 suites:

- auth.test.ts — Register, login, refresh rotation, RBAC 403s (9 tests)
- cartAndCheckout.test.ts — Cart ops, checkout, idempotency (8 tests)
- concurrency.test.ts — Race condition: 2 users buy the last item (1 test)
- adminAndAnalytics.test.ts — Admin stats, seller approval, notifications (7 tests)

Run the tests:

cd apps/api
npm test

---

## 💻 Local Development

### Prerequisites
- Node.js 20+
- MySQL 8 database (local or cloud)
- Git

### 1. Clone the repository

git clone https://github.com/AbdulhamidN/Smart-Ecommerce-.git
cd Smart-Ecommerce-
npm install

### 2. Configure environment variables

Create apps/api/.env with: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, CORS_ORIGIN, WEB_URL, NODE_ENV, PORT.

Create apps/web/.env with: VITE_API_URL=http://localhost:4000/api/v1

### 3. Set up the database

cd apps/api
npx prisma migrate dev
npx prisma db seed

### 4. Run the app

In two separate terminals:

Terminal 1 (API): cd apps/api && npm run dev
Terminal 2 (Web): cd apps/web && npm run dev

Open http://localhost:5173 and log in with any demo credential.

---

## 🚀 Deployment

### Backend (Render)
- Root Directory: apps/api
- Build Command: npm install && npx prisma generate && npm run build
- Start Command: npm start
- Environment Variables: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN, PORT
- Post-Deploy: Run npx prisma db seed via Render Shell for the first deployment.

### Frontend (Vercel)
- Root Directory: apps/web
- Framework: Vite
- Build Command: npm run build
- Environment Variable: VITE_API_URL = https://your-render-url.onrender.com/api/v1

### Database (Railway)
- MySQL 8 service, connected via DATABASE_URL.

---

## 📚 Documentation

Additional documentation lives in the docs/ folder:
- docs/REPORT.md — Full project report (Chapters 1–5)
- docs/schema.md — Database schema and design rationale
- docs/decisions.md — Engineering decisions and trade-offs
- docs/erd.png — Entity-Relationship Diagram

---

## 🗺️ Roadmap / Future Work

- Integrate real payment gateways (Telebirr, CBE Birr, Chapa, M-Pesa)
- Add seller image uploads via Cloudinary or AWS S3
- Implement email and SMS notifications
- Add product reviews and ratings
- Build a React Native mobile app
- Add CI/CD with GitHub Actions

---

## 📄 License

This project was built as part of the Brolf Tech Remote Internship Challenge 2026 and is intended for educational and portfolio purposes.

---

## 🙏 Acknowledgments

- Brolf Tech PLC for the internship challenge
- Prisma, Vercel, Render, and Railway for their free-tier infrastructure
- Antigravity for AI-assisted development (all code was reviewed and tested manually)

---

Built with care for the Ethiopian market. Made with React, Express, and Prisma.
