import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { OtpRepository } from './otp.repository';

describe('OtpService', () => {
  let service: OtpService;

  const mockOtpRepository = {
    createOTP: jest.fn(),
    getOTPDetails: jest.fn(),
    deleteOTP: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: OtpRepository,
          useValue: mockOtpRepository,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
