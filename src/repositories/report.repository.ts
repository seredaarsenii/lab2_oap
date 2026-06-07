import { getDb } from '../db/db.js';

export interface Report {
  id: number;
  user_id: number;
  category_id: number | null;
  title: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Closed' | 'In Progress';
  description: string;
  reporter: string;
  created_at: string;
}

export interface ReportDetails extends Report {
  user: {
    id: number;
    username: string;
    email: string;
  };
  category: {
    id: number;
    name: string;
    description: string;
  } | null;
}

export interface ReportStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  high_severity: number;
}

export interface ReportListOptions {
  status?: string;
  userId?: number;
  categoryId?: number;
  limit?: number;
  offset?: number;
  orderBy?: 'id' | 'created_at' | 'severity' | 'title' | 'status';
  order?: 'ASC' | 'DESC';
}

class ReportRepository {
  async findAll(ownerUserId: number, options: ReportListOptions = {}) {
    const db = await getDb();
    const where: string[] = ['user_id = ?'];
    const params: unknown[] = [ownerUserId];

    if (options.status) {
      where.push('status = ?');
      params.push(options.status);
    }

    if (options.userId) {
      where.push('user_id = ?');
      params.push(options.userId);
    }

    if (options.categoryId) {
      where.push('category_id = ?');
      params.push(options.categoryId);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderBy = options.orderBy ?? 'id';
    const order = options.order ?? 'DESC';
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const items = await db.all<Report[]>(
      `SELECT id, user_id, category_id, title, severity, status, description, reporter, created_at
       FROM reports
       ${whereSql}
       ORDER BY ${orderBy} ${order}
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    const totalRow = await db.get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM reports ${whereSql}`,
      ...params
    );

    return {
      items,
      total: totalRow?.total ?? 0
    };
  }

  async findById(id: string) {
    const db = await getDb();
    return db.get<Report>(
      `SELECT id, user_id, category_id, title, severity, status, description, reporter, created_at
       FROM reports
       WHERE id = ?`,
      id
    );
  }

  async findByIdForOwner(id: string, ownerUserId: number) {
    const db = await getDb();
    return db.get<Report>(
      `SELECT id, user_id, category_id, title, severity, status, description, reporter, created_at
       FROM reports
       WHERE id = ? AND user_id = ?`,
      id,
      ownerUserId
    );
  }

  async exists(id: string) {
    const db = await getDb();
    return Boolean(await db.get<{ id: number }>('SELECT id FROM reports WHERE id = ?', id));
  }

  async findDetailsById(id: string, ownerUserId: number): Promise<ReportDetails | undefined> {
    const db = await getDb();
    const row = await db.get<{
      id: number;
      user_id: number;
      category_id: number | null;
      title: string;
      severity: 'Low' | 'Medium' | 'High';
      status: 'Open' | 'Closed' | 'In Progress';
      description: string;
      reporter: string;
      created_at: string;
      user_username: string;
      user_email: string;
      category_name: string | null;
      category_description: string | null;
    }>(
      `SELECT
         reports.id,
         reports.user_id,
         reports.category_id,
         reports.title,
         reports.severity,
         reports.status,
         reports.description,
         reports.reporter,
         reports.created_at,
         users.username AS user_username,
         users.email AS user_email,
         categories.name AS category_name,
         categories.description AS category_description
       FROM reports
       JOIN users ON users.id = reports.user_id
       LEFT JOIN categories ON categories.id = reports.category_id
       WHERE reports.id = ? AND reports.user_id = ?`,
      id,
      ownerUserId
    );

    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      user_id: row.user_id,
      category_id: row.category_id,
      title: row.title,
      severity: row.severity,
      status: row.status,
      description: row.description,
      reporter: row.reporter,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        username: row.user_username,
        email: row.user_email
      },
      category: row.category_id === null
        ? null
        : {
            id: row.category_id,
            name: row.category_name ?? '',
            description: row.category_description ?? ''
          }
    };
  }

  async findDetails(ownerUserId: number, options: ReportListOptions = {}) {
    const db = await getDb();
    const where: string[] = ['reports.user_id = ?'];
    const params: unknown[] = [ownerUserId];

    if (options.status) {
      where.push('reports.status = ?');
      params.push(options.status);
    }

    if (options.userId) {
      where.push('reports.user_id = ?');
      params.push(options.userId);
    }

    if (options.categoryId) {
      where.push('reports.category_id = ?');
      params.push(options.categoryId);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderBy = options.orderBy ?? 'created_at';
    const order = options.order ?? 'DESC';
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const rows = await db.all<{
      id: number;
      user_id: number;
      category_id: number | null;
      title: string;
      severity: 'Low' | 'Medium' | 'High';
      status: 'Open' | 'Closed' | 'In Progress';
      description: string;
      reporter: string;
      created_at: string;
      user_username: string;
      user_email: string;
      category_name: string | null;
      category_description: string | null;
    }[]>(
      `SELECT
         reports.id,
         reports.user_id,
         reports.category_id,
         reports.title,
         reports.severity,
         reports.status,
         reports.description,
         reports.reporter,
         reports.created_at,
         users.username AS user_username,
         users.email AS user_email,
         categories.name AS category_name,
         categories.description AS category_description
       FROM reports
       JOIN users ON users.id = reports.user_id
       LEFT JOIN categories ON categories.id = reports.category_id
       ${whereSql}
       ORDER BY reports.${orderBy} ${order}
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    const totalRow = await db.get<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM reports
       JOIN users ON users.id = reports.user_id
       LEFT JOIN categories ON categories.id = reports.category_id
       ${whereSql}`,
      ...params
    );

    return {
      items: rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        category_id: row.category_id,
        title: row.title,
        severity: row.severity,
        status: row.status,
        description: row.description,
        reporter: row.reporter,
        created_at: row.created_at,
        user: {
          id: row.user_id,
          username: row.user_username,
          email: row.user_email
        },
        category: row.category_id === null
          ? null
          : {
              id: row.category_id,
              name: row.category_name ?? '',
              description: row.category_description ?? ''
            }
      })),
      total: totalRow?.total ?? 0
    };
  }

  async getStats(ownerUserId: number): Promise<ReportStats> {
    const db = await getDb();
    const stats = await db.get<ReportStats>(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END), 0) AS open,
         COALESCE(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0) AS in_progress,
         COALESCE(SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END), 0) AS closed,
         COALESCE(SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END), 0) AS high_severity
       FROM reports
       WHERE user_id = ?`,
      ownerUserId
    );

    return stats ?? {
      total: 0,
      open: 0,
      in_progress: 0,
      closed: 0,
      high_severity: 0
    };
  }

  async unsafeSearchByTitle(title: string, ownerUserId: number) {
    const db = await getDb();
    const sql = `
      SELECT id, user_id, category_id, title, severity, status, description, reporter, created_at
      FROM reports
      WHERE user_id = ${ownerUserId} AND title = '${title}'
      LIMIT 20
    `;

    return db.all<Report[]>(sql);
  }

  async safeSearchByTitle(title: string, ownerUserId: number) {
    const db = await getDb();
    return db.all<Report[]>(
      `SELECT id, user_id, category_id, title, severity, status, description, reporter, created_at
       FROM reports
       WHERE user_id = ? AND title = ?
       LIMIT 20`,
      ownerUserId,
      title
    );
  }

  async create(data: Omit<Report, 'id' | 'status' | 'created_at'>) {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO reports (user_id, category_id, title, severity, description, reporter)
       VALUES (?, ?, ?, ?, ?, ?)`,
      data.user_id,
      data.category_id,
      data.title,
      data.severity,
      data.description,
      data.reporter
    );

    const created = await this.findById(String(result.lastID));
    if (!created) {
      throw { status: 500, message: 'Created report was not found' };
    }

    return created;
  }

  async update(
    id: string,
    ownerUserId: number,
    data: Partial<Omit<Report, 'id' | 'created_at'>>
  ) {
    const allowedFields = ['user_id', 'category_id', 'title', 'severity', 'status', 'description', 'reporter'] as const;
    const entries = allowedFields
      .filter(field => data[field] !== undefined)
      .map(field => [field, data[field]] as const);

    if (!entries.length) {
      return this.findByIdForOwner(id, ownerUserId);
    }

    const assignments = entries.map(([field]) => `${field} = ?`).join(', ');
    const params = entries.map(([, value]) => value);
    const db = await getDb();
    const result = await db.run(
      `UPDATE reports SET ${assignments} WHERE id = ? AND user_id = ?`,
      ...params,
      id,
      ownerUserId
    );

    if (!result.changes) {
      return null;
    }

    return this.findByIdForOwner(id, ownerUserId);
  }

  async delete(id: string, ownerUserId: number) {
    const db = await getDb();
    const result = await db.run(
      'DELETE FROM reports WHERE id = ? AND user_id = ?',
      id,
      ownerUserId
    );
    return Boolean(result.changes);
  }
}

export const reportRepository = new ReportRepository();
