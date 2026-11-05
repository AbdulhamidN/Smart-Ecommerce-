import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import sellerRoutes from './routes/sellerRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { authenticate } from './middleware/authenticate';
import { requireRole } from './middleware/requireRole';
import { requireApprovedSeller } from './middleware/requireApprovedSeller';
import { Role } from '@prisma/client';

const app = express();
const port = process.env.PORT || 4000;

// Trust reverse proxy (essential for Render / Cloudflare / Nginx load balancers)
app.set('trust proxy', 1);

// Security & utility middleware
app.use(helmet());

const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin
      ? corsOrigin.includes(',')
        ? corsOrigin.split(',').map((o) => o.trim())
        : corsOrigin
      : true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Health check endpoints (available at root, /health, and /api/v1/health)
app.get(['/', '/health', '/api/v1/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'smart-ecommerce-api',
  });
});

// 2. Rate limiting for Auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts, please try again later',
    },
  },
});

// 3. API v1 Router Mounts
const apiV1 = express.Router();

apiV1.use('/auth', authLimiter, authRoutes);
apiV1.use(
  '/seller',
  authenticate,
  requireRole(Role.SELLER),
  requireApprovedSeller,
  sellerRoutes
);
apiV1.use('/cart', authenticate, cartRoutes);
apiV1.use('/orders', authenticate, orderRoutes);
apiV1.use('/admin', authenticate, requireRole(Role.ADMIN), adminRoutes);
apiV1.use('/notifications', authenticate, notificationRoutes);
apiV1.use('/', productRoutes);

// Mount all v1 routes under /api/v1
app.use('/api/v1', apiV1);

// 4. 404 Catch-All Handler (must strictly be placed after all route definitions)
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// 5. Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal server error',
    },
  });
});

// 6. Server Listener (bind explicitly to 0.0.0.0 for cloud host environments)
if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`API server running on port ${port} (0.0.0.0)`);
  });
}

export default app;
