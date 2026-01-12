import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import {
  comparePassword,
  encrypt,
} from 'src/utils/helper-functions/encryption';

import { UserRepository } from 'src/users/users.repository';
import { LoginDto, SignupDto } from './validation';

@Injectable()
export class EmailPasswordService {
  private readonly logger = new Logger(EmailPasswordService.name);

  constructor(
    private readonly userRepository: UserRepository,
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
      const user = await this.userRepository.getUserByEmail(email);

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
        // token: accessToken,
        // refreshToken: refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Login failed for email ${email}:`, error.stack);
      throw new InternalServerErrorException('Login failed');
    }
  }
}
