import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface JwtRefreshPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') ||
        configService.get<string>('JWT_SECRET') ||
        'default-secret-key',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    const refreshToken = req.body.refreshToken as string;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    return { ...payload, refreshToken };
  }
}
