import type { MonitorStatus } from '@/domain/monitoring/entities/MonitorStatus';
import { httpRequest } from '@/infrastructure/http/httpClient';

export const monitoringApi = {
  getStatus: () => httpRequest<MonitorStatus>('/status'),
  triggerCheck: () => httpRequest<MonitorStatus>('/check', { method: 'POST' }),
};
