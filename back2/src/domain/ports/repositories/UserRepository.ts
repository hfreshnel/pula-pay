import { User } from '../../entities/User';

export interface CreateUserParams {
  phone: string;
  email?: string;
  passwordHash: string;
}

/**
 * Repository port for User persistence
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(params: CreateUserParams): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
