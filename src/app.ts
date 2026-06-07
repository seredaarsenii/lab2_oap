import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import reportRouter from './routes/report.routes.js';
import categoryRouter from './routes/category.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { securityHeaders } from './middlewares/security.middleware.js';

const API_PREFIX = '/api/v1';
const allowedOrigin = 'http://localhost:5173';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[LOG] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  app.use(securityHeaders);
  app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    optionsSuccessStatus: 204
  }));
  app.use(express.json({ limit: '32kb' }));

  app.use(`${API_PREFIX}/auth`, authRouter);
  app.use(`${API_PREFIX}/users`, userRouter);
  app.use(`${API_PREFIX}/categories`, categoryRouter);
  app.use(`${API_PREFIX}/reports`, reportRouter);

  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/reports', reportRouter);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', (req, res) => {
    res.status(404).json({
      code: 404,
      message: 'API endpoint not found',
      details: null,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  });

  app.use(errorHandler);
  return app;
}
