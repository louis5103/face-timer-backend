import { Exclude, Expose } from 'class-transformer';
import { UserStatus } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  avatar: string;

  @Expose()
  timezone: string;

  @Expose()
  settings: Record<string, any>;

  @Expose()
  status: UserStatus;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
