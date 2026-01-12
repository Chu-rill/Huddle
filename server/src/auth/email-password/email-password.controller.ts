import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UsePipes,
} from '@nestjs/common';
import { EmailPasswordService } from './email-password.service';
import {
  LoginSchema,
  SignupSchema,
  type LoginDto,
  type SignupDto,
} from './validation';
import { ZodPipe } from 'src/utils/schema-validation/validation.pipe';

@Controller('auth/email-password')
export class EmailPasswordController {
  constructor(private readonly emailPasswordService: EmailPasswordService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodPipe(SignupSchema))
  async register(@Body() registerDto: SignupDto) {
    return this.emailPasswordService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodPipe(LoginSchema))
  async login(@Body() loginDto: LoginDto) {
    return this.emailPasswordService.login(loginDto);
  }
}
