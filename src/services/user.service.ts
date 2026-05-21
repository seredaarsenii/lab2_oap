import { userRepository, type User } from '../repositories/user.repository.js';

class UserService {
  async getAllUsers() {
    return await userRepository.findAll();
  }

  async createUser(userData: any) {
    // Валідація
    if (!userData.username || userData.username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (!userData.email || !userData.email.includes('@')) {
      throw new Error('Invalid email format');
    }

    return await userRepository.create(userData);
  }
}

export const userService = new UserService();