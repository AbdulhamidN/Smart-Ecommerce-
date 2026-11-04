import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import sellerRoutes from './routes/sellerRoutes';
import { authenticate } from './middleware/authenticate';
import { requireRole } from './middleware/requireRole';
import { requireApprovedSeller } from './middleware/requireApprovedSeller';
import { Role } from '@prisma/client';

const app = express();
const port = process.env.PORT || 4000;

// Security & utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Rate limiting for Auth routes
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

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use(
  '/api/v1/seller',
  authenticate,
  requireRole(Role.SELLER),
  requireApprovedSeller,
  sellerRoutes
);
app.use('/api/v1', productRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal server error',
    },
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API server running on port ${port}`);
  });
}

export default app;
