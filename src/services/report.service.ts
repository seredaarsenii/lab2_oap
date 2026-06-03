import { categoryRepository } from '../repositories/category.repository.js';
import { reportRepository, type ReportListOptions } from '../repositories/report.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import type { CreateReportDto } from '../dtos/create-report.dto.js';
import type { UpdateReportDto } from '../dtos/update-report.dto.js';
import { badRequest, notFound } from '../utils/http-error.js';

const severityValues = ['Low', 'Medium', 'High'];
const statusValues = ['Open', 'Closed', 'In Progress'];

export class ReportService {
  async getAllReports(options: ReportListOptions) {
    return reportRepository.findAll(options);
  }

  async getReportById(id: string) {
    const report = await reportRepository.findById(id);

    if (!report) {
      throw notFound('Report not found', { id });
    }

    return report;
  }

  async getReportDetailsById(id: string) {
    const report = await reportRepository.findDetailsById(id);

    if (!report) {
      throw notFound('Report not found', { id });
    }

    return report;
  }

  async createReport(data: CreateReportDto) {
    const userId = data.userId ?? data.user_id;
    const categoryId = data.categoryId ?? data.category_id ?? null;

    if (!userId) {
      throw badRequest('userId is required', { field: 'userId' });
    }

    this.validateRequiredReportFields(data);
    await this.ensureUserExists(userId);

    if (categoryId !== null) {
      await this.ensureCategoryExists(categoryId);
    }

    return reportRepository.create({
      user_id: userId,
      category_id: categoryId,
      title: data.title,
      severity: data.severity,
      description: data.description,
      reporter: data.reporter
    });
  }

  async updateReport(id: string, data: UpdateReportDto) {
    const userId = data.userId ?? data.user_id;
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

    if (userId !== undefined) {
      await this.ensureUserExists(userId);
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

    if (userId !== undefined) updateData.user_id = userId;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.reporter !== undefined) updateData.reporter = data.reporter;

    const updated = await reportRepository.update(id, updateData);

    if (!updated) {
      throw notFound('Report not found', { id });
    }

    return updated;
  }

  async deleteReport(id: string) {
    const deleted = await reportRepository.delete(id);

    if (!deleted) {
      throw notFound('Report not found', { id });
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

  private async ensureUserExists(userId: number) {
    const user = await userRepository.findById(String(userId));
    if (!user) {
      throw badRequest('userId must reference an existing user', { userId });
    }
  }

  private async ensureCategoryExists(categoryId: number) {
    const category = await categoryRepository.findById(String(categoryId));
    if (!category) {
      throw badRequest('categoryId must reference an existing category', { categoryId });
    }
  }
}

export const reportService = new ReportService();
