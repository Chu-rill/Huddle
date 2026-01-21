import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly userRepository: UserRepository) {}

  findAll() {
    return `This action returns all users`;
  }

  async findOneById(id: string) {
    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async findOneByEmail(email: string) {
    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.updateUser(id, updateUserDto);

    if (!user) {
      throw new BadRequestException('Failed to update user');
    }

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
