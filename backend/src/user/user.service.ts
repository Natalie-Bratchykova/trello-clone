import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput, UpdateUserInput, LoginUserInput } from './user.input';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserInput) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        boards: true,
        cards: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        boards: true,
        cards: true,
      },
    });
  }

  async updateUser(id: string, data: UpdateUserInput) {
    // Check if user exists
    await this.getUserById(id);

    // If email is being updated, check if it's already taken
    if (data.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already taken');
      }
    }

    // Hash password if it's being updated
    const updateData = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id: string) {
    // Check if user exists
    await this.getUserById(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async validateUser(data: LoginUserInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async getUserBoards(userId: string) {
    const user = await this.getUserById(userId);
    return this.prisma.board.findMany({
      where: { userId: user.id },
      include: {
        lists: true,
      },
    });
  }

  async getUserCards(userId: string) {
    const user = await this.getUserById(userId);
    return this.prisma.card.findMany({
      where: { userId: user.id },
      include: {
        list: {
          include: {
            board: true,
          },
        },
      },
    });
  }
}

