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
// ✅ Class property names (camelCase) must be used in indexes.
@Index(['session', 'pauseStart'])
export class SessionPause {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TimerSession, (session) => session.pauses, { onDelete: 'CASCADE' })
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
