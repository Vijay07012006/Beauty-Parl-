import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// Simple distributed lock for cron jobs (CRON-2): each job acquires a row with
// a short lease; a second instance sees an unexpired lease and skips the run.
@Entity('cron_locks')
export class CronLock {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  name!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
