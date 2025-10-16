import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TimerSession } from './timer-session.entity';

@Entity('session_pauses')
@Index(['session_id', 'pause_start'])
export class SessionPause {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @ManyToOne(() => TimerSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: TimerSession;

  @Column({ name: 'pause_start', type: 'timestamp' })
  pauseStart: Date;

  @Column({ name: 'pause_end', type: 'timestamp', nullable: true })
  pauseEnd: Date | null;

  @Column({ type: 'integer', nullable: true })
  duration: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Helper method to check if pause is still active
  isActive(): boolean {
    return this.pauseEnd === null;
  }

  // Helper method to calculate duration
  calculateDuration(): number {
    if (!this.pauseEnd) {
      return 0;
    }
    return Math.floor(
      (this.pauseEnd.getTime() - this.pauseStart.getTime()) / 1000,
    );
  }
}
