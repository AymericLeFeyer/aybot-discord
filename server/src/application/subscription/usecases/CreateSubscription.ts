import { randomUUID } from 'node:crypto';
import type { Subscription } from '../../../domain/subscription/entities/Subscription.js';
import type { SubscriptionRepository } from '../../../domain/subscription/repositories/SubscriptionRepository.js';
import { mergeKnownVideoIds } from '../../../domain/subscription/services/detectNewVideos.js';
import { isDiscordWebhookUrl } from '../../../domain/subscription/services/webhookUrl.js';
import type { YoutubeGateway } from '../../../domain/youtube/repositories/YoutubeGateway.js';
import { parseChannelReference } from '../../../domain/youtube/services/parseChannelReference.js';
import { ValidationError } from '../../../shared/errors.js';
import { toVideoSnapshot } from './toVideoSnapshot.js';

export interface CreateSubscriptionInput {
  channel: string;
  webhookUrl: string;
  message: string;
  includeShorts: boolean;
}

export class CreateSubscription {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly youtube: YoutubeGateway,
  ) {}

  async execute(input: CreateSubscriptionInput): Promise<Subscription> {
    const reference = parseChannelReference(input.channel);
    if (!reference) {
      throw new ValidationError(
        'Chaîne YouTube invalide : utilise une URL youtube.com, un @handle ou un ID UC…',
      );
    }
    if (!isDiscordWebhookUrl(input.webhookUrl)) {
      throw new ValidationError('URL de webhook Discord invalide.');
    }

    const channelId = await this.youtube.resolveChannelId(reference);
    // Amorce l'historique : les vidéos déjà en ligne ne seront jamais notifiées.
    const feed = await this.youtube.getChannelFeed(channelId);
    const now = new Date().toISOString();
    const latest = feed.videos[0];

    const subscription: Subscription = {
      id: randomUUID(),
      channelId,
      channelName: feed.channel.name,
      webhookUrl: input.webhookUrl.trim(),
      message: input.message,
      enabled: true,
      includeShorts: input.includeShorts,
      knownVideoIds: mergeKnownVideoIds([], feed.videos),
      lastVideo: latest ? toVideoSnapshot(latest) : null,
      lastCheckedAt: now,
      lastNotifiedAt: null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.subscriptions.create(subscription);
    return subscription;
  }
}
