import type { Request, Response } from 'express';
import { userService } from '../services/user.service.js';

class UserController {
  async getAll(req: Request, res: Response) {
    const users = await userService.getAllUsers();
    res.json({
    items: users,
    total: users.length
  });
  }

  async create(req: Request, res: Response) {
    try {
      const newUser = await userService.createUser(req.body);
      // Пункт 8: POST повертає 201 і створений об'єкт
      res.status(201).json(newUser);
    } catch (error: any) {
      // при помилці валідації - 400 Bad Request
      res.status(400).json({ message: error.message });
    }
  }
}

export const userController = new UserController();