import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type SessionMode = 'timer' | 'stopwatch';

@Entity('sessions')
@Index(['userId', 'startedAt'])
@Check(`"mode" IN ('timer', 'stopwatch')`)
@Check(`"ended_at" >= "started_at"`)
@Check(`"ended_at" <= "started_at" + interval '25 hours'`)
@Check(`"focused_ms" >= 0`)
export class Session {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 10 })
  mode: SessionMode;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz' })
  endedAt: Date;

  @Column({ type: 'date' })
  day: string;

  @Column({ name: 'focused_ms', type: 'integer' })
  focusedMs: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
