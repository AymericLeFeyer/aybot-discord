import type { MonitorRepository } from '@/domain/monitoring/repositories/MonitorRepository';
import { monitoringApi } from '../api/monitoringApi';

export class HttpMonitorRepository implements MonitorRepository {
  getStatus = monitoringApi.getStatus;
  triggerCheck = monitoringApi.triggerCheck;
}
