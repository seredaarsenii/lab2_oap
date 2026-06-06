import type { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service.js';
import type { CategoryListOptions } from '../repositories/category.repository.js';

const allowedSort = ['id', 'created_at', 'name'] as const;
type CategorySort = (typeof allowedSort)[number];

class CategoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const orderParam = String(req.query.order ?? 'DESC').toUpperCase();
      const order = orderParam === 'ASC' ? 'ASC' : 'DESC';
      const sortParam = String(req.query.sort ?? req.query.orderBy ?? 'id');
      const orderBy: CategorySort = allowedSort.includes(sortParam as CategorySort)
        ? sortParam as CategorySort
        : 'id';
      const options: CategoryListOptions = {
        limit,
        offset: (page - 1) * limit,
        order,
        orderBy
      };

      if (typeof req.query.name === 'string' && req.query.name) {
        options.name = req.query.name;
      }

      const categories = await categoryService.getAllCategories(options);
      res.json({
        data: categories.items,
        meta: {
          total: categories.total,
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
      const category = await categoryService.getCategoryById(req.params.id);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await categoryService.createCategory(req.body);
      res.status(201).json(created);
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
      const updated = await categoryService.updateCategory(req.params.id, req.body);
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
      await categoryService.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
