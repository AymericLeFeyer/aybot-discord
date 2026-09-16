import { useCallback, useEffect, useState } from 'react';
import type { MonitorStatus } from '@/domain/monitoring/entities/MonitorStatus';
import { useCases } from '@/infrastructure/container';

const REFRESH_INTERVAL_MS = 30_000;

export function useMonitorStatus() {
  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await useCases.getMonitorStatus.execute());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    const load = () => void refresh();
    const initial = setTimeout(load, 0);
    const timer = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [refresh]);

  const triggerCheck = async () => {
    setChecking(true);
    try {
      setStatus(await useCases.triggerCheck.execute());
    } finally {
      setChecking(false);
    }
  };

  return { status, checking, triggerCheck };
}
