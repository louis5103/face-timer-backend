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
import { Task } from '../../tasks/entities/task.entity';
import { SessionPause } from './session-pause.entity';

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('timer_sessions')
// ✅ Class property names (camelCase) must be used in indexes.
@Index(['user', 'status'])
@Index(['task', 'startTime'])
@Index(['user', 'startTime'])
export class TimerSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Task, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'task_id' })
  task: Task | null;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date | null;

  @Column({ type: 'integer', default: 0 })
  duration: number;

  @Column({ name: 'pause_count', type: 'integer', default: 0 })
  pauseCount: number;

  @Column({ name: 'total_pause_time', type: 'integer', default: 0 })
  totalPauseTime: number;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @Column({ name: 'face_stats_summary', type: 'jsonb', nullable: true })
  faceStatsSummary: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SessionPause, (pause) => pause.session)
  pauses: SessionPause[];

  // Helper method to calculate effective duration (excluding pause time)
  getEffectiveDuration(): number {
    return this.duration - this.totalPauseTime;
  }

  // Helper method to check if session is active
  isActive(): boolean {
    return this.status === SessionStatus.ACTIVE;
  }

  // Helper method to check if session can be paused
  canBePaused(): boolean {
    return this.status === SessionStatus.ACTIVE;
  }

  // Helper method to check if session can be resumed
  canBeResumed(): boolean {
    return this.status === SessionStatus.PAUSED;
  }
}
