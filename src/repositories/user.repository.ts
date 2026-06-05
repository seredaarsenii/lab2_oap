export interface User {
  id: string;
  username: string;
  email: string;
}

class UserRepository {
  private users: User[] = [];

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
      id: Date.now().toString(),
      ...userData
    };
    this.users.push(newUser);
    return newUser;
  }

  async update(id: string, userData: Partial<Omit<User, 'id'>>): Promise<User | null> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return null;

    const existingUser = this.users[index] as User;
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      id: existingUser.id
    };

    this.users[index] = updatedUser;
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return false;

    this.users.splice(index, 1);
    return true;
  }
}

export const userRepository = new UserRepository();
