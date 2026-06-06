import type { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import type { UserListOptions } from '../repositories/user.repository.js';

const allowedSort = ['id', 'created_at', 'username', 'email'] as const;
type UserSort = (typeof allowedSort)[number];

class UserController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const orderParam = String(req.query.order ?? 'DESC').toUpperCase();
      const order = orderParam === 'ASC' ? 'ASC' : 'DESC';
      const sortParam = String(req.query.sort ?? req.query.orderBy ?? 'id');
      const orderBy: UserSort = allowedSort.includes(sortParam as UserSort)
        ? sortParam as UserSort
        : 'id';
      const options: UserListOptions = {
        limit,
        offset: (page - 1) * limit,
        order,
        orderBy
      };

      if (typeof req.query.email === 'string' && req.query.email) {
        options.email = req.query.email;
      }

      if (typeof req.query.username === 'string' && req.query.username) {
        options.username = req.query.username;
      }

      const users = await userService.getAllUsers(options);
      res.json({
        data: users.items,
        meta: {
          total: users.total,
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
      const user = await userService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const newUser = await userService.createUser(req.body);
      res.status(201).json(newUser);
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
      const updated = await userService.updateUser(req.params.id, req.body);
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
      await userService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
