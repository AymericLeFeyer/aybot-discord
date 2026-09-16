import type { MonitorStatus } from '../entities/MonitorStatus';

export interface MonitorRepository {
  getStatus(): Promise<MonitorStatus>;
  /** Lance immédiatement une vérification de toutes les chaînes. */
  triggerCheck(): Promise<MonitorStatus>;
}
