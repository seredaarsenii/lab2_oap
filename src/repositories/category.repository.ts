import { getDb } from '../db/db.js';

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface CategoryListOptions {
  name?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'id' | 'created_at' | 'name';
  order?: 'ASC' | 'DESC';
}

class CategoryRepository {
  async findAll(options: CategoryListOptions = {}) {
    const db = await getDb();
    const where: string[] = [];
    const params: unknown[] = [];

    if (options.name) {
      where.push('name LIKE ?');
      params.push(`%${options.name}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderBy = options.orderBy ?? 'id';
    const order = options.order ?? 'DESC';
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const items = await db.all<Category[]>(
      `SELECT id, name, description, created_at
       FROM categories
       ${whereSql}
       ORDER BY ${orderBy} ${order}
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    const totalRow = await db.get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM categories ${whereSql}`,
      ...params
    );

    return {
      items,
      total: totalRow?.total ?? 0
    };
  }

  async findById(id: string) {
    const db = await getDb();
    return db.get<Category>(
      'SELECT id, name, description, created_at FROM categories WHERE id = ?',
      id
    );
  }

  async create(data: Pick<Category, 'name' | 'description'>) {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      data.name,
      data.description
    );

    const created = await this.findById(String(result.lastID));
    if (!created) {
      throw new Error('Created category was not found');
    }

    return created;
  }

  async update(id: string, data: Partial<Pick<Category, 'name' | 'description'>>) {
    const allowedFields = ['name', 'description'] as const;
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
      `UPDATE categories SET ${assignments} WHERE id = ?`,
      ...params,
      id
    );

    if (!result.changes) {
      return null;
    }

    return this.findById(id);
  }

  async delete(id: string) {
    const db = await getDb();
    const result = await db.run('DELETE FROM categories WHERE id = ?', id);
    return Boolean(result.changes);
  }
}

export const categoryRepository = new CategoryRepository();
