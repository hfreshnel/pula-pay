import { PrismaClient, User as PrismaUser, Prisma } from '@prisma/client';
import { User, UserProps } from '../../../domain/entities/User';
import { UserRepository, CreateUserParams } from '../../../domain/ports/repositories/UserRepository';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toDomain(user) : null;
  }

  async create(params: CreateUserParams): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        phone: params.phone,
        email: params.email,
        passwordHash: params.passwordHash,
      },
    });
    return this.toDomain(user);
  }

  async update(user: User): Promise<User> {
    const props = user.toPersistence();
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: props.email,
        passwordHash: props.passwordHash,
        kycLevel: props.kycLevel,
        kycData: (props.kycData as Prisma.InputJsonValue) ?? undefined,
        displayCurrency: props.displayCurrency,
        locale: props.locale,
        otpHash: props.otpHash,
        otpExpiresAt: props.otpExpiresAt,
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toDomain(prismaUser: PrismaUser): User {
    const props: UserProps = {
      id: prismaUser.id,
      phone: prismaUser.phone,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      kycLevel: prismaUser.kycLevel,
      kycData: prismaUser.kycData as Record<string, unknown> | null,
      displayCurrency: prismaUser.displayCurrency,
      locale: prismaUser.locale,
      otpHash: prismaUser.otpHash,
      otpExpiresAt: prismaUser.otpExpiresAt,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
    return new User(props);
  }
}
