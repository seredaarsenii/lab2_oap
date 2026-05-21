import { reportRepository, type Report } from '../repositories/report.repository.js';

import type { CreateReportDto } from '../dtos/create-report.dto.js';
import type { UpdateReportDto } from '../dtos/update-report.dto.js';

export class ReportService {
  
  async getAllReports(
    status?: string,
    page: number = 1,
    pageSize: number = 10
  ) {

    let reports = await reportRepository.findAll();

    // filtering
    if (status) {
      reports = reports.filter(r => r.status === status);
    }

    // pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: reports.slice(start, end),
      total: reports.length
    };
  }

  async getReportById(id: string) {
    const report = await reportRepository.findById(id);

    if (!report) {
      throw { status: 404, message: 'Звіт не знайдено' };
    }

    return report;
  }

  async createReport(data: CreateReportDto) {

    if (!data.title || data.title.length < 3) {
      throw { status: 400, message: 'Заголовок занадто короткий' };
    }

    return await reportRepository.create(data);
  }

  async updateReport(id: string, data: UpdateReportDto) {

    if (data.title && data.title.length < 3) {
      throw { status: 400, message: 'Заголовок занадто короткий' };
    }

    const updated = await reportRepository.update(id, data);

    if (!updated) {
      throw { status: 404, message: 'Звіт не знайдено' };
    }

    return updated;
  }

  async deleteReport(id: string) {
    const deleted = await reportRepository.delete(id);

    if (!deleted) {
      throw { status: 404, message: 'Звіт не знайдено' };
    }

    return true;
  }
}

export const reportService = new ReportService();