import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return a message when creating a user', () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = service.create(createUserDto);
      expect(result).toBe('This action adds a new user');
    });
  });

  describe('findAll', () => {
    it('should return a message for finding all users', () => {
      const result = service.findAll();
      expect(result).toBe('This action returns all users');
    });
  });

  describe('findOne', () => {
    it('should return a message for finding a specific user', () => {
      const userId = 1;
      const result = service.findOne(userId);
      expect(result).toBe(`This action returns a #${userId} user`);
    });
  });

  describe('update', () => {
    it('should return a message when updating a user', () => {
      const userId = 1;
      const updateUserDto: UpdateUserDto = {
        username: 'updateduser',
      };

      const result = service.update(userId, updateUserDto);
      expect(result).toBe(`This action updates a #${userId} user`);
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
