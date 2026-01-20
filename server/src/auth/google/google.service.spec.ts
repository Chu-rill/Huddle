import { Test, TestingModule } from '@nestjs/testing';
import { GoogleService } from './google.service';
import { UserRepository } from 'src/users/users.repository';
import { EmailPasswordService } from '../email-password/email-password.service';

describe('GoogleService', () => {
  let service: GoogleService;
  let userRepository: jest.Mocked<UserRepository>;
  let emailPasswordService: jest.Mocked<EmailPasswordService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleService,
        {
          provide: UserRepository,
          useValue: {
            getUserByEmail: jest.fn(),
            createUserOauth: jest.fn(),
            verifyUser: jest.fn(),
          },
        },
        {
          provide: EmailPasswordService,
          useValue: {
            generateAuthToken: jest.fn(),
            generateRefreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GoogleService>(GoogleService);
    userRepository = module.get(UserRepository);
    emailPasswordService = module.get(EmailPasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
