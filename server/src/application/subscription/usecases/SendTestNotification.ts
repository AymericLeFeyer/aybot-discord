import type { NotificationGateway } from '../../../domain/notification/repositories/NotificationGateway.js';
import type { SubscriptionRepository } from '../../../domain/subscription/repositories/SubscriptionRepository.js';
import { renderMessage } from '../../../domain/subscription/services/messageTemplate.js';
import type { YoutubeGateway } from '../../../domain/youtube/repositories/YoutubeGateway.js';
import { NotFoundError, ValidationError } from '../../../shared/errors.js';

/** Envoie le message personnalisé avec la dernière vidéo de la chaîne, pour vérifier le rendu. */
export class SendTestNotification {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly youtube: YoutubeGateway,
    private readonly notifier: NotificationGateway,
  ) {}

  async execute(id: string): Promise<void> {
    const subscription = await this.subscriptions.findById(id);
    if (!subscription) throw new NotFoundError('Abonnement introuvable.');

    const feed = await this.youtube.getChannelFeed(subscription.channelId);
    const video = feed.videos[0];
    if (!video) throw new ValidationError("Cette chaîne n'a aucune vidéo publique à envoyer.");

    await this.notifier.send(subscription.webhookUrl, {
      content: renderMessage(subscription.message, video),
    });
  }
}
