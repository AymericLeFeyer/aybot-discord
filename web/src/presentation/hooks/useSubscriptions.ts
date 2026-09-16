import { useCallback, useEffect, useState } from 'react';
import type {
  CreateSubscriptionInput,
  Subscription,
  UpdateSubscriptionInput,
} from '@/domain/subscription/entities/Subscription';
import { useCases } from '@/infrastructure/container';
import { errorMessage } from '@/shared/errors';

const REFRESH_INTERVAL_MS = 30_000;

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSubscriptions(await useCases.listSubscriptions.execute());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
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

  const replace = (updated: Subscription) =>
    setSubscriptions((current) => current.map((s) => (s.id === updated.id ? updated : s)));

  const create = async (input: CreateSubscriptionInput) => {
    const created = await useCases.createSubscription.execute(input);
    setSubscriptions((current) => [created, ...current]);
    return created;
  };

  const update = async (id: string, input: UpdateSubscriptionInput) => {
    const updated = await useCases.updateSubscription.execute(id, input);
    replace(updated);
    return updated;
  };

  const remove = async (id: string) => {
    await useCases.deleteSubscription.execute(id);
    setSubscriptions((current) => current.filter((s) => s.id !== id));
  };

  const sendTest = (id: string) => useCases.sendTestNotification.execute(id);

  return { subscriptions, loading, error, refresh, create, update, remove, sendTest };
}
