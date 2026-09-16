import type { SubscriptionRepository } from '@/domain/subscription/repositories/SubscriptionRepository';
import { subscriptionApi } from '../api/subscriptionApi';

export class HttpSubscriptionRepository implements SubscriptionRepository {
  list = subscriptionApi.list;
  create = subscriptionApi.create;
  update = subscriptionApi.update;
  remove = subscriptionApi.remove;
  sendTest = subscriptionApi.sendTest;
}
