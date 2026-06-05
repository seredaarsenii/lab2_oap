import { reportRepository, type Report } from '../repositories/report.repository.js';
import type { CreateReportDto } from '../dtos/create-report.dto.js';
import type { UpdateReportDto } from '../dtos/update-report.dto.js';

const allowedSeverities: Report['severity'][] = ['Low', 'Medium', 'High'];
const allowedStatuses: Report['status'][] = ['Open', 'Closed', 'In Progress'];

export class ReportService {
  async getAllReports(
    status?: string,
    page: number = 1,
    pageSize: number = 10
  ) {
    let reports = await reportRepository.findAll();

    if (status) {
      if (!allowedStatuses.includes(status as Report['status'])) {
        throw { status: 400, message: 'Status must be Open, Closed, or In Progress' };
      }

      reports = reports.filter(report => report.status === status);
    }

    if (page < 1 || pageSize < 1) {
      throw { status: 400, message: 'Page and pageSize must be positive numbers' };
    }

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
      throw { status: 404, message: 'Report not found' };
    }

    return report;
  }

  async createReport(data: CreateReportDto) {
    this.validateReport(data, true);

    return await reportRepository.create(data);
  }

  async updateReport(id: string, data: UpdateReportDto) {
    this.validateReport(data, false);

    const updated = await reportRepository.update(id, data);

    if (!updated) {
      throw { status: 404, message: 'Report not found' };
    }

    return updated;
  }

  async deleteReport(id: string) {
    const deleted = await reportRepository.delete(id);

    if (!deleted) {
      throw { status: 404, message: 'Report not found' };
    }

    return true;
  }

  private validateReport(data: CreateReportDto | UpdateReportDto, requireAllFields: boolean) {
    if (requireAllFields && !data.title) {
      throw { status: 400, message: 'Title is required' };
    }

    if (data.title !== undefined && data.title.trim().length < 3) {
      throw { status: 400, message: 'Title must be at least 3 characters long' };
    }

    if (requireAllFields && !data.severity) {
      throw { status: 400, message: 'Severity is required' };
    }

    if (data.severity !== undefined && !allowedSeverities.includes(data.severity)) {
      throw { status: 400, message: 'Severity must be Low, Medium, or High' };
    }

    if ('status' in data && data.status !== undefined && !allowedStatuses.includes(data.status)) {
      throw { status: 400, message: 'Status must be Open, Closed, or In Progress' };
    }

    if (requireAllFields && !data.description) {
      throw { status: 400, message: 'Description is required' };
    }

    if (data.description !== undefined && data.description.trim().length < 3) {
      throw { status: 400, message: 'Description must be at least 3 characters long' };
    }

    if (requireAllFields && !data.reporter) {
      throw { status: 400, message: 'Reporter is required' };
    }

    if (data.reporter !== undefined && data.reporter.trim().length < 2) {
      throw { status: 400, message: 'Reporter must be at least 2 characters long' };
    }
  }
}

export const reportService = new ReportService();
