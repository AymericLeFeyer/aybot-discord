import type { Video } from '../../youtube/entities/Video.js';
import { MAX_KNOWN_VIDEO_IDS, type Subscription } from '../entities/Subscription.js';

/**
 * Vidéos à notifier : jamais vues, publiées après la création de l'abonnement
 * (évite de notifier d'anciennes vidéos), Shorts exclus si demandé.
 * Triées de la plus ancienne à la plus récente.
 */
export function detectNewVideos(subscription: Subscription, videos: Video[]): Video[] {
  // Aucune vérification réussie auparavant : on amorce l'historique sans notifier.
  if (subscription.lastCheckedAt === null) return [];

  const known = new Set(subscription.knownVideoIds);
  const createdAt = new Date(subscription.createdAt).getTime();
  return videos
    .filter((video) => !known.has(video.id))
    .filter((video) => video.publishedAt.getTime() >= createdAt)
    .filter((video) => subscription.includeShorts || !video.isShort)
    .sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
}

/** Fusionne les IDs vus, les plus récents en tête, bornés à MAX_KNOWN_VIDEO_IDS. */
export function mergeKnownVideoIds(knownVideoIds: string[], videos: Video[]): string[] {
  return [...new Set([...videos.map((video) => video.id), ...knownVideoIds])].slice(
    0,
    MAX_KNOWN_VIDEO_IDS,
  );
}
