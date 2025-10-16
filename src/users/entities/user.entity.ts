import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
@Index(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true, length: 500 })
  avatar: string;

  @Column({ default: 'UTC', length: 50 })
  timezone: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  settings: Record<string, any>;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations will be added later
  // @OneToMany(() => Task, (task) => task.user)
  // tasks: Task[];

  // @OneToMany(() => TimerSession, (session) => session.user)
  // timerSessions: TimerSession[];

  // @OneToMany(() => RefreshToken, (token) => token.user)
  // refreshTokens: RefreshToken[];
}
