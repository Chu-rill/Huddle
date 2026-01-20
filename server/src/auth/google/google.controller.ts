import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { GoogleService } from './google.service';
import { GoogleGuard } from 'src/guard/google.guard';

@Controller('oauth')
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth(@Req() req) {
    // This triggers the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.googleService.validateOAuthGoogleLogin(req);

    return res.json(result);
  }
}
