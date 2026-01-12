import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async createUser(username: string, email: string, password: string) {
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
    return user;
  }

  async createUserOauth(username: string, email: string) {
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        isEmailVerified: true,
        password: true,
      },
    });
    return user;
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
    return user;
  }
}
