import { getDb } from '../db/db.js';

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface UserWithPassword extends User {
  password_hash: string;
}

export interface UserListOptions {
  email?: string;
  username?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'id' | 'created_at' | 'username' | 'email';
  order?: 'ASC' | 'DESC';
}

class UserRepository {
  async findAll(options: UserListOptions = {}) {
    const db = await getDb();
    const where: string[] = [];
    const params: unknown[] = [];

    if (options.email) {
      where.push('email LIKE ?');
      params.push(`%${options.email}%`);
    }

    if (options.username) {
      where.push('username LIKE ?');
      params.push(`%${options.username}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderBy = options.orderBy ?? 'id';
    const order = options.order ?? 'DESC';
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const items = await db.all<User[]>(
      `SELECT id, username, email, created_at
       FROM users
       ${whereSql}
       ORDER BY ${orderBy} ${order}
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    const totalRow = await db.get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM users ${whereSql}`,
      ...params
    );

    return {
      items,
      total: totalRow?.total ?? 0
    };
  }

  async findById(id: string): Promise<User | undefined> {
    const db = await getDb();
    return db.get<User>(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      id
    );
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPassword | undefined> {
    const db = await getDb();
    return db.get<UserWithPassword>(
      `SELECT id, username, email, created_at, password_hash
       FROM users
       WHERE email = ?`,
      email
    );
  }

  async create(userData: Pick<User, 'username' | 'email'>): Promise<User> {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      userData.username,
      userData.email
    );

    const created = await this.findById(String(result.lastID));
    if (!created) {
      throw new Error('Created user was not found');
    }

    return created;
  }

  async update(id: string, data: Partial<Pick<User, 'username' | 'email'>>) {
    const allowedFields = ['username', 'email'] as const;
    const entries = allowedFields
      .filter(field => data[field] !== undefined)
      .map(field => [field, data[field]] as const);

    if (!entries.length) {
      return this.findById(id);
    }

    const assignments = entries.map(([field]) => `${field} = ?`).join(', ');
    const params = entries.map(([, value]) => value);
    const db = await getDb();
    const result = await db.run(
      `UPDATE users SET ${assignments} WHERE id = ?`,
      ...params,
      id
    );

    if (!result.changes) {
      return null;
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.run('DELETE FROM users WHERE id = ?', id);
    return Boolean(result.changes);
  }
}

export const userRepository = new UserRepository();
