import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './users.repository';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUserRepository = {
    getUserById: jest.fn(),
    getUserByEmail: jest.fn(),
    updateUser: jest.fn(),
    createUser: jest.fn(),
    createUserOauth: jest.fn(),
    getUserByEmailForLogin: jest.fn(),
    verifyUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
