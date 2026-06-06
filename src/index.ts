import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import userRouter from './routes/user.routes.js';
import reportRouter from './routes/report.routes.js';
import categoryRouter from './routes/category.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { dbPath, initDb } from './db/db.js';

const app = express();
const PORT = 3000;
const API_PREFIX = '/api/v1';
const allowedOrigin = 'http://localhost:5173';

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[LOG] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 204
}));

app.use(express.json());

app.use(`${API_PREFIX}/users`, userRouter);
app.use(`${API_PREFIX}/categories`, categoryRouter);
app.use(`${API_PREFIX}/reports`, reportRouter);

// Keep the previous URLs available while clients move to the versioned API.
app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/reports', reportRouter);

app.get('/health', (req: Request, res: Response) => {
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

await initDb();

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`SQLite database: ${dbPath}`);
});
