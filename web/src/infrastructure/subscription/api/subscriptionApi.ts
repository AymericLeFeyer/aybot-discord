import type {
  CreateSubscriptionInput,
  Subscription,
  UpdateSubscriptionInput,
} from '@/domain/subscription/entities/Subscription';
import { httpRequest } from '@/infrastructure/http/httpClient';

export const subscriptionApi = {
  list: () => httpRequest<Subscription[]>('/subscriptions'),
  create: (input: CreateSubscriptionInput) =>
    httpRequest<Subscription>('/subscriptions', { method: 'POST', body: input }),
  update: (id: string, input: UpdateSubscriptionInput) =>
    httpRequest<Subscription>(`/subscriptions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    }),
  remove: (id: string) =>
    httpRequest<void>(`/subscriptions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  sendTest: (id: string) =>
    httpRequest<void>(`/subscriptions/${encodeURIComponent(id)}/test`, { method: 'POST' }),
};
