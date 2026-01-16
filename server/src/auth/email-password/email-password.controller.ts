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
  CreateOTPDto,
  LoginSchema,
  otp,
  resendOtp,
  ResendOTPDto,
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

  @Post('/validateOTP')
  @UsePipes(new ZodPipe(otp))
  ValidateOTP(@Body() dto: CreateOTPDto) {
    return this.emailPasswordService.validateOTP(dto);
  }

  @Post('/resendOTP')
  @UsePipes(new ZodPipe(resendOtp))
  resendOTP(@Body() dto: ResendOTPDto) {
    return this.emailPasswordService.resendOTP(dto);
  }

  @Post('/refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.emailPasswordService.refreshAccessToken(refreshToken);
  }

  @Post('/revoke')
  async revokeToken(@Body('refreshToken') refreshToken: string) {
    return this.emailPasswordService.revokeRefreshToken(refreshToken);
  }
}
