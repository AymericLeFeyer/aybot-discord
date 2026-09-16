import type { MonitorStatus } from '@/domain/monitoring/entities/MonitorStatus';
import type { MonitorRepository } from '@/domain/monitoring/repositories/MonitorRepository';

export class GetMonitorStatus {
  constructor(private readonly repository: MonitorRepository) {}

  execute(): Promise<MonitorStatus> {
    return this.repository.getStatus();
  }
}

export class TriggerCheck {
  constructor(private readonly repository: MonitorRepository) {}

  execute(): Promise<MonitorStatus> {
    return this.repository.triggerCheck();
  }
}
