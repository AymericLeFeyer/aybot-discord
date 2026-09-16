import type { Subscription } from '../../../domain/subscription/entities/Subscription.js';
import type { SubscriptionRepository } from '../../../domain/subscription/repositories/SubscriptionRepository.js';
import { isDiscordWebhookUrl } from '../../../domain/subscription/services/webhookUrl.js';
import { NotFoundError, ValidationError } from '../../../shared/errors.js';

export interface UpdateSubscriptionInput {
  webhookUrl?: string;
  message?: string;
  enabled?: boolean;
  includeShorts?: boolean;
}

export class UpdateSubscription {
  constructor(private readonly subscriptions: SubscriptionRepository) {}

  async execute(id: string, input: UpdateSubscriptionInput): Promise<Subscription> {
    if (input.webhookUrl !== undefined && !isDiscordWebhookUrl(input.webhookUrl)) {
      throw new ValidationError('URL de webhook Discord invalide.');
    }
    const updated = await this.subscriptions.update(id, (current) => ({
      ...current,
      webhookUrl: input.webhookUrl?.trim() ?? current.webhookUrl,
      message: input.message ?? current.message,
      enabled: input.enabled ?? current.enabled,
      includeShorts: input.includeShorts ?? current.includeShorts,
      updatedAt: new Date().toISOString(),
    }));
    if (!updated) throw new NotFoundError('Abonnement introuvable.');
    return updated;
  }
}
