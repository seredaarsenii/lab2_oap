import express from 'express';
import type { Request, Response } from 'express';
import userRouter from './routes/user.routes.js';
import reportRouter from './routes/report.routes.js';
import categoryRouter from './routes/category.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { dbPath, initDb } from './db/db.js';

const app = express();
const PORT = 3000;

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
app.use('/api/categories', categoryRouter);
app.use('/api/reports', reportRouter);

app.get('/health', (req: Request, res: Response) => {
  res.send('API works!');
});

app.use(errorHandler);

await initDb();

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`SQLite database: ${dbPath}`);
});
