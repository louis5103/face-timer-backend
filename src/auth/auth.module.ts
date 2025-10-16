import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersModule } from '../users/users.module';
import { JwtStrategy, JwtRefreshStrategy, LocalStrategy } from './strategies';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
        signOptions: {
          // Parse the environment variable as a number (base 10)
          expiresIn: +configService.get<number>('JWT_EXPIRATION') || 900,
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ConfigModule,
  ],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
