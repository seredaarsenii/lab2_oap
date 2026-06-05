import { userRepository } from '../repositories/user.repository.js';
import type { CreateUserDto } from '../dtos/create-user.dto.js';
import type { UpdateUserDto } from '../dtos/update-user.dto.js';

class UserService {
  async getAllUsers() {
    const users = await userRepository.findAll();

    return {
      items: users,
      total: users.length
    };
  }

  async getUserById(id: string) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    return user;
  }

  async createUser(userData: CreateUserDto) {
    this.validateUser(userData, true);

    return await userRepository.create(userData);
  }

  async updateUser(id: string, userData: UpdateUserDto) {
    this.validateUser(userData, false);

    const updated = await userRepository.update(id, userData);

    if (!updated) {
      throw { status: 404, message: 'User not found' };
    }

    return updated;
  }

  async deleteUser(id: string) {
    const deleted = await userRepository.delete(id);

    if (!deleted) {
      throw { status: 404, message: 'User not found' };
    }

    return true;
  }

  private validateUser(userData: CreateUserDto | UpdateUserDto, requireAllFields: boolean) {
    if (requireAllFields && !userData.username) {
      throw { status: 400, message: 'Username is required' };
    }

    if (userData.username !== undefined && userData.username.length < 3) {
      throw { status: 400, message: 'Username must be at least 3 characters long' };
    }

    if (requireAllFields && !userData.email) {
      throw { status: 400, message: 'Email is required' };
    }

    if (userData.email !== undefined && !userData.email.includes('@')) {
      throw { status: 400, message: 'Invalid email format' };
    }
  }
}

export const userService = new UserService();
