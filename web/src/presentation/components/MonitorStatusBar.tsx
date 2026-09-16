import { Loader2Icon, RefreshCwIcon } from 'lucide-react';
import type { MonitorStatus } from '@/domain/monitoring/entities/MonitorStatus';
import { Button } from '@/presentation/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { formatRelative } from '@/shared/utils/formatDate';

interface MonitorStatusBarProps {
  status: MonitorStatus | null;
  checking: boolean;
  now: number;
  onCheck: () => void;
}

export function MonitorStatusBar({ status, checking, now, onCheck }: MonitorStatusBarProps) {
  const online = status !== null;
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn('size-2 rounded-full', online ? 'bg-emerald-500' : 'bg-destructive')}
          aria-hidden
        />
        {online ? `Vérification toutes les ${status.intervalMinutes} min` : 'Serveur hors ligne'}
      </span>
      {online && (
        <span>
          Dernière {formatRelative(status.lastRunAt, now)}
          {status.nextRunAt && ` · prochaine ${formatRelative(status.nextRunAt, now)}`}
        </span>
      )}
      <Button variant="outline" size="sm" onClick={onCheck} disabled={!online || checking}>
        {checking ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
        Vérifier maintenant
      </Button>
    </div>
  );
}
