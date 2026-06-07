import { categoryRepository } from '../repositories/category.repository.js';
import { reportRepository, type ReportListOptions } from '../repositories/report.repository.js';
import type { CreateReportDto } from '../dtos/create-report.dto.js';
import type { UpdateReportDto } from '../dtos/update-report.dto.js';
import { badRequest, forbidden, notFound } from '../utils/http-error.js';

const severityValues = ['Low', 'Medium', 'High'];
const statusValues = ['Open', 'Closed', 'In Progress'];

export class ReportService {
  async getAllReports(currentUserId: number, options: ReportListOptions) {
    return reportRepository.findAll(currentUserId, options);
  }

  async getReportById(id: string, currentUserId: number) {
    const report = await reportRepository.findByIdForOwner(id, currentUserId);

    if (!report) {
      await this.throwNotFoundOrForbidden(id);
    }

    return report;
  }

  async getReportDetailsById(id: string, currentUserId: number) {
    const report = await reportRepository.findDetailsById(id, currentUserId);

    if (!report) {
      await this.throwNotFoundOrForbidden(id);
    }

    return report;
  }

  async getReportDetails(currentUserId: number, options: ReportListOptions) {
    return reportRepository.findDetails(currentUserId, options);
  }

  async getReportStats(currentUserId: number) {
    return reportRepository.getStats(currentUserId);
  }

  async unsafeSearchByTitle(title: string, currentUserId: number) {
    if (process.env.ENABLE_UNSAFE_SQL_DEMO !== 'true') {
      throw forbidden('Unsafe SQL demo is disabled', {
        enableWith: 'ENABLE_UNSAFE_SQL_DEMO=true'
      });
    }

    if (!title) {
      throw badRequest('title query parameter is required', { field: 'title' });
    }

    return reportRepository.unsafeSearchByTitle(title, currentUserId);
  }

  async safeSearchByTitle(title: string, currentUserId: number) {
    if (!title) {
      throw badRequest('title query parameter is required', { field: 'title' });
    }

    return reportRepository.safeSearchByTitle(title, currentUserId);
  }

  async createReport(data: CreateReportDto, currentUserId: number) {
    const categoryId = data.categoryId ?? data.category_id ?? null;

    this.validateRequiredReportFields(data);

    if (categoryId !== null) {
      await this.ensureCategoryExists(categoryId);
    }

    return reportRepository.create({
      user_id: currentUserId,
      category_id: categoryId,
      title: data.title,
      severity: data.severity,
      description: data.description,
      reporter: data.reporter
    });
  }

  async updateReport(id: string, data: UpdateReportDto, currentUserId: number) {
    const categoryId = data.categoryId ?? data.category_id;

    if (data.title !== undefined && data.title.length < 3) {
      throw badRequest('Title must be at least 3 characters long', { field: 'title' });
    }

    if (data.severity !== undefined && !severityValues.includes(data.severity)) {
      throw badRequest('Severity must be Low, Medium, or High', { field: 'severity' });
    }

    if (data.status !== undefined && !statusValues.includes(data.status)) {
      throw badRequest('Status must be Open, Closed, or In Progress', { field: 'status' });
    }

    if (categoryId !== undefined && categoryId !== null) {
      await this.ensureCategoryExists(categoryId);
    }

    const updateData: {
      user_id?: number;
      category_id?: number | null;
      title?: string;
      severity?: 'Low' | 'Medium' | 'High';
      status?: 'Open' | 'Closed' | 'In Progress';
      description?: string;
      reporter?: string;
    } = {};

    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.reporter !== undefined) updateData.reporter = data.reporter;

    const updated = await reportRepository.update(id, currentUserId, updateData);

    if (!updated) {
      await this.throwNotFoundOrForbidden(id);
    }

    return updated;
  }

  async deleteReport(id: string, currentUserId: number) {
    const deleted = await reportRepository.delete(id, currentUserId);

    if (!deleted) {
      await this.throwNotFoundOrForbidden(id);
    }

    return true;
  }

  private validateRequiredReportFields(data: CreateReportDto) {
    if (!data.title || data.title.length < 3) {
      throw badRequest('Title must be at least 3 characters long', { field: 'title' });
    }

    if (!data.severity || !severityValues.includes(data.severity)) {
      throw badRequest('Severity must be Low, Medium, or High', { field: 'severity' });
    }

    if (!data.description) {
      throw badRequest('Description is required', { field: 'description' });
    }

    if (!data.reporter) {
      throw badRequest('Reporter is required', { field: 'reporter' });
    }
  }

  private async ensureCategoryExists(categoryId: number) {
    const category = await categoryRepository.findById(String(categoryId));
    if (!category) {
      throw badRequest('categoryId must reference an existing category', { categoryId });
    }
  }

  private async throwNotFoundOrForbidden(id: string): Promise<never> {
    if (await reportRepository.exists(id)) {
      throw forbidden('You do not have access to this report', { id });
    }

    throw notFound('Report not found', { id });
  }
}

export const reportService = new ReportService();
