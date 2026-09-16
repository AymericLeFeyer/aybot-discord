import type {
  CreateSubscriptionInput,
  Subscription,
  UpdateSubscriptionInput,
} from '@/domain/subscription/entities/Subscription';
import type { SubscriptionRepository } from '@/domain/subscription/repositories/SubscriptionRepository';
import { isDiscordWebhookUrl } from '@/domain/subscription/services/message';
import { ValidationError } from '@/shared/errors';

export class ListSubscriptions {
  constructor(private readonly repository: SubscriptionRepository) {}

  execute(): Promise<Subscription[]> {
    return this.repository.list();
  }
}

export class CreateSubscription {
  constructor(private readonly repository: SubscriptionRepository) {}

  execute(input: CreateSubscriptionInput): Promise<Subscription> {
    if (!input.channel.trim()) throw new ValidationError('Indique une chaîne YouTube.');
    if (!isDiscordWebhookUrl(input.webhookUrl)) {
      throw new ValidationError('URL de webhook Discord invalide.');
    }
    if (!input.message.trim()) throw new ValidationError('Le message est obligatoire.');
    return this.repository.create(input);
  }
}

export class UpdateSubscription {
  constructor(private readonly repository: SubscriptionRepository) {}

  execute(id: string, input: UpdateSubscriptionInput): Promise<Subscription> {
    if (input.webhookUrl !== undefined && !isDiscordWebhookUrl(input.webhookUrl)) {
      throw new ValidationError('URL de webhook Discord invalide.');
    }
    if (input.message !== undefined && !input.message.trim()) {
      throw new ValidationError('Le message est obligatoire.');
    }
    return this.repository.update(id, input);
  }
}

export class DeleteSubscription {
  constructor(private readonly repository: SubscriptionRepository) {}

  execute(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}

export class SendTestNotification {
  constructor(private readonly repository: SubscriptionRepository) {}

  execute(id: string): Promise<void> {
    return this.repository.sendTest(id);
  }
}
