import type { Subscription } from '../../../domain/subscription/entities/Subscription.js';
import type { SubscriptionRepository } from '../../../domain/subscription/repositories/SubscriptionRepository.js';

export class ListSubscriptions {
  constructor(private readonly subscriptions: SubscriptionRepository) {}

  async execute(): Promise<Subscription[]> {
    const all = await this.subscriptions.findAll();
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
