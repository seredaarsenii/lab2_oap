import { categoryRepository, type CategoryListOptions } from '../repositories/category.repository.js';
import type { CreateCategoryDto } from '../dtos/create-category.dto.js';
import type { UpdateCategoryDto } from '../dtos/update-category.dto.js';
import { badRequest, conflict, notFound } from '../utils/http-error.js';

class CategoryService {
  async getAllCategories(options: CategoryListOptions) {
    return categoryRepository.findAll(options);
  }

  async getCategoryById(id: string) {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw notFound('Category not found', { id });
    }

    return category;
  }

  async createCategory(data: CreateCategoryDto) {
    this.validateCategory(data);

    try {
      return await categoryRepository.create(data);
    } catch (error: any) {
      if (error?.code === 'SQLITE_CONSTRAINT') {
        throw conflict('Category name must be unique', { name: data.name });
      }
      throw error;
    }
  }

  async updateCategory(id: string, data: UpdateCategoryDto) {
    if (data.name !== undefined && data.name.length < 2) {
      throw badRequest('Category name must be at least 2 characters long');
    }

    if (data.description !== undefined && !data.description) {
      throw badRequest('Category description is required');
    }

    try {
      const updated = await categoryRepository.update(id, data);

      if (!updated) {
        throw notFound('Category not found', { id });
      }

      return updated;
    } catch (error: any) {
      if (error?.code === 'SQLITE_CONSTRAINT') {
        throw conflict('Category name must be unique', { name: data.name });
      }
      throw error;
    }
  }

  async deleteCategory(id: string) {
    const deleted = await categoryRepository.delete(id);

    if (!deleted) {
      throw notFound('Category not found', { id });
    }

    return true;
  }

  private validateCategory(data: CreateCategoryDto) {
    if (!data.name || data.name.length < 2) {
      throw badRequest('Category name must be at least 2 characters long', { field: 'name' });
    }

    if (!data.description) {
      throw badRequest('Category description is required', { field: 'description' });
    }
  }
}

export const categoryService = new CategoryService();
