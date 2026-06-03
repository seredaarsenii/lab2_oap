import { getDb } from '../db/db.js';

const users = [
  ['Ivan', 'ivan@example.com'],
  ['Olena', 'olena@example.com'],
  ['Maksym', 'maksym@example.com']
];

const categories = [
  ['Web', 'Web application vulnerabilities'],
  ['Network', 'Network and infrastructure vulnerabilities'],
  ['Access Control', 'Authentication and authorization issues']
];

const reports = [
  [1, 1, 'SQL Injection', 'High', 'Open', 'Login form accepts unsafe SQL input', 'Ivan'],
  [1, 3, 'Broken Access Control', 'High', 'In Progress', 'Regular user can open admin page', 'Ivan'],
  [2, 1, 'XSS in Comments', 'Medium', 'Open', 'Comment field renders script tags', 'Olena'],
  [2, 2, 'Open SSH Port', 'Low', 'Closed', 'SSH is exposed to the public internet', 'Olena'],
  [3, 2, 'Outdated TLS', 'Medium', 'Open', 'Server allows weak TLS protocol versions', 'Maksym'],
  [3, 3, 'Weak Password Policy', 'Low', 'Closed', 'Password policy allows short passwords', 'Maksym']
];

class SeedRepository {
  async seed() {
    const db = await getDb();

    await db.exec('BEGIN TRANSACTION;');

    try {
      await db.exec('DELETE FROM reports;');
      await db.exec('DELETE FROM categories;');
      await db.exec('DELETE FROM users;');
      await db.exec("DELETE FROM sqlite_sequence WHERE name IN ('reports', 'categories', 'users');");

      for (const [username, email] of users) {
        await db.run(
          'INSERT INTO users (username, email) VALUES (?, ?)',
          username,
          email
        );
      }

      for (const [name, description] of categories) {
        await db.run(
          'INSERT INTO categories (name, description) VALUES (?, ?)',
          name,
          description
        );
      }

      for (const [userId, categoryId, title, severity, status, description, reporter] of reports) {
        await db.run(
          `INSERT INTO reports (user_id, category_id, title, severity, status, description, reporter)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          userId,
          categoryId,
          title,
          severity,
          status,
          description,
          reporter
        );
      }

      await db.exec('COMMIT;');
    } catch (error) {
      await db.exec('ROLLBACK;');
      throw error;
    }
  }
}

export const seedRepository = new SeedRepository();
