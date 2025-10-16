import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tasks')
@Index(['user_id', 'is_active'])
@Index(['user_id', 'last_used'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 100, nullable: true })
  icon: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'total_time', type: 'bigint', default: 0 })
  totalTime: number;

  @Column({ name: 'last_used', type: 'timestamp', nullable: true })
  lastUsed: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations (will be activated later)
  // @OneToMany(() => TimerSession, (session) => session.task)
  // timerSessions: TimerSession[];
}
