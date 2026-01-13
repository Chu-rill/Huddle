import { Module } from '@nestjs/common';
import { EmailPasswordService } from './email-password.service';
import { EmailPasswordController } from './email-password.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from 'src/email/email.module';
import { OtpModule } from 'src/otp/otp.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2h' },
    }),
    EmailModule,
    OtpModule,
  ],
  controllers: [EmailPasswordController],
  providers: [EmailPasswordService],
})
export class EmailPasswordModule {}
