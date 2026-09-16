import { BellRingIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateSubscriptionInput } from '@/domain/subscription/entities/Subscription';
import { MonitorStatusBar } from '@/presentation/components/MonitorStatusBar';
import { SubscriptionCard } from '@/presentation/components/SubscriptionCard';
import { SubscriptionForm } from '@/presentation/components/SubscriptionForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card';
import { useMonitorStatus } from '@/presentation/hooks/useMonitorStatus';
import { useNow } from '@/presentation/hooks/useNow';
import { useSubscriptions } from '@/presentation/hooks/useSubscriptions';
import { errorMessage } from '@/shared/errors';

export function HomePage() {
  const { subscriptions, loading, error, refresh, create, update, remove, sendTest } =
    useSubscriptions();
  const monitor = useMonitorStatus();
  const now = useNow();

  const handleCreate = async (input: CreateSubscriptionInput) => {
    const created = await create(input);
    toast.success(`${created.channelName} est maintenant suivie`);
  };

  const handleCheck = async () => {
    try {
      await monitor.triggerCheck();
      await refresh();
      toast.success('Vérification terminée');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-red-600 text-white">
            <BellRingIcon className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold">AyBot</h1>
            <p className="text-sm text-muted-foreground">
              Nouvelles vidéos YouTube publiées sur Discord
            </p>
          </div>
        </div>
        <MonitorStatusBar
          status={monitor.status}
          checking={monitor.checking}
          now={now}
          onCheck={handleCheck}
        />
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Suivre une chaîne</CardTitle>
            <CardDescription>
              Les vidéos déjà en ligne ne sont pas notifiées, seulement les prochaines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionForm submitLabel="Ajouter" onSubmit={handleCreate} />
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Chaînes suivies {!loading && `(${subscriptions.length})`}
          </h2>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" /> Chargement…
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {!loading && !error && subscriptions.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Aucune chaîne suivie pour l’instant. Ajoute ta première chaîne avec le formulaire.
            </div>
          )}

          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              now={now}
              onUpdate={update}
              onRemove={remove}
              onSendTest={sendTest}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
