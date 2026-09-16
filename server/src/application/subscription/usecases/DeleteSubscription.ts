import type { SubscriptionRepository } from '../../../domain/subscription/repositories/SubscriptionRepository.js';
import { NotFoundError } from '../../../shared/errors.js';

export class DeleteSubscription {
  constructor(private readonly subscriptions: SubscriptionRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.subscriptions.delete(id);
    if (!deleted) throw new NotFoundError('Abonnement introuvable.');
  }
}
