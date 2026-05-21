import type { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service.js';

export class ReportController {

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {

      const status = req.query.status as string;

      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const reports = await reportService.getAllReports(
        status,
        page,
        pageSize
      );

      res.json(reports);

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

      const report = await reportService.getReportById(req.params.id);

      res.json(report);

    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {

      const newReport = await reportService.createReport(req.body);

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

      const updated = await reportService.updateReport(
        req.params.id,
        req.body
      );

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

      await reportService.deleteReport(req.params.id);

      res.status(204).send();

    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();