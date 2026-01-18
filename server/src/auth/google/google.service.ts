import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from 'src/users/users.repository';
import { EmailPasswordService } from '../email-password/email-password.service';

@Injectable()
export class GoogleService {
  constructor(
    private userRepository: UserRepository,
    private authService: EmailPasswordService,
  ) {}

  async validateOAuthGoogleLogin(req): Promise<any> {
    if (!req || !req.user) {
      console.log('Google login failed:', req);
      throw new UnauthorizedException('No user from Google');
    }

    const auth = {
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
    };

    let user = await this.userRepository.getUserByEmail(auth.email);

    if (!user) {
      let username = `${auth.firstName}${auth.lastName}`;
      user = await this.userRepository.createUserOauth(username, auth.email);

      await Promise.all([this.userRepository.verifyUser(user.email)]);
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.authService.generateAuthToken(user.id),
      this.authService.generateRefreshToken(user.id),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Google Auth Successful',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
      token: accessToken,
      refreshToken: refreshToken,
    };
  }
}
