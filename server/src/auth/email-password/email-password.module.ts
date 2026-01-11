import { Module } from '@nestjs/common';
import { EmailPasswordService } from './email-password.service';
import { EmailPasswordController } from './email-password.controller';

@Module({
  controllers: [EmailPasswordController],
  providers: [EmailPasswordService],
})
export class EmailPasswordModule {}
