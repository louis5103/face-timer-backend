import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
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
    const user = await this.usersService.create(registerDto);
    return this.generateAuthResponse(user.id, user.email);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password, // Pass the hashed password from the user entity
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user.id, user.email);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password, // Pass the hashed password from the user entity
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async refreshAccessToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshResponseDto> {
    const refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenDto.refreshToken },
      relations: ['user'],
    });

    if (!refreshTokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!refreshTokenEntity.isValid()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    refreshTokenEntity.isRevoked = true;
    await this.refreshTokenRepository.save(refreshTokenEntity);

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
      {
        user: { id: userId },
        isRevoked: false,
      },
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

    const expiresIn = parseInt(
      this.configService.get<string>('JWT_EXPIRATION') || '3600',
      10,
    );

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: user,
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

    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const refreshToken = this.refreshTokenRepository.create({
      user: user,
      token,
      expiresAt,
    });

    return await this.refreshTokenRepository.save(refreshToken);
  }

  async validateUserById(userId: string): Promise<any> {
    return await this.usersService.findOne(userId);
  }
}
