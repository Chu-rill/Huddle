import { Module } from '@nestjs/common';
import { EmailPasswordService } from './email-password.service';
import { EmailPasswordController } from './email-password.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailModule } from 'src/email/email.module';
import { OtpModule } from 'src/otp/otp.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '2h' },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    OtpModule,
  ],
  controllers: [EmailPasswordController],
  providers: [EmailPasswordService],
})
export class EmailPasswordModule {}
