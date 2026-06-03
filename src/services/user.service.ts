import { userRepository, type UserListOptions } from '../repositories/user.repository.js';
import type { CreateUserDto } from '../dtos/create-user.dto.js';
import type { UpdateUserDto } from '../dtos/update-user.dto.js';
import { badRequest, conflict, notFound } from '../utils/http-error.js';

class UserService {
  async getAllUsers(options: UserListOptions) {
    return userRepository.findAll(options);
  }

  async getUserById(id: string) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw notFound('User not found', { id });
    }

    return user;
  }

  async createUser(userData: CreateUserDto) {
    this.validateUser(userData);

    try {
      return await userRepository.create(userData);
    } catch (error: any) {
      if (error?.code === 'SQLITE_CONSTRAINT') {
        throw conflict('User email must be unique', { email: userData.email });
      }
      throw error;
    }
  }

  async updateUser(id: string, userData: UpdateUserDto) {
    if (userData.username !== undefined && userData.username.length < 3) {
      throw badRequest('Username must be at least 3 characters long');
    }

    if (userData.email !== undefined && !userData.email.includes('@')) {
      throw badRequest('Invalid email format');
    }

    try {
      const updated = await userRepository.update(id, userData);

      if (!updated) {
        throw notFound('User not found', { id });
      }

      return updated;
    } catch (error: any) {
      if (error?.code === 'SQLITE_CONSTRAINT') {
        throw conflict('User email must be unique', { email: userData.email });
      }
      throw error;
    }
  }

  async deleteUser(id: string) {
    const deleted = await userRepository.delete(id);

    if (!deleted) {
      throw notFound('User not found', { id });
    }

    return true;
  }

  private validateUser(userData: CreateUserDto) {
    if (!userData.username || userData.username.length < 3) {
      throw badRequest('Username must be at least 3 characters long', { field: 'username' });
    }

    if (!userData.email || !userData.email.includes('@')) {
      throw badRequest('Invalid email format', { field: 'email' });
    }
  }
}

export const userService = new UserService();
