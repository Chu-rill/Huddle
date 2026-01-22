import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepository } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    isEmailVerified: true,
  };

  const mockUserFull = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    password: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isEmailVerified: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: {
            getUserById: jest.fn(),
            getUserByEmail: jest.fn(),
            updateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a message for finding all users', () => {
      const result = service.findAll();
      expect(result).toBe('This action returns all users');
    });
  });

  describe('findOneById', () => {
    it('should successfully find a user by id', async () => {
      userRepository.getUserById.mockResolvedValue(mockUser);

      const result = await service.findOneById('user-123');

      expect(userRepository.getUserById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'User retrieved successfully',
        data: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.getUserById.mockResolvedValue(null);

      await expect(service.findOneById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneById('non-existent-id')).rejects.toThrow(
        'User Not Found',
      );
      expect(userRepository.getUserById).toHaveBeenCalledWith(
        'non-existent-id',
      );
    });
  });

  describe('findOneByEmail', () => {
    it('should successfully find a user by email', async () => {
      userRepository.getUserByEmail.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail('test@example.com');

      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'User retrieved successfully',
        data: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);

      await expect(
        service.findOneByEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOneByEmail('nonexistent@example.com'),
      ).rejects.toThrow('User Not Found');
      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      username: 'updateduser',
    };

    it('should successfully update a user', async () => {
      const updatedUser = {
        ...mockUserFull,
        username: 'updateduser',
      };
      userRepository.updateUser.mockResolvedValue(updatedUser);

      const result = await service.update('user-123', updateUserDto);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        'user-123',
        updateUserDto,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'User updated successfully',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
        },
      });
    });

    it('should throw BadRequestException if update fails', async () => {
      userRepository.updateUser.mockResolvedValue(null as any);

      await expect(service.update('user-123', updateUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('user-123', updateUserDto)).rejects.toThrow(
        'Failed to update user',
      );
      expect(userRepository.updateUser).toHaveBeenCalledWith(
        'user-123',
        updateUserDto,
      );
    });

    it('should handle repository errors', async () => {
      userRepository.updateUser.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.update('user-123', updateUserDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('remove', () => {
    it('should return a message when removing a user', () => {
      const userId = 1;
      const result = service.remove(userId);
      expect(result).toBe(`This action removes a #${userId} user`);
    });
  });
});
