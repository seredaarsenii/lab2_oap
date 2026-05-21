export interface User {
  id: string;
  username: string;
  email: string;
}

class UserRepository {
  // сховище в пам'яті (пункт 9)
  private users: User[] = [];

  // Метод для отримання всіх користувачів
  async findAll(): Promise<User[]> {
    return this.users;
  }

  // Метод для створення нового користувача
  async create(userData: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
      id: Date.now().toString(),
      ...userData
    };
    this.users.push(newUser);
    return newUser;
  }
}

export const userRepository = new UserRepository();