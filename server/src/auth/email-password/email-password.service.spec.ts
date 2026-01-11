import { Test, TestingModule } from '@nestjs/testing';
import { EmailPasswordService } from './email-password.service';

describe('EmailPasswordService', () => {
  let service: EmailPasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailPasswordService],
    }).compile();

    service = module.get<EmailPasswordService>(EmailPasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
