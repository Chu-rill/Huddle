import { Test, TestingModule } from '@nestjs/testing';
import { EmailPasswordController } from './email-password.controller';
import { EmailPasswordService } from './email-password.service';

describe('EmailPasswordController', () => {
  let controller: EmailPasswordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailPasswordController],
      providers: [EmailPasswordService],
    }).compile();

    controller = module.get<EmailPasswordController>(EmailPasswordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
