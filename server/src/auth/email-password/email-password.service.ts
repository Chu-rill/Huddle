import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import {
  comparePassword,
  encrypt,
} from 'src/utils/helper-functions/encryption';

import { UserRepository } from 'src/users/users.repository';
import { CreateOTPDto, LoginDto, ResendOTPDto, SignupDto } from './validation';
import { EmailService } from 'src/email/email.service';
import { OtpService } from 'src/otp/otp.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmailPasswordService {
  private readonly logger = new Logger(EmailPasswordService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: SignupDto) {
    const { username, email, password } = registerDto;
    this.logger.log(`Starting registration for email: ${email}`);

    try {
      // Check if user already exists
      this.logger.debug(`Checking if user exists with email: ${email}`);
      const existingUser = await this.userRepository.getUserByEmail(email);

      if (existingUser) {
        this.logger.warn(
          `Registration failed: User already exists with email: ${email}`,
        );
        throw new ConflictException('User already exists');
      }

      // Hash password
      this.logger.debug('Hashing password');
      const hashedPassword = await encrypt(password.trim());

      // Create user
      this.logger.debug(
        `Creating user with username: ${username}, email: ${email}`,
      );
      const user = await this.userRepository.createUser(
        username,
        email,
        hashedPassword,
      );

      this.logger.log(`User created successfully with ID: ${user.id}`);

      // Generate and send OTP
      try {
        this.logger.debug(
          `Generating OTP for email verification for: ${email}`,
        );
        const otp = await this.otpService.generateOTP(email);
        const data = {
          subject: 'Huddle Validation',
          username: user.username || 'User',
          otp: otp,
        };
        await this.emailService.sendWelcomeEmail(email, data);
      } catch (error) {
        this.logger.error(`Failed to generate OTP for email ${email}:`, error);
      }

      this.logger.log(
        `Registration completed successfully for user: ${user.id}`,
      );
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'User registered successfully.',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`Registration failed for email ${email}:`, error.stack);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    this.logger.log(`Login attempt for email: ${email}`);

    try {
      // Find user
      this.logger.debug(`Looking up user with email: ${email}`);
      const user = await this.userRepository.getUserByEmailForLogin(email);

      if (!user) {
        this.logger.warn(`Login failed: User not found with email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check password
      this.logger.debug(`Verifying password for user: ${user.id}`);
      const isPasswordValid = await comparePassword(
        password.trim(),
        user.password!,
      );

      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for user: ${user.id}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isEmailVerified) {
        this.logger.warn(
          `Login failed: Email not verified for user: ${user.id}`,
        );
        throw new UnauthorizedException(
          'Please verify your email before logging in',
        );
      }

      const accessToken = await this.generateAuthToken(user.id);
      // Generate refresh token
      await this.cleanupOldRefreshTokens(user.id);
      const refreshToken = await this.generateRefreshToken(user.id);

      this.logger.log(`Login successful for user: ${user.id}`);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token: accessToken,
        refreshToken: refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Login failed for email ${email}:`, error.stack);
      throw new InternalServerErrorException('Login failed');
    }
  }

  async validateOTP(dto: CreateOTPDto) {
    const user = await this.userRepository.getUserByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate OTP
    await this.otpService.verifyOTP(dto.email, dto.OTP);

    // Mark user as verified
    await this.userRepository.verifyUser(dto.email);

    const token = await this.generateAuthToken(user.id);

    // Generate refresh token
    await this.cleanupOldRefreshTokens(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'User verified successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isEmailVerified,
      },
      token: token,
      refreshToken: refreshToken,
    };
  }

  async resendOTP(dto: ResendOTPDto) {
    const user = await this.userRepository.getUserByEmail(dto.email);
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'user not found',
        data: null,
      };
    }

    const otp = await this.otpService.generateOTP(user.email);

    const data = {
      subject: 'InnkeeperPro validation',
      username: user.username || 'User',
      otp: otp,
    };

    await this.emailService.sendWelcomeEmail(user.email, data);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'OTP Send',
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Find the refresh token in database
      const tokenRecord = await this.prisma.session.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        // Delete expired token
        await this.prisma.session.delete({
          where: { id: tokenRecord.id },
        });
        throw new UnauthorizedException('Refresh token expired');
      }

      // Check if token is revoked
      if (tokenRecord.revoked) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const newAccessToken = await this.generateAuthToken(tokenRecord.user.id);

      // Optionally rotate refresh token for enhanced security
      // Delete old refresh token and create new one
      await this.prisma.session.delete({
        where: { id: tokenRecord.id },
      });

      const newRefreshToken = await this.generateRefreshToken(
        tokenRecord.user.id,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully',
        token: newAccessToken,
        refreshToken: newRefreshToken,
        data: {
          id: tokenRecord.user.id,
          username: tokenRecord.user.username,
          email: tokenRecord.user.email,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.log('Error refreshing token:', error);
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  async revokeRefreshToken(refreshToken: string) {
    try {
      const tokenRecord = await this.prisma.session.findUnique({
        where: { token: refreshToken },
      });

      if (!tokenRecord) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Refresh token not found',
        };
      }

      await this.prisma.session.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Refresh token revoked successfully',
      };
    } catch (error) {
      console.log('Error revoking token:', error);
      throw new Error('Failed to revoke refresh token');
    }
  }

  // Helper method to generate refresh token
  async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    await this.prisma.session.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return refreshToken;
  }

  // Helper method to generate auth token
  async generateAuthToken(userId: string): Promise<string> {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const payload = {
      id: user.id,
      username: user.username,
    };
    return this.jwtService.signAsync(payload);
  }

  // Helper method to clean up old refresh tokens for a user
  private async cleanupOldRefreshTokens(userId: string): Promise<void> {
    // Remove expired tokens
    await this.prisma.session.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Keep only the 5 most recent tokens per user
    const tokens = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: 5,
    });

    if (tokens.length > 0) {
      await this.prisma.session.deleteMany({
        where: {
          id: {
            in: tokens.map((t) => t.id),
          },
        },
      });
    }
  }
}
