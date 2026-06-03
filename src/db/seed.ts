import { initDb } from './db.js';
import { seedRepository } from '../repositories/seed.repository.js';

await initDb();

console.log('[DB] Seed started');

await seedRepository.seed();

console.log('[DB] Seed completed: 3 users, 3 categories, 6 reports');
