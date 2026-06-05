import express from 'express';
import userRouter from './routes/user.routes.js';
import reportRouter from './routes/report.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[LOG] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

app.use(express.json());
app.use(express.static('public'));

app.use('/api/users', userRouter);
app.use('/api/reports', reportRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.use(errorHandler);
