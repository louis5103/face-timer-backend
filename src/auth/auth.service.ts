import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto, RefreshTokenDto } from './dto';
import { AuthResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // UsersService handles password hashing and email uniqueness check
    const user = await this.usersService.create(registerDto);

    // Generate tokens
    return this.generateAuthResponse(user.id, user.email);
  }

  /**
   * Login user (called by LocalStrategy after validation)
   */
  async login(user: User): Promise<AuthResponseDto> {
    return this.generateAuthResponse(user.id, user.email);
  }

  async refreshAccessToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshResponseDto> {
    // Find refresh token
    const refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenDto.refreshToken },
      relations: ['user'],
    });

    if (!refreshTokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is valid
    if (!refreshTokenEntity.isValid()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Revoke old refresh token
    refreshTokenEntity.isRevoked = true;
    await this.refreshTokenRepository.save(refreshTokenEntity);

    // Generate new tokens
    return this.generateAuthResponse(
      refreshTokenEntity.user.id,
      refreshTokenEntity.user.email,
    );
  }

  async logout(userId: string): Promise<void> {
    await this.revokeAllUserTokens(userId);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });

    if (refreshToken) {
      refreshToken.isRevoked = true;
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private async generateAuthResponse(
    userId: string,
    email: string,
  ): Promise<AuthResponseDto> {
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = await this.generateRefreshToken(userId);
    const user = await this.usersService.findOne(userId);

    const expiresIn =
      parseInt(this.configService.get<string>('JWT_EXPIRATION') || '3600', 10);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        timezone: user.timezone,
        settings: user.settings,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      expiresIn,
    };
  }

  private generateAccessToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  private async generateRefreshToken(userId: string): Promise<RefreshToken> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresIn =
      parseInt(
        this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '604800',
        10,
      ) * 1000;
    const expiresAt = new Date(Date.now() + expiresIn);

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token,
      expiresAt,
    });

    return await this.refreshTokenRepository.save(refreshToken);
  }

  async validateUser(userId: string): Promise<any> {
    return await this.usersService.findOne(userId);
  }
}
