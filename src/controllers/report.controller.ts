import type { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service.js';
import type { ReportListOptions } from '../repositories/report.repository.js';

const allowedOrderBy = ['id', 'created_at', 'severity', 'title', 'status'] as const;
type OrderBy = (typeof allowedOrderBy)[number];

function getListOptions(req: Request) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? req.query.pageSize) || 10, 1), 100);
  const orderParam = String(req.query.order ?? 'DESC').toUpperCase();
  const order = orderParam === 'ASC' ? 'ASC' : 'DESC';
  const orderByParam = String(req.query.sort ?? req.query.orderBy ?? 'id');
  const orderBy: OrderBy = allowedOrderBy.includes(orderByParam as OrderBy)
    ? orderByParam as OrderBy
    : 'id';
  const options: ReportListOptions = {
    limit,
    offset: (page - 1) * limit,
    order,
    orderBy
  };

  if (typeof req.query.status === 'string' && req.query.status) {
    options.status = req.query.status;
  }

  if (typeof req.query.userId === 'string' && req.query.userId) {
    options.userId = Number(req.query.userId);
  }

  if (typeof req.query.categoryId === 'string' && req.query.categoryId) {
    options.categoryId = Number(req.query.categoryId);
  }

  return { options, page, limit };
}

export class ReportController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { options, page, limit } = getListOptions(req);
      const reports = await reportService.getAllReports(req.currentUser!.id, options);

      res.json({
        data: reports.items,
        meta: {
          total: reports.total,
          page,
          limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const report = await reportService.getReportById(req.params.id, req.currentUser!.id);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { options, page, limit } = getListOptions(req);
      const reports = await reportService.getReportDetails(req.currentUser!.id, options);
      res.json({
        data: reports.items,
        meta: {
          total: reports.total,
          page,
          limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reportService.getReportStats(req.currentUser!.id);
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }

  async unsafeSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const title = typeof req.query.title === 'string' ? req.query.title : '';
      const reports = await reportService.unsafeSearchByTitle(title, req.currentUser!.id);
      res.json({
        data: reports,
        meta: {
          warning: 'This endpoint intentionally demonstrates unsafe SQL concatenation'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async safeSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const title = typeof req.query.title === 'string' ? req.query.title : '';
      const reports = await reportService.safeSearchByTitle(title, req.currentUser!.id);
      res.json({ data: reports });
    } catch (error) {
      next(error);
    }
  }

  async getDetailsById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const report = await reportService.getReportDetailsById(req.params.id, req.currentUser!.id);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const newReport = await reportService.createReport(req.body, req.currentUser!.id);
      res.status(201).json(newReport);
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const updated = await reportService.updateReport(req.params.id, req.body, req.currentUser!.id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async delete(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      await reportService.deleteReport(req.params.id, req.currentUser!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

}

export const reportController = new ReportController();
