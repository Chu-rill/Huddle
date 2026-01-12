import { Module } from '@nestjs/common';
import { EmailPasswordService } from './email-password.service';
import { EmailPasswordController } from './email-password.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2h' },
    }),
  ],
  controllers: [EmailPasswordController],
  providers: [EmailPasswordService],
})
export class EmailPasswordModule {}
