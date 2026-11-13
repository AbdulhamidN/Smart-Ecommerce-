# GibeMart — Smart E-Commerce Platform

**GibeMart** is a modern, multi-vendor e-commerce platform designed for the Ethiopian market. It connects customers, independent sellers, and administrators through a unified shopping experience, featuring ETB pricing, product discovery, seller management, order processing, and transactional checkout.

The platform aims to simplify online shopping and empower local businesses through a reliable and scalable digital marketplace.

**Developed for:** Brolf Tech Remote Internship Challenge 2026 — Project 2: Smart E-Commerce Platform.

---

## Live Demo

- **Frontend:** [https://smart-ecommerce-psi.vercel.app](https://smart-ecommerce-psi.vercel.app)
- **Backend API Health:** [https://smart-ecommerce-api-ek3p.onrender.com/api/v1/health](https://smart-ecommerce-api-ek3p.onrender.com/api/v1/health)
- **Database:** MySQL 8

Demo credentials are provided separately for authorized project evaluation.

---

## Features

### Customer Experience

- Dynamic homepage with promotional carousel and category discovery.
- Product catalog with search and filtering.
- Filter products by category, price range (ETB), and availability.
- Shopping cart with server-side quantity validation.
- Transactional checkout with idempotency protection.
- Order history with visual order-status tracking.
- Personalized product recommendations.
- Customer account management.

### Seller Dashboard

- Seller registration and administrator approval workflow.
- Product management with create, update, and delete operations.
- Product image support and draft/published states.
- Inventory tracking with low-stock and out-of-stock indicators.
- Order management for individual sellers.
- Revenue and sales analytics with interactive charts.
- Seller-specific product and order access.

### Administrator Dashboard

- Seller application review and approval.
- Platform-wide statistics covering revenue, orders, users, and sellers.
- Marketplace-wide order management.
- In-app notifications.
- Centralized platform management.

---

## Technology Stack

| Layer               | Technologies                    |
| ------------------- | ------------------------------- |
| Frontend            | React 18, Vite, Tailwind CSS    |
| Routing             | React Router                    |
| Data Management     | TanStack Query                  |
| Backend             | Node.js 20, Express, TypeScript |
| Validation          | Zod                             |
| Database            | MySQL 8                         |
| ORM                 | Prisma                          |
| Authentication      | JWT, bcrypt, HttpOnly Cookies   |
| Charts              | Recharts                        |
| Testing             | Vitest, Supertest               |
| Frontend Deployment | Vercel                          |
| Backend Deployment  | Render                          |
| Database Hosting    | Railway                         |

---

## Architecture

GibeMart follows a decoupled application architecture consisting of two main applications:

- **Frontend (`apps/web`):** React-based user interface for customers, sellers, and administrators.
- **Backend (`apps/api`):** Express REST API responsible for authentication, authorization, business logic, order processing, and database operations.

The frontend communicates with the backend through HTTPS-based REST API requests. Prisma ORM manages database interactions with MySQL.

The application uses role-based access control (RBAC) to enforce permissions across different user roles.

---

## Project Structure

```text
smart-ecommerce/
│
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   │
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   │
│   │   └── tests/
│   │
│   └── web/
│       ├── public/
│       └── src/
│           ├── api/
│           ├── components/
│           ├── context/
│           ├── pages/
│           └── utils/
│
├── docs/
│   ├── REPORT.md
│   ├── schema.md
│   ├── decisions.md
│   └── erd.png
│
└── README.md
```

---

## Key Technical Highlights

### 1. Transactional Checkout and Concurrency Safety

The checkout process uses Prisma database transactions to maintain data consistency.

Product stock is updated atomically using a conditional database update that verifies sufficient inventory before completing a purchase.

This prevents overselling when multiple customers attempt to purchase the remaining stock simultaneously.

### 2. Idempotent Order Processing

Checkout requests support idempotency keys to prevent duplicate order creation when requests are repeated, such as when customers accidentally submit checkout more than once.

Repeated requests with the same key return the original order instead of creating another one.

### 3. Order Lifecycle Management

Orders follow a controlled lifecycle:

`PAID → PROCESSING → SHIPPED → DELIVERED`

Cancellation is restricted according to the order's current state. Invalid state transitions are rejected, and concurrent updates are handled through optimistic locking.

### 4. Role-Based Access Control

Backend authorization enforces permissions based on user roles.

The platform distinguishes between:

- Customers
- Sellers
- Administrators

Seller-specific operations are restricted to the seller who owns the relevant resources, while administrative operations require administrator privileges.

### 5. Historical Price Consistency

Order items store the product price at the time of purchase.

This ensures that historical order totals remain accurate even if the seller changes the product price later.

### 6. Product Recommendations

The recommendation engine uses SQL-based product co-occurrence analysis to identify products frequently purchased together.

A same-category fallback is provided for products with insufficient purchase history.

---

## Testing

The backend includes **25 automated tests across four test suites**.

| Test Suite                  | Coverage                                                      |
| --------------------------- | ------------------------------------------------------------- |
| `auth.test.ts`              | Registration, login, token refresh, and authorization         |
| `cartAndCheckout.test.ts`   | Cart operations, checkout, and idempotency                    |
| `concurrency.test.ts`       | Concurrent purchases and stock consistency                    |
| `adminAndAnalytics.test.ts` | Administration, seller approval, analytics, and notifications |

### Run Tests

```bash
cd apps/api
npm test
```

---

## Local Development

### Prerequisites

- Node.js 20 or later
- MySQL 8
- Git
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/AbdulhamidN/Smart-Ecommerce-.git

cd Smart-Ecommerce-
```

### 2. Install Dependencies

Install the dependencies for the frontend and backend according to their respective package configurations.

```bash
cd apps/api
npm install

cd ../web
npm install
```

### 3. Configure Environment Variables

Create an `.env` file inside `apps/api/`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/database"

JWT_ACCESS_SECRET="your-secure-access-secret"
JWT_REFRESH_SECRET="your-secure-refresh-secret"

ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"

CORS_ORIGIN="http://localhost:5173"
WEB_URL="http://localhost:5173"

NODE_ENV="development"
PORT=4000
```

Create an `.env` file inside `apps/web/`:

```env
VITE_API_URL="http://localhost:4000/api/v1"
```

Use your own local database credentials and securely generated secrets.

**Important:** Never commit `.env` files, production credentials, private keys, or other sensitive configuration to GitHub.

### 4. Initialize the Database

```bash
cd apps/api

npx prisma migrate dev
npx prisma db seed
```

### 5. Start the Applications

Run the backend in one terminal:

```bash
cd apps/api
npm run dev
```

Run the frontend in another terminal:

```bash
cd apps/web
npm run dev
```

Open the application:

```text
http://localhost:5173
```

---

## Deployment

The application uses separate deployment environments for its frontend, backend, and database.

### Frontend — Vercel

- Root Directory: `apps/web`
- Framework: Vite
- Build Command: `npm run build`
- Environment Variable: `VITE_API_URL`

### Backend — Render

- Root Directory: `apps/api`
- Build Command: `npm install && npx prisma generate && npm run build`
- Start Command: `npm start`

Configure the required production environment variables through the hosting provider's environment settings.

### Database — Railway

- Database: MySQL 8
- Connection: Prisma ORM through `DATABASE_URL`

Database migrations should be applied as part of the deployment process.

---

## Documentation

Additional project documentation is available in the `docs/` directory.

| Document       | Description                               |
| -------------- | ----------------------------------------- |
| `REPORT.md`    | Full project report covering Chapters 1–5 |
| `schema.md`    | Database schema and design rationale      |
| `decisions.md` | Engineering decisions and trade-offs      |
| `erd.png`      | Entity-Relationship Diagram               |

---

## Future Improvements

Potential enhancements include:

- Integration with Ethiopian payment providers such as Telebirr and Chapa.
- Seller image uploads through Cloudinary or AWS S3.
- Email and SMS notifications.
- Product reviews and ratings.
- Enhanced seller settlement and payout management.
- Mobile application development using React Native.
- Continuous Integration and Deployment using GitHub Actions.

---

## License and Project Purpose

GibeMart was developed as part of the **Brolf Tech Remote Internship Challenge 2026 —  Smart E-Commerce Platform**.

The project demonstrates the design and implementation of a multi-vendor e-commerce application, covering frontend development, backend services, database management, authentication, transactional operations, and deployment.

---

## Acknowledgments

- **Brolf Tech PLC** — Internship challenge and project opportunity.
- **Prisma** — Database ORM.
- **Vercel** — Frontend hosting.
- **Render** — Backend hosting.
- **Railway** — Database infrastructure.

