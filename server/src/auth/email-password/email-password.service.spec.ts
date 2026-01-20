import { Test, TestingModule } from '@nestjs/testing';
import { EmailPasswordService } from './email-password.service';
import { UserRepository } from 'src/users/users.repository';
import { EmailService } from 'src/email/email.service';
import { OtpService } from 'src/otp/otp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common';
import * as encryption from 'src/utils/helper-functions/encryption';

jest.mock('src/utils/helper-functions/encryption');
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mocked-refresh-token'),
  }),
}));

describe('EmailPasswordService', () => {
  let service: EmailPasswordService;
  let userRepository: jest.Mocked<UserRepository>;
  let emailService: jest.Mocked<EmailService>;
  let otpService: jest.Mocked<OtpService>;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isEmailVerified: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailPasswordService,
        {
          provide: UserRepository,
          useValue: {
            getUserByEmail: jest.fn(),
            getUserByEmailForLogin: jest.fn(),
            getUserById: jest.fn(),
            createUser: jest.fn(),
            verifyUser: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
          },
        },
        {
          provide: OtpService,
          useValue: {
            generateOTP: jest.fn(),
            verifyOTP: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            session: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailPasswordService>(EmailPasswordService);
    userRepository = module.get(UserRepository);
    emailService = module.get(EmailService);
    otpService = module.get(OtpService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);
      (encryption.encrypt as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.createUser.mockResolvedValue(mockUser);
      otpService.generateOTP.mockResolvedValue('123456');
      emailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(encryption.encrypt).toHaveBeenCalledWith(registerDto.password);
      expect(userRepository.createUser).toHaveBeenCalledWith(
        registerDto.username,
        registerDto.email,
        'hashed-password',
      );
      expect(otpService.generateOTP).toHaveBeenCalledWith(registerDto.email);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        registerDto.email,
        {
          subject: 'Huddle Validation',
          username: mockUser.username,
          otp: '123456',
        },
      );
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'User registered successfully.',
        data: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
        },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      userRepository.getUserByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      userRepository.getUserByEmail.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should still register user even if OTP generation fails', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);
      (encryption.encrypt as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.createUser.mockResolvedValue(mockUser);
      otpService.generateOTP.mockRejectedValue(new Error('OTP error'));

      const result = await service.register(registerDto);

      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.success).toBe(true);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    beforeEach(() => {
      (prismaService.session.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (prismaService.session.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
        token: 'mocked-refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
      });
    });

    it('should successfully login a verified user', async () => {
      userRepository.getUserByEmailForLogin.mockResolvedValue(mockUser);
      userRepository.getUserById.mockResolvedValue(mockUser);
      (encryption.comparePassword as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('access-token');

      const result = await service.login(loginDto);

      expect(userRepository.getUserByEmailForLogin).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(encryption.comparePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: mockUser.id,
        username: mockUser.username,
      });
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Login successful',
        data: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
        token: 'access-token',
        refreshToken: 'mocked-refresh-token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.getUserByEmailForLogin.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(encryption.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userRepository.getUserByEmailForLogin.mockResolvedValue(mockUser);
      (encryption.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if email is not verified', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      userRepository.getUserByEmailForLogin.mockResolvedValue(unverifiedUser);
      (encryption.comparePassword as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Please verify your email before logging in'),
      );
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      userRepository.getUserByEmailForLogin.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('validateOTP', () => {
    const validateDto = {
      email: 'test@example.com',
      OTP: '123456',
    };

    beforeEach(() => {
      (prismaService.session.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (prismaService.session.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
        token: 'mocked-refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
      });
    });

    it('should successfully validate OTP and verify user', async () => {
      userRepository.getUserByEmail.mockResolvedValue(mockUser);
      userRepository.getUserById.mockResolvedValue(mockUser);
      otpService.verifyOTP.mockResolvedValue(undefined);
      userRepository.verifyUser.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('access-token');

      const result = await service.validateOTP(validateDto);

      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
        validateDto.email,
      );
      expect(otpService.verifyOTP).toHaveBeenCalledWith(
        validateDto.email,
        validateDto.OTP,
      );
      expect(userRepository.verifyUser).toHaveBeenCalledWith(validateDto.email);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: mockUser.id,
        username: mockUser.username,
      });
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'User verified successfully',
        data: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          isVerified: mockUser.isEmailVerified,
        },
        token: 'access-token',
        refreshToken: 'mocked-refresh-token',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);

      await expect(service.validateOTP(validateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(otpService.verifyOTP).not.toHaveBeenCalled();
    });
  });

  describe('resendOTP', () => {
    const resendDto = {
      email: 'test@example.com',
    };

    it('should successfully resend OTP', async () => {
      userRepository.getUserByEmail.mockResolvedValue(mockUser);
      otpService.generateOTP.mockResolvedValue('654321');
      emailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.resendOTP(resendDto);

      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
        resendDto.email,
      );
      expect(otpService.generateOTP).toHaveBeenCalledWith(mockUser.email);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        mockUser.email,
        {
          subject: 'InnkeeperPro validation',
          username: mockUser.username,
          otp: '654321',
        },
      );
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'OTP Send',
      });
    });

    it('should return NOT_FOUND if user does not exist', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);

      const result = await service.resendOTP(resendDto);

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'user not found',
        data: null,
      });
      expect(otpService.generateOTP).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    const refreshToken = 'valid-refresh-token';
    const tokenRecord = {
      id: 'session-123',
      token: refreshToken,
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      revoked: false,
      createdAt: new Date(),
      user: mockUser,
    };

    it('should successfully refresh access token', async () => {
      (prismaService.session.findUnique as jest.Mock).mockResolvedValue(
        tokenRecord,
      );
      (prismaService.session.delete as jest.Mock).mockResolvedValue(
        tokenRecord,
      );
      (prismaService.session.create as jest.Mock).mockResolvedValue({
        ...tokenRecord,
        token: 'new-refresh-token',
      });
      userRepository.getUserById.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refreshAccessToken(refreshToken);

      expect(prismaService.session.findUnique).toHaveBeenCalledWith({
        where: { token: refreshToken },
        include: { user: true },
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: mockUser.id,
        username: mockUser.username,
      });
      expect(prismaService.session.delete).toHaveBeenCalledWith({
        where: { id: tokenRecord.id },
      });
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully',
        token: 'new-access-token',
        refreshToken: 'mocked-refresh-token',
        data: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
      });
    });

    it('should throw UnauthorizedException if token not found', async () => {
      (prismaService.session.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      const expiredTokenRecord = {
        ...tokenRecord,
        expiresAt: new Date(Date.now() - 1000), // expired
      };
      (prismaService.session.findUnique as jest.Mock).mockResolvedValue(
        expiredTokenRecord,
      );
      (prismaService.session.delete as jest.Mock).mockResolvedValue(
        expiredTokenRecord,
      );

      await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Refresh token expired'),
      );
      expect(prismaService.session.delete).toHaveBeenCalledWith({
        where: { id: expiredTokenRecord.id },
      });
    });

    it('should throw UnauthorizedException if token is revoked', async () => {
      const revokedTokenRecord = {
        ...tokenRecord,
        revoked: true,
      };
      (prismaService.session.findUnique as jest.Mock).mockResolvedValue(
        revokedTokenRecord,
      );

      await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Refresh token has been revoked'),
      );
    });
  });

  describe('revokeRefreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const tokenRecord = {
      id: 'session-123',
      token: refreshToken,
      userId: mockUser.id,
      expiresAt: new Date(),
      revoked: false,
      createdAt: new Date(),
    };

    it('should successfully revoke a refresh token', async () => {
      (prismaService.session.findUnique as jest.Mock).mockResolvedValue(
        tokenRecord,
      );
      (prismaService.session.update as jest.Mock).mockResolvedValue({
        ...tokenRecord,
        revoked: true,
      });

      const result = await service.revokeRefreshToken(refreshToken);

      expect(prismaService.session.findUnique).toHaveBeenCalledWith({
        where: { token: refreshToken },
      });
      expect(prismaService.session.update).toHaveBeenCalledWith({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Refresh token revoked successfully',
      });
    });

    it('should return NOT_FOUND if token does not exist', async () => {
      (prismaService.session.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.revokeRefreshToken(refreshToken);

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Refresh token not found',
      });
      expect(prismaService.session.update).not.toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      (prismaService.session.findUnique as jest.Mock).mockResolvedValue(
        tokenRecord,
      );
      (prismaService.session.update as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.revokeRefreshToken(refreshToken)).rejects.toThrow(
        'Failed to revoke refresh token',
      );
    });
  });
});
