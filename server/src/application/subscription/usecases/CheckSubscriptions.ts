import type { NotificationGateway } from '../../../domain/notification/repositories/NotificationGateway.js';
import type { Subscription } from '../../../domain/subscription/entities/Subscription.js';
import type { SubscriptionRepository } from '../../../domain/subscription/repositories/SubscriptionRepository.js';
import {
  detectNewVideos,
  mergeKnownVideoIds,
} from '../../../domain/subscription/services/detectNewVideos.js';
import { renderMessage } from '../../../domain/subscription/services/messageTemplate.js';
import type { ChannelFeed } from '../../../domain/youtube/entities/Channel.js';
import type { YoutubeGateway } from '../../../domain/youtube/repositories/YoutubeGateway.js';
import { errorMessage } from '../../../shared/errors.js';
import { logger } from '../../../shared/logger.js';
import { toVideoSnapshot } from './toVideoSnapshot.js';

export interface CheckReport {
  checked: number;
  notified: number;
  errors: number;
}

/** Vérifie toutes les chaînes suivies et publie les nouvelles vidéos sur les webhooks. */
export class CheckSubscriptions {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly youtube: YoutubeGateway,
    private readonly notifier: NotificationGateway,
  ) {}

  async execute(): Promise<CheckReport> {
    const report: CheckReport = { checked: 0, notified: 0, errors: 0 };
    const enabled = (await this.subscriptions.findAll()).filter((s) => s.enabled);

    // Une seule requête YouTube par chaîne, même si plusieurs webhooks la suivent.
    const byChannel = Map.groupBy(enabled, (subscription) => subscription.channelId);
    for (const [channelId, channelSubscriptions] of byChannel) {
      let feed: ChannelFeed;
      try {
        feed = await this.youtube.getChannelFeed(channelId);
      } catch (error) {
        logger.warn(`Flux YouTube indisponible pour ${channelId} :`, errorMessage(error));
        for (const subscription of channelSubscriptions) {
          report.errors++;
          await this.recordCheck(subscription.id, { lastError: errorMessage(error) });
        }
        continue;
      }
      for (const subscription of channelSubscriptions) {
        report.checked++;
        const result = await this.notifySubscription(subscription, feed);
        report.notified += result.notified;
        if (result.error) report.errors++;
      }
    }
    return report;
  }

  private async notifySubscription(
    subscription: Subscription,
    feed: ChannelFeed,
  ): Promise<{ notified: number; error: boolean }> {
    const newVideos = detectNewVideos(subscription, feed.videos);
    const notifiedIds: string[] = [];
    let lastError: string | null = null;

    for (const video of newVideos) {
      try {
        await this.notifier.send(subscription.webhookUrl, {
          content: renderMessage(subscription.message, video),
        });
        notifiedIds.push(video.id);
        logger.info(
          `Notifié « ${video.title} » (${feed.channel.name}) → abonnement ${subscription.id}`,
        );
      } catch (error) {
        lastError = `Envoi Discord échoué : ${errorMessage(error)}`;
        logger.warn(lastError);
        break; // on réessaiera cette vidéo (et les suivantes) au prochain passage
      }
    }

    // Les vidéos non envoyées suite à une erreur ne sont pas marquées comme vues.
    const failedIds = new Set(newVideos.map((v) => v.id).filter((id) => !notifiedIds.includes(id)));
    const seenVideos = feed.videos.filter((video) => !failedIds.has(video.id));
    const latest = feed.videos[0];

    await this.subscriptions.update(subscription.id, (current) => ({
      ...current,
      channelName: feed.channel.name,
      knownVideoIds: mergeKnownVideoIds(current.knownVideoIds, seenVideos),
      lastVideo: latest ? toVideoSnapshot(latest) : current.lastVideo,
      lastCheckedAt: new Date().toISOString(),
      lastNotifiedAt: notifiedIds.length > 0 ? new Date().toISOString() : current.lastNotifiedAt,
      lastError,
    }));
    return { notified: notifiedIds.length, error: lastError !== null };
  }

  private async recordCheck(id: string, patch: Pick<Subscription, 'lastError'>): Promise<void> {
    await this.subscriptions.update(id, (current) => ({
      ...current,
      ...patch,
      lastCheckedAt: new Date().toISOString(),
    }));
  }
}
