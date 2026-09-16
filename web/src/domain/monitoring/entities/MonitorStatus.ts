export interface MonitorStatus {
  intervalMinutes: number;
  running: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}
